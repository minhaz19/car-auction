'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from './useRedux';
import { setCredentials, clearCredentials } from '@/store/slices/authSlice';
import {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useLogoutAllMutation,
} from '@/store/services/authApi';

/**
 * useAuth — primary hook for auth actions and current user state.
 *
 * Wraps RTK Query mutations + Redux dispatch so components never
 * need to import store internals directly.
 */
export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const user = useAppSelector((s) => s.auth.user);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const isLoading = useAppSelector((s) => s.auth.isLoading);
  const isAuthenticated = !!user;

  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [logoutMutation] = useLogoutMutation();
  const [logoutAllMutation] = useLogoutAllMutation();

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginMutation({ email, password }).unwrap();
      dispatch(setCredentials({ user: result.user, accessToken: result.accessToken }));
      // Set a lightweight non-httpOnly cookie so Next.js middleware can detect auth state
      document.cookie = 'sessionExists=1; path=/; max-age=604800; samesite=strict';
      return result;
    },
    [loginMutation, dispatch],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const result = await registerMutation({ name, email, password }).unwrap();
      dispatch(setCredentials({ user: result.user, accessToken: result.accessToken }));
      document.cookie = 'sessionExists=1; path=/; max-age=604800; samesite=strict';
      return result;
    },
    [registerMutation, dispatch],
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation().unwrap();
    } finally {
      dispatch(clearCredentials());
      // Clear the session flag cookie
      document.cookie = 'sessionExists=; path=/; max-age=0';
      router.push('/auth/login');
    }
  }, [logoutMutation, dispatch, router]);

  const logoutAll = useCallback(async () => {
    try {
      await logoutAllMutation().unwrap();
    } finally {
      dispatch(clearCredentials());
      document.cookie = 'sessionExists=; path=/; max-age=0';
      router.push('/auth/login');
    }
  }, [logoutAllMutation, dispatch, router]);

  return {
    user,
    accessToken,
    isLoading,
    isAuthenticated,
    isLoginLoading,
    isRegisterLoading,
    login,
    register,
    logout,
    logoutAll,
  };
}
