export function AvatarStack({ members }: { members: Array<{ name: string; avatarUrl: string | null }>; }) {
  const visible = members.slice(0, 3);
  const overflow = Math.max(0, members.length - visible.length);

  return (
    <div className="flex items-center">
      {visible.map((member, index) => (
        <div
          key={`${member.name}-${index}`}
          className="-ml-1.5 first:ml-0 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#131521] bg-[#232633] text-xs font-semibold text-white/75"
          title={member.name}
        >
          {member.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
          ) : (
            member.name.slice(0, 2).toUpperCase()
          )}
        </div>
      ))}
      {overflow > 0 ? (
        <div className="-ml-1.5 flex h-8 min-w-8 items-center justify-center rounded-full border border-[#2e2550] bg-[#6f3ce7]/90 px-2 text-xs font-semibold text-white">
          +{overflow}
        </div>
      ) : null}
    </div>
  );
}
