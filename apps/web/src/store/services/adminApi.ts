import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  AdminAnalyticsResponse,
  IAdminUser,
  ICar,
  ITransaction,
} from '@car-auction/shared';
import type { RootState } from '../index';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/admin`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['AdminAnalytics', 'AdminListings', 'AdminUsers', 'AdminDisputes'],
  endpoints: (builder) => ({
    getAdminAnalytics: builder.query<AdminAnalyticsResponse, void>({
      query: () => '/analytics',
      providesTags: ['AdminAnalytics'],
    }),

    getAdminListings: builder.query<ICar[], { status?: string; search?: string } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.set('status', params.status);
        if (params?.search) queryParams.set('search', params.search);
        const queryStr = queryParams.toString();
        return `/cars${queryStr ? `?${queryStr}` : ''}`;
      },
      providesTags: ['AdminListings'],
    }),

    updateListingStatus: builder.mutation<
      { message: string; car: ICar },
      { id: string; status: string; reason: string }
    >({
      query: ({ id, status, reason }) => ({
        url: `/cars/${id}/status`,
        method: 'PATCH',
        body: { status, reason },
      }),
      invalidatesTags: ['AdminListings', 'AdminAnalytics'],
    }),

    getAdminUsers: builder.query<IAdminUser[], void>({
      query: () => '/users',
      providesTags: ['AdminUsers'],
    }),

    suspendUser: builder.mutation<
      { message: string; user: IAdminUser },
      { id: string; status: 'active' | 'suspended' }
    >({
      query: ({ id, status }) => ({
        url: `/users/${id}/suspend`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['AdminUsers', 'AdminAnalytics'],
    }),

    getAdminDisputes: builder.query<ITransaction[], void>({
      query: () => '/disputes',
      providesTags: ['AdminDisputes'],
    }),

    resolveDispute: builder.mutation<
      { message: string; transaction: ITransaction },
      { id: string; resolutionNotes: string }
    >({
      query: ({ id, resolutionNotes }) => ({
        url: `/disputes/${id}/resolve`,
        method: 'PATCH',
        body: { resolutionNotes },
      }),
      invalidatesTags: ['AdminDisputes', 'AdminAnalytics'],
    }),
  }),
});

export const {
  useGetAdminAnalyticsQuery,
  useGetAdminListingsQuery,
  useUpdateListingStatusMutation,
  useGetAdminUsersQuery,
  useSuspendUserMutation,
  useGetAdminDisputesQuery,
  useResolveDisputeMutation,
} = adminApi;
