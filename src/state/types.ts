// ─── Primitive IDs ───────────────────────────────────────────────────────────

export type GodId =
  | 'mesin' | 'gul' | 'klossa' | 'skarhol'
  | 'marena' | 'azorius' | 'ara' | 'finhorn'
  | 'beroan' | 'sofiel';

export type ElementId = 'life' | 'death' | 'earth' | 'water' | 'air' | 'fire';

export type StrengthId = 'weak' | 'mid' | 'strong';

export type ColorScheme = 'blue' | 'green' | 'orange';

// Sprint 13: furniture types (Sprint 19: crystal_ball)
export type FurnitureType = 'bed' | 'lab_table' | 'bong' | 'crystal_ball';

export interface FurnitureItem {
  type: FurnitureType;
  id: string;        // e.g. 'bed_basic', 'bed_standard', 'bong'
  name: string;      // display name
  quality: number;   // 1-3 for beds; 1 for lab table and bong
}

// Sprint 7: food quality descriptors
export type FoodDescriptor = 'greasy' | 'salty' | 'sugary' | 'bland' | 'healthy' | 'gourmet';

// Sprint 7: inventory items — discriminated union (Sprint 16: extended with spell scrolls)
export interface SnackItem {
  type: 'snack';
  id: string;
  name: string;
  descriptor: FoodDescriptor;
}

// Sprint 16: spell scrolls — one-use casting of a spell the wizard doesn't know
export interface SpellScrollItem {
  type: 'spell_scroll';
  id: string;        // e.g. 'scroll_lucky_fingers'
  name: string;      // e.g. 'Scroll of Lucky Fingers'
  spellId: string;   // which spell this scroll casts
}

// Sprint 20: potion items (crafted via Wizard Projects)
export interface PotionItem {
  type: 'potion';
  id: string;        // e.g. 'longevity_potion'
  name: string;      // e.g. 'Longevity Potion'
}

// Sprint 20: monument items (crafted via Wizard Projects, donated at temples in Sprint 21)
export interface MonumentItem {
  type: 'monument';
  id: string;        // e.g. 'monument_small'
  name: string;
  size: 'small' | 'medium' | 'large';
}

export type InventoryItem = SnackItem | SpellScrollItem | PotionItem | MonumentItem;

// Sprint 20: active wizard project state
export interface ProjectState {
  projectId: string;    // e.g. 'longevity_potion'
  progress: number;     // work units accumulated
}

// Sprint 2+: location and neighborhood tracking
export type NeighborhoodId =
  | 'the_skids' | 'the_burbs' | 'richville'
  | 'center_city' | 'downtown' | 'university_heights';

export type LocationId =
  | 'tower'
  | 'the_skids_bodega'
  | 'the_burbs_bodega'
  | 'richville_bodega'
  | 'center_city_bodega'
  | 'downtown_bodega'
  | 'university_heights_bodega'
  // Sprint 9: Temples
  | 'the_skids_temple_gul'
  | 'the_skids_temple_finhorn'
  | 'the_burbs_temple_klossa'
  | 'the_burbs_temple_ara'
  | 'richville_temple_skarhol'
  | 'richville_temple_sofiel'
  | 'center_city_temple_beroan'
  | 'center_city_temple_azorius'
  | 'downtown_temple_marena'
  | 'university_heights_temple_mesin'
  // Sprint 13: Furniture stores
  | 'the_skids_furniture'
  | 'the_burbs_furniture'
  | 'richville_furniture'
  | 'center_city_furniture'
  | 'downtown_furniture'
  | 'university_heights_furniture'
  // Sprint 14: University
  | 'university_heights_university'
  // Sprint 16: University Bookstore and Spell Scroll Stores
  | 'university_heights_bookstore'
  | 'the_skids_scroll_store'
  | 'the_burbs_scroll_store'
  | 'richville_scroll_store'
  | 'center_city_scroll_store'
  | 'downtown_scroll_store'
  | 'university_heights_scroll_store'
  // Sprint 22: Dad's House
  | 'richville_dads_house';

// Sprint 9: prayer buff
export interface PrayerBuff {
  godId: GodId;
  expiresAtClock: number;   // minutes from midnight
  expiresOnDay: number;
  expiresInMonth: number;
  expiresInYear: number;
}

// Sprint 15: luck spell buff (from Lucky Fingers)
export interface LuckBuff {
  expiresAtClock: number;
  expiresOnDay: number;
  expiresInMonth: number;
  expiresInYear: number;
}

// ─── Scratch Session ──────────────────────────────────────────────────────────

// 0 = █ covered, 1 = ▓, 2 = ▒, 3 = ░, 4 = glyph revealed
export type CellState = 0 | 1 | 2 | 3 | 4;

export interface TicketCell {
  symbolId: number;  // 1–30
  state: CellState;
}

export interface GeneratedTicket {
  typeId: string;
  typeName: string;
  cost: number;
  cells: TicketCell[];
  rows: number;
  cols: number;
  // Pre-determined outcome
  isWin: boolean;
  winningSymbolId: number | null;  // null on losses
  matchCount: number;              // highest matching symbol count
  basePayout: number;              // 0 on loss; pre-affinity payout
  actualPayout: number;            // 0 until revealed; post-affinity payout applied to cash
  // UI state
  revealed: boolean;               // true when all cells are at state 4
}

export interface ScratchSessionState {
  tickets: GeneratedTicket[];
  currentTicketIndex: number;
  timeCostMinutes: number;   // pre-computed time cost (used in Sprint 2+)
  totalPayout: number;       // accumulated winnings so far this session
  totalCost: number;         // total spent on this session
}

// ─── Game State ───────────────────────────────────────────────────────────────

export type Phase = 'setup' | 'playing' | 'scratching' | 'passedout' | 'game_over' | 'event';

// Sprint 22: loan state
export interface LoanState {
  principal: number;
  interestRate: number;
  collateral: boolean;  // true if spellbook held as collateral
}

// Sprint 23: active random event
export interface ActiveEvent {
  eventId: string;
  flavor: string;
  choices: { label: string }[];
  resolved: boolean;
  outcomeText: string | null;
  choiceIndex: number | null;
}

export interface GameState {
  // ── Core ──
  phase: Phase;
  cash: number;

  // ── Time & Calendar (Sprint 2+) ──
  clock: number;             // minutes from midnight; 600 = 10:00 AM, 1560 = curfew
  day: number;               // 1-based, 1–30
  month: number;             // 1–12
  year: number;

  // ── Location (Sprint 2+) ──
  currentNeighborhood: NeighborhoodId;
  currentLocation: LocationId;

  // ── Passout tracking (Sprint 2+) ──
  lastPassoutPenalty: number | null;  // shown on passout screen

  // ── Chill meter (Sprint 5+) ──
  chill: number;  // mood meter, floor 0, no hard cap; shown as % bar (100 = full)

  // ── Mana pool (Sprint 6+) ──
  mana: number;     // current mana, floor 0, cap at maxMana
  maxMana: number;  // maximum mana capacity

  // ── Inventory (Sprint 7+) ──
  inventory: (InventoryItem | null)[];  // length 5, null = empty slot

  // ── Player Stats (Sprint 8+) ──
  intelligence: number;       // learning speed at university; degrades with age
  bookbinding: number;        // spellbook capacity
  wizardFame: number;         // unlocks, loan caps, event chances
  relaxationRate: number;     // passive chill restore rate
  restingRelaxation: number;  // baseline chill target

  // ── Hidden Addiction Stats (Sprint 17+) ──
  addictionNeed: number;         // cumulative craving; grows with scratch frequency
  addictionSatisfaction: number; // cumulative satisfaction from scratching

  // ── Age Health (Sprint 18 stub — aging system not yet implemented) ──
  ageHealthScore: number;  // composite health; determines death age; starts at 100

  // ── Crystal Ball (Sprint 19) ──
  crystalBallReveal: { stat: string; label: string; value: number } | null;  // transient; cleared on next action

  // ── God Affinity (Sprint 9+) ──
  affinity: Record<GodId, number>;    // affinity score per god, starts at 0
  prayerBuffs: PrayerBuff[];          // active timed prayer buffs

  // ── Furniture (Sprint 13+) ──
  furniture: FurnitureItem[];  // max 10 slots

  // ── Spellbook (Sprint 14+) ──
  knownSpells: string[];       // spell IDs learned at university
  equippedSpells: string[];    // spell IDs in spellbook (bounded by bookbinding)

  // ── Spell Buffs (Sprint 15+) ──
  luckBuff: LuckBuff | null;   // active Lucky Fingers buff; null when inactive

  // ── Birthday (Sprint 11+) ──
  birthdayMonth: number;  // 1–12; set during new-run setup; used for Birthday event (Sprint 23+)

  // ── Wizard Projects (Sprint 20+) ──
  activeProject: ProjectState | null;  // one project at a time; null = no project

  // ── Dad's House & Loans (Sprint 22+) ──
  dadAlive: boolean;           // false after "Dad Dies" event
  loan: LoanState | null;     // active loan from Dad; null = no loan

  // ── Random Events (Sprint 23+) ──
  activeEvent: ActiveEvent | null;
  eventsTriggered: Record<string, number>;  // event id → trigger count
  notableEvents: string[];                   // for legacy screen
  loanSharkDebt: number;                     // Loan Shark event debt
  loanSharkInterestRate: number;             // interest on loan shark debt
  lastBirthdayYear: number;                  // track last birthday event year

  // ── Scratch session (active during 'scratching' phase) ──
  scratchSession: ScratchSessionState | null;

  // ── Legacy tracking ──
  totalTicketsScratched: number;
  bestSingleWin: number;

  // ── RNG ──
  rngSeed: number;  // current seed state; advances with each RNG call

  // ── Settings ──
  colorScheme: ColorScheme;
}

// ─── Save Format ──────────────────────────────────────────────────────────────

export interface SaveData {
  version: number;
  state: GameState;
  timestamp: number;
}
