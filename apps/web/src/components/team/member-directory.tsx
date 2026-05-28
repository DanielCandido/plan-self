import type { DirectoryTab } from '@/store/teams.store';
import type { TeamMemberItem } from '@plan-self/types';
import { DirectoryPagination } from './directory-pagination';
import { DirectoryTable } from './directory-table';

const tabs: Array<{ value: DirectoryTab; label: string }> = [
  { value: 'all', label: 'All Members' },
  { value: 'byRole', label: 'By Role' },
  { value: 'byTeam', label: 'By Team' },
];

export function MemberDirectory({
  members,
  totalCount,
  isLoading,
  activeTab,
  onTabChange,
  page,
  onPageChange,
}: {
  members: TeamMemberItem[];
  totalCount: number;
  isLoading: boolean;
  activeTab: DirectoryTab;
  onTabChange: (tab: DirectoryTab) => void;
  page: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(120deg,rgba(255,255,255,0.03),rgba(124,58,237,0.05))] backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-5">
        <h2 className="text-5xl font-semibold text-white">Directory</h2>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={`rounded-md px-4 py-2 text-lg transition ${
                activeTab === tab.value ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <DirectoryTable members={members} isLoading={isLoading} />
      <DirectoryPagination page={page} perPage={8} totalCount={totalCount} onPageChange={onPageChange} />
    </section>
  );
}
