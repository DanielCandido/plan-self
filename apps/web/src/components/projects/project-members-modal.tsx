'use client';

import { useState } from 'react';
import type { ProjectAvailableUser, ProjectMember } from '@plan-self/types';

export function ProjectMembersModal({
  open,
  projectName,
  members,
  availableUsers,
  isLoading,
  isSaving,
  onOpenChange,
  onSearchChange,
  onAddMember,
  onRemoveMember,
}: {
  open: boolean;
  projectName: string;
  members: ProjectMember[];
  availableUsers: ProjectAvailableUser[];
  isLoading: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSearchChange: (value: string) => void;
  onAddMember: (userId: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
}) {
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-3xl rounded-[28px] border border-white/10 bg-[#101118] p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-white">Project members</h2>
            <p className="mt-1 text-sm text-white/60">{projectName}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/65"
          >
            Esc
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/75">Current members</h3>
            <div className="max-h-[300px] space-y-2 overflow-auto pr-1">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-white">{member.name}</p>
                    <p className="text-xs text-white/60">{member.role}</p>
                  </div>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={async () => {
                      try {
                        await onRemoveMember(member.userId);
                      } catch (error) {
                        console.error('Failed to remove project member', error);
                      }
                    }}
                    className="rounded-md border border-rose-500/30 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/75">Add people</h3>
            <input
              placeholder="Search users by name"
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none"
            />
            <div className="max-h-[300px] space-y-2 overflow-auto pr-1">
              {isLoading ? (
                <p className="text-sm text-white/60">Loading users...</p>
              ) : (
                availableUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <div>
                      <p className="text-sm text-white">{user.name}</p>
                      <p className="text-xs text-white/60">{user.role}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isSaving || user.isMember}
                      onClick={async () => {
                        try {
                          setPendingUserId(user.userId);
                          await onAddMember(user.userId);
                        } catch (error) {
                          console.error('Failed to add project member', error);
                        } finally {
                          setPendingUserId(null);
                        }
                      }}
                      className="rounded-md border border-[#b794ff]/40 px-2 py-1 text-xs text-[#d7c5ff] disabled:opacity-40"
                    >
                      {user.isMember ? 'Added' : pendingUserId === user.userId ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
