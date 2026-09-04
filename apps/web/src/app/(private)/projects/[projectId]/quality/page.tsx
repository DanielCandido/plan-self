'use client';

import { FormEvent, useState } from 'react';
import { useParams } from 'next/navigation';
import { useConstructionQuality } from '@/hooks/use-projects';

const field = 'w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-sm text-white outline-none';

export default function QualityPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const quality = useConstructionQuality(projectId);
  const [inspection, setInspection] = useState({ title: '', type: 'QUALITY', inspectionDate: new Date().toISOString().slice(0, 10), location: '', checklist: '', notes: '', status: 'OPEN' });
  const [nonConformity, setNonConformity] = useState({ inspectionId: '', code: '', title: '', description: '', severity: 'MEDIUM', dueDate: '' });

  async function saveInspection(event: FormEvent) {
    event.preventDefault();
    const checklist = inspection.checklist.split('\n').map((description) => description.trim()).filter(Boolean).map((description) => ({ description, result: 'PASS' }));
    await quality.createInspection({ ...inspection, checklist });
    setInspection((value) => ({ ...value, title: '', location: '', checklist: '', notes: '' }));
  }

  async function saveNonConformity(event: FormEvent) {
    event.preventDefault();
    await quality.createNonConformity({ ...nonConformity, inspectionId: nonConformity.inspectionId || undefined, dueDate: nonConformity.dueDate || undefined });
    setNonConformity({ inspectionId: '', code: '', title: '', description: '', severity: 'MEDIUM', dueDate: '' });
  }

  return <main className="mx-auto space-y-6 max-w-[1600px]">
    <div className="grid gap-6 xl:grid-cols-2">
      <form onSubmit={saveInspection} className="space-y-3 rounded-[28px] border border-white/10 bg-[#111219] p-5">
        <div><p className="text-xs uppercase tracking-[.2em] text-white/40">Qualidade e seguranca</p><h2 className="text-xl font-semibold text-white">Nova inspecao</h2></div>
        <input required value={inspection.title} onChange={(e) => setInspection({ ...inspection, title: e.target.value })} placeholder="Titulo da inspecao" className={field} />
        <div className="grid grid-cols-2 gap-2"><select value={inspection.type} onChange={(e) => setInspection({ ...inspection, type: e.target.value })} className={field}><option value="QUALITY">Qualidade</option><option value="SAFETY">Seguranca</option></select><input required type="date" value={inspection.inspectionDate} onChange={(e) => setInspection({ ...inspection, inspectionDate: e.target.value })} className={field} /></div>
        <input value={inspection.location} onChange={(e) => setInspection({ ...inspection, location: e.target.value })} placeholder="Local ou frente de servico" className={field} />
        <textarea required rows={4} value={inspection.checklist} onChange={(e) => setInspection({ ...inspection, checklist: e.target.value })} placeholder="Itens do checklist, um por linha" className={field} />
        <textarea rows={2} value={inspection.notes} onChange={(e) => setInspection({ ...inspection, notes: e.target.value })} placeholder="Observacoes" className={field} />
        <button disabled={quality.isSaving} className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">Registrar inspecao</button>
      </form>

      <form onSubmit={saveNonConformity} className="space-y-3 rounded-[28px] border border-white/10 bg-[#111219] p-5">
        <div><p className="text-xs uppercase tracking-[.2em] text-white/40">Tratamento</p><h2 className="text-xl font-semibold text-white">Abrir nao conformidade</h2></div>
        <div className="grid grid-cols-2 gap-2"><input required value={nonConformity.code} onChange={(e) => setNonConformity({ ...nonConformity, code: e.target.value })} placeholder="Codigo (NC-001)" className={field} /><select value={nonConformity.severity} onChange={(e) => setNonConformity({ ...nonConformity, severity: e.target.value })} className={field}><option value="LOW">Baixa</option><option value="MEDIUM">Media</option><option value="HIGH">Alta</option><option value="CRITICAL">Critica</option></select></div>
        <input required value={nonConformity.title} onChange={(e) => setNonConformity({ ...nonConformity, title: e.target.value })} placeholder="Titulo" className={field} />
        <select value={nonConformity.inspectionId} onChange={(e) => setNonConformity({ ...nonConformity, inspectionId: e.target.value })} className={field}><option value="">Sem inspecao vinculada</option>{quality.inspections.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
        <textarea required rows={3} value={nonConformity.description} onChange={(e) => setNonConformity({ ...nonConformity, description: e.target.value })} placeholder="Descreva o desvio e a evidencia" className={field} />
        <input type="date" value={nonConformity.dueDate} onChange={(e) => setNonConformity({ ...nonConformity, dueDate: e.target.value })} className={field} />
        <button disabled={quality.isSaving} className="w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">Abrir nao conformidade</button>
      </form>
    </div>

    <section className="rounded-[28px] border border-white/10 bg-[#111219] p-5"><h2 className="mb-4 text-xl font-semibold text-white">Inspecoes</h2><div className="grid gap-3 lg:grid-cols-2">{quality.inspections.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 p-4"><div className="flex justify-between gap-3"><div><h3 className="font-medium text-white">{item.title}</h3><p className="text-xs text-white/40">{item.type === 'QUALITY' ? 'Qualidade' : 'Seguranca'} · {new Date(item.inspectionDate).toLocaleDateString('pt-BR')} · {item.inspector.name}</p></div><span className="text-xs text-violet-200">{item.status}</span></div><p className="mt-2 text-sm text-white/55">{item.checklist.length} itens · {item.nonConformities.length} nao conformidades</p></article>)}{!quality.isLoading && quality.inspections.length === 0 && <p className="text-white/40">Nenhuma inspecao registrada.</p>}</div></section>

    <section className="rounded-[28px] border border-white/10 bg-[#111219] p-5"><h2 className="mb-4 text-xl font-semibold text-white">Nao conformidades</h2><div className="space-y-3">{quality.nonConformities.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs text-rose-300">{item.code} · {item.severity}</p><h3 className="font-medium text-white">{item.title}</h3><p className="mt-1 text-sm text-white/55">{item.description}</p></div><select value={item.status} disabled={quality.isSaving} onChange={(e) => quality.updateNonConformity({ id: item.id, payload: { status: e.target.value } })} className="h-fit rounded-lg border border-white/10 bg-[#171821] px-3 py-2 text-xs text-white"><option value="OPEN">Aberta</option><option value="IN_PROGRESS">Em tratamento</option><option value="RESOLVED">Resolvida</option><option value="CLOSED">Encerrada</option></select></div></article>)}{!quality.isLoading && quality.nonConformities.length === 0 && <p className="text-white/40">Nenhuma nao conformidade aberta.</p>}</div></section>
  </main>;
}
