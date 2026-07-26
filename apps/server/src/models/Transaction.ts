import mongoose, { Document, Schema } from 'mongoose';
import type { TransactionStatus, PayoutStatus, FulfillmentStatus } from '@car-auction/shared';

export interface ITransactionDocument extends Document {
  carId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  amount: number;
  status: TransactionStatus;
  payoutStatus: PayoutStatus;
  fulfillmentStatus?: FulfillmentStatus;
  stripePaymentIntentId?: string;
  handoffConfirmedByBuyer: boolean;
  handoffConfirmedBySeller: boolean;
  paidAt?: Date;
  completedAt?: Date;
  disputed?: boolean;
  disputeReason?: string;
  disputedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    carId: {
      type: Schema.Types.ObjectId,
      ref: 'Car',
      required: true,
      index: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'awaiting_handoff', 'completed', 'disputed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    payoutStatus: {
      type: String,
      enum: ['pending', 'initiated', 'completed'],
      default: 'pending',
    },
    fulfillmentStatus: {
      type: String,
      enum: ['pending_payment', 'paid_awaiting_pickup', 'completed', 'disputed'],
      default: 'pending_payment',
    },
    stripePaymentIntentId: {
      type: String,
      index: true,
    },
    handoffConfirmedByBuyer: {
      type: Boolean,
      default: false,
    },
    handoffConfirmedBySeller: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    disputed: {
      type: Boolean,
      default: false,
    },
    disputeReason: {
      type: String,
    },
    disputedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

export const Transaction = mongoose.model<ITransactionDocument>(
  'Transaction',
  TransactionSchema,
);
