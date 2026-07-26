import { Router, Request, Response, CookieOptions, IRouter } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  REFRESH_COOKIE_MAX_AGE,
} from '../config/jwt';
import { requireAuth } from '../middleware/auth';
import type { JwtPayload } from '@car-auction/shared';

const router: IRouter = Router();

const BCRYPT_ROUNDS = 12;
const REFRESH_COOKIE_NAME = 'refreshToken';

/** Cookie options for the refresh token */
function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: '/api/auth', // scope cookie to auth routes only
  };
}

/** Build the public JWT payload from a user document */
function buildTokenPayload(user: { _id: unknown; name: string; email: string; role: string }): JwtPayload {
  return {
    sub: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role as JwtPayload['role'],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  // Basic validation
  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ message: 'name, email, and password are required' });
    return;
  }

  if (password.length < 8 || !/\d/.test(password)) {
    res.status(400).json({
      message: 'Password must be at least 8 characters and contain at least one number',
    });
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    res.status(409).json({ message: 'An account with that email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await User.create({ name: name.trim(), email, passwordHash });

  const payload = buildTokenPayload(user);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ sub: payload.sub });

  // Store the refresh token
  user.refreshTokens.push(refreshToken);
  await user.save();

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.status(201).json({
    accessToken,
    user: { _id: payload.sub, name: user.name, email: user.email, role: user.role },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email?.trim() || !password) {
    res.status(400).json({ message: 'email and password are required' });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const payload = buildTokenPayload(user);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ sub: payload.sub });

  user.refreshTokens.push(refreshToken);
  await user.save();

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  res.status(200).json({
    accessToken,
    user: { _id: payload.sub, name: user.name, email: user.email, role: user.role },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const token: string | undefined = req.cookies[REFRESH_COOKIE_NAME];

  if (!token) {
    res.status(401).json({ message: 'No refresh token provided' });
    return;
  }

  let decoded: { sub: string };
  try {
    decoded = verifyRefreshToken(token) as { sub: string };
  } catch {
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
    res.status(401).json({ message: 'Refresh token is invalid or expired' });
    return;
  }

  const user = await User.findById(decoded.sub);

  if (!user || !user.refreshTokens.includes(token)) {
    // Token reuse detected — possible theft; revoke all sessions
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
    res.status(401).json({ message: 'Refresh token reuse detected — all sessions invalidated' });
    return;
  }

  // Rotate: remove old token, issue new one
  user.refreshTokens = user.refreshTokens.filter((t) => t !== token);
  const payload = buildTokenPayload(user);
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken({ sub: payload.sub });
  user.refreshTokens.push(newRefreshToken);
  await user.save();

  res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions());
  res.status(200).json({
    accessToken: newAccessToken,
    user: { _id: payload.sub, name: user.name, email: user.email, role: user.role },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout   (requires valid access token)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/logout', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const token: string | undefined = req.cookies[REFRESH_COOKIE_NAME];

  if (token && req.user) {
    await User.findByIdAndUpdate(req.user.sub, {
      $pull: { refreshTokens: token },
    });
  }

  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  res.status(200).json({ message: 'Logged out successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout-all   (all-device logout)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/logout-all', requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user.sub, { $set: { refreshTokens: [] } });
  }

  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  res.status(200).json({ message: 'Logged out from all devices' });
});

export default router;
