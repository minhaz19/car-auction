import type { IUserPublic } from './user';
import type { ICar } from './car';

export interface IReview {
  _id: string;
  transactionId: string;
  carId: string | ICar;
  reviewerId: string | IUserPublic;
  revieweeId: string | IUserPublic;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateReviewPayload {
  rating: number;
  comment: string;
}

export interface UserReviewsResponse {
  reviews: IReview[];
  averageRating: number;
  totalReviews: number;
}
