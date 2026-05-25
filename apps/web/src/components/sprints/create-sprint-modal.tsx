'use client';

import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateSprintPayload, SprintSummary } from '@plan-self/types';

const schema = z.object({
  name: z.string().min(3),
  goal: z.string().optional(),
  objective: z.string().optional(),
  notes: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  targetVelocity: z.coerce.number().min(0).default(0),
  memberIds: z.array(z.string()).min(1),
});

type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function CreateSprintModal({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  projectId,
  teamMembers,
  recentSprint,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateSprintPayload) => Promise<void>;
  isSubmitting: boolean;
  projectId: string;
  teamMembers: Array<{ userId: string; name: string; avatarUrl: string | null }>;
  recentSprint?: SprintSummary | null;
}) {
  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      goal: '',
      objective: '',
      notes: '',
      startDate: '',
      endDate: '',
      targetVelocity: recentSprint?.velocity ?? 0,
      memberIds: teamMembers.slice(0, Math.min(teamMembers.length, 5)).map((member) => member.userId),
    },
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === 'Escape') onOpenChange(false);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'enter') {
        void form.handleSubmit(async (values) => {
          await onSubmit({
            projectId,
            name: values.name,
            goal: values.goal,
            objective: values.objective,
            notes: values.notes,
            startDate: values.startDate,
            endDate: values.endDate,
            targetVelocity: values.targetVelocity,
            members: values.memberIds.map((userId: string) => ({ userId })),
          });
          onOpenChange(false);
        })();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [form, onOpenChange, onSubmit, open, projectId]);

  if (!open) return null;

  return (
    <ModalShell title="Create sprint" onClose={() => onOpenChange(false)}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit({
            projectId,
            name: values.name,
            goal: values.goal,
            objective: values.objective,
            notes: values.notes,
            startDate: values.startDate,
            endDate: values.endDate,
            targetVelocity: values.targetVelocity,
            members: values.memberIds.map((userId: string) => ({ userId })),
          });
          onOpenChange(false);
        })}
      >
        <Field label="Name"><input {...form.register('name')} className={inputClass} /></Field>
        <Field label="Goal"><input {...form.register('goal')} className={inputClass} /></Field>
        <Field label="Sprint objective"><textarea {...form.register('objective')} className={`${inputClass} min-h-24`} /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Start date"><input type="datetime-local" {...form.register('startDate')} className={inputClass} /></Field>
          <Field label="End date"><input type="datetime-local" {...form.register('endDate')} className={inputClass} /></Field>
        </div>
        <Field label="Target velocity"><input type="number" {...form.register('targetVelocity')} className={inputClass} /></Field>
        <Field label="Members">
          <div className="grid gap-2 md:grid-cols-2">
            {teamMembers.map((member) => {
              const selected = form.watch('memberIds').includes(member.userId);
              return (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => {
                    const current = form.getValues('memberIds');
                    form.setValue(
                      'memberIds',
                      selected ? current.filter((id) => id !== member.userId) : [...current, member.userId],
                    );
                  }}
                  className={`rounded-2xl border px-3 py-3 text-left text-sm ${selected ? 'border-[#b794ff]/70 bg-[#b794ff]/10 text-white' : 'border-white/10 bg-white/[0.03] text-white/65'}`}
                >
                  {member.name}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Observações"><textarea {...form.register('notes')} className={`${inputClass} min-h-20`} /></Field>
        <div className="flex items-center justify-between text-xs text-white/45">
          <span>Shortcut: Ctrl/Cmd + Enter</span>
          <button disabled={isSubmitting} className="rounded-2xl bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd] px-4 py-3 font-semibold text-[#130d22]">
            {isSubmitting ? 'Creating…' : 'Create sprint'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#101118] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 px-3 py-2 text-white/65">Esc</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm text-white/65">
      <span>{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none';
