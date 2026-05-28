'use client';

import { useMemo } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateTeamPayload, TeamVisibility } from '@plan-self/types';

const teamSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  color: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'SECRET']),
});

type TeamFormValues = z.input<typeof teamSchema>;

export function CreateTeamModal({
  open,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateTeamPayload) => Promise<unknown>;
}) {
  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#7c3aed',
      avatarUrl: '',
      visibility: 'PRIVATE',
    },
  });

  const slugPreview = useMemo(() => {
    const value = form.watch('name') ?? '';
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, [form]);

  if (!open) return null;

  return (
    <ModalShell title="Create Team" onClose={() => onOpenChange(false)}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit({
            name: values.name,
            description: values.description || undefined,
            color: values.color || undefined,
            avatarUrl: values.avatarUrl || undefined,
            visibility: values.visibility as TeamVisibility,
          });
          form.reset();
          onOpenChange(false);
        })}
      >
        <Field label="Name">
          <input {...form.register('name')} className={inputClass} placeholder="Core Engineering" />
          <p className="text-xs text-white/45">slug preview: {slugPreview || 'team-slug'}</p>
        </Field>
        <Field label="Description">
          <textarea {...form.register('description')} className={`${inputClass} min-h-20`} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Color">
            <input {...form.register('color')} type="color" className="h-10 w-full rounded-md border border-white/10 bg-transparent" />
          </Field>
          <Field label="Visibility">
            <select {...form.register('visibility')} className={inputClass}>
              <option value="PRIVATE">Private</option>
              <option value="PUBLIC">Public</option>
              <option value="SECRET">Secret</option>
            </select>
          </Field>
        </div>
        <Field label="Avatar URL">
          <input {...form.register('avatarUrl')} className={inputClass} placeholder="https://..." />
        </Field>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-gradient-to-r from-[#7a3ffc] to-[#9c67ff] px-5 py-2 text-sm font-semibold text-white"
          >
            {isSubmitting ? 'Saving...' : 'Create Team'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#101118] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md border border-white/10 px-3 py-1 text-sm text-white/70">
            Esc
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm text-white/75">
      <span>{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none';
