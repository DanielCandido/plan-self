import './globals.css';
import { Geist } from 'next/font/google';
import type { ReactNode } from 'react';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

export const metadata = {
  title: 'Plan Self',
  description: 'Plataforma Kanban self-hosted modular',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
