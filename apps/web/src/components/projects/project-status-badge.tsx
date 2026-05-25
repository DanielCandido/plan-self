'use client';

const STATUS_LABELS: Record<string, string> = {
  ON_TRACK: 'ON TRACK',
  AT_RISK: 'AT RISK',
  OFF_TRACK: 'OFF TRACK',
  COMPLETED: 'COMPLETED',
  PLANNED: 'PLANNED',
  ON_HOLD: 'ON HOLD',
  CANCELLED: 'CANCELLED',
};

const STATUS_CLASSES: Record<string, string> = {
  ON_TRACK: 'bg-emerald-500/15 text-emerald-300',
  AT_RISK: 'bg-amber-500/15 text-amber-300',
  OFF_TRACK: 'bg-rose-500/15 text-rose-300',
  COMPLETED: 'bg-cyan-500/15 text-cyan-300',
  PLANNED: 'bg-violet-500/15 text-violet-300',
  ON_HOLD: 'bg-zinc-500/15 text-zinc-300',
  CANCELLED: 'bg-rose-600/15 text-rose-300',
};

const DOT_CLASSES: Record<string, string> = {
  ON_TRACK: 'bg-emerald-400',
  AT_RISK: 'bg-amber-400',
  OFF_TRACK: 'bg-rose-400',
  COMPLETED: 'bg-cyan-400',
  PLANNED: 'bg-violet-400',
  ON_HOLD: 'bg-zinc-400',
  CANCELLED: 'bg-rose-500',
};

export function ProjectStatusBadge({ status }: { status: string | null | undefined }) {
  const key = (status ?? 'PLANNED').toUpperCase();
  const label = STATUS_LABELS[key] ?? key.replaceAll('_', ' ');
  const className = STATUS_CLASSES[key] ?? STATUS_CLASSES.PLANNED;
  const dotClass = DOT_CLASSES[key] ?? DOT_CLASSES.PLANNED;

  return (
    <span className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-semibold tracking-wide ${className}`}>
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
