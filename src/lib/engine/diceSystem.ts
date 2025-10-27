/**
 * Dice System Engine
 * Handles rolling dice pools and calculating results
 */

export interface Die {
  faces: number;  // 4, 6, 8, 10, 12, 20
  source: string;  // "Strength", "Trait: Devout", "Base Action"
}

export interface DicePool {
  advantageDice: number;  // Number of d20s
  bonusDice: Die[];       // Additional dice from stats/traits
}

export interface DiceResult {
  advantageRolls: number[];  // All d20 rolls
  keptRoll: number;          // Highest d20 (advantage)
  bonusRolls: { die: Die; result: number }[];  // Bonus dice results
  total: number;             // Final total
  criticalSuccess: boolean;  // Total >= DC + 10
  criticalFailure: boolean;  // Total <= DC - 10
}

/**
 * Roll a single die with specified faces
 */
export function rollDie(faces: number): number {
  return Math.floor(Math.random() * faces) + 1;
}

/**
 * Roll advantage dice (multiple d20s, keep highest)
 */
export function rollAdvantageDice(count: number): { rolls: number[]; kept: number } {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(rollDie(20));
  }
  const kept = Math.max(...rolls);
  return { rolls, kept };
}

/**
 * Roll bonus dice
 */
export function rollBonusDice(dice: Die[]): { die: Die; result: number }[] {
  return dice.map(die => ({
    die,
    result: rollDie(die.faces)
  }));
}

/**
 * Calculate total from dice results
 */
export function calculateTotal(keptRoll: number, bonusResults: { die: Die; result: number }[]): number {
  const bonusTotal = bonusResults.reduce((sum, { result }) => sum + result, 0);
  return keptRoll + bonusTotal;
}

/**
 * Determine if result is critical success or failure
 */
export function checkCritical(result: number, dc: number): { criticalSuccess: boolean; criticalFailure: boolean } {
  return {
    criticalSuccess: result >= dc + 10,
    criticalFailure: result <= dc - 10
  };
}

/**
 * Roll a complete dice pool
 */
export function rollDicePool(pool: DicePool, dc: number = 10): DiceResult {
  // Roll advantage dice
  const advantage = rollAdvantageDice(pool.advantageDice);
  
  // Roll bonus dice
  const bonusResults = rollBonusDice(pool.bonusDice);
  
  // Calculate total
  const total = calculateTotal(advantage.kept, bonusResults);
  
  // Check for critical results
  const critical = checkCritical(total, dc);
  
  return {
    advantageRolls: advantage.rolls,
    keptRoll: advantage.kept,
    bonusRolls: bonusResults,
    total,
    criticalSuccess: critical.criticalSuccess,
    criticalFailure: critical.criticalFailure
  };
}

/**
 * Get Unicode die face for display
 */
export function getDieFace(value: number, faces: number): string {
  if (faces === 20) {
    // d20 faces
    const d20Faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅', '⚀', '⚁'];
    return d20Faces[value - 1] || '⚀';
  } else if (faces === 6) {
    // d6 faces
    const d6Faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return d6Faces[value - 1] || '⚀';
  } else if (faces === 4) {
    // d4 faces (using d6 symbols for now)
    const d4Faces = ['⚀', '⚁', '⚂', '⚃'];
    return d4Faces[value - 1] || '⚀';
  } else {
    // Generic die face
    return `[${value}]`;
  }
}

/**
 * Get result symbol for display
 */
export function getResultSymbol(result: DiceResult, dc: number): string {
  if (result.criticalSuccess) return '★★★';
  if (result.total >= dc) return '✓';
  if (result.total >= dc - 5) return '⚠';
  if (result.criticalFailure) return '✗✗';
  return '✗';
}

/**
 * Get result color class for display
 */
export function getResultColorClass(result: DiceResult, dc: number): string {
  if (result.criticalSuccess) return 'text-green-400';
  if (result.total >= dc) return 'text-green-500';
  if (result.total >= dc - 5) return 'text-yellow-500';
  if (result.criticalFailure) return 'text-red-400';
  return 'text-red-500';
}
