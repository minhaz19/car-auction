import type { IUserPublic } from './user';

export interface IMessage {
  _id: string;
  transactionId: string;
  senderId: string | IUserPublic;
  text: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SendMessagePayload {
  text: string;
}
