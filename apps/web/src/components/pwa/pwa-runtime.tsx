'use client';

import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { listMutations, removeMutation, updateMutation, type OfflineMutation } from '@/lib/offline-queue';

export function PwaRuntime() {
  const queryClient = useQueryClient();
  const [online, setOnline] = useState(true);
  const [items, setItems] = useState<OfflineMutation[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const refresh = useCallback(async () => setItems(await listMutations()), []);

  const synchronize = useCallback(async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    const queued = await listMutations();
    for (const item of queued.filter((entry) => entry.status === 'pending')) {
      try {
        await apiClient.request({
          method: item.method,
          url: item.url,
          data: item.data,
          headers: item.headers,
          _offlineReplay: true,
        });
        await removeMutation(item.id);
      } catch (error: any) {
        const conflict = error?.response?.status === 409;
        await updateMutation(item.id, {
          attempts: item.attempts + 1,
          status: conflict ? 'conflict' : 'failed',
          error: error?.response?.data?.message ?? error?.message ?? 'Falha ao sincronizar',
        });
        if (!conflict && !error?.response) break;
      }
    }
    await refresh();
    await queryClient.invalidateQueries();
    setSyncing(false);
  }, [queryClient, refresh, syncing]);

  useEffect(() => {
    setOnline(navigator.onLine);
    void refresh();
    if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js');

    const handleOnline = () => {
      setOnline(true);
      void synchronize();
    };
    const handleOffline = () => setOnline(false);
    const handleQueue = () => void refresh();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline:queue-changed', handleQueue);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline:queue-changed', handleQueue);
    };
  }, [refresh, synchronize]);

  const conflicts = items.filter((item) => item.status === 'conflict' || item.status === 'failed');
  if (online && items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-violet-500/30 bg-zinc-950/95 p-3 text-sm text-zinc-100 shadow-2xl backdrop-blur">
      <button className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setExpanded((value) => !value)}>
        <span>{online ? (syncing ? 'Sincronizando...' : `${items.length} alteracao(oes) local(is)`) : 'Modo offline'}</span>
        <span className={online ? 'text-emerald-400' : 'text-amber-400'}>{online ? 'online' : 'sem rede'}</span>
      </button>
      {expanded && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="mb-2 text-xs text-zinc-400">As alteracoes pendentes ficam neste dispositivo ate a sincronizacao.</p>
          {conflicts.map((item) => (
            <div key={item.id} className="mb-2 rounded-lg bg-red-950/40 p-2 text-xs">
              <p className="font-medium text-red-300">Conflito em {item.method.toUpperCase()} {item.url}</p>
              <p className="mt-1 text-zinc-400">{item.error}</p>
              <div className="mt-2 flex gap-2">
                <button className="text-violet-300" onClick={() => void updateMutation(item.id, { status: 'pending', error: undefined }).then(synchronize)}>Tentar novamente</button>
                <button className="text-zinc-400" onClick={() => void removeMutation(item.id).then(() => { toast.info('Alteracao local descartada'); void refresh(); })}>Descartar</button>
              </div>
            </div>
          ))}
          {online && items.some((item) => item.status === 'pending') && (
            <button className="mt-1 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium disabled:opacity-50" disabled={syncing} onClick={() => void synchronize()}>Sincronizar agora</button>
          )}
        </div>
      )}
    </div>
  );
}
