import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { IUserPublic } from '@car-auction/shared';
import type { RootState } from '../index';

interface AuthResponse {
  accessToken: string;
  user: IUserPublic;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/auth`,
    credentials: 'include', // send httpOnly cookie on every request
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: '/register', method: 'POST', body }),
    }),
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: '/login', method: 'POST', body }),
    }),
    refresh: builder.mutation<AuthResponse, void>({
      query: () => ({ url: '/refresh', method: 'POST' }),
    }),
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({ url: '/logout', method: 'POST' }),
    }),
    logoutAll: builder.mutation<{ message: string }, void>({
      query: () => ({ url: '/logout-all', method: 'POST' }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshMutation,
  useLogoutMutation,
  useLogoutAllMutation,
} = authApi;
