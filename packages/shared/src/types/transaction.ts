import type { ICar } from './car';
import type { IUserPublic } from './user';

export type TransactionStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PayoutStatus = 'pending' | 'initiated' | 'completed';

export interface ITransaction {
  _id: string;
  carId: string | ICar;
  buyerId: string | IUserPublic;
  sellerId: string | IUserPublic;
  amount: number;
  status: TransactionStatus;
  payoutStatus: PayoutStatus;
  stripePaymentIntentId?: string;
  stripeClientSecret?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
}
