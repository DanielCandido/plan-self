export function ProjectsErrorState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f1017] px-4">
      <div className="glass-card w-full max-w-md rounded-2xl border border-white/10 p-6 text-center">
        <h1 className="text-lg font-semibold text-white">Falha ao carregar projetos</h1>
        <p className="mt-2 text-sm text-white/65">
          Não foi possível carregar os projetos agora. Atualize a página para tentar novamente.
        </p>
      </div>
    </main>
  );
}
