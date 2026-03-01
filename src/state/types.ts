// ─── Primitive IDs ───────────────────────────────────────────────────────────

export type GodId =
  | 'mesin' | 'gul' | 'klossa' | 'skarhol'
  | 'marena' | 'azorius' | 'ara' | 'finhorn'
  | 'beroan' | 'sofiel';

export type ElementId = 'life' | 'death' | 'earth' | 'water' | 'air' | 'fire';

export type StrengthId = 'weak' | 'mid' | 'strong';

export type ColorScheme = 'blue' | 'green' | 'orange';

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
  | 'university_heights_bodega';

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
  basePayout: number;              // 0 on loss
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

export type Phase = 'playing' | 'scratching' | 'passedout' | 'game_over';

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
