import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  ICar,
  CarFilterParams,
  PaginatedCarsResponse,
  IBid,
  PaginatedBidsResponse,
} from '@car-auction/shared';
import type { RootState } from '../index';

export interface PlaceBidResponse {
  message: string;
  bid: IBid;
  car: ICar;
}

export const carsApi = createApi({
  reducerPath: 'carsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Car', 'FeaturedCars', 'Bids', 'UserBids'],
  endpoints: (builder) => ({
    getFeaturedCars: builder.query<ICar[], void>({
      query: () => '/cars/featured',
      providesTags: ['FeaturedCars'],
    }),

    getCars: builder.query<PaginatedCarsResponse, CarFilterParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
        return `/cars?${queryParams.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.cars.map(({ _id }) => ({ type: 'Car' as const, id: _id })),
              { type: 'Car', id: 'LIST' },
            ]
          : [{ type: 'Car', id: 'LIST' }],
    }),

    getCarById: builder.query<ICar, string>({
      query: (id) => `/cars/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Car', id }],
    }),

    getCarBids: builder.query<PaginatedBidsResponse, { id: string; page?: number; limit?: number }>({
      query: ({ id, page = 1, limit = 10 }) => `/cars/${id}/bids?page=${page}&limit=${limit}`,
      providesTags: (_result, _error, { id }) => [{ type: 'Bids', id }],
    }),

    getUserBids: builder.query<IBid[], void>({
      query: () => '/users/me/bids',
      providesTags: ['UserBids'],
    }),

    getBrands: builder.query<string[], void>({
      query: () => '/meta/brands',
    }),

    getModelsByBrand: builder.query<string[], string>({
      query: (brand) => `/meta/models?brand=${encodeURIComponent(brand)}`,
    }),

    createCar: builder.mutation<ICar, Partial<ICar>>({
      query: (body) => ({
        url: '/cars',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Car', id: 'LIST' }, 'FeaturedCars'],
    }),

    updateCar: builder.mutation<ICar, { id: string; data: Partial<ICar> }>({
      query: ({ id, data }) => ({
        url: `/cars/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Car', id },
        { type: 'Car', id: 'LIST' },
        'FeaturedCars',
      ],
    }),

    deleteCar: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/cars/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Car', id },
        { type: 'Car', id: 'LIST' },
        'FeaturedCars',
      ],
    }),

    placeBid: builder.mutation<PlaceBidResponse, { carId: string; amount: number }>({
      query: ({ carId, amount }) => ({
        url: `/cars/${carId}/bid`,
        method: 'POST',
        body: { amount },
      }),
      invalidatesTags: (_result, _error, { carId }) => [
        { type: 'Car', id: carId },
        { type: 'Bids', id: carId },
        { type: 'Car', id: 'LIST' },
        'FeaturedCars',
        'UserBids',
      ],
    }),
  }),
});

export const {
  useGetFeaturedCarsQuery,
  useGetCarsQuery,
  useGetCarByIdQuery,
  useGetCarBidsQuery,
  useGetUserBidsQuery,
  useGetBrandsQuery,
  useGetModelsByBrandQuery,
  useCreateCarMutation,
  useUpdateCarMutation,
  useDeleteCarMutation,
  usePlaceBidMutation,
} = carsApi;
