import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { authApi } from './services/authApi';
import { carsApi } from './services/carsApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [carsApi.reducerPath]: carsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, carsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
