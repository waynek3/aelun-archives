import { describe, it, expect } from 'vitest'
import { lifepathService } from '@/lib/engine/lifepath'

describe('lifepathService', () => {
  it('lists at least one lifepath and progresses through steps', () => {
    const lifepaths = lifepathService.listLifepaths()
    expect(lifepaths.length).toBeGreaterThan(0)
    const lp = lifepaths[0]
    const prog0 = lifepathService.start(lp.id)
    expect(prog0.currentStepIndex).toBe(0)
    const step0 = lp.steps[0]
    const choice0 = step0.choices[0]
    const prog1 = lifepathService.choose(prog0, choice0.id)
    expect(prog1.currentStepIndex).toBe(1)
  })
})
