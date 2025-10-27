import type { ActionCard } from '@/types/cards'

/**
 * Filter action cards by the current scene context.
 * A card is available if:
 * - It has at least one tag that matches a scene tag OR includes the 'Universal' tag
 * - AND the current timescale is included in the card's timescales
 */
export function filterActionsByContext(params: {
  sceneTags: string[]
  timescale: string
  actions: ActionCard[]
}): ActionCard[] {
  const { sceneTags, timescale, actions } = params

  const sceneTagSet = new Set(sceneTags.map((t) => t.toLowerCase()))

  return actions.filter((card) => {
    const hasTagMatch = card.tags.some(
      (tag) => tag.toLowerCase() === 'universal' || sceneTagSet.has(tag.toLowerCase()),
    )
    const timescaleMatch = card.timescales.includes(timescale)
    return hasTagMatch && timescaleMatch
  })
}
