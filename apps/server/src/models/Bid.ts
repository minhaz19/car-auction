import mongoose, { Document, Schema } from 'mongoose';
import type { BidStatus } from '@car-auction/shared';

export interface IBidDocument extends Document {
  carId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  status: BidStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BidSchema = new Schema<IBidDocument>(
  {
    carId: {
      type: Schema.Types.ObjectId,
      ref: 'Car',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Bid amount must be positive'],
    },
    status: {
      type: String,
      enum: ['active', 'outbid', 'won'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true },
);

// Compound index for querying bid history sorted by highest / newest bid
BidSchema.index({ carId: 1, createdAt: -1 });

export const Bid = mongoose.model<IBidDocument>('Bid', BidSchema);
