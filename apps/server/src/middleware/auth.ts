import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import type { UserRole } from '@car-auction/shared';

/**
 * requireAuth — validates the Bearer access token.
 * Attaches req.user on success; returns 401 on failure.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ message: 'Access token is invalid or expired' });
  }
}

/**
 * requireRole — role-based access control middleware factory.
 * Must be used after requireAuth.
 *
 * @example
 * router.post('/listing', requireAuth, requireRole('seller', 'admin'), handler)
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
