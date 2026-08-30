'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useProjectTimeline } from '@/hooks/use-projects';

const DAY_MS = 86_400_000;
const DAY_WIDTH = 36;

export default function TimelinePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data, isLoading, scheduleTask, isScheduling } = useProjectTimeline(projectId);
  const scheduled = data?.tasks.filter((task) => task.plannedStart && task.plannedEnd) ?? [];
  const unscheduled = data?.tasks.filter((task) => !task.plannedStart || !task.plannedEnd) ?? [];
  const range = useMemo(() => buildRange(scheduled), [scheduled]);
  const nodeById = new Map((data?.wbs ?? []).map((node) => [node.id, node]));
  const dependencyCount = new Map<string, number>();
  for (const dependency of data?.dependencies ?? []) dependencyCount.set(dependency.blockedTaskId, (dependencyCount.get(dependency.blockedTaskId) ?? 0) + 1);

  if (isLoading) return <main className="mx-auto max-w-[1600px] rounded-[28px] border border-white/10 bg-[#111219] p-8 text-white/50">Carregando cronograma...</main>;

  return (
    <main className="mx-auto max-w-[1600px] space-y-5">
      <section className="rounded-[28px] border border-white/10 bg-[#111219] p-5">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs uppercase tracking-[.2em] text-white/40">Planejamento integrado</p><h2 className="text-2xl font-semibold text-white">Timeline / Gantt</h2></div><p className="text-sm text-white/45">{scheduled.length} planejadas · {unscheduled.length} sem datas</p></div>
        {scheduled.length === 0 ? <Empty /> : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <div style={{ minWidth: 320 + range.days.length * DAY_WIDTH }}>
              <div className="grid border-b border-white/10 bg-white/[.025]" style={{ gridTemplateColumns: `320px ${range.days.length * DAY_WIDTH}px` }}>
                <div className="sticky left-0 z-20 bg-[#15161e] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/55">Atividade</div>
                <div className="flex">{range.days.map((day) => <div key={day.toISOString()} style={{ width: DAY_WIDTH }} className="shrink-0 border-l border-white/[.06] py-2 text-center"><p className="text-[10px] text-white/35">{day.toLocaleDateString('pt-BR', { month: 'short' })}</p><p className="text-xs text-white/65">{day.getDate()}</p></div>)}</div>
              </div>
              {scheduled.map((task) => {
                const start = dayIndex(range.start, new Date(task.plannedStart!));
                const duration = Math.max(1, dayIndex(new Date(task.plannedStart!), new Date(task.plannedEnd!)) + 1);
                return <div key={task.id} className="grid border-b border-white/[.06] last:border-0" style={{ gridTemplateColumns: `320px ${range.days.length * DAY_WIDTH}px` }}>
                  <div className="sticky left-0 z-10 bg-[#111219] px-4 py-3"><p className="truncate text-sm text-white"><span className="mr-2 font-mono text-xs text-[#bda4ff]">{task.code}</span>{task.title}</p><p className="mt-1 truncate text-xs text-white/40">{task.wbsNodeId ? `${nodeById.get(task.wbsNodeId)?.code ?? ''} ${nodeById.get(task.wbsNodeId)?.name ?? ''}` : 'Sem EAP'} {dependencyCount.get(task.id) ? `· ${dependencyCount.get(task.id)} predecessoras` : ''}</p></div>
                  <div className="relative min-h-14 bg-[repeating-linear-gradient(to_right,transparent,transparent_35px,rgba(255,255,255,.05)_36px)]"><div title={`${task.title}: ${format(task.plannedStart!)} a ${format(task.plannedEnd!)}`} style={{ left: start * DAY_WIDTH + 3, width: duration * DAY_WIDTH - 6 }} className={`absolute top-3 h-8 rounded-lg border px-2 text-xs leading-8 text-white shadow-lg ${task.blocked ? 'border-rose-400/50 bg-rose-500/50' : task.state === 'DONE' ? 'border-emerald-400/40 bg-emerald-500/50' : 'border-violet-300/40 bg-violet-500/55'}`}><span className="block truncate">{duration}d</span></div></div>
                </div>;
              })}
            </div>
          </div>
        )}
      </section>
      {unscheduled.length > 0 && <section className="rounded-[28px] border border-amber-300/15 bg-amber-300/[.04] p-5"><h3 className="font-semibold text-amber-100">Tarefas sem planejamento</h3><p className="mb-3 text-sm text-amber-100/55">Defina início, término e o item da EAP para incluí-las no Gantt.</p><div className="grid gap-3 lg:grid-cols-2">{unscheduled.map((task) => <ScheduleTask key={task.id} task={task} wbs={data?.wbs ?? []} disabled={isScheduling} onSchedule={scheduleTask} />)}</div></section>}
    </main>
  );
}

function buildRange(tasks: Array<{ plannedStart: string | null; plannedEnd: string | null }>) { const now = startOfDay(new Date()); const starts = tasks.map((t) => startOfDay(new Date(t.plannedStart!)).getTime()); const ends = tasks.map((t) => startOfDay(new Date(t.plannedEnd!)).getTime()); const start = new Date(Math.min(now.getTime(), ...starts)); const rawEnd = new Date(Math.max(now.getTime() + 14 * DAY_MS, ...ends)); const end = new Date(Math.min(rawEnd.getTime(), start.getTime() + 119 * DAY_MS)); const days = Array.from({ length: dayIndex(start, end) + 1 }, (_, i) => new Date(start.getTime() + i * DAY_MS)); return { start, days }; }
function startOfDay(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function dayIndex(start: Date, end: Date) { return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / DAY_MS); }
function format(value: string) { return new Date(value).toLocaleDateString('pt-BR'); }
function Empty() { return <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center"><p className="text-white/65">Nenhuma tarefa possui início e término planejados.</p><p className="mt-1 text-sm text-white/35">As tarefas sem datas aparecem abaixo e não recebem posições artificiais.</p></div>; }

function ScheduleTask({ task, wbs, disabled, onSchedule }: { task: { id: string; code: string | null; title: string; wbsNodeId: string | null }; wbs: Array<{ id: string; code: string; name: string }>; disabled: boolean; onSchedule: (payload: { taskId: string; plannedStart: string; plannedEnd: string; wbsNodeId?: string | null }) => Promise<unknown> }) {
  const today = new Date().toISOString().slice(0, 10); const [start, setStart] = useState(today); const [end, setEnd] = useState(today); const [wbsNodeId, setWbsNodeId] = useState(task.wbsNodeId ?? '');
  async function submit(event: FormEvent) { event.preventDefault(); if (end < start) return; await onSchedule({ taskId: task.id, plannedStart: `${start}T12:00:00.000Z`, plannedEnd: `${end}T12:00:00.000Z`, wbsNodeId: wbsNodeId || null }); }
  return <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-black/15 p-3"><p className="mb-2 truncate text-sm text-white"><span className="mr-2 font-mono text-xs text-amber-200/70">{task.code}</span>{task.title}</p><div className="grid grid-cols-2 gap-2"><input aria-label="Inicio planejado" type="date" value={start} onChange={(e) => setStart(e.target.value)} className={dateClass} /><input aria-label="Termino planejado" type="date" min={start} value={end} onChange={(e) => setEnd(e.target.value)} className={dateClass} /></div><select value={wbsNodeId} onChange={(e) => setWbsNodeId(e.target.value)} className={`${dateClass} mt-2 w-full`}><option value="">Sem EAP</option>{wbs.map((node) => <option key={node.id} value={node.id}>{node.code} - {node.name}</option>)}</select><button disabled={disabled || end < start} className="mt-2 rounded-lg bg-amber-200/15 px-3 py-2 text-xs font-semibold text-amber-100 disabled:opacity-40">Planejar</button></form>;
}

const dateClass = 'rounded-lg border border-white/10 bg-[#171821] px-2 py-2 text-xs text-white outline-none';
