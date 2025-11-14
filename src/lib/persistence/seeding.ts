import rawContent from '@/data/game-content.json';
import { validateGameContent } from '@/lib/utils/validation';
import { openDB, clear, put, get } from './indexedDB';
import { DB_NAME, DB_VERSION, upgrade } from './migrations';
import { createDefaultMetaProgression } from './metaProgression';

export async function seedIfNeeded(): Promise<void> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });

  // Check a sentinel in metaProgression store
  const seeded = await new Promise<boolean>((resolve) => {
    const tx = db.transaction('metaProgression', 'readonly');
    const req = tx.objectStore('metaProgression').get('seeded');
    req.onsuccess = () => resolve(!!req.result?.value);
    req.onerror = () => resolve(false);
  });

  if (seeded) return;

  // Validate and load content
  validateGameContent(rawContent);

  // Clear and seed gameContent store
  await clear(db, 'gameContent');

  type AnyContent = { id: string; type: string; [k: string]: unknown };
  const toRecords: AnyContent[] = [];

  for (const c of rawContent.actionCards) toRecords.push({ ...c, type: 'action' });
  for (const p of rawContent.predicateCards) toRecords.push({ ...p, type: 'predicate' });
  for (const t of rawContent.traits) toRecords.push({ ...t, type: 'trait' });

  for (const rec of toRecords) {
    await put(db, 'gameContent', rec);
  }

  // Initialize metaProgression if needed
  const existingMeta = await get(db, 'metaProgression', 'main');
  if (!existingMeta) {
    await put(db, 'metaProgression', createDefaultMetaProgression());
  }

  // Mark seeded
  await put(db, 'metaProgression', { key: 'seeded', value: true });
}
