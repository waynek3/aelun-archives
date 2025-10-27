export const TIMESCALES = [
  'Day',
  '3-Hour',
  '20-Min',
  'Encounter',
] as const;
export type Timescale = typeof TIMESCALES[number];

export const ACTION_TYPES = ['Targeted', 'Untargeted'] as const;
export type ActionTypeConst = typeof ACTION_TYPES[number];

export const SCENE_TAGS = [
  'Universal',
  'Homestead',
  'Forest',
  'Wilderness',
  'Settlement',
  'Dungeon',
  'Dangerous',
  'Combat',
] as const;
export type SceneTag = typeof SCENE_TAGS[number];

export const DICE_FACES = [4, 6, 8, 10, 12, 20] as const;
export type DieFaces = typeof DICE_FACES[number];