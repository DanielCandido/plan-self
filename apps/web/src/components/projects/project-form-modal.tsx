'use client';

import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateProjectPayload, ProjectItem } from '@plan-self/types';

const schema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  color: z.string().optional(),
  ownerId: z.string().optional(),
  teamId: z.string().optional(),
});

type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const COLOR_PRESETS = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

export function ProjectFormModal({
  open,
  title,
  submitLabel,
  isSubmitting,
  initialProject,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  submitLabel: string;
  isSubmitting?: boolean;
  initialProject?: ProjectItem | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateProjectPayload) => Promise<void>;
}) {
  const form = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialProject?.name ?? '',
      description: initialProject?.description ?? '',
      status: initialProject?.status ?? 'PLANNED',
      priority: initialProject?.priority ?? 'MEDIUM',
      color: initialProject?.color ?? '#7c3aed',
      ownerId: initialProject?.ownerId ?? '',
      teamId: initialProject?.teamId ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      name: initialProject?.name ?? '',
      description: initialProject?.description ?? '',
      status: initialProject?.status ?? 'PLANNED',
      priority: initialProject?.priority ?? 'MEDIUM',
      color: initialProject?.color ?? '#7c3aed',
      ownerId: initialProject?.ownerId ?? '',
      teamId: initialProject?.teamId ?? '',
    });
  }, [form, initialProject, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#101118] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-3xl font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/65"
          >
            Esc
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit({
              name: values.name,
              description: values.description || undefined,
              status: values.status || undefined,
              priority: values.priority || undefined,
              color: values.color || undefined,
              ownerId: values.ownerId || undefined,
              teamId: values.teamId || undefined,
            });
            onOpenChange(false);
          })}
        >
          <Field label="Name">
            <input {...form.register('name')} className={inputClass} placeholder="Project name" />
          </Field>

          <Field label="Description">
            <textarea {...form.register('description')} className={`${inputClass} min-h-[88px]`} />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Status">
              <select {...form.register('status')} className={inputClass}>
                <option value="PLANNED">Planned</option>
                <option value="ON_TRACK">On track</option>
                <option value="AT_RISK">At risk</option>
                <option value="OFF_TRACK">Off track</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </Field>
            <Field label="Priority">
              <select {...form.register('priority')} className={inputClass}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </Field>
          </div>

          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => form.setValue('color', color)}
                  className={`h-8 w-8 rounded-full border ${
                    form.watch('color') === color ? 'border-white/80' : 'border-white/20'
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Owner ID">
              <input {...form.register('ownerId')} className={inputClass} placeholder="Optional" />
            </Field>
            <Field label="Team ID">
              <input {...form.register('teamId')} className={inputClass} placeholder="Optional" />
            </Field>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd] px-5 py-2.5 text-sm font-semibold text-[#150d22]"
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm text-white/70">
      <span>{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none';
