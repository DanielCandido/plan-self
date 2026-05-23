'use client';

import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#12131a] p-8">
      <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
      {user && (
        <p className="text-[#d2bbff]/70">
          Olá, <span className="text-white font-medium">{user.name}</span>
        </p>
      )}
      <button
        onClick={logout}
        disabled={isLoading}
        className="mt-4 rounded-lg bg-[#7c3aed] px-5 py-2 text-sm font-medium text-white hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Saindo…' : 'Sair'}
      </button>
    </main>
  );
}
