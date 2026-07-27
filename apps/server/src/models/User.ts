import mongoose, { Document, Schema } from 'mongoose';
import type { UserRole, UserAccountStatus } from '@car-auction/shared';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserAccountStatus;
  refreshTokens: string[];
  watchlist: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'] satisfies UserRole[],
      default: 'buyer',
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
    watchlist: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Car' }],
      default: [],
    },
  },
  { timestamps: true },
);

// Never leak passwordHash or refreshTokens in JSON responses
UserSchema.set('toJSON', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (_doc: any, ret: any) => {
    delete ret.passwordHash;
    delete ret.refreshTokens;
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', UserSchema);
