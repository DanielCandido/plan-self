import type { ReactNode } from 'react';
import { PrivateShell } from '@/components/layout/private-shell';

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return <PrivateShell>{children}</PrivateShell>;
}
