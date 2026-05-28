export function TeamsHeader({
  searchTerm,
  onSearchChange,
  onOpenCreate,
  onOpenInvite,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenCreate: () => void;
  onOpenInvite: () => void;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <h1 className="text-6xl font-semibold tracking-tight text-white">Team Management</h1>
        <p className="mt-2 text-2xl text-white/65">
          Manage organization structure and collaborate across departments.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search team or members..."
          className="h-12 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-white outline-none"
        />
        <button
          type="button"
          onClick={onOpenCreate}
          className="h-12 rounded-xl border border-white/20 bg-white/[0.04] px-5 text-base font-semibold text-white"
        >
          New Team
        </button>
        <button
          type="button"
          onClick={onOpenInvite}
          className="h-12 rounded-xl bg-gradient-to-r from-[#7a3ffc] to-[#9c67ff] px-5 text-base font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.35)]"
        >
          Invite Member
        </button>
      </div>
    </header>
  );
}
