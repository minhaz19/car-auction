'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { useRefreshMutation } from '@/store/services/authApi';
import { setCredentials, clearCredentials } from '@/store/slices/authSlice';
import { useAppDispatch } from '@/hooks/useRedux';

/**
 * SessionRestorer — silently calls /api/auth/refresh on mount to restore
 * the session from the httpOnly refresh token cookie.
 * Rendered inside the Redux Provider so it can dispatch.
 */
function SessionRestorer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [refresh] = useRefreshMutation();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const result = await refresh().unwrap();
        dispatch(setCredentials({ user: result.user, accessToken: result.accessToken }));
        // Ensure session flag cookie is set
        document.cookie = 'sessionExists=1; path=/; max-age=604800; samesite=strict';
      } catch {
        // No valid session — user needs to log in
        dispatch(clearCredentials());
      }
    };

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SessionRestorer>{children}</SessionRestorer>
    </Provider>
  );
}
