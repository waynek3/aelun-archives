import { openDB } from '@/lib/persistence/indexedDB'
import { DB_NAME, DB_VERSION, upgrade } from '@/lib/persistence/migrations'
import type { ActionCard, PredicateCard } from '@/types/cards'

const cache: {
  actions?: Record<string, ActionCard>
  predicates?: Record<string, PredicateCard>
} = {}

async function loadAll(): Promise<void> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade })

  function getAll(store: string): Promise<Array<ActionCard | PredicateCard>> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('gameContent', 'readonly')
      const idx = tx.objectStore('gameContent').index('type')
      const req = idx.getAll(store)
      req.onsuccess = () => resolve(req.result as Array<ActionCard | PredicateCard>)
      req.onerror = () => reject(req.error)
    })
  }

  const [actions, predicates] = await Promise.all([getAll('action'), getAll('predicate')])

  cache.actions = Object.fromEntries(actions.map((a) => [a.id, a as ActionCard]))
  cache.predicates = Object.fromEntries(predicates.map((p) => [p.id, p as PredicateCard]))
}

export async function getActionCards(): Promise<Record<string, ActionCard>> {
  if (!cache.actions) await loadAll()
  return cache.actions!
}

export async function getPredicateCards(): Promise<Record<string, PredicateCard>> {
  if (!cache.predicates) await loadAll()
  return cache.predicates!
}

export async function getActionsArray(): Promise<ActionCard[]> {
  const byId = await getActionCards()
  return Object.values(byId)
}
