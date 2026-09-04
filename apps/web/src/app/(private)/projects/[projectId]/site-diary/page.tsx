'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useProjectById, useSiteDiaries } from '@/hooks/use-projects';

const lines = (value: string) => value.split('\n').map((text) => text.trim()).filter(Boolean).map((description) => ({ description }));

export default function SiteDiaryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProjectById(projectId);
  const { diaries, isLoading, saveDiary, uploadPhoto, openPhoto, isSaving } = useSiteDiaries(projectId);
  const [selectedId, setSelectedId] = useState('');
  const selected = useMemo(() => diaries.find((item) => item.id === selectedId) ?? diaries[0], [diaries, selectedId]);
  const [date, setDate] = useState(''); const [weather, setWeather] = useState('Ensolarado'); const [temperature, setTemperature] = useState('');
  const [workforce, setWorkforce] = useState(''); const [equipment, setEquipment] = useState(''); const [services, setServices] = useState(''); const [occurrences, setOccurrences] = useState(''); const [notes, setNotes] = useState('');

  if (project && project.profile !== 'CONSTRUCTION_SITE') return <div className="rounded-3xl border border-white/10 bg-[#111219] p-8 text-white/60">Diario de obra disponivel apenas para projetos de construcao.</div>;
  async function submit(event: FormEvent) { event.preventDefault(); await saveDiary({ reportDate: date, weather, temperature: temperature ? Number(temperature) : null, workforce: workforce.split('\n').filter(Boolean).map((row) => { const [role, quantity] = row.split(':'); return { role: role.trim(), quantity: Number(quantity ?? 1) }; }), equipment: lines(equipment), services: lines(services), occurrences: lines(occurrences), notes: notes || null, status: 'DRAFT' }); }

  return <main className="mx-auto grid max-w-[1600px] gap-6 xl:grid-cols-[420px_1fr]">
    <form onSubmit={submit} className="h-fit space-y-4 rounded-[28px] border border-white/10 bg-[#111219] p-5">
      <div><p className="text-xs uppercase tracking-[.2em] text-white/40">Campo</p><h2 className="text-2xl font-semibold text-white">Novo diario de obra</h2></div>
      <div className="grid grid-cols-2 gap-3"><input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} /><input type="number" placeholder="Temperatura °C" value={temperature} onChange={(e) => setTemperature(e.target.value)} className={inputClass} /></div>
      <select value={weather} onChange={(e) => setWeather(e.target.value)} className={inputClass}><option>Ensolarado</option><option>Nublado</option><option>Chuva</option><option>Chuva intensa</option></select>
      <Area label="Efetivo (funcao: quantidade)" value={workforce} onChange={setWorkforce} placeholder={'Pedreiro: 4\nServente: 6'} />
      <Area label="Equipamentos (um por linha)" value={equipment} onChange={setEquipment} />
      <Area label="Servicos executados (um por linha)" value={services} onChange={setServices} required />
      <Area label="Ocorrencias (uma por linha)" value={occurrences} onChange={setOccurrences} />
      <Area label="Observacoes" value={notes} onChange={setNotes} />
      <button disabled={isSaving} className={buttonClass}>Salvar diario</button>
    </form>
    <section className="space-y-4">
      {isLoading ? <p className="text-white/50">Carregando...</p> : diaries.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-white/45">Nenhum diario registrado.</div> : <>
        <select value={selected?.id ?? ''} onChange={(e) => setSelectedId(e.target.value)} className={inputClass}>{diaries.map((diary) => <option key={diary.id} value={diary.id}>{new Date(diary.reportDate).toLocaleDateString('pt-BR')} · {diary.weather}</option>)}</select>
        {selected && <article className="rounded-[28px] border border-white/10 bg-[#111219] p-6 text-white/75">
          <div className="flex justify-between"><div><p className="text-sm text-white/40">{new Date(selected.reportDate).toLocaleDateString('pt-BR')}</p><h2 className="text-2xl font-semibold text-white">{selected.weather} {selected.temperature != null ? `· ${selected.temperature} °C` : ''}</h2></div><span>{selected.status}</span></div>
          <div className="mt-6 grid gap-5 md:grid-cols-2"><List title="Efetivo" values={selected.workforce.map((x) => `${x.role}: ${x.quantity}`)} /><List title="Equipamentos" values={selected.equipment.map((x) => x.description)} /><List title="Servicos" values={selected.services.map((x) => x.description)} /><List title="Ocorrencias" values={selected.occurrences.map((x) => x.description)} /></div>
          <div className="mt-6 border-t border-white/10 pt-5"><h3 className="font-semibold text-white">Fotos</h3><div className="mt-3 flex flex-wrap gap-2">{selected.photos.map((photo) => <button key={photo.id} onClick={() => openPhoto(selected.id, photo)} className="rounded-lg border border-white/10 px-3 py-2 text-sm">{photo.caption || photo.originalName}</button>)}</div><label className="mt-4 block text-sm text-violet-300">Adicionar foto<input type="file" accept="image/*" capture="environment" className="mt-2 block text-white/60" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadPhoto({ diaryId: selected.id, file }); }} /></label><p className="mt-2 text-xs text-white/35">Fotos exigem conexao; o restante do diario pode entrar na fila offline.</p></div>
        </article>}
      </>}
    </section>
  </main>;
}

function Area({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) { return <label className="block text-sm text-white/60">{label}<textarea required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputClass} mt-2 min-h-20 w-full`} /></label>; }
function List({ title, values }: { title: string; values: string[] }) { return <div><h3 className="font-semibold text-white">{title}</h3>{values.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{values.map((value, i) => <li key={i}>{value}</li>)}</ul> : <p className="mt-2 text-sm text-white/35">Sem registros</p>}</div>; }
const inputClass = 'w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-sm text-white outline-none'; const buttonClass = 'w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50';
