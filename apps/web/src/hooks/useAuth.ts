'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { redirectToOAuth } from '@/lib/auth';
import type { LoginPayload, OAuthProvider } from '@/types/auth.types';

export function useAuth() {
  const router = useRouter();
  const store = useAuthStore();

  const login = useCallback(
    async (payload: LoginPayload) => {
      await store.login(payload);
      router.push('/dashboard');
    },
    [store, router],
  );

  const logout = useCallback(async () => {
    await store.logout();
    router.push('/login');
  }, [store, router]);

  const loginWithOAuth = useCallback((provider: OAuthProvider) => {
    redirectToOAuth(provider);
  }, []);

  return {
    user: store.user,
    accessToken: store.accessToken,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isBootstrapped: store.isBootstrapped,
    error: store.error,
    login,
    logout,
    loginWithOAuth,
  };
}
