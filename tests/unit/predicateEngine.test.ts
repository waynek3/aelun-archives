import { describe, it, expect, beforeEach } from 'vitest'
import { resolveAction } from '@/lib/engine/predicateEngine'
import type { ActionCard, PredicateCard, Character, DiceResult } from '@/types'

describe('predicateEngine', () => {
  let mockActionCard: ActionCard
  let mockPredicateCard: PredicateCard
  let mockCharacter: Character
  let mockDiceResult: DiceResult

  beforeEach(() => {
    mockActionCard = {
      id: 'test_action',
      name: 'Test Action',
      description: 'A test action',
      actionType: 'Targeted',
      tags: ['Combat'],
      timescales: ['Immediate'],
      diceModifier: { type: 'advantage', value: 1 },
      failureField: []
    }

    mockPredicateCard = {
      id: 'test_location',
      name: 'Test Location',
      description: 'A test location',
      sceneTags: ['Dangerous'],
      timescale: 'Immediate',
      outcomeLogic: {
        'test_action': [
          {
            condition: 'roll >= 10',
            outcome: 'deal_damage',
            parameters: { dice: '1d4' }
          },
          {
            condition: 'roll < 10',
            outcome: 'receive_damage',
            parameters: { dice: '1d2' }
          }
        ]
      },
      stateFlags: {},
      exits: []
    }

    mockCharacter = {
      id: 'test_character',
      name: 'Test Character',
      lifepath: [],
      stats: {
        strength: 3,
        agility: 3,
        insight: 3,
        charisma: 3,
        fortitude: 3,
        will: 3
      },
      traits: [],
      actionDeck: ['test_action'],
      currentHP: 10,
      maxHP: 10,
      affinities: {},
      worldState: {
        location: 'test_location',
        flags: {},
        time: {
          timescale: 'Immediate',
          turnCount: 1
        }
      },
      createdAt: Date.now(),
      turnCount: 1
    }

    mockDiceResult = {
      advantageRolls: [6, 4],
      keptRoll: 6,
      bonusRolls: [],
      total: 10,
      criticalSuccess: false,
      criticalFailure: false
    }
  })

  describe('resolveAction', () => {
    it('should resolve a successful action', async () => {
      const result = await resolveAction({
        actionCard: mockActionCard,
        predicateCard: mockPredicateCard,
        character: mockCharacter,
        diceResult: mockDiceResult
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.text).toContain('test action')
      expect(result.text).toContain('Test Location')
      expect(result.effects).toHaveLength(1)
      expect(result.effects[0].type).toBe('damage')
    })

    it('should resolve a failed action', async () => {
      const failedDiceResult = { ...mockDiceResult, total: 5 }
      const result = await resolveAction({
        actionCard: mockActionCard,
        predicateCard: mockPredicateCard,
        character: mockCharacter,
        diceResult: failedDiceResult
      })
      
      expect(result).toBeDefined()
      expect(result.success).toBe(false)
      expect(result.text).toContain('test action')
      expect(result.text).toContain('Test Location')
      expect(result.effects).toHaveLength(1)
      expect(result.effects[0].type).toBe('damage')
    })

    it('should handle critical success', async () => {
      const criticalDiceResult = { ...mockDiceResult, total: 20, criticalSuccess: true }
      const result = await resolveAction({
        actionCard: mockActionCard,
        predicateCard: mockPredicateCard,
        character: mockCharacter,
        diceResult: criticalDiceResult
      })
      
      expect(result).toBeDefined()
      expect(result.criticalSuccess).toBe(true)
      expect(result.text).toContain('test action')
    })

    it('should handle critical failure', async () => {
      const criticalDiceResult = { ...mockDiceResult, total: 1, criticalFailure: true }
      const result = await resolveAction({
        actionCard: mockActionCard,
        predicateCard: mockPredicateCard,
        character: mockCharacter,
        diceResult: criticalDiceResult
      })
      
      expect(result).toBeDefined()
      expect(result.criticalFailure).toBe(true)
      expect(result.text).toContain('test action')
    })
  })
})