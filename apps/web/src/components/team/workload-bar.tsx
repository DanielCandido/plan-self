export function WorkloadBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value));
  const color =
    safe > 80 ? 'bg-rose-300' : safe > 60 ? 'bg-amber-300' : safe > 35 ? 'bg-sky-300' : 'bg-[#c8b2ff]';

  return (
    <div className="h-2 w-32 rounded-full bg-white/15">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${safe}%` }} />
    </div>
  );
}
