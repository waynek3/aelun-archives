export type AffinityCategory = 'faction' | 'deity' | 'npc';

export interface AffinityDefinition {
  id: string;
  name: string;
  category: AffinityCategory;
  description: string;
  region?: string;
}

export const AFFINITY_DEFINITIONS: AffinityDefinition[] = [
  {
    id: 'silver_hand',
    name: 'Silver Hand Bandits',
    category: 'faction',
    description: 'An infamous band of rogues who respect boldness and despise lawkeepers.',
    region: 'Wilderness',
  },
  {
    id: 'monastery',
    name: 'Monastery of Aelun',
    category: 'faction',
    description: 'Stoic ascetics who value restraint and devotion to ancient rites.',
    region: 'Homesteads',
  },
  {
    id: 'forest_spirits',
    name: 'Spirits of the Northwood',
    category: 'deity',
    description: 'Restless spirits that reward harmony with nature and punish greed.',
    region: 'Wilderness',
  },
  {
    id: 'god_of_war',
    name: 'Vaskor, God of War',
    category: 'deity',
    description: 'A martial patron who admires courage and decisive strikes.',
  },
  {
    id: 'unknown_power',
    name: 'The Unknown Power',
    category: 'npc',
    description: 'A mysterious presence that reacts unpredictably to mortal pleas.',
  },
];

export function getAffinityDefinition(id: string): AffinityDefinition | undefined {
  return AFFINITY_DEFINITIONS.find((definition) => definition.id === id);
}
