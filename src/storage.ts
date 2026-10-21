import { defaultRules, type Project } from './types';

const DB_NAME = 'furniture-ai-studio';
const STORE = 'projects';
const RULES_KEY = 'furniture-ai-studio-common-rules';

export function getCommonRules(): string {
  try { return localStorage.getItem(RULES_KEY) ?? defaultRules; }
  catch { return defaultRules; }
}

export function saveCommonRules(rules: string): void {
  localStorage.setItem(RULES_KEY, rules);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}

export const saveProject = (project: Project) => transaction('readwrite', store => store.put(project));
export const getProjects = () => transaction<Project[]>('readonly', store => store.getAll());
export const removeProject = (id: string) => transaction('readwrite', store => store.delete(id));

export function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
