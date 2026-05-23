import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Plan Self',
  description: 'Plataforma Kanban self-hosted modular',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
