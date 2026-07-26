import type { JwtPayload } from '@car-auction/shared';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
