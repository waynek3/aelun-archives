import { describe, it, expect, beforeEach } from 'vitest'
import { 
  modifyAffinity, 
  getAffinityLevel, 
  getAffinityColor, 
  meetsThreshold, 
  getCharacterAffinities,
  getPeakAffinities,
  getAffinityWeightModifier 
} from '@/lib/engine/affinityManager'
import type { Character } from '@/types'

describe('affinityManager', () => {
  let mockCharacter: Character

  beforeEach(() => {
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
      actionDeck: [],
      currentHP: 10,
      maxHP: 10,
      affinities: {
        'test_location': 5,
        'test_entity': -3
      },
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
  })

  describe('getAffinityLevel', () => {
    it('should return correct affinity level for positive values', () => {
      expect(getAffinityLevel(8)).toBe('Beloved')
      expect(getAffinityLevel(5)).toBe('Trusted')
      expect(getAffinityLevel(2)).toBe('Liked')
      expect(getAffinityLevel(0)).toBe('Neutral')
    })

    it('should return correct affinity level for negative values', () => {
      expect(getAffinityLevel(-2)).toBe('Distrusted')
      expect(getAffinityLevel(-5)).toBe('Disliked')
      expect(getAffinityLevel(-8)).toBe('Hated')
    })

    it('should handle edge cases', () => {
      expect(getAffinityLevel(3)).toBe('Liked')
      expect(getAffinityLevel(-3)).toBe('Distrusted')
    })
  })

  describe('getAffinityColor', () => {
    it('should return correct color for positive affinity', () => {
      expect(getAffinityColor(8)).toBe('text-purple-400')
      expect(getAffinityColor(5)).toBe('text-blue-400')
      expect(getAffinityColor(2)).toBe('text-green-400')
    })

    it('should return correct color for negative affinity', () => {
      expect(getAffinityColor(-2)).toBe('text-orange-400')
      expect(getAffinityColor(-5)).toBe('text-red-400')
      expect(getAffinityColor(-8)).toBe('text-red-400')
    })

    it('should return gray for neutral affinity', () => {
      expect(getAffinityColor(0)).toBe('text-gray-400')
    })
  })

  describe('meetsThreshold', () => {
    it('should return true when affinity meets threshold', () => {
      expect(meetsThreshold(5, 3)).toBe(true)
      expect(meetsThreshold(5, 5)).toBe(true)
    })

    it('should return false when affinity does not meet threshold', () => {
      expect(meetsThreshold(2, 3)).toBe(false)
      expect(meetsThreshold(1, 5)).toBe(false)
    })
  })

  describe('getCharacterAffinities', () => {
    it('should return character affinities', () => {
      const affinities = getCharacterAffinities(mockCharacter)
      
      expect(affinities).toHaveLength(2)
      expect(affinities[0].entity).toBe('test_location')
      expect(affinities[0].score).toBe(5)
      expect(affinities[1].entity).toBe('test_entity')
      expect(affinities[1].score).toBe(-3)
    })

    it('should return empty array for character with no affinities', () => {
      const characterWithNoAffinities = {
        ...mockCharacter,
        affinities: {}
      }

      const affinities = getCharacterAffinities(characterWithNoAffinities)
      expect(affinities).toHaveLength(0)
    })
  })

  describe('getPeakAffinities', () => {
    it('should return peak affinities', () => {
      const peaks = getPeakAffinities(mockCharacter)
      
      expect(peaks).toBeDefined()
      expect(peaks['test_location']).toBe(5)
      expect(peaks['test_entity']).toBe(-3)
    })

    it('should return empty object for character with no affinities', () => {
      const characterWithNoAffinities = {
        ...mockCharacter,
        affinities: {}
      }

      const peaks = getPeakAffinities(characterWithNoAffinities)
      expect(peaks).toEqual({})
    })
  })

  describe('getAffinityWeightModifier', () => {
    it('should return correct weight modifier for positive affinity', () => {
      expect(getAffinityWeightModifier(8)).toBe(1.8)
      expect(getAffinityWeightModifier(5)).toBe(1.5)
      expect(getAffinityWeightModifier(2)).toBe(1.2)
    })

    it('should return correct weight modifier for negative affinity', () => {
      expect(getAffinityWeightModifier(-2)).toBe(0.8)
      expect(getAffinityWeightModifier(-5)).toBe(0.5)
      expect(getAffinityWeightModifier(-8)).toBe(0.2)
    })

    it('should handle neutral affinity', () => {
      expect(getAffinityWeightModifier(0)).toBe(1.0)
    })
  })

  describe('modifyAffinity', () => {
    it('should increase affinity', () => {
      const result = modifyAffinity(mockCharacter, 'test_location', 2)
      
      expect(result.affinities['test_location']).toBe(7)
      expect(result.affinities['test_entity']).toBe(-3) // unchanged
    })

    it('should decrease affinity', () => {
      const result = modifyAffinity(mockCharacter, 'test_location', -2)
      
      expect(result.affinities['test_location']).toBe(3)
      expect(result.affinities['test_entity']).toBe(-3) // unchanged
    })

    it('should create new affinity if it does not exist', () => {
      const result = modifyAffinity(mockCharacter, 'new_entity', 3)
      
      expect(result.affinities['new_entity']).toBe(3)
      expect(result.affinities['test_location']).toBe(5) // unchanged
      expect(result.affinities['test_entity']).toBe(-3) // unchanged
    })

    it('should handle zero change', () => {
      const result = modifyAffinity(mockCharacter, 'test_location', 0)
      
      expect(result.affinities['test_location']).toBe(5)
    })

    it('should not modify the original character', () => {
      const originalAffinity = mockCharacter.affinities['test_location']
      modifyAffinity(mockCharacter, 'test_location', 2)
      
      expect(mockCharacter.affinities['test_location']).toBe(originalAffinity)
    })
  })
})