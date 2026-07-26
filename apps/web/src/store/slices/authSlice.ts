import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { IUserPublic } from '@car-auction/shared';

interface AuthState {
  user: IUserPublic | null;
  accessToken: string | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: true, // true on mount — waiting for silent refresh attempt
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: IUserPublic; accessToken: string }>,
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isLoading = false;
    },
    clearCredentials(state) {
      state.user = null;
      state.accessToken = null;
      state.isLoading = false;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setLoading } = authSlice.actions;
export default authSlice.reducer;
