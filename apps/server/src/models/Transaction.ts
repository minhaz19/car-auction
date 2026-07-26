import mongoose, { Document, Schema } from 'mongoose';
import type { TransactionStatus, PayoutStatus } from '@car-auction/shared';

export interface ITransactionDocument extends Document {
  carId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  amount: number;
  status: TransactionStatus;
  payoutStatus: PayoutStatus;
  stripePaymentIntentId?: string;
  paidAt?: Date;
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
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    payoutStatus: {
      type: String,
      enum: ['pending', 'initiated', 'completed'],
      default: 'pending',
    },
    stripePaymentIntentId: {
      type: String,
      index: true,
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

export const Transaction = mongoose.model<ITransactionDocument>(
  'Transaction',
  TransactionSchema,
);
