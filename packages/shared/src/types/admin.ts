import type { IUserPublic, UserAccountStatus } from './user';
import type { ICar } from './car';
import type { ITransaction } from './transaction';

export interface IAdminUser extends IUserPublic {
  status: UserAccountStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminAnalyticsResponse {
  totalActiveAuctions: number;
  totalBidVolume: number;
  totalUsers: number;
  listingsByStatus: {
    live: number;
    ended: number;
    upcoming: number;
  };
  topBrands: {
    brand: string;
    count: number;
  }[];
}

export interface AdminUpdateCarStatusPayload {
  status: 'live' | 'ended' | 'upcoming';
  reason: string;
}

export interface AdminSuspendUserPayload {
  status: UserAccountStatus;
  reason?: string;
}

export interface AdminResolveDisputePayload {
  resolutionNotes: string;
}
