import type { ActionCard, PredicateCard } from '@/types/cards'

type PredicateMap = Record<string, PredicateCard>

const ACTION_TAG_MAPPINGS: Record<string, string[]> = {
  social: ['settlement', 'social', 'noble', 'trade'],
  trade: ['settlement', 'trade', 'social'],
  combat: ['dangerous', 'combat'],
  stealth: ['dangerous', 'criminal', 'settlement'],
  survival: ['wilderness', 'forest'],
  spiritual: ['sacred', 'homestead'],
  divine: ['sacred', 'homestead'],
  magical: ['mysterious', 'magical', 'scholarly'],
  crafting: ['homestead', 'settlement'],
}

/**
 * Determine which predicate cards can be targeted by a given action.
 * This filters predicates based on action tags, adjacency, and special rules.
 */
export function getAvailableTargets(
  action: ActionCard,
  predicateMap: PredicateMap,
  currentLocation: string
): PredicateCard[] {
  const currentPredicate = predicateMap[currentLocation]
  const accessibleIds = new Set<string>()

  if (currentPredicate) {
    if (!['travel', 'scout', 'teleport'].includes(action.id)) {
      accessibleIds.add(currentPredicate.id)
    }
    currentPredicate.exits?.forEach((id) => accessibleIds.add(id))
  }

  if (accessibleIds.size === 0) {
    Object.keys(predicateMap).forEach((id) => accessibleIds.add(id))
  }

  const candidates = Array.from(accessibleIds)
    .map((id) => predicateMap[id])
    .filter((pred): pred is PredicateCard => Boolean(pred))

  return candidates.filter((predicate) =>
    matchesActionContext(action, predicate, currentPredicate)
  )
}

function matchesActionContext(
  action: ActionCard,
  predicate: PredicateCard,
  currentPredicate?: PredicateCard
): boolean {
  const predicateTags = predicate.sceneTags.map((tag) => tag.toLowerCase())
  const currentIsPredicate = !!(currentPredicate && predicate.id === currentPredicate.id)

  switch (action.id) {
    case 'travel':
    case 'scout':
      if (!currentPredicate) return true
      return currentPredicate.exits?.includes(predicate.id) ?? false
    case 'shadow_step':
    case 'teleport':
      return predicate.id !== currentPredicate?.id
    case 'pray':
    case 'ritual':
    case 'pilgrimage':
      return predicateTags.includes('sacred'.toLowerCase()) || currentIsPredicate
    default:
      break
  }

  if (action.tags.includes('Universal')) {
    return true
  }

  return action.tags.some((tag) => {
    const normalizedTag = tag.toLowerCase()
    if (predicateTags.includes(normalizedTag)) {
      return true
    }
    const mapped = ACTION_TAG_MAPPINGS[normalizedTag]
    return mapped ? mapped.some((mappedTag) => predicateTags.includes(mappedTag)) : false
  })
}

/**
 * Get a user-friendly description of why a target is available for an action
 */
export function getTargetDescription(action: ActionCard, target: PredicateCard): string {
  if (action.id === 'travel') {
    return `Travel to ${target.name}`
  }
  if (action.id === 'pray') {
    if (target.sceneTags.includes('Sacred')) {
      return `Pray at the sacred ${target.name}`
    }
    return `Pray at ${target.name}`
  }
  if (action.tags.includes('Social')) {
    return `Use ${action.name.toLowerCase()} at ${target.name}`
  }
  if (action.tags.includes('Combat')) {
    return `Engage in ${action.name.toLowerCase()} at ${target.name}`
  }
  if (action.tags.includes('Stealth')) {
    return `Use ${action.name.toLowerCase()} at ${target.name}`
  }
  if (action.tags.includes('Magical')) {
    return `Channel ${action.name.toLowerCase()} at ${target.name}`
  }
  if (action.tags.includes('Exploration')) {
    return `Explore ${target.name} with ${action.name.toLowerCase()}`
  }
  
  return `Use ${action.name.toLowerCase()} at ${target.name}`
}