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

    completeTransaction: builder.mutation<{ message: string; transaction: ITransaction }, string>({
      query: (id) => ({
        url: `/${id}/complete`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Transaction', id }, 'Transaction'],
    }),

    confirmHandoff: builder.mutation<{ message: string; transaction: ITransaction }, string>({
      query: (id) => ({
        url: `/${id}/confirm-handoff`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Transaction', id }, 'Transaction'],
    }),

    disputeTransaction: builder.mutation<
      { message: string; transaction: ITransaction },
      { id: string; reason: string }
    >({
      query: ({ id, reason }) => ({
        url: `/${id}/dispute`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Transaction', id }, 'Transaction'],
    }),

    getMessages: builder.query<import('@car-auction/shared').IMessage[], string>({
      query: (id) => `/${id}/messages`,
      providesTags: (_result, _error, id) => [{ type: 'Transaction', id }],
    }),

    sendMessage: builder.mutation<import('@car-auction/shared').IMessage, { transactionId: string; text: string }>({
      query: ({ transactionId, text }) => ({
        url: `/${transactionId}/messages`,
        method: 'POST',
        body: { text },
      }),
      invalidatesTags: (_result, _error, { transactionId }) => [{ type: 'Transaction', id: transactionId }],
    }),

    submitTransactionReview: builder.mutation<
      { message: string; review: import('@car-auction/shared').IReview },
      { transactionId: string; rating: number; comment: string }
    >({
      query: ({ transactionId, rating, comment }) => ({
        url: `/${transactionId}/review`,
        method: 'POST',
        body: { rating, comment },
      }),
      invalidatesTags: (_result, _error, { transactionId }) => [{ type: 'Transaction', id: transactionId }],
    }),
  }),
});

export const {
  useGetTransactionQuery,
  useCreatePaymentIntentMutation,
  useConfirmPaymentMutation,
  useGetUserTransactionsQuery,
  useCompleteTransactionMutation,
  useConfirmHandoffMutation,
  useDisputeTransactionMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useSubmitTransactionReviewMutation,
} = transactionsApi;
