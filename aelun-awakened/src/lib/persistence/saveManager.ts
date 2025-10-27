import { openDB, get, getAll, put, del } from './indexedDB';
import { DB_NAME, DB_VERSION, upgrade } from './migrations';
import type { Character } from '@/types/character';

export async function saveCharacter(character: Character): Promise<void> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });
  await put(db, 'characters', character);
}

export async function loadCharacter(id: string): Promise<Character | null> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });
  const c = await get<Character>(db, 'characters', id);
  return c ?? null;
}

export async function listSaves(): Promise<Array<Pick<Character, 'id' | 'name' | 'createdAt'>>> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });
  const all = await getAll<Character>(db, 'characters');
  return all.map(({ id, name, createdAt }) => ({ id, name, createdAt }));
}

export async function deleteSave(id: string): Promise<void> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });
  await del(db, 'characters', id);
}

export async function exportSave(id: string): Promise<string | null> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });
  const c = await get<Character>(db, 'characters', id);
  return c ? JSON.stringify(c, null, 2) : null;
}
