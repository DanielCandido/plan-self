'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useProjectById, useProjectWbs, useWeeklyPlans } from '@/hooks/use-projects';

export default function WeeklyPlanPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProjectById(projectId);
  const { nodes } = useProjectWbs(projectId);
  const { plans, isLoading, createPlan, addItem, updateItem, closePlan, isSaving } = useWeeklyPlans(projectId);
  const [selectedId, setSelectedId] = useState('');
  const selected = useMemo(() => plans.find((plan) => plan.id === selectedId) ?? plans[0], [plans, selectedId]);
  const [weekStart, setWeekStart] = useState('');
  const [description, setDescription] = useState('');
  const [wbsNodeId, setWbsNodeId] = useState('');
  const [unit, setUnit] = useState('un');
  const [quantity, setQuantity] = useState('1');

  if (project && project.profile !== 'CONSTRUCTION_SITE') return <div className="rounded-3xl border border-white/10 bg-[#111219] p-8 text-white/60">Planejamento de campo esta disponivel apenas para projetos de obra.</div>;

  async function create(event: FormEvent) {
    event.preventDefault();
    await createPlan({ weekStart });
    setWeekStart('');
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    await addItem({ planId: selected.id, payload: { description, wbsNodeId: wbsNodeId || undefined, unit, plannedQuantity: Number(quantity) } });
    setDescription(''); setWbsNodeId(''); setQuantity('1');
  }

  return <main className="mx-auto max-w-[1600px] space-y-6">
    <section className="flex flex-wrap items-end gap-4 rounded-[28px] border border-white/10 bg-[#111219] p-5">
      <form onSubmit={create} className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-white/60">Segunda-feira<input required type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className={`${inputClass} mt-2`} /></label>
        <button disabled={isSaving} className={buttonClass}>Nova semana</button>
      </form>
      {plans.length > 0 && <label className="ml-auto text-sm text-white/60">Semana<select value={selected?.id ?? ''} onChange={(e) => setSelectedId(e.target.value)} className={`${inputClass} mt-2`}>
        {plans.map((plan) => <option key={plan.id} value={plan.id}>{new Date(plan.weekStart).toLocaleDateString('pt-BR')} · PPC {plan.ppc}%</option>)}
      </select></label>}
    </section>

    {isLoading ? <p className="text-white/50">Carregando...</p> : !selected ? <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-white/45">Crie a primeira semana de planejamento.</div> : <>
      {selected.status !== 'CLOSED' && <form onSubmit={add} className="grid gap-3 rounded-[28px] border border-white/10 bg-[#111219] p-5 md:grid-cols-[1fr_1fr_100px_120px_auto]">
        <input required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Servico ou meta da semana" className={inputClass} />
        <select value={wbsNodeId} onChange={(e) => setWbsNodeId(e.target.value)} className={inputClass}><option value="">Sem EAP</option>{nodes.map((node) => <option key={node.id} value={node.id}>{node.code} - {node.name}</option>)}</select>
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unidade" className={inputClass} />
        <input required type="number" min="0" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
        <button disabled={isSaving} className={buttonClass}>Adicionar meta</button>
      </form>}
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#111219]">
        <div className="flex items-center justify-between p-5"><div><p className="text-xs uppercase tracking-[.2em] text-white/40">Controle fisico</p><h2 className="text-2xl font-semibold text-white">PPC {selected.ppc}%</h2></div>{selected.status !== 'CLOSED' && <button onClick={() => closePlan(selected.id)} className="text-sm text-amber-300">Encerrar semana</button>}</div>
        <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-y border-white/10 text-white/40"><tr><th className="p-4">Meta</th><th>EAP</th><th>Planejado</th><th>Realizado</th><th>Progresso</th><th>Status</th></tr></thead><tbody>{selected.items.map((item) => {
          const progress = item.plannedQuantity ? Math.min(100, Math.round(item.actualQuantity / item.plannedQuantity * 100)) : 0;
          return <tr key={item.id} className="border-b border-white/5 text-white/75"><td className="p-4 font-medium text-white">{item.description}</td><td>{item.wbsNode ? `${item.wbsNode.code} ${item.wbsNode.name}` : '—'}</td><td>{item.plannedQuantity} {item.unit}</td><td><input disabled={selected.status === 'CLOSED'} type="number" min="0" step="0.01" defaultValue={item.actualQuantity} onBlur={(e) => updateItem({ planId: selected.id, itemId: item.id, payload: { actualQuantity: Number(e.target.value) } })} className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1" /></td><td>{progress}%</td><td><span className="rounded-full bg-white/5 px-2 py-1 text-xs">{item.status}</span></td></tr>;
        })}</tbody></table></div>
      </section>
    </>}
  </main>;
}

const inputClass = 'rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-sm text-white outline-none';
const buttonClass = 'rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50';
