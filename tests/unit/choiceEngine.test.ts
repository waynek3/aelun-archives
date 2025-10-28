import { describe, it, expect } from 'vitest'
import { choose, createOptions, getChoiceStats } from '@/lib/engine/choiceEngine'

const character = {
  id: 'c', name: 'n', lifepath: [], stats: { strength:1, agility:1, insight:1, charisma:1, fortitude:1, will:1 }, traits: [], actionDeck: [], currentHP:10, maxHP:10, affinities: { friendly: 5, hostile: -5 }, location: 'loc', worldState: {}, createdAt: 0, turnCount: 0
}

describe('choiceEngine', () => {
  it('choose returns one of the options', () => {
    const options = createOptions(['a','b','c'], 1, ['friendly'])
    const picked = choose(options, { character })
    expect(['a','b','c']).toContain(picked)
  })

  it('getChoiceStats provides probabilities', () => {
    const options = createOptions(['a','b'], 1, ['friendly'])
    const stats = getChoiceStats(options, { character })
    expect(stats.length).toBe(2)
    const totalProb = stats.reduce((s, x) => s + x.probability, 0)
    expect(totalProb).toBeGreaterThan(0)
  })
})
