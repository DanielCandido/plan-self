import type { TeamMemberItem } from '@plan-self/types';
import { RoleBadge } from './role-badge';
import { StatusIndicator } from './status-indicator';
import { WorkloadBar } from './workload-bar';

export function DirectoryTable({
  members,
  isLoading,
}: {
  members: TeamMemberItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-lg bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left">
        <thead>
          <tr className="border-y border-white/10 text-sm uppercase tracking-[0.14em] text-white/50">
            <th className="px-6 py-4">Member</th>
            <th className="px-6 py-4">Role</th>
            <th className="px-6 py-4">Team</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Load</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b border-white/5 text-xl text-white/90 hover:bg-white/[0.02]">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#202331] text-sm font-semibold text-white">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-lg text-white/60">{member.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <RoleBadge role={member.role} />
              </td>
              <td className="px-6 py-4 text-lg text-white/85">{member.team ?? member.teamId}</td>
              <td className="px-6 py-4">
                <StatusIndicator status={member.status} />
              </td>
              <td className="px-6 py-4">
                <WorkloadBar value={member.workload} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
