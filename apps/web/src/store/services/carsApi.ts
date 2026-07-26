import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ICar, CarFilterParams, PaginatedCarsResponse } from '@car-auction/shared';
import type { RootState } from '../index';

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
  tagTypes: ['Car', 'FeaturedCars'],
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
  }),
});

export const {
  useGetFeaturedCarsQuery,
  useGetCarsQuery,
  useGetCarByIdQuery,
  useGetBrandsQuery,
  useGetModelsByBrandQuery,
  useCreateCarMutation,
  useUpdateCarMutation,
  useDeleteCarMutation,
} = carsApi;
