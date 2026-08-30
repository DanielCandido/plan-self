'use client';

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { PwaRuntime } from '@/components/pwa/pwa-runtime';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <PwaRuntime />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e1f26',
            border: '1px solid rgba(124,58,237,0.2)',
            color: '#e3e1ec',
            borderRadius: '10px',
            fontSize: '13px',
          },
        }}
        richColors
      />
    </QueryClientProvider>
  );
}
