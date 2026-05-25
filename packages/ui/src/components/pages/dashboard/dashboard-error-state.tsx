export function DashboardErrorState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#12131a] px-4">
      <div className="glass-card w-full max-w-md rounded-lg border border-white/10 p-5 text-center">
        <h2 className="text-base font-semibold text-white">Falha ao carregar dashboard</h2>
        <p className="mt-2 text-sm text-[#d2bbff]/70">
          Não foi possível obter os dados agora. Atualize a página para tentar novamente.
        </p>
      </div>
    </main>
  );
}
