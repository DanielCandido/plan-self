'use client';

import { motion } from 'framer-motion';
import type { TeamItem } from '@plan-self/types';
import { AvatarStack } from './avatar-stack';

const badgeStyle: Record<string, string> = {
  '#7c3aed': 'bg-[#7c3aed]/15 text-[#cdb4ff]',
  '#0ea5e9': 'bg-[#0ea5e9]/15 text-[#92ddff]',
};

export function TeamCard({
  team,
  onEdit,
  onArchive,
  onDuplicate,
  onDelete,
}: {
  team: TeamItem;
  onEdit: (teamId: string) => void;
  onArchive: (teamId: string) => void;
  onDuplicate: (teamId: string) => void;
  onDelete: (teamId: string) => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-[linear-gradient(120deg,rgba(255,255,255,0.03),rgba(124,58,237,0.06))] p-6 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.35)] transition hover:border-[#7c3aed]/40 hover:shadow-[0_0_0_1px_rgba(124,58,237,0.2),0_24px_60px_rgba(0,0,0,0.5)]"
    >
      <div className="mb-6 flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-sm font-semibold text-white"
          style={{ backgroundColor: team.color ?? '#2b2e3f' }}
        >
          {team.name.slice(0, 2).toUpperCase()}
        </div>
        <span className={`rounded-md px-3 py-1 text-sm font-semibold ${badgeStyle[team.color ?? ''] ?? 'bg-white/10 text-white/80'}`}>
          {team.visibility}
        </span>
      </div>

      <h3 className="mb-2 text-5xl font-semibold leading-tight text-white">{team.name}</h3>
      <p className="mb-6 min-h-[72px] text-xl text-white/70">
        {team.description ?? 'Sem descrição para este time.'}
      </p>

      <div className="mb-5 flex items-center justify-between">
        <AvatarStack
          members={Array.from({ length: Math.min(3, team.memberCount) }).map((_, idx) => ({
            name: `${team.name} ${idx + 1}`,
            avatarUrl: null,
          }))}
        />
        <span className="text-xl text-white/85">{team.activeProjects} Active Projects</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onEdit(team.id)} className={actionBtnClass}>
          Edit
        </button>
        <button type="button" onClick={() => onArchive(team.id)} className={actionBtnClass}>
          {team.archivedAt ? 'Restore' : 'Archive'}
        </button>
        <button type="button" onClick={() => onDuplicate(team.id)} className={actionBtnClass}>
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => onDelete(team.id)}
          className={`${actionBtnClass} border-rose-500/35 text-rose-300 hover:bg-rose-500/10`}
        >
          Delete
        </button>
      </div>
    </motion.article>
  );
}

const actionBtnClass =
  'rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-sm text-white/75 transition hover:bg-white/[0.08]';
