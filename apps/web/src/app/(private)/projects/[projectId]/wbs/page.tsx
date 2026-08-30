'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import type { WbsNodeType } from '@plan-self/types';
import { useProjectWbs } from '@/hooks/use-projects';

export default function WbsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { nodes, isLoading, createNode, removeNode, isSaving } = useProjectWbs(projectId);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<WbsNodeType>('WORK_PACKAGE');
  const [parentId, setParentId] = useState('');
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, typeof nodes>();
    for (const node of nodes) map.set(node.parentId, [...(map.get(node.parentId) ?? []), node]);
    return map;
  }, [nodes]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await createNode({ code, name, type, parentId: parentId || undefined });
    setCode(''); setName(''); setParentId('');
  }

  return (
    <main className="mx-auto grid max-w-[1600px] gap-6 xl:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="h-fit space-y-4 rounded-[28px] border border-white/10 bg-[#111219] p-5">
        <div><p className="text-xs uppercase tracking-[.2em] text-white/40">Estrutura analitica</p><h2 className="text-xl font-semibold text-white">Novo item da EAP</h2></div>
        <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="Codigo (ex.: 1.2)" className={inputClass} />
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className={inputClass} />
        <select value={type} onChange={(e) => setType(e.target.value as WbsNodeType)} className={inputClass}>
          <option value="PHASE">Fase</option><option value="DELIVERABLE">Entregavel</option><option value="WORK_PACKAGE">Pacote de trabalho</option>
        </select>
        <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={inputClass}>
          <option value="">Sem item pai</option>{nodes.map((node) => <option key={node.id} value={node.id}>{node.code} - {node.name}</option>)}
        </select>
        <button disabled={isSaving} className="w-full rounded-xl bg-[#8b5cf6] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Adicionar</button>
      </form>

      <section className="rounded-[28px] border border-white/10 bg-[#111219] p-5">
        <div className="mb-5"><p className="text-xs uppercase tracking-[.2em] text-white/40">Planejamento</p><h2 className="text-2xl font-semibold text-white">EAP do projeto</h2></div>
        {isLoading ? <p className="text-white/50">Carregando...</p> : nodes.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/45">Nenhum item cadastrado.</p> : (
          <div className="space-y-2">{(childrenByParent.get(null) ?? []).map((node) => <WbsRow key={node.id} node={node} depth={0} childrenByParent={childrenByParent} onRemove={removeNode} />)}</div>
        )}
      </section>
    </main>
  );
}

function WbsRow({ node, depth, childrenByParent, onRemove }: { node: any; depth: number; childrenByParent: Map<string | null, any[]>; onRemove: (id: string) => Promise<unknown> }) {
  return <><div style={{ marginLeft: depth * 24 }} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.03] px-4 py-3"><div><span className="mr-3 font-mono text-xs text-[#bda4ff]">{node.code}</span><span className="text-sm font-medium text-white">{node.name}</span><p className="mt-1 text-xs text-white/45">{node.type} · {node._count.tasks} tarefas</p></div><button onClick={() => onRemove(node.id)} className="text-xs text-rose-300">Remover</button></div>{(childrenByParent.get(node.id) ?? []).map((child) => <WbsRow key={child.id} node={child} depth={depth + 1} childrenByParent={childrenByParent} onRemove={onRemove} />)}</>;
}

const inputClass = 'w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-sm text-white outline-none';
