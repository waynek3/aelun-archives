import { describe, it, expect, beforeEach } from 'vitest'
import { filterActionsByContext } from '@/lib/engine/actionFilter'
import type { ActionCard } from '@/types'

describe('actionFilter', () => {
  let mockActions: ActionCard[]

  beforeEach(() => {
    mockActions = [
      {
        id: 'combat_action',
        name: 'Combat Action',
        description: 'A combat action',
        actionType: 'Targeted',
        tags: ['Combat'],
        timescales: ['Immediate'],
        diceModifier: { type: 'advantage', value: 1 },
        failureField: []
      },
      {
        id: 'stealth_action',
        name: 'Stealth Action',
        description: 'A stealth action',
        actionType: 'Untargeted',
        tags: ['Stealth'],
        timescales: ['Immediate'],
        diceModifier: { type: 'advantage', value: 1 },
        failureField: []
      },
      {
        id: 'universal_action',
        name: 'Universal Action',
        description: 'A universal action',
        actionType: 'Targeted',
        tags: ['Universal'],
        timescales: ['Immediate'],
        diceModifier: { type: 'advantage', value: 1 },
        failureField: []
      },
      {
        id: 'long_term_action',
        name: 'Long Term Action',
        description: 'A long term action',
        actionType: 'Targeted',
        tags: ['Combat'],
        timescales: ['Long-term'],
        diceModifier: { type: 'advantage', value: 1 },
        failureField: []
      }
    ]
  })

  describe('filterActionsByContext', () => {
    it('should filter actions by scene tags', () => {
      const result = filterActionsByContext({
        sceneTags: ['Combat'],
        timescale: 'Immediate',
        actions: mockActions
      })
      
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('combat_action')
      expect(result[1].id).toBe('universal_action')
    })

    it('should filter actions by timescale', () => {
      const result = filterActionsByContext({
        sceneTags: ['Combat'],
        timescale: 'Long-term',
        actions: mockActions
      })
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('long_term_action')
    })

    it('should include universal actions', () => {
      const result = filterActionsByContext({
        sceneTags: ['Stealth'],
        timescale: 'Immediate',
        actions: mockActions
      })
      
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('stealth_action')
      expect(result[1].id).toBe('universal_action')
    })

    it('should handle case insensitive matching', () => {
      const result = filterActionsByContext({
        sceneTags: ['combat'],
        timescale: 'Immediate',
        actions: mockActions
      })
      
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('combat_action')
      expect(result[1].id).toBe('universal_action')
    })

    it('should return empty array when no matches', () => {
      const result = filterActionsByContext({
        sceneTags: ['Magic'],
        timescale: 'Immediate',
        actions: mockActions
      })
      
      expect(result).toHaveLength(1) // Universal action still matches
    })

    it('should handle empty actions array', () => {
      const result = filterActionsByContext({
        sceneTags: ['Combat'],
        timescale: 'Immediate',
        actions: []
      })
      
      expect(result).toHaveLength(0)
    })

    it('should handle multiple scene tags', () => {
      const result = filterActionsByContext({
        sceneTags: ['Combat', 'Stealth'],
        timescale: 'Immediate',
        actions: mockActions
      })
      
      expect(result).toHaveLength(3)
      expect(result[0].id).toBe('combat_action')
      expect(result[1].id).toBe('stealth_action')
      expect(result[2].id).toBe('universal_action')
    })
  })
})