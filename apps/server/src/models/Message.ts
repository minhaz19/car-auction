import mongoose, { Document, Schema } from 'mongoose';

export interface IMessageDocument extends Document {
  transactionId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true },
);

MessageSchema.index({ transactionId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessageDocument>('Message', MessageSchema);
