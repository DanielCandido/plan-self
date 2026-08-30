'use client';

export type OfflineMutationStatus = 'pending' | 'conflict' | 'failed';

export interface OfflineMutation {
  id: string;
  method: 'post' | 'put' | 'patch' | 'delete';
  url: string;
  data: unknown;
  headers: Record<string, string>;
  createdAt: string;
  attempts: number;
  status: OfflineMutationStatus;
  error?: string;
}

const DB_NAME = 'plan-self-offline';
const STORE_NAME = 'mutations';
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void,
): Promise<T> {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => action(database.transaction(STORE_NAME, mode).objectStore(STORE_NAME), resolve, reject));
  } finally {
    database.close();
  }
}

export function notifyQueueChanged() {
  window.dispatchEvent(new Event('offline:queue-changed'));
}

export async function enqueueMutation(input: Omit<OfflineMutation, 'createdAt' | 'attempts' | 'status'>) {
  const mutation: OfflineMutation = {
    ...input,
    createdAt: new Date().toISOString(),
    attempts: 0,
    status: 'pending',
  };
  await transaction<void>('readwrite', (store, resolve, reject) => {
    const request = store.put(mutation);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  notifyQueueChanged();
  return mutation;
}

export async function listMutations(): Promise<OfflineMutation[]> {
  const items = await transaction<OfflineMutation[]>('readonly', (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as OfflineMutation[]);
    request.onerror = () => reject(request.error);
  });
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function updateMutation(id: string, changes: Partial<OfflineMutation>) {
  await transaction<void>('readwrite', (store, resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      if (!getRequest.result) return resolve();
      const putRequest = store.put({ ...getRequest.result, ...changes });
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
  });
  notifyQueueChanged();
}

export async function removeMutation(id: string) {
  await transaction<void>('readwrite', (store, resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  notifyQueueChanged();
}
