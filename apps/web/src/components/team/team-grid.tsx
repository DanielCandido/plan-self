import type { TeamItem } from '@plan-self/types';
import { TeamCard } from './team-card';

export function TeamGrid({
  teams,
  isLoading,
  onEdit,
  onArchive,
  onDuplicate,
  onDelete,
}: {
  teams: TeamItem[];
  isLoading: boolean;
  onEdit: (teamId: string) => void;
  onArchive: (teamId: string) => void;
  onDuplicate: (teamId: string) => void;
  onDelete: (teamId: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-6 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-[320px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  if (!teams.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/65">
        Nenhum time encontrado.
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          onEdit={onEdit}
          onArchive={onArchive}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
