import type { ActionCard, PredicateCard } from '@/types/cards'

/**
 * Determine which predicate cards can be targeted by a given action.
 * This filters predicates based on action tags and other criteria.
 */
export function getAvailableTargets(
  action: ActionCard,
  allPredicates: PredicateCard[],
  currentLocation: string
): PredicateCard[] {
  const targets: PredicateCard[] = []

  for (const predicate of allPredicates) {
    let canTarget = false

    // Special case handling for specific actions
    if (action.id === 'travel') {
      // Travel can target any location except current one
      canTarget = predicate.id !== currentLocation
    }
    else if (action.id === 'pray') {
      // Pray can target sacred locations or current location
      canTarget = predicate.sceneTags.includes('Sacred') || predicate.id === currentLocation
    }
    else if (action.id === 'scout') {
      // Scout can target any location except current one
      canTarget = predicate.id !== currentLocation
    }
    else if (action.id === 'sneak_attack') {
      // Sneak attack targets dangerous or settlement locations
      canTarget = predicate.sceneTags.includes('Dangerous') || 
                  predicate.sceneTags.includes('Settlement') ||
                  predicate.sceneTags.includes('Criminal')
    }
    else if (action.id === 'bargain') {
      // Bargain targets settlement or trade locations
      canTarget = predicate.sceneTags.includes('Settlement') || 
                  predicate.sceneTags.includes('Trade') ||
                  predicate.sceneTags.includes('Social')
    }
    else if (action.id === 'intimidate') {
      // Intimidate targets dangerous or settlement locations
      canTarget = predicate.sceneTags.includes('Dangerous') || 
                  predicate.sceneTags.includes('Settlement') ||
                  predicate.sceneTags.includes('Criminal')
    }
    else if (action.id === 'persuade') {
      // Persuade targets settlement or social locations
      canTarget = predicate.sceneTags.includes('Settlement') || 
                  predicate.sceneTags.includes('Social') ||
                  predicate.sceneTags.includes('Noble')
    }
    else if (action.id === 'forge_alliance') {
      // Forge alliance targets settlement or social locations
      canTarget = predicate.sceneTags.includes('Settlement') || 
                  predicate.sceneTags.includes('Social') ||
                  predicate.sceneTags.includes('Noble')
    }
    else if (action.id === 'feint') {
      // Feint targets dangerous or combat locations
      canTarget = predicate.sceneTags.includes('Dangerous') || 
                  predicate.sceneTags.includes('Combat')
    }
    else if (action.id === 'taunt') {
      // Taunt targets dangerous or combat locations
      canTarget = predicate.sceneTags.includes('Dangerous') || 
                  predicate.sceneTags.includes('Combat')
    }
    else if (action.id === 'perform') {
      // Perform targets settlement or social locations
      canTarget = predicate.sceneTags.includes('Settlement') || 
                  predicate.sceneTags.includes('Social') ||
                  predicate.sceneTags.includes('Noble')
    }
    else if (action.id === 'seduce') {
      // Seduce targets settlement or social locations
      canTarget = predicate.sceneTags.includes('Settlement') || 
                  predicate.sceneTags.includes('Social') ||
                  predicate.sceneTags.includes('Noble')
    }
    else if (action.id === 'interrogate') {
      // Interrogate targets dangerous or criminal locations
      canTarget = predicate.sceneTags.includes('Dangerous') || 
                  predicate.sceneTags.includes('Criminal')
    }
    else if (action.id === 'lead') {
      // Lead targets settlement or social locations
      canTarget = predicate.sceneTags.includes('Settlement') || 
                  predicate.sceneTags.includes('Social') ||
                  predicate.sceneTags.includes('Noble')
    }
    else if (action.id === 'negotiate') {
      // Negotiate targets settlement or social locations
      canTarget = predicate.sceneTags.includes('Settlement') || 
                  predicate.sceneTags.includes('Social') ||
                  predicate.sceneTags.includes('Noble')
    }
    else if (action.id === 'repair') {
      // Repair can target any location (universal)
      canTarget = true
    }
    else if (action.id === 'upgrade') {
      // Upgrade can target any location (universal)
      canTarget = true
    }
    else if (action.id === 'teach') {
      // Teach targets settlement or social locations
      canTarget = predicate.sceneTags.includes('Settlement') || 
                  predicate.sceneTags.includes('Social')
    }
    else if (action.id === 'research') {
      // Research targets scholarly or magical locations
      canTarget = predicate.sceneTags.includes('Magical') || 
                  predicate.sceneTags.includes('Mysterious') ||
                  predicate.sceneTags.includes('Scholarly')
    }
    else if (action.id === 'pilgrimage') {
      // Pilgrimage targets sacred locations
      canTarget = predicate.sceneTags.includes('Sacred')
    }
    else if (action.id === 'exorcise') {
      // Exorcise targets dangerous or cursed locations
      canTarget = predicate.sceneTags.includes('Dangerous') || 
                  predicate.sceneTags.includes('Cursed')
    }
    else if (action.id === 'bless_item') {
      // Bless item can target any location (universal)
      canTarget = true
    }
    else if (action.id === 'shadow_step') {
      // Shadow step can target any location except current
      canTarget = predicate.id !== currentLocation
    }
    else if (action.id === 'mind_blast') {
      // Mind blast targets dangerous or combat locations
      canTarget = predicate.sceneTags.includes('Dangerous') || 
                  predicate.sceneTags.includes('Combat')
    }
    else if (action.id === 'elemental_blast') {
      // Elemental blast targets dangerous or combat locations
      canTarget = predicate.sceneTags.includes('Dangerous') || 
                  predicate.sceneTags.includes('Combat')
    }
    else if (action.id === 'charm_person') {
      // Charm person targets settlement or social locations
      canTarget = predicate.sceneTags.includes('Settlement') || 
                  predicate.sceneTags.includes('Social')
    }
    else if (action.id === 'wall_of_force') {
      // Wall of force can target any location (universal)
      canTarget = true
    }
    else if (action.id === 'polymorph') {
      // Polymorph targets dangerous or combat locations
      canTarget = predicate.sceneTags.includes('Dangerous') || 
                  predicate.sceneTags.includes('Combat')
    }
    else if (action.id === 'disintegrate') {
      // Disintegrate targets dangerous or combat locations
      canTarget = predicate.sceneTags.includes('Dangerous') || 
                  predicate.sceneTags.includes('Combat')
    }
    else if (action.id === 'teleport') {
      // Teleport can target any known location except current
      canTarget = predicate.id !== currentLocation
    }
    else if (action.id === 'resurrection') {
      // Resurrection can target any location (universal)
      canTarget = true
    }
    else if (action.id === 'meteor_swarm') {
      // Meteor swarm targets dangerous or combat locations
      canTarget = predicate.sceneTags.includes('Dangerous') || 
                  predicate.sceneTags.includes('Combat')
    }
    else if (action.id === 'power_word_kill') {
      // Power word kill targets dangerous or combat locations
      canTarget = predicate.sceneTags.includes('Dangerous') || 
                  predicate.sceneTags.includes('Combat')
    }
    else if (action.id === 'gate') {
      // Gate can target any location (universal)
      canTarget = true
    }
    else if (action.id === 'pickpocket') {
      // Pickpocket targets settlement or criminal locations
      canTarget = predicate.sceneTags.includes('Settlement') || 
                  predicate.sceneTags.includes('Criminal') ||
                  predicate.sceneTags.includes('Social')
    }
    else if (action.id === 'lockpick') {
      // Lockpick targets mysterious or dungeon locations
      canTarget = predicate.sceneTags.includes('Mysterious') || 
                  predicate.sceneTags.includes('Dungeon') ||
                  predicate.sceneTags.includes('Underground')
    }
    else if (action.id === 'climb') {
      // Climb targets wilderness or dangerous locations
      canTarget = predicate.sceneTags.includes('Wilderness') || 
                  predicate.sceneTags.includes('Dangerous') ||
                  predicate.sceneTags.includes('High')
    }
    else if (action.id === 'gamble') {
      // Gamble targets settlement or social locations
      canTarget = predicate.sceneTags.includes('Settlement') || 
                  predicate.sceneTags.includes('Social') ||
                  predicate.sceneTags.includes('Criminal')
    }
    else if (action.id === 'enchant') {
      // Enchant targets magical or mysterious locations
      canTarget = predicate.sceneTags.includes('Magical') || 
                  predicate.sceneTags.includes('Mysterious')
    }
    else if (action.id === 'summon') {
      // Summon targets magical or sacred locations
      canTarget = predicate.sceneTags.includes('Magical') || 
                  predicate.sceneTags.includes('Sacred') ||
                  predicate.sceneTags.includes('Mysterious')
    }
    else if (action.id === 'disguise') {
      // Disguise targets settlement or social locations
      canTarget = predicate.sceneTags.includes('Settlement') || 
                  predicate.sceneTags.includes('Social')
    }
    else if (action.id === 'track') {
      // Track targets wilderness or dangerous locations
      canTarget = predicate.sceneTags.includes('Wilderness') || 
                  predicate.sceneTags.includes('Dangerous')
    }
    else if (action.id === 'forage') {
      // Forage targets wilderness locations
      canTarget = predicate.sceneTags.includes('Wilderness')
    }
    else if (action.id === 'swim') {
      // Swim targets water or wilderness locations
      canTarget = predicate.sceneTags.includes('Water') || 
                  predicate.sceneTags.includes('Wilderness')
    }
    else if (action.id === 'investigate') {
      // Investigate targets mysterious or settlement locations
      canTarget = predicate.sceneTags.includes('Mysterious') || 
                  predicate.sceneTags.includes('Settlement') ||
                  predicate.sceneTags.includes('Dungeon')
    }
    else if (action.id === 'experiment') {
      // Experiment targets magical or mysterious locations
      canTarget = predicate.sceneTags.includes('Magical') || 
                  predicate.sceneTags.includes('Mysterious')
    }
    else if (action.id === 'meditate_deep') {
      // Deep meditation targets sacred or peaceful locations
      canTarget = predicate.sceneTags.includes('Sacred') || 
                  predicate.sceneTags.includes('Peaceful')
    }
    else if (action.id === 'fast') {
      // Fast targets sacred or peaceful locations
      canTarget = predicate.sceneTags.includes('Sacred') || 
                  predicate.sceneTags.includes('Peaceful')
    }
    else if (action.id === 'commune') {
      // Commune targets sacred or mystical locations
      canTarget = predicate.sceneTags.includes('Sacred') || 
                  predicate.sceneTags.includes('Mystical') ||
                  predicate.sceneTags.includes('Magical')
    }
    else {
      // Default: check if any action tags match predicate scene tags
      canTarget = action.tags.some(tag => 
        predicate.sceneTags.some(sceneTag => 
          sceneTag.toLowerCase() === tag.toLowerCase()
        )
      )
    }

    if (canTarget) {
      targets.push(predicate)
    }
  }

  return targets
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