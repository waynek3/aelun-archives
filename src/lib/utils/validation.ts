import type { ActionCard, PredicateCard, OutcomeRule } from '@/types/cards';
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

export function isOutcomeRule(value: unknown): value is OutcomeRule {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.condition === 'string' &&
    typeof v.outcome === 'string' &&
    typeof v.parameters === 'object' &&
    v.parameters !== null
  );
}

export function isDiceModifier(value: unknown): value is string {
  return typeof value === 'string';
}

export function isFailureField(value: unknown): value is { tier: number; requiresFailures: number; maxUnlocks: number; pool: string[] } {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.tier === 'number' &&
    typeof v.requiresFailures === 'number' &&
    typeof v.maxUnlocks === 'number' &&
    Array.isArray(v.pool) &&
    v.pool.every((item: unknown) => typeof item === 'string')
  );
}

export function isTimescale(value: unknown): value is string {
  return typeof value === 'string';
}

export function isStateFlag(value: unknown): value is { flag: string; value: any } {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.flag === 'string' &&
    v.value !== undefined
  );
}

export function isExit(value: unknown): value is string {
  return typeof value === 'string';
}

export function isLifepath(value: unknown): value is { id: string; name: string; steps: unknown[] } {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    Array.isArray(v.steps)
  );
}

export function isLifepathStep(value: unknown): value is { 
  id: string; 
  prompt: string; 
  choices: unknown[] 
} {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.prompt === 'string' &&
    Array.isArray(v.choices)
  );
}

export function isRequirement(value: unknown): value is { 
  type: string; 
  value: any; 
  description: string 
} {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.type === 'string' &&
    v.value !== undefined &&
    typeof v.description === 'string'
  );
}

export function isReward(value: unknown): value is { 
  type: string; 
  value: any; 
  description: string 
} {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.type === 'string' &&
    v.value !== undefined &&
    typeof v.description === 'string'
  );
}

export function isChoice(value: unknown): value is { 
  id: string; 
  name: string; 
  stats?: Record<string, number>; 
  traits?: string[]; 
  cards?: string[] 
} {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    (v.stats === undefined || (typeof v.stats === 'object' && v.stats !== null)) &&
    (v.traits === undefined || Array.isArray(v.traits)) &&
    (v.cards === undefined || Array.isArray(v.cards))
  );
}

export function isConsequence(value: unknown): value is { 
  type: string; 
  value: any; 
  description: string 
} {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.type === 'string' &&
    v.value !== undefined &&
    typeof v.description === 'string'
  );
}

export interface GameContentFile {
  version: number;
  actionCards: ActionCard[];
  predicateCards: PredicateCard[];
  traits: Trait[];
  lifepaths: unknown[]; // kept unknown for now; validated in lifepath loader
}

export function validateGameContent(json: unknown): asserts json is GameContentFile {
  if (!json || typeof json !== 'object') throw new Error('Invalid content: not an object');
  const data = json as Record<string, unknown> & GameContentFile;
  
  // Basic structure validation
  if (typeof data.version !== 'number') throw new Error('Invalid content: version missing');
  if (!Array.isArray(data.actionCards)) throw new Error('Invalid content: actionCards missing');
  if (!Array.isArray(data.predicateCards)) throw new Error('Invalid content: predicateCards missing');
  if (!Array.isArray(data.traits)) throw new Error('Invalid content: traits missing');
  if (!Array.isArray(data.lifepaths)) throw new Error('Invalid content: lifepaths missing');

  // Validate action cards
  for (const c of data.actionCards) {
    if (!isActionCard(c)) throw new Error(`Invalid ActionCard: ${JSON.stringify(c)}`);
    
    // Validate action card properties
    if (!c.id || c.id.trim() === '') throw new Error(`Invalid ActionCard: empty id`);
    if (!c.name || c.name.trim() === '') throw new Error(`Invalid ActionCard: empty name`);
    if (!c.description || c.description.trim() === '') throw new Error(`Invalid ActionCard: empty description`);
    
    // Validate tags
    if (!Array.isArray(c.tags)) throw new Error(`Invalid ActionCard: tags must be array`);
    for (const tag of c.tags) {
      if (typeof tag !== 'string' || tag.trim() === '') {
        throw new Error(`Invalid ActionCard: invalid tag: ${tag}`);
      }
    }
    
    // Validate timescales
    if (!Array.isArray(c.timescales)) throw new Error(`Invalid ActionCard: timescales must be array`);
    for (const timescale of c.timescales) {
      if (!isTimescale(timescale)) {
        throw new Error(`Invalid ActionCard: invalid timescale: ${JSON.stringify(timescale)}`);
      }
    }
    
    // Validate failure field
    if (!Array.isArray(c.failureField)) throw new Error(`Invalid ActionCard: failureField must be array`);
    for (const failure of c.failureField) {
      if (!isFailureField(failure)) {
        throw new Error(`Invalid ActionCard: invalid failure field: ${JSON.stringify(failure)}`);
      }
    }
    
    // Validate dice modifier
    if (c.diceModifier && !isDiceModifier(c.diceModifier)) {
      throw new Error(`Invalid ActionCard: invalid dice modifier: ${JSON.stringify(c.diceModifier)}`);
    }
  }

  // Validate predicate cards
  for (const p of data.predicateCards) {
    if (!isPredicateCard(p)) throw new Error(`Invalid PredicateCard: ${JSON.stringify(p)}`);
    
    // Validate predicate card properties
    if (!p.id || p.id.trim() === '') throw new Error(`Invalid PredicateCard: empty id`);
    if (!p.name || p.name.trim() === '') throw new Error(`Invalid PredicateCard: empty name`);
    if (!p.description || p.description.trim() === '') throw new Error(`Invalid PredicateCard: empty description`);
    
    // Validate scene tags
    if (!Array.isArray(p.sceneTags)) throw new Error(`Invalid PredicateCard: sceneTags must be array`);
    for (const tag of p.sceneTags) {
      if (typeof tag !== 'string' || tag.trim() === '') {
        throw new Error(`Invalid PredicateCard: invalid scene tag: ${tag}`);
      }
    }
    
    // Validate timescale
    if (!p.timescale || typeof p.timescale !== 'string' || p.timescale.trim() === '') {
      throw new Error(`Invalid PredicateCard: invalid timescale: ${p.timescale}`);
    }
    
    // Validate outcome logic
    if (!p.outcomeLogic || typeof p.outcomeLogic !== 'object' || Array.isArray(p.outcomeLogic)) {
      throw new Error(`Invalid PredicateCard: invalid outcome logic: ${JSON.stringify(p.outcomeLogic)}`);
    }
    
    // Validate state flags
    if (!p.stateFlags || typeof p.stateFlags !== 'object' || Array.isArray(p.stateFlags)) {
      throw new Error(`Invalid PredicateCard: invalid state flags: ${JSON.stringify(p.stateFlags)}`);
    }
    
    // Validate exits
    if (!Array.isArray(p.exits)) throw new Error(`Invalid PredicateCard: exits must be array`);
    for (const exit of p.exits) {
      if (!isExit(exit)) {
        throw new Error(`Invalid PredicateCard: invalid exit: ${JSON.stringify(exit)}`);
      }
    }
  }

  // Validate traits
  for (const t of data.traits) {
    if (!isTrait(t)) throw new Error(`Invalid Trait: ${JSON.stringify(t)}`);
    
    // Validate trait properties
    if (!t.id || t.id.trim() === '') throw new Error(`Invalid Trait: empty id`);
    if (!t.name || t.name.trim() === '') throw new Error(`Invalid Trait: empty name`);
    if (!t.effect || t.effect.trim() === '') throw new Error(`Invalid Trait: empty effect`);
    
    // Validate trait type
    if (t.type !== 'Passive' && t.type !== 'Triggered') {
      throw new Error(`Invalid Trait: invalid type: ${t.type}`);
    }
  }

  // Validate lifepaths
  for (const l of data.lifepaths) {
    if (!isLifepath(l)) throw new Error(`Invalid Lifepath: ${JSON.stringify(l)}`);
    
    // Validate lifepath properties
    if (!l.id || l.id.trim() === '') throw new Error(`Invalid Lifepath: empty id`);
    if (!l.name || l.name.trim() === '') throw new Error(`Invalid Lifepath: empty name`);
    
    // Validate lifepath steps
    for (const step of l.steps) {
      if (!isLifepathStep(step)) {
        throw new Error(`Invalid Lifepath Step: ${JSON.stringify(step)}`);
      }
      
      // Validate step properties
      if (!step.id || step.id.trim() === '') throw new Error(`Invalid Lifepath Step: empty id`);
      if (!step.prompt || step.prompt.trim() === '') throw new Error(`Invalid Lifepath Step: empty prompt`);
      
      // Validate choices
      if (step.choices && Array.isArray(step.choices)) {
        for (const choice of step.choices) {
          if (!isChoice(choice)) {
            throw new Error(`Invalid Lifepath Step Choice: ${JSON.stringify(choice)}`);
          }
          
          // Validate choice properties
          if (!choice.id || choice.id.trim() === '') throw new Error(`Invalid Lifepath Step Choice: empty id`);
          if (!choice.name || choice.name.trim() === '') throw new Error(`Invalid Lifepath Step Choice: empty name`);
        }
      }
    }
  }

  // Validate content consistency
  validateContentConsistency(data);
}

/**
 * Validate content consistency and cross-references
 */
function validateContentConsistency(data: GameContentFile): void {
  // Check for duplicate IDs
  const actionCardIds = new Set<string>();
  const predicateCardIds = new Set<string>();
  const traitIds = new Set<string>();
  const lifepathIds = new Set<string>();

  // Check action card IDs
  for (const card of data.actionCards) {
    if (actionCardIds.has(card.id)) {
      throw new Error(`Duplicate ActionCard ID: ${card.id}`);
    }
    actionCardIds.add(card.id);
  }

  // Check predicate card IDs
  for (const card of data.predicateCards) {
    if (predicateCardIds.has(card.id)) {
      throw new Error(`Duplicate PredicateCard ID: ${card.id}`);
    }
    predicateCardIds.add(card.id);
  }

  // Check trait IDs
  for (const trait of data.traits) {
    if (traitIds.has(trait.id)) {
      throw new Error(`Duplicate Trait ID: ${trait.id}`);
    }
    traitIds.add(trait.id);
  }

  // Check lifepath IDs
  for (const lifepath of data.lifepaths) {
    if (isLifepath(lifepath)) {
      if (lifepathIds.has(lifepath.id)) {
        throw new Error(`Duplicate Lifepath ID: ${lifepath.id}`);
      }
      lifepathIds.add(lifepath.id);
    }
  }

  // Validate predicate card outcome logic references
  for (const card of data.predicateCards) {
    for (const [actionId, rules] of Object.entries(card.outcomeLogic)) {
      if (!actionCardIds.has(actionId)) {
        throw new Error(`PredicateCard ${card.id} references unknown ActionCard: ${actionId}`);
      }
      
      if (!Array.isArray(rules)) {
        throw new Error(`PredicateCard ${card.id} outcome logic for ${actionId} must be array`);
      }
      
      for (const rule of rules) {
        if (!isOutcomeRule(rule)) {
          throw new Error(`PredicateCard ${card.id} invalid outcome rule: ${JSON.stringify(rule)}`);
        }
      }
    }
  }

  // Validate predicate card exits
  for (const card of data.predicateCards) {
    for (const exit of card.exits) {
      if (typeof exit === 'string') {
        if (!predicateCardIds.has(exit)) {
          throw new Error(`PredicateCard ${card.id} references unknown location: ${exit}`);
        }
      } else if (typeof exit === 'object' && exit !== null && 'location' in exit) {
        const exitObj = exit as { location: string };
        if (!predicateCardIds.has(exitObj.location)) {
          throw new Error(`PredicateCard ${card.id} references unknown location: ${exitObj.location}`);
        }
      }
    }
  }

  // Validate lifepath step references
  for (const lifepath of data.lifepaths) {
    if (isLifepath(lifepath)) {
      for (const step of lifepath.steps) {
        if (isLifepathStep(step)) {
          // Check if step references valid traits (lifepath steps don't have requirements or rewards)
          
          for (const choice of step.choices) {
            if (isChoice(choice)) {
              // Check if choice references valid traits in stats, traits, or cards
              if (choice.traits && Array.isArray(choice.traits)) {
                for (const trait of choice.traits) {
                  if (typeof trait === 'string' && !traitIds.has(trait)) {
                    throw new Error(`Lifepath ${lifepath.id} step ${step.id} choice ${choice.id} references unknown trait: ${trait}`);
                  }
                }
              }
              if (choice.cards && Array.isArray(choice.cards)) {
                for (const card of choice.cards) {
                  if (typeof card === 'string' && !actionCardIds.has(card)) {
                    throw new Error(`Lifepath ${lifepath.id} step ${step.id} choice ${choice.id} references unknown action card: ${card}`);
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Validate action card failure field references
  for (const card of data.actionCards) {
    for (const failure of card.failureField) {
      if (typeof failure === 'object' && failure !== null && 'unlock' in failure) {
        const failureObj = failure as { unlock: string };
        if (!actionCardIds.has(failureObj.unlock)) {
          throw new Error(`ActionCard ${card.id} references unknown unlock: ${failureObj.unlock}`);
        }
      }
    }
  }

  // Validate trait effect references
  for (const trait of data.traits) {
    // Check if trait effect references valid entities
    const effect = trait.effect.toLowerCase();
    if (effect.includes('fire') || effect.includes('water') || effect.includes('earth') || effect.includes('air')) {
      // Elemental traits should have proper elemental references
      if (!effect.includes('elemental')) {
        console.warn(`Trait ${trait.id} has elemental references but may not be properly categorized`);
      }
    }
  }

  // Validate content balance
  validateContentBalance(data);
}

/**
 * Validate content balance and game design
 */
function validateContentBalance(data: GameContentFile): void {
  // Check action card balance
  const actionTypes = new Map<string, number>();
  for (const card of data.actionCards) {
    actionTypes.set(card.actionType, (actionTypes.get(card.actionType) || 0) + 1);
  }
  
  if ((actionTypes.get('Targeted') || 0) < 5) {
    console.warn('Warning: Fewer than 5 Targeted action cards may create balance issues');
  }
  
  if ((actionTypes.get('Untargeted') || 0) < 5) {
    console.warn('Warning: Fewer than 5 Untargeted action cards may create balance issues');
  }

  // Check predicate card balance
  const sceneTagCounts = new Map<string, number>();
  for (const card of data.predicateCards) {
    for (const tag of card.sceneTags) {
      sceneTagCounts.set(tag, (sceneTagCounts.get(tag) || 0) + 1);
    }
  }
  
  for (const [tag, count] of sceneTagCounts) {
    if (count < 2) {
      console.warn(`Warning: Scene tag '${tag}' appears in fewer than 2 predicate cards`);
    }
  }

  // Check trait balance
  const traitTypes = new Map<string, number>();
  for (const trait of data.traits) {
    traitTypes.set(trait.type, (traitTypes.get(trait.type) || 0) + 1);
  }
  
  if ((traitTypes.get('Passive') || 0) < 10) {
    console.warn('Warning: Fewer than 10 Passive traits may limit character customization');
  }
  
  if ((traitTypes.get('Triggered') || 0) < 5) {
    console.warn('Warning: Fewer than 5 Triggered traits may limit character customization');
  }

  // Check lifepath balance
  if (data.lifepaths.length < 3) {
    console.warn('Warning: Fewer than 3 lifepaths may limit character creation options');
  }

  // Check content diversity
  const uniqueTags = new Set<string>();
  for (const card of data.actionCards) {
    for (const tag of card.tags) {
      uniqueTags.add(tag);
    }
  }
  
  if (uniqueTags.size < 10) {
    console.warn('Warning: Fewer than 10 unique action tags may limit gameplay variety');
  }

  const uniqueSceneTags = new Set<string>();
  for (const card of data.predicateCards) {
    for (const tag of card.sceneTags) {
      uniqueSceneTags.add(tag);
    }
  }
  
  if (uniqueSceneTags.size < 8) {
    console.warn('Warning: Fewer than 8 unique scene tags may limit location variety');
  }
}