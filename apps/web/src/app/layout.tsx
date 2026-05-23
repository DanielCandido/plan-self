import './globals.css';
import { GeistSans } from 'geist/font/sans';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Plan Self',
  description: 'Plataforma Kanban self-hosted modular',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={GeistSans.className}>{children}</body>
    </html>
  );
}
