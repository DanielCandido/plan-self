'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative w-full max-w-[360px] rounded-2xl glass-card p-8 shadow-[0_24px_64px_rgba(0,0,0,0.55)] mx-auto"
      style={{
        boxShadow:
          '0 0 0 1px rgba(124,58,237,0.15), 0 24px 64px rgba(0,0,0,0.55), 0 0 60px rgba(124,58,237,0.08)',
      }}
    >
      {/* Inner glow top edge */}
      <div
        className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
        style={{
          background:
            'linear-gradient(90deg, transparent 10%, rgba(124,58,237,0.45) 50%, transparent 90%)',
        }}
      />
      {children}
    </motion.div>
  );
}
