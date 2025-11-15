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

export interface AffinityHistoryEntry {
  peak: number;
  lastKnown: number;
}

export interface MetaProgression {
  version: number;
  cardUnlocks: Record<string, Record<number, string>>; // baseCardId -> tier -> unlockedCardId
  graveyard: GraveyardEntry[];
  compendium: Compendium;
  statistics: GameStatistics;
  affinityHistory: Record<string, AffinityHistoryEntry>;
}