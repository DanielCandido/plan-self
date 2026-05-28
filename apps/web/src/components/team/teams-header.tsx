import {PageHeaderShell} from "@plan-self/ui";
import {usePrivateShell} from "@/components/layout/private-shell-context";

export function TeamsHeader({
  searchTerm,
  onSearchChange,
  onOpenCreate,
  onOpenInvite,
                              onClear
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onOpenCreate: () => void;
  onOpenInvite: () => void;
  onClear?:() => void;
}) {
  const { toggleSidebar } = usePrivateShell();

  return (
      <PageHeaderShell
          eyebrow="Workspace"
          title="Team Management"
          description="Manage organization structure and collaborate across departments."
          onToggleSidebar={toggleSidebar}
          searchSlot={
            <input
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search teams..."
                className="h-12 w-full max-w-[640px] rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-sm text-white/85 outline-none transition focus:border-[#d2bbff]/35 focus:bg-white/[0.08]"
            />
          }
          actions={
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
              <button
                  type="button"
                  className="rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-white/80"
                  onClick={onClear}
              >
                Clear
              </button>
            </div>
          }
      />
  );
}
