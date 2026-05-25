'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];
const DEFAULT_PRIVATE_ROUTE = '/dashboard';
const DEFAULT_PUBLIC_ROUTE = '/login';

export function useSession() {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isBootstrapped = useAuthStore((state) => state.isBootstrapped);

  const bootstrap = useAuthStore((state) => state.bootstrap);
  const clearSession = useAuthStore((state) => state.clearSession);

  // Bootstrap session on mount
  useEffect(() => {
    if (!isBootstrapped) {
      bootstrap();
    }
  }, [isBootstrapped, bootstrap]);

  // Session expiry handler
  useEffect(() => {
    const handleExpiry = () => {
      clearSession();
      router.push(DEFAULT_PUBLIC_ROUTE);
    };

    window.addEventListener('auth:session-expired', handleExpiry);

    return () => {
      window.removeEventListener('auth:session-expired', handleExpiry);
    };
  }, [clearSession, router]);

  // Route guard
  useEffect(() => {
    if (!isBootstrapped) return;

    const isPublicRoute = PUBLIC_ROUTES.some((r) =>
        pathname.startsWith(r),
    );

    if (!isAuthenticated && !isPublicRoute) {
      router.push(
          `${DEFAULT_PUBLIC_ROUTE}?redirect=${encodeURIComponent(pathname)}`,
      );
    }

    if (isAuthenticated && isPublicRoute) {
      router.push(DEFAULT_PRIVATE_ROUTE);
    }
  }, [isBootstrapped, isAuthenticated, pathname, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isBootstrapped,
  };
}