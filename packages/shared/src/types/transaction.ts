import type { ICar } from './car';
import type { IUserPublic } from './user';

export type TransactionStatus =
  | 'pending'
  | 'paid'
  | 'awaiting_handoff'
  | 'completed'
  | 'disputed'
  | 'failed'
  | 'refunded';

export type PayoutStatus = 'pending' | 'initiated' | 'completed';
export type FulfillmentStatus = 'pending_payment' | 'paid_awaiting_pickup' | 'completed' | 'disputed';

export interface ITransaction {
  _id: string;
  carId: string | ICar;
  buyerId: string | IUserPublic;
  sellerId: string | IUserPublic;
  amount: number;
  status: TransactionStatus;
  payoutStatus: PayoutStatus;
  fulfillmentStatus?: FulfillmentStatus;
  stripePaymentIntentId?: string;
  stripeClientSecret?: string;
  handoffConfirmedByBuyer: boolean;
  handoffConfirmedBySeller: boolean;
  paidAt?: string;
  completedAt?: string;
  disputed?: boolean;
  disputeReason?: string;
  disputedAt?: string;
  createdAt: string;
  updatedAt?: string;
}
