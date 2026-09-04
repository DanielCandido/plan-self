'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateProjectPayload, ProjectItem } from '@plan-self/types';
import { useProjectFormOptions } from '@/hooks/use-projects';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  color: z.string().optional(),
  ownerId: z.string().optional(),
  teamId: z.string().optional(),
  profile: z.enum(['GENERAL', 'CONSTRUCTION_SITE']),
  siteName: z.string().optional(), address: z.string().optional(), city: z.string().optional(), state: z.string().max(2).optional(), postalCode: z.string().optional(),
  clientName: z.string().optional(), clientDocument: z.string().optional(), technicalManagerName: z.string().optional(), technicalManagerRegistry: z.string().optional(),
  artNumber: z.string().optional(), permitNumber: z.string().optional(), contractNumber: z.string().optional(), plannedStart: z.string().optional(), plannedEnd: z.string().optional(),
});

type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

const COLOR_PRESETS = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

function resolveInitialOption(
  enabled: boolean,
  initialId: string | null | undefined,
  initialName: string | null | undefined,
) {
  if (!enabled || !initialId || !initialName) {
    return null;
  }

  return { id: initialId, name: initialName };
}

function constructionDefaults(project?: ProjectItem | null) {
  const data = project?.construction;
  return {
    siteName: data?.siteName ?? '', address: data?.address ?? '', city: data?.city ?? '', state: data?.state ?? '', postalCode: data?.postalCode ?? '',
    clientName: data?.clientName ?? '', clientDocument: data?.clientDocument ?? '', technicalManagerName: data?.technicalManagerName ?? '',
    technicalManagerRegistry: data?.technicalManagerRegistry ?? '', artNumber: data?.artNumber ?? '', permitNumber: data?.permitNumber ?? '', contractNumber: data?.contractNumber ?? '',
    plannedStart: data?.plannedStart?.slice(0, 10) ?? '', plannedEnd: data?.plannedEnd?.slice(0, 10) ?? '',
  };
}

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
  const [ownerSearch, setOwnerSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const { ownerOptions, teamOptions, isLoadingOwnerOptions, isLoadingTeamOptions } = useProjectFormOptions(
    ownerSearch,
    teamSearch,
    open,
  );
  const shouldShowInitialOwnerOption =
    Boolean(initialProject?.ownerId && initialProject?.owner?.name) &&
    !ownerOptions.some((item) => item.id === initialProject?.ownerId);
  const shouldShowInitialTeamOption =
    Boolean(initialProject?.teamId && initialProject?.team?.name) &&
    !teamOptions.some((item) => item.id === initialProject?.teamId);
  const initialOwnerOption = resolveInitialOption(
    shouldShowInitialOwnerOption,
    initialProject?.ownerId,
    initialProject?.owner?.name,
  );
  const initialTeamOption = resolveInitialOption(
    shouldShowInitialTeamOption,
    initialProject?.teamId,
    initialProject?.team?.name,
  );
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
      profile: initialProject?.profile ?? 'GENERAL',
      ...constructionDefaults(initialProject),
    },
  });
  const resetForm = form.reset;

  useEffect(() => {
    resetForm({
      name: initialProject?.name ?? '',
      description: initialProject?.description ?? '',
      status: initialProject?.status ?? 'PLANNED',
      priority: initialProject?.priority ?? 'MEDIUM',
      color: initialProject?.color ?? '#7c3aed',
      ownerId: initialProject?.ownerId ?? '',
      teamId: initialProject?.teamId ?? '',
      profile: initialProject?.profile ?? 'GENERAL',
      ...constructionDefaults(initialProject),
    });
  }, [initialProject, open, resetForm]);

  useEffect(() => {
    if (!open) {
      setOwnerSearch('');
      setTeamSearch('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#101118] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
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
              profile: values.profile,
              construction: values.profile === 'CONSTRUCTION_SITE' ? {
                siteName: values.siteName || undefined, address: values.address || undefined, city: values.city || undefined, state: values.state?.toUpperCase() || undefined, postalCode: values.postalCode || undefined,
                clientName: values.clientName || undefined, clientDocument: values.clientDocument || undefined, technicalManagerName: values.technicalManagerName || undefined,
                technicalManagerRegistry: values.technicalManagerRegistry || undefined, artNumber: values.artNumber || undefined, permitNumber: values.permitNumber || undefined,
                contractNumber: values.contractNumber || undefined, plannedStart: values.plannedStart || undefined, plannedEnd: values.plannedEnd || undefined,
              } : undefined,
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

          <Field label="Perfil do projeto">
            <select {...form.register('profile')} className={inputClass}>
              <option value="GENERAL">Geral</option>
              <option value="CONSTRUCTION_SITE">Obra / Engenharia civil</option>
            </select>
          </Field>

          {form.watch('profile') === 'CONSTRUCTION_SITE' && (
            <fieldset className="space-y-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
              <legend className="px-2 text-sm font-semibold text-amber-200">Cadastro tecnico da obra</legend>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome do canteiro"><input {...form.register('siteName')} className={inputClass} /></Field>
                <Field label="Cliente"><input {...form.register('clientName')} className={inputClass} /></Field>
                <Field label="CPF/CNPJ do cliente"><input {...form.register('clientDocument')} className={inputClass} /></Field>
                <Field label="Contrato"><input {...form.register('contractNumber')} className={inputClass} /></Field>
              </div>
              <Field label="Endereco da obra"><input {...form.register('address')} className={inputClass} /></Field>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Cidade"><input {...form.register('city')} className={inputClass} /></Field>
                <Field label="UF"><input {...form.register('state')} maxLength={2} className={inputClass} /></Field>
                <Field label="CEP"><input {...form.register('postalCode')} className={inputClass} /></Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Responsavel tecnico"><input {...form.register('technicalManagerName')} className={inputClass} /></Field>
                <Field label="CREA/CAU"><input {...form.register('technicalManagerRegistry')} className={inputClass} /></Field>
                <Field label="ART/RRT"><input {...form.register('artNumber')} className={inputClass} /></Field>
                <Field label="Alvara"><input {...form.register('permitNumber')} className={inputClass} /></Field>
                <Field label="Inicio planejado"><input type="date" {...form.register('plannedStart')} className={inputClass} /></Field>
                <Field label="Termino planejado"><input type="date" {...form.register('plannedEnd')} className={inputClass} /></Field>
              </div>
              <p className="text-xs text-amber-100/60">Ao criar a obra, a EAP padrao de fases e servicos sera gerada automaticamente.</p>
            </fieldset>
          )}

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
            <Field label="Owner">
              <div className="space-y-2">
                <input
                  value={ownerSearch}
                  onChange={(event) => setOwnerSearch(event.target.value)}
                  className={inputClass}
                  placeholder="Search owner..."
                />
                <select {...form.register('ownerId')} className={inputClass}>
                  <option value="">No owner</option>
                  {initialOwnerOption ? (
                    <option value={initialOwnerOption.id}>{initialOwnerOption.name}</option>
                  ) : null}
                  {ownerOptions.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
                {isLoadingOwnerOptions ? <p className="text-xs text-white/45">Loading owners...</p> : null}
              </div>
            </Field>
            <Field label="Team">
              <div className="space-y-2">
                <input
                  value={teamSearch}
                  onChange={(event) => setTeamSearch(event.target.value)}
                  className={inputClass}
                  placeholder="Search team..."
                />
                <select {...form.register('teamId')} className={inputClass}>
                  <option value="">No team</option>
                  {initialTeamOption ? (
                    <option value={initialTeamOption.id}>{initialTeamOption.name}</option>
                  ) : null}
                  {teamOptions.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                {isLoadingTeamOptions ? <p className="text-xs text-white/45">Loading teams...</p> : null}
              </div>
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
