import mongoose, { Document, Schema } from 'mongoose';
import type {
  CarCondition,
  BodyType,
  Transmission,
  FuelType,
  AuctionStatus,
} from '@car-auction/shared';

export interface ICarDocument extends Omit<Document, 'model'> {
  sellerId: mongoose.Types.ObjectId;
  make: string;
  model: string;
  year: number;
  condition: CarCondition;
  bodyType: BodyType;
  mileage: number;
  transmission: Transmission;
  fuelType: FuelType;
  color: string;
  images: string[];
  description: string;
  startingBid: number;
  currentBid: number;
  reservePrice?: number;
  auctionStart: Date;
  auctionEnd: Date;
  status: AuctionStatus;
  bidCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CarSchema = new Schema<ICarDocument>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    make: {
      type: String,
      required: [true, 'Car make is required'],
      trim: true,
      index: true,
    },
    model: {
      type: String,
      required: [true, 'Car model is required'],
      trim: true,
      index: true,
    },
    year: {
      type: Number,
      required: [true, 'Car year is required'],
      min: [1900, 'Year must be after 1900'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the far future'],
      index: true,
    },
    condition: {
      type: String,
      enum: ['New', 'Used', 'Certified Pre-Owned'],
      required: true,
      index: true,
    },
    bodyType: {
      type: String,
      enum: ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'Convertible', 'Wagon', 'Van'],
      required: true,
      index: true,
    },
    mileage: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    transmission: {
      type: String,
      enum: ['Automatic', 'Manual'],
      required: true,
    },
    fuelType: {
      type: String,
      enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
      required: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      required: true,
      validate: [(val: string[]) => val.length > 0, 'At least one car image is required'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    startingBid: {
      type: Number,
      required: true,
      min: 0,
    },
    currentBid: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    reservePrice: {
      type: Number,
      min: 0,
    },
    auctionStart: {
      type: Date,
      required: true,
    },
    auctionEnd: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'live', 'ended'],
      default: 'live',
      index: true,
    },
    bidCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

// Compound index for fast filtered searches
CarSchema.index({ status: 1, make: 1, currentBid: 1, auctionEnd: 1 });

export const Car = mongoose.model<ICarDocument>('Car', CarSchema);
