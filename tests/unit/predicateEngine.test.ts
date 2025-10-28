import { describe, it, expect } from 'vitest'
import { resolveAction, type Outcome } from '@/lib/engine/predicateEngine'
import type { ActionCard, PredicateCard } from '@/types/cards'
import type { Character } from '@/types/character'

const mockAction: ActionCard = {
  id: 'quick_attack',
  name: 'Quick Attack',
  description: 'Fast strike',
  actionType: 'Untargeted',
  tags: ['Combat'],
  timescales: ['Encounter'],
  failureField: []
}

const mockPredicate: PredicateCard = {
  id: 'woods',
  name: 'Gnarled Woods',
  description: 'Spooky',
  sceneTags: ['Forest', 'Wilderness'],
  timescale: 'Encounter',
  outcomeLogic: {
    quick_attack: [
      { condition: 'roll >= 15', outcome: 'deal_damage', parameters: { dice: '1d6' } },
      { condition: 'roll < 15', outcome: 'receive_damage', parameters: { dice: '1d4' } }
    ]
  },
  stateFlags: {},
  exits: []
}

const mockCharacter = {
  id: 'c1',
  name: 'Hero',
  lifepath: [],
  stats: { strength: 1, agility: 1, insight: 1, charisma: 1, fortitude: 1, will: 1 },
  traits: [],
  actionDeck: [],
  currentHP: 10,
  maxHP: 10,
  affinities: {},
  location: 'woods',
  worldState: {},
  createdAt: Date.now(),
  turnCount: 0
}

describe('predicateEngine.resolveAction', () => {
  it('produces success outcome when roll meets condition', async () => {
    const outcome: Outcome = await resolveAction({
      actionCard: mockAction,
      predicateCard: mockPredicate,
      character: mockCharacter as unknown as Character,
      diceResult: { advantageRolls: [15], keptRoll: 15, bonusRolls: [], total: 15, criticalSuccess: false, criticalFailure: false }
    })
    expect(outcome.success).toBe(true)
    expect(outcome.effects.some(e => e.type === 'damage')).toBe(true)
  })

  it('produces failure outcome when no rule matches', async () => {
    const outcome: Outcome = await resolveAction({
      actionCard: { ...mockAction, id: 'unknown_action' },
      predicateCard: mockPredicate,
      character: mockCharacter as unknown as Character,
      diceResult: { advantageRolls: [5], keptRoll: 5, bonusRolls: [], total: 5, criticalSuccess: false, criticalFailure: false }
    })
    expect(outcome.success).toBe(false)
  })
})
