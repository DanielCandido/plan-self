'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { TeamMemberItem } from '@plan-self/types';
import apiClient from '@/lib/api';

export function AdminResetPasswordDialog({
  member,
  currentUserId,
  onClose,
  onSelfReset,
}: {
  member: TeamMemberItem | null;
  currentUserId: string;
  onClose: () => void;
  onSelfReset: () => Promise<void>;
}) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPassword('');
    setConfirmation('');
  }, [member?.userId]);

  if (!member) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmation) return toast.error('As senhas nao conferem');
    setSubmitting(true);
    try {
      await apiClient.patch(
        `/users/${member.userId}/password`,
        { newPassword: password },
        { _offlineQueue: false },
      );
      toast.success('Senha redefinida e sessoes revogadas');
      if (member.userId === currentUserId) await onSelfReset();
      else onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Nao foi possivel redefinir a senha');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="reset-password-title">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <h2 id="reset-password-title" className="text-xl font-semibold text-white">Redefinir senha local</h2>
        <p className="mt-2 text-sm text-white/60">
          Nova senha para <strong className="text-white/90">{member.name}</strong>. Todas as sessoes atuais dessa conta serao encerradas.
        </p>
        <label className="mt-5 block text-sm text-white/70">
          Nova senha
          <input type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-violet-500" />
        </label>
        <p className="mt-1 text-xs text-white/40">Minimo de 12 caracteres, com maiuscula, minuscula e numero.</p>
        <label className="mt-4 block text-sm text-white/70">
          Confirmar senha
          <input type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-violet-500" />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" disabled={submitting} onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-white/60 hover:bg-white/5">Cancelar</button>
          <button type="submit" disabled={submitting || password.length < 12} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Redefinindo...' : 'Redefinir e revogar sessoes'}</button>
        </div>
      </form>
    </div>
  );
}
