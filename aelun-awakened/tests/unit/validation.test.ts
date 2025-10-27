import { describe, it, expect } from 'vitest'
import content from '@/data/game-content.json'
import { validateGameContent } from '@/lib/utils/validation'

describe('validation', () => {
  it('validates the bundled game-content.json', () => {
    expect(() => validateGameContent(content)).not.toThrow()
  })
})
