const columns = [
  { title: 'Backlog', tasks: ['Definir arquitetura multi-tenant'] },
  { title: 'Todo', tasks: ['Implementar módulo RBAC'] },
  { title: 'In Progress', tasks: ['Criar Setup Wizard'] },
  { title: 'Review', tasks: ['Validar Docker Compose'] },
  { title: 'Done', tasks: ['Estrutura monorepo inicial'] },
];

export default function Home() {
  return (
    <main>
      <h1>Plan Self</h1>
      <p>Kanban + colaboração em tempo real + setup guiado para self-hosting.</p>
      <section className="board">
        {columns.map((column) => (
          <article className="column" key={column.title}>
            <strong>{column.title}</strong>
            {column.tasks.map((task) => (
              <div className="card" key={task}>
                {task}
              </div>
            ))}
          </article>
        ))}
      </section>
    </main>
  );
}
