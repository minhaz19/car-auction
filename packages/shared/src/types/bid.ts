export type BidStatus = 'active' | 'outbid' | 'won';

export interface IBid {
  _id: string;
  carId: string;
  userId: string | { _id: string; name: string };
  amount: number;
  status: BidStatus;
  maskedBidderName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaginatedBidsResponse {
  bids: IBid[];
  total: number;
  page: number;
  totalPages: number;
}

/** Helper utility to mask a user's name for public bid history privacy (e.g. "Jane Doe" -> "J***e") */
export function maskName(name: string): string {
  if (!name || name.trim().length === 0) return 'B***r';
  const trimmed = name.trim();
  if (trimmed.length <= 2) return `${trimmed.charAt(0)}***`;
  return `${trimmed.charAt(0)}***${trimmed.charAt(trimmed.length - 1)}`;
}
