'use client';

import { useMemo, useState } from 'react';
import type { InvitePayload, TeamItem } from '@plan-self/types';

export function InviteMemberModal({
  open,
  teams,
  selectedTeamId,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  teams: TeamItem[];
  selectedTeamId: string | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (teamId: string, payload: InvitePayload) => Promise<void>;
}) {
  const [emailInput, setEmailInput] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [teamId, setTeamId] = useState<string | null>(selectedTeamId);

  const emails = useMemo(
    () =>
      emailInput
        .split(/[\n,;]/)
        .map((email) => email.trim())
        .filter(Boolean),
    [emailInput],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#101118] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-white">Invite Members</h3>
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-md border border-white/10 px-3 py-1 text-sm text-white/70">
            Esc
          </button>
        </div>
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-white/70">Emails (comma/line separated)</span>
            <textarea
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              className="min-h-24 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none"
              placeholder="jane@plan-self.io, john@plan-self.io"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm text-white/70">Role</span>
              <select value={role} onChange={(event) => setRole(event.target.value)} className={inputClass}>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="MEMBER">Member</option>
                <option value="GUEST">Guest</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/70">Team</span>
              <select value={teamId ?? ''} onChange={(event) => setTeamId(event.target.value)} className={inputClass}>
                <option value="">Select team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/70">Expiration (days)</span>
              <input
                type="number"
                min={1}
                max={30}
                value={expiresInDays}
                onChange={(event) => setExpiresInDays(Number.parseInt(event.target.value, 10) || 7)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <p className="mb-2 text-sm text-white/70">Invite preview ({emails.length})</p>
            <ul className="space-y-1 text-sm text-white/80">
              {emails.length ? emails.map((email) => <li key={email}>• {email}</li>) : <li>Nenhum email informado.</li>}
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!teamId || !emails.length || isSubmitting}
              onClick={async () => {
                if (!teamId) return;
                await onSubmit(teamId, { emails, role, expiresInDays });
                setEmailInput('');
                onOpenChange(false);
              }}
              className="rounded-lg bg-gradient-to-r from-[#7a3ffc] to-[#9c67ff] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send invites'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass = 'h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none';
