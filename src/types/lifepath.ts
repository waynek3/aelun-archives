export interface LifepathChoiceDefinition {
  id: string;
  name: string;
  stats?: Partial<Record<'strength' | 'agility' | 'insight' | 'charisma' | 'fortitude' | 'will', number>>;
  traits?: string[]; // trait ids
  cards?: string[]; // action card ids
}

export interface LifepathStep {
  id: string;
  prompt: string;
  choices: LifepathChoiceDefinition[];
}

export interface LifepathDefinition {
  id: string;
  name: string;
  steps: LifepathStep[];
}

export interface CharacterSeed {
  stats: {
    strength: number;
    agility: number;
    insight: number;
    charisma: number;
    fortitude: number;
    will: number;
  };
  traitIds: string[];
  deckActionCardIds: string[];
}

export interface LifepathProgressState {
  lifepathId: string;
  currentStepIndex: number;
  selectedChoiceIds: string[]; // parallel to steps traversed
  seed: CharacterSeed;
}
