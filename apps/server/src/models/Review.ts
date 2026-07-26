import mongoose, { Document, Schema } from 'mongoose';

export interface IReviewDocument extends Document {
  transactionId: mongoose.Types.ObjectId;
  carId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  revieweeId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReviewDocument>(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
      index: true,
    },
    carId: {
      type: Schema.Types.ObjectId,
      ref: 'Car',
      required: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    revieweeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

// Prevent duplicate reviews by the same reviewer for the same transaction
ReviewSchema.index({ transactionId: 1, reviewerId: 1 }, { unique: true });

export const Review = mongoose.model<IReviewDocument>('Review', ReviewSchema);
