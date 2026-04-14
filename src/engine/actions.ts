import type { ColorScheme, LocationId } from '../state/types';

// All actions a player can take.
// Each action is a discriminated union so dispatch can exhaustively handle them.

export type GameAction =
  // Buy tickets and/or snacks at a bodega.  Snacks are added to inventory;
  // if tickets > 0, a scratch session begins.
  | { type: 'BUY_TICKETS'; quantities: Record<string, number>; snacks?: string[] }
  // Tap a scratch cell to advance its reveal state (0→1→2→3=revealed).
  | { type: 'SCRATCH_CELL'; cellIndex: number }
  // Move to the next ticket after the current one is fully revealed.
  | { type: 'ADVANCE_TICKET' }
  // End the scratch session and return to the store.
  | { type: 'FINISH_SESSION' }
  // Toggle the color scheme.
  | { type: 'SET_THEME'; scheme: ColorScheme }
  // Start a fresh game (clears save).
  | { type: 'NEW_GAME' }
  // Sprint 2: travel to a location within the current neighborhood.
  | { type: 'TRAVEL'; destination: LocationId }
  // Sprint 2: sleep at the tower (ends the current day, advances to next morning).
  | { type: 'SLEEP' }
  // Sprint 2: dismiss the passout screen after waking up.
  | { type: 'WAKE_UP' }
  // Sprint 7: consume a snack from inventory (instant, no time cost).
  | { type: 'CONSUME_SNACK'; slotIndex: number }
  // Sprint 9: temple actions (god inferred from currentLocation).
  | { type: 'DONATE_PRIVATE'; amount: number }
  | { type: 'DONATE_PUBLIC'; amount: number }
  | { type: 'PRAY'; duration: number }
  // Sprint 11: set birthday month during new-run setup.
  | { type: 'SET_BIRTHDAY'; month: number }
  // Sprint 13: furniture actions.
  | { type: 'BUY_FURNITURE'; furnitureId: string }
  | { type: 'USE_BONG'; furnitureIndex: number }
  | { type: 'RECYCLE_FURNITURE'; furnitureIndex: number }
  // Sprint 14: university & spellbook actions.
  | { type: 'ATTEND_CLASS'; spellId: string }
  | { type: 'LEARN_BOOKBINDING' }
  | { type: 'ADD_SPELL_TO_BOOK'; spellId: string }
  | { type: 'REMOVE_SPELL_FROM_BOOK'; spellId: string }
  // Sprint 15: godId required for affinity-category spells (favor_boost, divine_slight).
  | { type: 'CAST_SPELL'; spellId: string; godId?: import('../state/types').GodId }
  // Sprint 16: buy a spell scroll at a bookstore or scroll store.
  | { type: 'BUY_SCROLL'; spellId: string }
  // Sprint 16: use a spell scroll from inventory (slotIndex); godId required for affinity scrolls.
  | { type: 'USE_SCROLL'; slotIndex: number; godId?: import('../state/types').GodId }
  // Sprint 19: use the Crystal Ball to reveal a hidden stat (requires knowing the matching reveal spell).
  | { type: 'USE_CRYSTAL_BALL'; revealType: 'addiction' | 'chill' | 'ageHealth' }
  // Sprint 25: order a drink at the University Bar; snacks optionally purchased alongside.
  | { type: 'ORDER_DRINK'; drinkId: string; snacks?: string[] }
  // Sprint 20: wizard project actions (Lab Table).
  | { type: 'START_PROJECT'; projectId: string }
  | { type: 'WORK_ON_PROJECT'; duration: number }   // minutes, must be :15 increment
  | { type: 'CANCEL_PROJECT' }
  | { type: 'COLLECT_PROJECT' }                      // pick up completed item when inventory was full
  // Sprint 21: donate a monument from inventory to the current temple.
  | { type: 'DONATE_MONUMENT'; slotIndex: number }
  // Sprint 22: Dad's House loan actions.
  | { type: 'TAKE_LOAN'; amount: number }
  | { type: 'REPAY_LOAN'; amount: number }
  | { type: 'VISIT_GRAVE' }
  // Sprint 23: random event actions.
  | { type: 'RESOLVE_EVENT'; choiceIndex: number }
  | { type: 'DISMISS_EVENT' };
