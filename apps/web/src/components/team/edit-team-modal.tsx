'use client';

import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TeamItem, UpdateTeamPayload } from '@plan-self/types';

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  color: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'SECRET']),
});

type FormValues = z.input<typeof schema>;

export function EditTeamModal({
  open,
  team,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  team: TeamItem | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (teamId: string, payload: UpdateTeamPayload) => Promise<unknown>;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: team?.name ?? '',
      description: team?.description ?? '',
      color: team?.color ?? '#7c3aed',
      avatarUrl: team?.avatarUrl ?? '',
      visibility: team?.visibility ?? 'PRIVATE',
    },
  });

  useEffect(() => {
    form.reset({
      name: team?.name ?? '',
      description: team?.description ?? '',
      color: team?.color ?? '#7c3aed',
      avatarUrl: team?.avatarUrl ?? '',
      visibility: team?.visibility ?? 'PRIVATE',
    });
  }, [team, form, open]);

  if (!open || !team) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#101118] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-white">Edit Team</h3>
          <button type="button" onClick={() => onOpenChange(false)} className="rounded-md border border-white/10 px-3 py-1 text-sm text-white/70">
            Esc
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(team.id, values);
            onOpenChange(false);
          })}
        >
          <input {...form.register('name')} className={inputClass} placeholder="Team name" />
          <textarea {...form.register('description')} className={`${inputClass} min-h-20`} placeholder="Description" />
          <div className="grid grid-cols-2 gap-4">
            <input {...form.register('color')} type="color" className="h-10 w-full rounded-md border border-white/10 bg-transparent" />
            <select {...form.register('visibility')} className={inputClass}>
              <option value="PRIVATE">Private</option>
              <option value="PUBLIC">Public</option>
              <option value="SECRET">Secret</option>
            </select>
          </div>
          <input {...form.register('avatarUrl')} className={inputClass} placeholder="Avatar URL" />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-gradient-to-r from-[#7a3ffc] to-[#9c67ff] px-5 py-2 text-sm font-semibold text-white"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass = 'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none';
