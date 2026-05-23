import type { ReactNode } from 'react';

interface KanbanColumnProps {
  title: string;
  children: ReactNode;
}

export const KanbanColumn = ({ title, children }: KanbanColumnProps) => ({ title, children });
