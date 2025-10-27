import type { ActionCard, PredicateCard } from '@/types/cards';
import type { Trait } from '@/types/character';

export function isActionCard(value: unknown): value is ActionCard {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.description === 'string' &&
    (v.actionType === 'Targeted' || v.actionType === 'Untargeted') &&
    Array.isArray(v.tags) &&
    Array.isArray(v.timescales) &&
    Array.isArray(v.failureField)
  );
}

export function isPredicateCard(value: unknown): value is PredicateCard {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.description === 'string' &&
    Array.isArray(v.sceneTags) &&
    typeof v.timescale === 'string' &&
    typeof v.outcomeLogic === 'object' &&
    !Array.isArray(v.outcomeLogic) &&
    typeof v.stateFlags === 'object' &&
    Array.isArray(v.exits)
  );
}

export function isTrait(value: unknown): value is Trait {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    (v.type === 'Passive' || v.type === 'Triggered') &&
    typeof v.effect === 'string'
  );
}

export interface GameContentFile {
  version: number;
  actionCards: ActionCard[];
  predicateCards: PredicateCard[];
  traits: Trait[];
  lifepaths: unknown[]; // typed in lifepath impl phase
}

export function validateGameContent(json: unknown): asserts json is GameContentFile {
  if (!json || typeof json !== 'object') throw new Error('Invalid content: not an object');
  const data = json as Record<string, unknown> & GameContentFile;
  if (typeof data.version !== 'number') throw new Error('Invalid content: version missing');
  if (!Array.isArray(data.actionCards)) throw new Error('Invalid content: actionCards missing');
  if (!Array.isArray(data.predicateCards)) throw new Error('Invalid content: predicateCards missing');
  if (!Array.isArray(data.traits)) throw new Error('Invalid content: traits missing');
  if (!Array.isArray(data.lifepaths)) throw new Error('Invalid content: lifepaths missing');

  for (const c of data.actionCards) {
    if (!isActionCard(c)) throw new Error(`Invalid ActionCard: ${JSON.stringify(c)}`);
  }
  for (const p of data.predicateCards) {
    if (!isPredicateCard(p)) throw new Error(`Invalid PredicateCard: ${JSON.stringify(p)}`);
  }
  for (const t of data.traits) {
    if (!isTrait(t)) throw new Error(`Invalid Trait: ${JSON.stringify(t)}`);
  }
}