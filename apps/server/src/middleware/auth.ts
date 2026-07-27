import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { User } from '../models/User';
import type { UserRole } from '@car-auction/shared';

/**
 * requireAuth — validates the Bearer access token and verifies active account status.
 * Attaches req.user on success; returns 401/403 on failure.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);

    // Verify user account is active and not suspended
    const dbUser = await User.findById(payload.sub).select('status role');
    if (!dbUser) {
      res.status(401).json({ message: 'User account no longer exists' });
      return;
    }

    if (dbUser.status === 'suspended') {
      res.status(403).json({ message: 'Your account has been suspended by an administrator.' });
      return;
    }

    // Keep payload role synchronized with DB
    req.user = {
      ...payload,
      role: dbUser.role,
    };

    next();
  } catch {
    res.status(401).json({ message: 'Access token is invalid or expired' });
  }
}

/**
 * requireRole — role-based access control middleware factory.
 * Must be used after requireAuth.
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}
