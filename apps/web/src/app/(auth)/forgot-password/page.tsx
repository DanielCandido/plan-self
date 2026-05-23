import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#12131a] p-8">
      <h1 className="text-2xl font-semibold text-white">Recuperar senha</h1>
      <p className="mt-2 text-sm text-[#d2bbff]/55">Em breve.</p>
      <Link href="/login" className="mt-4 text-xs text-[#d2bbff]/50 hover:text-[#d2bbff]/80 transition-colors">
        ← Voltar ao login
      </Link>
    </main>
  );
}
