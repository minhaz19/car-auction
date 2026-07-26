import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ITransaction } from '@car-auction/shared';
import type { RootState } from '../index';

export interface PaymentIntentResponse {
  clientSecret: string;
  stripePublishableKey: string;
  amount: number;
  status: string;
}

export const transactionsApi = createApi({
  reducerPath: 'transactionsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/transactions`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Transaction'],
  endpoints: (builder) => ({
    getTransaction: builder.query<ITransaction, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Transaction', id }],
    }),

    createPaymentIntent: builder.mutation<PaymentIntentResponse, string>({
      query: (id) => ({
        url: `/${id}/create-payment-intent`,
        method: 'POST',
      }),
    }),

    confirmPayment: builder.mutation<{ message: string; transaction: ITransaction }, string>({
      query: (id) => ({
        url: `/${id}/confirm`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Transaction', id }, 'Transaction'],
    }),

    getUserTransactions: builder.query<ITransaction[], void>({
      query: () => '/me',
      providesTags: ['Transaction'],
    }),
  }),
});

export const {
  useGetTransactionQuery,
  useCreatePaymentIntentMutation,
  useConfirmPaymentMutation,
  useGetUserTransactionsQuery,
} = transactionsApi;
