export type UserRole = 'buyer' | 'seller' | 'admin';
export type UserAccountStatus = 'active' | 'suspended';

/** Public-safe user shape — no passwordHash, no refreshTokens */
export interface IUserPublic {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: UserAccountStatus;
  watchlist?: string[];
  createdAt: string;
}

/** JWT payload shape embedded in access tokens */
export interface JwtPayload {
  sub: string; // user _id
  name: string;
  email: string;
  role: UserRole;
}
