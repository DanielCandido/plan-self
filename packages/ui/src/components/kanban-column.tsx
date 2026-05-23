import type { ReactNode } from 'react';

interface KanbanColumnProps {
  title: string;
  children: ReactNode;
}

export const KanbanColumn = ({ title, children }: KanbanColumnProps) => (
  <section>
    <h3>{title}</h3>
    {children}
  </section>
);
