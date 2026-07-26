import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { authApi } from './services/authApi';
import { carsApi } from './services/carsApi';
import { usersApi } from './services/usersApi';
import { transactionsApi } from './services/transactionsApi';
import { reviewsApi } from './services/reviewsApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [carsApi.reducerPath]: carsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [transactionsApi.reducerPath]: transactionsApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      carsApi.middleware,
      usersApi.middleware,
      transactionsApi.middleware,
      reviewsApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
