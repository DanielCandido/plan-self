'use client';

export function ProjectProgressBar({
  progress,
  color,
  status,
}: {
  progress: number;
  color?: string | null;
  status?: string | null;
}) {
  const safeProgress = Math.min(100, Math.max(0, progress));
  const statusKey = status?.toUpperCase();
  const fallback =
    statusKey === 'AT_RISK'
      ? '#7dd3fc'
      : statusKey === 'OFF_TRACK'
        ? '#fb7185'
        : statusKey === 'COMPLETED'
          ? '#67e8f9'
          : '#c4b5fd';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/75">Progress</span>
        <span className={`${safeProgress >= 75 ? 'text-cyan-300' : 'text-amber-300'} font-medium`}>{safeProgress}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${safeProgress}%`,
            background: color ?? fallback,
          }}
        />
      </div>
    </div>
  );
}
