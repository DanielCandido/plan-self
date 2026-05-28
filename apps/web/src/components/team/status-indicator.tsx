import type { MemberStatus } from '@plan-self/types';

const statusMap: Record<MemberStatus, { dot: string; label: string }> = {
  ONLINE: { dot: 'bg-emerald-400', label: 'Online' },
  OFFLINE: { dot: 'bg-white/20', label: 'Offline' },
  AWAY: { dot: 'bg-amber-400', label: 'Away' },
  BUSY: { dot: 'bg-rose-400', label: 'Busy' },
  IN_MEETING: { dot: 'bg-yellow-400', label: 'In Meeting' },
};

export function StatusIndicator({ status }: { status: MemberStatus }) {
  const config = statusMap[status] ?? statusMap.OFFLINE;
  return (
    <span className="inline-flex items-center gap-2 text-lg text-white/85">
      <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
