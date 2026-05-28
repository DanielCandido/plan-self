export function KanbanErrorState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111218] px-4">
      <div className="glass-card w-full max-w-md rounded-3xl border border-white/10 p-6 text-center">
        <h1 className="text-lg font-semibold text-white">Falha ao carregar board</h1>
        <p className="mt-2 text-sm text-white/60">Atualize a página para tentar novamente.</p>
      </div>
    </main>
  );
}
