import content from '@/data/game-content.json'
import type { LifepathDefinition, LifepathProgressState } from '@/types/lifepath'
import type { Character, Stats, Trait } from '@/types/character'

export interface LifepathService {
  listLifepaths(): LifepathDefinition[]
  start(lifepathId: string): LifepathProgressState
  choose(progress: LifepathProgressState, choiceId: string): LifepathProgressState
  isComplete(progress: LifepathProgressState): boolean
  buildCharacter(progress: LifepathProgressState, name: string): Character
}

const baseStats: Stats = {
  strength: 0,
  agility: 0,
  insight: 0,
  charisma: 0,
  fortitude: 0,
  will: 0,
}

function createEmptySeed() {
  return {
    stats: { ...baseStats },
    traitIds: [] as string[],
    deckActionCardIds: [] as string[],
  }
}

export const lifepathService: LifepathService = {
  listLifepaths() {
    return (content.lifepaths as unknown as LifepathDefinition[])
  },
  start(lifepathId: string): LifepathProgressState {
    return {
      lifepathId,
      currentStepIndex: 0,
      selectedChoiceIds: [],
      seed: createEmptySeed(),
    }
  },
  choose(progress, choiceId) {
    const lifepath = (content.lifepaths as unknown as LifepathDefinition[]).find(l => l.id === progress.lifepathId)
    if (!lifepath) return progress
    const step = lifepath.steps[progress.currentStepIndex]
    if (!step) return progress
    const choice = step.choices.find(c => c.id === choiceId)
    if (!choice) return progress

    const next = structuredClone(progress) as LifepathProgressState

    // apply stats
    if (choice.stats) {
      for (const [k, v] of Object.entries(choice.stats)) {
        // @ts-expect-error indexed
        next.seed.stats[k] = (next.seed.stats[k] || 0) + (v || 0)
      }
    }
    // traits/cards
    if (choice.traits) next.seed.traitIds.push(...choice.traits)
    if (choice.cards) next.seed.deckActionCardIds.push(...choice.cards)

    next.selectedChoiceIds.push(choiceId)
    next.currentStepIndex = Math.min(next.currentStepIndex + 1, lifepath.steps.length)
    return next
  },
  isComplete(progress) {
    const lifepath = (content.lifepaths as unknown as LifepathDefinition[]).find(l => l.id === progress.lifepathId)
    return !!lifepath && progress.currentStepIndex >= lifepath.steps.length
  },
  buildCharacter(progress, name) {
    const now = Date.now()

    // Map trait ids to embedded Trait objects when available from content; fallback to minimal
    const traitMap = new Map<string, Trait>()
    for (const t of content.traits) traitMap.set(t.id, t as unknown as Trait)

    const traits: Trait[] = progress.seed.traitIds.map((id) =>
      traitMap.get(id) || ({ id, name: id, type: 'Passive', effect: '' } as Trait)
    )

    const character: Character = {
      id: crypto.randomUUID(),
      name,
      lifepath: progress.selectedChoiceIds.map((id) => ({ id, name: id, description: '' })),
      stats: progress.seed.stats,
      traits,
      actionDeck: progress.seed.deckActionCardIds,
      currentHP: 10,
      maxHP: 10,
      affinities: {},
      worldState: {
        location: 'homestead',
        flags: {},
        time: { timescale: 'Day', turnCount: 0 },
      },
      createdAt: now,
      turnCount: 0,
    }

    return character
  },
}
