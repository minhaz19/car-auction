import type { IBid } from './bid';

export interface BidPlacedPayload {
  carId: string;
  currentBid: number;
  bidCount: number;
  newBid: IBid;
  auctionEnd: string;
  serverTime: number;
}

export interface AuctionExtendedPayload {
  carId: string;
  newAuctionEnd: string;
  extendedBySeconds: number;
  serverTime: number;
}

export interface AuctionEndedPayload {
  carId: string;
  winningBid: number;
  winningBidderName?: string;
  serverTime: number;
}

export interface PresenceUpdatePayload {
  carId: string;
  watcherCount: number;
}

export interface RoomJoinedPayload {
  carId: string;
  auctionEnd: string;
  serverTime: number;
  watcherCount: number;
}

export interface BidRejectedPayload {
  carId: string;
  reason: string;
  currentBid?: number;
}

export interface ServerToClientEvents {
  'bid:placed': (payload: BidPlacedPayload) => void;
  'bid:rejected': (payload: BidRejectedPayload) => void;
  'auction:extended': (payload: AuctionExtendedPayload) => void;
  'auction:ended': (payload: AuctionEndedPayload) => void;
  'presence:update': (payload: PresenceUpdatePayload) => void;
  'room:joined': (payload: RoomJoinedPayload) => void;
}

export interface ClientToServerEvents {
  'join:room': (payload: { carId: string }) => void;
  'leave:room': (payload: { carId: string }) => void;
}
