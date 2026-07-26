import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ICar, PaginatedNotificationsResponse, INotification, IUserPublic } from '@car-auction/shared';
import type { RootState } from '../index';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/users`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Watchlist', 'Notifications'],
  endpoints: (builder) => ({
    getWatchlist: builder.query<ICar[], void>({
      query: () => '/me/watchlist',
      providesTags: ['Watchlist'],
    }),

    addToWatchlist: builder.mutation<{ message: string; watchlist: string[] }, string>({
      query: (carId) => ({
        url: `/me/watchlist/${carId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Watchlist'],
    }),

    removeFromWatchlist: builder.mutation<{ message: string; watchlist: string[] }, string>({
      query: (carId) => ({
        url: `/me/watchlist/${carId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Watchlist'],
    }),

    getNotifications: builder.query<PaginatedNotificationsResponse, { page?: number; limit?: number } | void>({
      query: (params) => {
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        return `/me/notifications?page=${page}&limit=${limit}`;
      },
      providesTags: ['Notifications'],
    }),

    markNotificationRead: builder.mutation<INotification, string>({
      query: (id) => ({
        url: `/me/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),

    markAllNotificationsRead: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/me/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),

    updateRole: builder.mutation<{ message: string; user: IUserPublic }, { role: 'seller' | 'buyer' }>({
      query: (body) => ({
        url: '/me/role',
        method: 'PATCH',
        body,
      }),
    }),
  }),
});

export const {
  useGetWatchlistQuery,
  useAddToWatchlistMutation,
  useRemoveFromWatchlistMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useUpdateRoleMutation,
} = usersApi;
