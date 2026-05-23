const columns = [
  { title: 'Backlog', tasks: ['Definir arquitetura multi-tenant'] },
  { title: 'Todo', tasks: ['Implementar módulo RBAC'] },
  { title: 'In Progress', tasks: ['Criar Setup Wizard'] },
  { title: 'Review', tasks: ['Validar Docker Compose'] },
  { title: 'Done', tasks: ['Estrutura monorepo inicial'] },
];

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1440px] px-margin-mobile py-xl md:px-margin-desktop">
      <header className="mb-xl rounded-lg border border-white/10 bg-surface-container/85 p-lg backdrop-blur-glass">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Plan Self</h1>
        <p className="mt-sm max-w-3xl text-base text-foreground/80">
          Kanban + colaboração em tempo real + setup guiado para self-hosting.
        </p>
        <div className="mt-md flex flex-wrap gap-sm">
          <button className="rounded px-md py-sm text-sm font-medium transition-colors duration-150 ease-in-out bg-primary text-on-primary hover:bg-primary/90">
            Primário
          </button>
          <button className="rounded border border-outline px-md py-sm text-sm font-medium transition-colors duration-150 ease-in-out hover:bg-surface-container-high/40">
            Secundário
          </button>
        </div>
      </header>

      <section className="grid gap-md md:grid-cols-2 xl:grid-cols-5">
        {columns.map((column) => (
          <article className="rounded-lg border border-white/10 bg-surface-container p-md" key={column.title}>
            <strong className="text-sm uppercase tracking-[0.02em] text-foreground/85">{column.title}</strong>
            {column.tasks.map((task) => (
              <div className="mt-sm rounded-md border border-outline-variant/70 bg-surface-container-high p-sm text-sm" key={task}>
                {task}
              </div>
            ))}
          </article>
        ))}
      </section>
    </main>
  );
}
