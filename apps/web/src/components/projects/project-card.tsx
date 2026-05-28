'use client';

import Link from 'next/link';
import type { ProjectItem } from '@plan-self/types';
import { ProjectProgressBar } from './project-progress-bar';
import { ProjectStatusBadge } from './project-status-badge';

function formatDate(input: string) {
  return new Date(input).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export function ProjectCard({
  project,
  onEdit,
  onMembers,
  onArchive,
}: {
  project: ProjectItem;
  onEdit: (projectId: string) => void;
  onMembers: (projectId: string) => void;
  onArchive: (projectId: string) => void;
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-[#1c1e28] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div
          className="h-14 w-14 rounded-md border border-white/10"
          style={{ background: project.color ?? '#3b2a66' }}
        />
        <ProjectStatusBadge status={project.status} />
      </div>

      <h3 className="mb-2 line-clamp-2 text-2xl font-semibold leading-tight text-white">
        {project.name}
      </h3>
      <p className="mb-8 line-clamp-3 min-h-[84px] text-md text-white/70">
        {project.description || 'Sem descrição definida para este projeto.'}
      </p>

      <ProjectProgressBar
        progress={project.meta?.progress ?? project.progress ?? 0}
        color={project.color}
        status={project.status}
      />

      <div className="my-6 h-px bg-white/10" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xs font-semibold text-white/75">
            {project.owner?.name?.slice(0, 2).toUpperCase() ?? 'PS'}
          </div>
          <span className="text-lg text-white/80">{project.owner?.name ?? 'Sem responsável'}</span>
        </div>
        <span className="text-lg text-white/70">{formatDate(project.updatedAt)}</span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href={`/projects/${project.id}/sprints`}
          className="rounded-md border border-[#b794ff]/40 bg-[#b794ff]/10 px-3 py-2 text-sm font-medium text-[#d7c5ff] hover:bg-[#b794ff]/20"
        >
          Open board
        </Link>
        <button
          type="button"
          onClick={() => onEdit(project.id)}
          className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/75 hover:bg-white/[0.08]"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onMembers(project.id)}
          className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/75 hover:bg-white/[0.08]"
        >
          Members
        </button>
        <button
          type="button"
          onClick={() => onArchive(project.id)}
          className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/75 hover:bg-white/[0.08]"
        >
          {project.archived ? 'Unarchive' : 'Archive'}
        </button>
      </div>
    </article>
  );
}
