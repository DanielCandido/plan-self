import './globals.css';
import { GeistSans } from 'geist/font/sans';
import type { ReactNode } from 'react';
import { Providers } from '@/components/providers/providers';

export const metadata = {
  title: 'Plan Self',
  description: 'Plataforma Kanban self-hosted modular',
  manifest: '/manifest.webmanifest',
  applicationName: 'Plan Self',
  appleWebApp: { capable: true, title: 'Plan Self', statusBarStyle: 'black-translucent' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={GeistSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
