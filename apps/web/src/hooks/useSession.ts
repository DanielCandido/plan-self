'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];
const DEFAULT_PRIVATE_ROUTE = '/dashboard';
const DEFAULT_PUBLIC_ROUTE = '/login';

export function useSession() {
  const store = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Bootstrap session on mount (calls /auth/me once)
  useEffect(() => {
    if (!store.isBootstrapped) {
      store.bootstrap();
    }
  }, [store]);

  // Handle session expiry event from Axios interceptor
  useEffect(() => {
    const handleExpiry = () => {
      store.clearSession();
      router.push(DEFAULT_PUBLIC_ROUTE);
    };
    window.addEventListener('auth:session-expired', handleExpiry);
    return () => window.removeEventListener('auth:session-expired', handleExpiry);
  }, [store, router]);

  // Client-side route guard (middleware handles SSR/edge, this handles transitions)
  useEffect(() => {
    if (!store.isBootstrapped) return;

    const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

    if (!store.isAuthenticated && !isPublicRoute) {
      router.push(`${DEFAULT_PUBLIC_ROUTE}?redirect=${encodeURIComponent(pathname)}`);
    }

    if (store.isAuthenticated && isPublicRoute) {
      router.push(DEFAULT_PRIVATE_ROUTE);
    }
  }, [store.isBootstrapped, store.isAuthenticated, pathname, router]);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isBootstrapped: store.isBootstrapped,
  };
}
