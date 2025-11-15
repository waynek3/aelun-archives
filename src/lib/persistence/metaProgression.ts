import { openDB, get, put } from './indexedDB';
import { DB_NAME, DB_VERSION, upgrade } from './migrations';
import type { MetaProgression, Compendium, AffinityHistoryEntry } from '@/types/meta';

const META_KEY = 'main';

export type PersistedMetaProgression = MetaProgression & {
  key: typeof META_KEY;
  // Allow auxiliary dynamic fields such as cardProgress_* caches
  [extra: string]: unknown;
};

const DEFAULT_COMPENDIUM: Compendium = {
  discoveredCards: [],
  discoveredPredicates: [],
  discoveredTraits: [],
  discoveredAffinities: [],
  loreFragments: [],
  completionPercentage: 0,
};

export function createDefaultMetaProgression(): PersistedMetaProgression {
  return {
    key: META_KEY,
    version: 1,
    cardUnlocks: {},
    graveyard: [],
    compendium: structuredClone(DEFAULT_COMPENDIUM),
    statistics: {
      totalRuns: 0,
      longestRunTurns: 0,
      totalDeaths: 0,
    },
    affinityHistory: {},
  };
}

function normalizeMetaRecord(record: unknown): PersistedMetaProgression {
  if (!record) {
    return createDefaultMetaProgression();
  }

  const raw = record as Record<string, unknown>;
  const legacyValue = typeof raw.value === 'object' && raw.value !== null ? (raw.value as MetaProgression) : null;

  const base: PersistedMetaProgression = legacyValue
    ? { key: META_KEY, ...legacyValue }
    : ({
        key: META_KEY,
        ...(raw as unknown as MetaProgression),
      } as PersistedMetaProgression);

  if (!base.cardUnlocks) base.cardUnlocks = {};
  if (!base.graveyard) base.graveyard = [];
  if (!base.compendium) base.compendium = structuredClone(DEFAULT_COMPENDIUM);
  if (!base.statistics) {
    base.statistics = {
      totalRuns: 0,
      longestRunTurns: 0,
      totalDeaths: 0,
    };
  }
  if (!base.affinityHistory) {
    base.affinityHistory = {};
  }

  // Copy over any cardProgress_* fields from the raw record
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith('cardProgress_')) {
      base[key] = value;
    }
  }

  // Ensure compendium arrays exist
  base.compendium.discoveredCards ??= [];
  base.compendium.discoveredPredicates ??= [];
  base.compendium.discoveredTraits ??= [];
  base.compendium.discoveredAffinities ??= [];
  base.compendium.loreFragments ??= [];

  return base;
}

export async function getMetaProgression(): Promise<PersistedMetaProgression> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });
  const record = await get<Record<string, unknown> | undefined>(db, 'metaProgression', META_KEY);
  const normalized = normalizeMetaRecord(record);

  // If record did not exist or was legacy-shaped, persist the normalized form
  if (!record || (record && 'value' in record)) {
    await put(db, 'metaProgression', normalized);
  }

  return normalized;
}

export async function saveMetaProgression(meta: PersistedMetaProgression): Promise<void> {
  const db = await openDB({ name: DB_NAME, version: DB_VERSION, upgrade });
  await put(db, 'metaProgression', meta);
}

export async function updateMetaProgression(
  updater: (meta: PersistedMetaProgression) => void
): Promise<PersistedMetaProgression> {
  const meta = await getMetaProgression();
  updater(meta);
  await saveMetaProgression(meta);
  return meta;
}

export async function recordAffinityChange(entityId: string, score: number): Promise<void> {
  if (typeof indexedDB === 'undefined') {
    return
  }
  await updateMetaProgression((meta) => {
    const history: AffinityHistoryEntry = meta.affinityHistory[entityId] ?? {
      peak: score,
      lastKnown: score,
    };
    history.lastKnown = score;
    history.peak = Math.max(history.peak, score);
    meta.affinityHistory[entityId] = history;
  });
}
