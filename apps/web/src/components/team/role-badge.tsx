const roleClassMap: Record<string, string> = {
  OWNER: 'border-[#7f63ff]/40 bg-[#7f63ff]/15 text-[#d7cbff]',
  ADMIN: 'border-[#7f63ff]/40 bg-[#7f63ff]/15 text-[#d7cbff]',
  MANAGER: 'border-[#4fa2ff]/40 bg-[#4fa2ff]/15 text-[#b8dcff]',
  MEMBER: 'border-[#f2a15a]/40 bg-[#f2a15a]/15 text-[#ffd6b0]',
  GUEST: 'border-white/20 bg-white/5 text-white/70',
};

export function RoleBadge({ role }: { role: string }) {
  const classes = roleClassMap[role] ?? roleClassMap.GUEST;
  return <span className={`rounded-md border px-3 py-1 text-sm ${classes}`}>{role}</span>;
}
