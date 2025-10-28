export interface GraveyardEntry {
  characterId: string;
  name: string;
  lifepath: string[];
  survived: number; // turns survived
  diedAt: string; // predicate id or location name
  causeOfDeath: string;
  achievements: string[];
  peakAffinities: Record<string, number>;
  timestamp: number;
}

export interface Compendium {
  discoveredCards: string[]; // store as array for persistence
  discoveredPredicates: string[];
  discoveredTraits: string[];
  discoveredAffinities: string[];
  loreFragments: string[];
  completionPercentage: number;
}

export interface GameStatistics {
  totalRuns: number;
  longestRunTurns: number;
  totalDeaths: number;
}

export interface MetaProgression {
  version: number;
  cardUnlocks: Record<string, Record<number, string>>; // baseCardId -> tier -> unlockedCardId
  graveyard: GraveyardEntry[];
  compendium: Compendium;
  statistics: GameStatistics;
  // Per-card failure tracking for evolution system
  cardProgress?: Record<string, CardProgress>;
}

export interface CardProgress {
  cardId: string;
  failureCount: number;
  tiersUsed: boolean[];
}