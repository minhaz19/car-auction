import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { IReview, CreateReviewPayload, UserReviewsResponse } from '@car-auction/shared';
import type { RootState } from '../index';

export const reviewsApi = createApi({
  reducerPath: 'reviewsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/reviews`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Review'],
  endpoints: (builder) => ({
    createReview: builder.mutation<{ message: string; review: IReview }, CreateReviewPayload>({
      query: (body) => ({
        url: '/',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Review'],
    }),

    getSellerReviews: builder.query<UserReviewsResponse, string>({
      query: (sellerId) => `/seller/${sellerId}`,
      providesTags: ['Review'],
    }),
  }),
});

export const { useCreateReviewMutation, useGetSellerReviewsQuery } = reviewsApi;
