# Chill Scratch-Off Wizard Simulator — Technical Architecture

---

## 1. Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language | **TypeScript** | Complex interconnected game state (10 gods, 30 symbols, hidden stats, opposition circle math) benefits heavily from static typing. Catches misconfigurations at compile time rather than at runtime mid-play. |
| Build Tool | **Vite** | Fast HMR for iterative sprint development. Zero-config TypeScript support. Produces a single optimized bundle for mobile deployment. No webpack complexity. |
| UI Framework | **None (vanilla DOM)** | The UI is text-driven menus and progress bars — no component trees, no virtual DOM diffing, no reactive templating needed. A lightweight rendering layer that writes to the DOM directly keeps the bundle small and the architecture transparent. If menu complexity grows beyond expectations, Preact (3KB) can be dropped in later without restructuring. |
| Styling | **Plain CSS with CSS custom properties** | Three retro color schemes map directly to CSS custom properties. Toggle themes by swapping a `data-theme` attribute on `<body>`. No preprocessor needed. |
| State persistence | **localStorage** | No backend. Game state serializes to JSON. Single save slot is sufficient for launch. |
| Testing | **Vitest** | Ships with Vite. Fast, TypeScript-native. Systems like affinity math, payout calculation, and opposition circle logic are pure functions — ideal for unit testing. |
| Linting | **ESLint + typescript-eslint** | Standard tooling. Catches bugs early. |

### What's explicitly excluded

- **No React/Vue/Svelte.** The game is a state machine rendered as text. A framework adds bundle size and conceptual overhead with no payoff for this UI style.
- **No canvas/WebGL.** All visuals are Unicode glyphs styled with CSS. DOM rendering is correct here.
- **No backend, no database.** localStorage only. A backend can be added later for leaderboards if desired.
- **No bundled font files.** The symbol set uses BMP glyphs that render in system fonts universally.

---

## 2. Core Architecture

The game is structured as an **action-driven state machine**. There is no real-time game loop. The in-game clock only advances when the player takes an action. All game logic operates on a single centralized state object. The UI is a thin rendering layer that reads state and dispatches player actions.

```
         Player taps a button
                 │
                 ▼
      ┌────────────────────┐
      │   Action Dispatch   │
      │                    │
      │  1. Validate action │
      │  2. Calculate time  │
      │     cost            │
      │  3. Advance clock   │
      │  4. Run systems for │
      │     elapsed time    │
      │  5. Apply action    │
      │     effects         │
      │  6. Check triggers  │
      │     (curfew, rent,  │
      │      events, death) │
      │  7. Auto-save       │
      └─────────┬──────────┘
                │
        ┌───────▼───────┐
        │  Game State    │
        │  (single obj)  │
        └───────┬───────┘
                │
        ┌───────▼───────┐
        │  UI Render     │
        │  (read-only)   │
        └───────────────┘
```

Every action the player can take has a known in-game time cost, displayed to the player before they commit. Travel to a bodega: 5 minutes. Scratch 4 tickets: 1 minute (snapped to :15). Pray for 30 minutes: 30 minutes. The player always knows what they're spending before they spend it.

### Why action-driven, not real-time

There is no idle state where time passes on its own. The player is always making a decision. This means:
- No `setInterval` / `requestAnimationFrame` game loop.
- No idle-game-style fast-forward when the tab is backgrounded.
- No "game speed" tuning constant.
- Simpler architecture: action → state update → render. That's it.

Passive systems (chill decay, affinity decay, mana regen) still run — they just run in bulk for the elapsed time when an action advances the clock. If the player travels for 15 minutes, chill decays for 15 minutes' worth in one calculation.

### Why a centralized state object

The game has deeply interconnected systems:
- Scratching a ticket touches: cash, chill, addiction (need + satisfaction), god affinity (payout multiplier), time, and potentially random events.
- Praying touches: time, mana, god affinity (timed buff), and indirectly chill.
- Sleeping touches: time, mana (bed quality), chill (bed quality), and advances the calendar (aging, rent).

A single state object avoids scattered state synchronization bugs. Every system reads from and writes to the same source of truth.

### Why NOT Redux / Zustand / signals

The game has one consumer (the renderer) and one producer (the action dispatcher). There's no concurrent UI that needs fine-grained reactivity. A plain object with a `render()` call after each state change is sufficient and easier to debug. If this proves insufficient during development, a pub/sub layer can be added without restructuring.

---

## 3. State Shape

Top-level state structure. All fields are serializable to JSON for localStorage persistence.

```typescript
interface GameState {
  // Core
  phase: 'new_run' | 'playing' | 'scratching' | 'game_over' | 'legacy';
  cash: number;
  day: number;           // day of month (1-based)
  month: number;         // 1-12
  year: number;
  clock: number;         // minutes since midnight (0-1439)
  birthday: { day: number; month: number };

  // Location
  currentNeighborhood: NeighborhoodId;
  currentLocation: LocationId;

  // Stats
  intelligence: number;
  bookbinding: number;
  wizardFame: number;
  relaxationRate: number;
  restingRelaxation: number;

  // Hidden stats
  addictionNeed: number;
  addictionSatisfaction: number;
  ageHealthScore: number;
  deathAge: number;          // computed from ageHealthScore periodically

  // Meters
  chill: number;
  mana: number;
  maxMana: number;

  // God affinity (keyed by GodId)
  affinity: Record<GodId, number>;
  prayerBuffs: PrayerBuff[];  // active timed buffs

  // Inventory
  inventory: (InventoryItem | null)[];  // length 5, null = empty slot

  // Spellbook
  knownSpells: SpellId[];
  equippedSpells: SpellId[];  // subset of knownSpells, bounded by bookbinding
  spellProgress: Record<SpellId, number>;

  // Tower
  furniture: FurnitureItem[];  // max 10

  // Projects
  activeProject: ProjectState | null;

  // Scratch session (active during 'scratching' phase)
  scratchSession: ScratchSessionState | null;

  // Events
  dadAlive: boolean;
  eventsTriggered: Record<string, number>;  // event id -> count
  bongBreakCount: number;

  // Meta / legacy tracking
  totalTicketsScratched: number;
  bestSingleWin: number;
  highestFame: number;
  notableEvents: string[];

  // RNG
  rngSeed: number;

  // Settings (persisted separately from game state)
  colorScheme: 'blue' | 'green' | 'orange';
}
```

This is intentionally flat. Nested objects are used only where a clear grouping exists (affinity map, prayer buffs). Flat state is easier to serialize, diff, and debug.

---

## 4. System Architecture

Each game system is a pure module that exports functions operating on `GameState`. No system holds its own state. This makes systems independently testable and composable.

### System List

| System | Reads | Writes | Sprint |
|--------|-------|--------|--------|
| **Time** | clock, day, month, year | clock, day, month, year | 2 |
| **Travel** | currentNeighborhood, clock | currentLocation, currentNeighborhood, clock | 2, 4 |
| **Rent** | cash, day | cash, phase | 3 |
| **Chill** | chill, relaxationRate, restingRelaxation | chill | 5 |
| **Mana** | mana, maxMana, furniture (bed) | mana | 6 |
| **Inventory** | inventory | inventory | 7 |
| **Stats** | intelligence, bookbinding, etc. | (all player stats) | 8 |
| **Affinity** | affinity, prayerBuffs, month | affinity, wizardFame | 9-12 |
| **Scratch** | cash, affinity, symbols, addiction | cash, chill, addiction, clock, totalTicketsScratched | 1, 10 |
| **Addiction** | addictionNeed, addictionSatisfaction | addictionNeed, addictionSatisfaction, restingRelaxation | 17 |
| **Aging** | year, month, ageHealthScore | intelligence, addictionSusceptibility, deathAge, phase | 18 |
| **Spellbook** | equippedSpells, mana, chill | mana, various (per spell effect) | 14-16 |
| **Projects** | activeProject, chill | activeProject, inventory | 20 |
| **Events** | location, affinity, wizardFame, RNG | various (per event) | 23 |

### Action dispatch pattern

Every player action follows the same flow:

```typescript
function dispatch(state: GameState, action: GameAction): GameState {
  // 1. Calculate time cost for this action
  const timeCost = getTimeCost(action);

  // 2. Advance clock and run passive systems for elapsed time
  let next = advanceClock(state, timeCost);
  next = runPassiveSystems(next, timeCost); // chill decay, affinity decay, etc.

  // 3. Apply the action's specific effects
  next = applyAction(next, action);

  // 4. Check triggers
  next = checkCurfew(next);
  next = checkRentDue(next);
  next = checkRandomEvents(next, action);
  next = checkDeath(next);

  // 5. Auto-save
  save(next);

  return next;
}
```

Each step is a pure function. The dispatch chain is the only place where state mutation occurs.

---

## 5. Time System Design

Time is the most cross-cutting system. It needs careful design upfront because every sprint builds on it.

### Action-based clock

The in-game clock is purely action-driven. There is no real-time tick. When the player performs an action, the clock advances by that action's time cost.

```
Player action  ──►  Time cost lookup  ──►  Clock advance
                                              │
                                              ├── Run passive systems for elapsed minutes
                                              ├── Calendar rollover (day → month → year)
                                              ├── Curfew check
                                              └── Rent day check
```

### Day cycle

- **Wake time:** 10:00 AM (clock = 600)
- **Curfew:** 2:00 AM (clock = 1560, i.e., next day 02:00)
- **Waking hours:** 16 hours (960 minutes)
- All values stored in tuning config.

### Time costs

Every action in the game has a time cost. The player sees this cost before committing. Examples:

| Action | Time Cost | Snapping |
|--------|-----------|----------|
| Travel within neighborhood | 5 min | Snaps to :15 |
| Travel to different neighborhood | 15 min | Snaps to :15 |
| Scratch tickets | 15s/ticket, 1 min minimum | Snaps to :15 after total |
| Prayer | Player chooses duration | Must be :15 increment |
| University class | Per-class duration | Snaps to :15 |
| Buy items at store | 15 min | Already aligned |
| Sleep | Remainder of night | Advances to next day 10:00 |
| Work on project | Player chooses duration | Must be :15 increment |

### Task snapping

All non-scratch tasks snap to the next :15 increment:

```typescript
function snapToQuarter(minutes: number): number {
  return Math.ceil(minutes / 15) * 15;
}
```

Scratch sessions: total seconds = tickets * 15, minimum 60 seconds, convert to minutes, then snap.

### Passout

If the clock passes curfew (2:00 AM) and the player is not in the tower, they pass out. Consequences (all tunable per neighborhood):

| Neighborhood | Cash Penalty | Chill Restored | Mana Restored |
|-------------|-------------|----------------|---------------|
| The Skids | $20 | Low | Moderate |
| The Burbs | $40 | Slightly below avg | Slightly below avg |
| Center City | $60 | Moderate | Moderate |
| Downtown | $80 | Low | Low |
| Richville | $100 | High | Low |
| University Heights | $50 | Low | High |

Exact values in `data/balance.json`.

---

## 6. UI Architecture

### Screen stack

The UI is a simple screen stack, not a router. Each screen is a function that renders to a container.

```typescript
type Screen =
  | { type: 'new_run' }
  | { type: 'tower' }
  | { type: 'neighborhood'; id: NeighborhoodId }
  | { type: 'location'; id: LocationId }
  | { type: 'scratch'; session: ScratchSessionState }
  | { type: 'game_over' }
  | { type: 'legacy' };
```

### Rendering approach

Each screen exports a `render(state, container)` function that writes to a root `<div>`. On state change, the current screen's render function is called. No diffing — full replacement of the screen container's innerHTML except during scratch sessions (see below). This is fast enough for text-only UI.

### HUD

A persistent HUD bar sits above the screen area and shows:
- Cash (dollar amount)
- Clock (HH:MM)
- Calendar (Day Month Year)
- Chill bar (percentage bar, no number)
- Mana bar (shows current/max)

The HUD re-renders after every action.

### Three Color Schemes

Three retro computing themes, selectable by the player:

```css
/* DOS Blue — classic BIOS / Norton Commander */
[data-theme="blue"] {
  --bg: #0000AA;
  --fg: #55FFFF;
  --accent: #FFFFFF;
  --bar-fill: #55FFFF;
  --bar-empty: #000055;
  --warn: #FF5555;
  --muted: #555555;
}

/* Terminal Green — classic CRT terminal */
[data-theme="green"] {
  --bg: #0A0A0A;
  --fg: #33FF33;
  --accent: #66FF66;
  --bar-fill: #33FF33;
  --bar-empty: #0A2A0A;
  --warn: #FF5555;
  --muted: #1A6B1A;
}

/* Amber — vintage amber phosphor monitor */
[data-theme="orange"] {
  --bg: #0A0A0A;
  --fg: #FFAA00;
  --accent: #FFCC44;
  --bar-fill: #FFAA00;
  --bar-empty: #2A1A00;
  --warn: #FF5555;
  --muted: #6B4400;
}
```

All UI elements reference custom properties. Theme toggle swaps `data-theme` on `<body>`. Preference persists in localStorage (separate from game save).

### Mobile-first layout

- Single-column layout, max-width 480px, centered.
- Touch targets minimum 44x44px.
- No horizontal scrolling.
- Font: system monospace stack (`ui-monospace, 'Cascadia Code', 'Fira Code', monospace`).
- Viewport meta tag locks zoom behavior.

---

## 7. File Structure

```
/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts                    # Entry point: init, action dispatch, render
│   ├── state/
│   │   ├── types.ts               # GameState, all type definitions
│   │   ├── initial.ts             # Default starting state for new run
│   │   └── save.ts                # localStorage serialize/deserialize
│   ├── engine/
│   │   ├── dispatch.ts            # Action dispatcher (the core loop)
│   │   ├── time.ts                # Clock advancement, calendar, snapping
│   │   └── actions.ts             # Action type definitions and validators
│   ├── systems/
│   │   ├── scratch.ts             # Ticket generation, resolution, payouts
│   │   ├── chill.ts               # Chill meter decay and restoration
│   │   ├── mana.ts                # Mana pool management
│   │   ├── affinity.ts            # God affinity gain/loss/decay, opposition
│   │   ├── addiction.ts           # Hidden addiction mechanic
│   │   ├── aging.ts               # Age progression, health score, death
│   │   ├── inventory.ts           # Inventory slot management
│   │   ├── spellbook.ts           # Spell learning, equipping, casting
│   │   ├── projects.ts            # Wizard project progress
│   │   ├── rent.ts                # Monthly rent check
│   │   ├── travel.ts              # Travel time calculation
│   │   └── events.ts              # Random event trigger and resolution
│   ├── data/
│   │   ├── balance.json           # All tuning values (see Section 8)
│   │   ├── gods.ts                # God definitions, opposition circle
│   │   ├── symbols.ts             # 30 symbols, element/god/strength mapping
│   │   ├── neighborhoods.ts       # 6 neighborhoods, god strengths
│   │   ├── locations.ts           # Location type definitions, menus
│   │   ├── food.ts                # Snack/food definitions
│   │   ├── furniture.ts           # Furniture definitions
│   │   ├── spells.ts              # Spell bank definitions
│   │   ├── potions.ts             # Potion definitions
│   │   └── tickets.ts             # Ticket type definitions (formats, odds, payouts)
│   ├── ui/
│   │   ├── renderer.ts            # Screen manager, render dispatch
│   │   ├── hud.ts                 # Persistent HUD bar
│   │   ├── components.ts          # Reusable: progress bars, menus, buttons
│   │   ├── screens/
│   │   │   ├── new-run.ts         # Birthday selection, new game
│   │   │   ├── tower.ts           # Wizard tower menu
│   │   │   ├── neighborhood.ts    # Neighborhood location picker
│   │   │   ├── bodega.ts          # Bodega purchase screen
│   │   │   ├── scratch.ts         # Scratch reveal screen (tap-to-reveal)
│   │   │   ├── temple.ts          # Temple menu (donate, pray)
│   │   │   ├── university.ts      # University class selection
│   │   │   ├── furniture-store.ts # Furniture purchase
│   │   │   ├── game-over.ts       # Eviction screen
│   │   │   └── legacy.ts          # Death summary screen
│   │   └── theme.ts               # Theme toggle logic
│   └── util/
│       ├── rng.ts                 # Seeded PRNG (mulberry32)
│       └── format.ts              # Currency, time, bar rendering helpers
├── test/
│   ├── systems/
│   │   ├── scratch.test.ts
│   │   ├── affinity.test.ts
│   │   ├── chill.test.ts
│   │   └── ...
│   └── engine/
│       ├── dispatch.test.ts
│       └── time.test.ts
├── docs/
│   └── architecture.md            # This document
├── scope.md
├── sprints.md
└── CLAUDE.md
```

---

## 8. Tuning & Balance Config

All gameplay-affecting numbers live in a single human-readable JSON file. This is the designer's control surface — every dial that affects how the game plays is here, not buried in code.

```jsonc
// data/balance.json
{
  "starting": {
    "cash": 250,
    "neighborhood": "the_skids",
    "chill": 50,
    "mana": 20,
    "maxMana": 30,
    "intelligence": 10,
    "bookbinding": 1,
    "wizardFame": 0,
    "relaxationRate": 1.0,
    "restingRelaxation": 50,
    "ageHealthScore": 100
  },

  "rent": {
    "amount": 100,
    "dueDay": 1
  },

  "dayCycle": {
    "wakeTime": 600,
    "curfewTime": 1560,
    "sleepChillRestore": "bed_quality_based",
    "sleepManaRestore": "bed_quality_based"
  },

  "travel": {
    "sameNeighborhoodMinutes": 5,
    "crossNeighborhoodMinutes": 15
  },

  "scratching": {
    "secondsPerTicket": 15,
    "minimumSessionSeconds": 60
  },

  "passout": {
    "the_skids":           { "cashPenalty": 20,  "chillRestore": 0.15, "manaRestore": 0.40 },
    "the_burbs":           { "cashPenalty": 40,  "chillRestore": 0.30, "manaRestore": 0.30 },
    "center_city":         { "cashPenalty": 60,  "chillRestore": 0.35, "manaRestore": 0.35 },
    "downtown":            { "cashPenalty": 80,  "chillRestore": 0.15, "manaRestore": 0.15 },
    "richville":           { "cashPenalty": 100, "chillRestore": 0.50, "manaRestore": 0.15 },
    "university_heights":  { "cashPenalty": 50,  "chillRestore": 0.15, "manaRestore": 0.50 }
  },

  "chill": {
    "decayPerMinute": 0.05,
    "lossPerScratchLoss": 2,
    "gainPerScratchWin": 5,
    "bongRestoreAmount": 25
  },

  "mana": {
    "passoutPenalty": 0.5
  },

  "affinity": {
    "scaleFactor": 0.02,
    "privateDonationMultiplier": 1.5,
    "publicDonationMultiplier": 0.75,
    "publicDonationFameGain": 1,
    "strongMonthMultiplier": 2.0,
    "passiveDecayPerDay": 0.5,
    "prayerBuffMultiplier": 2.0,
    "prayerDebuffMultiplier": 0.5
  },

  "addiction": {
    "needGrowthRate": 0.1,
    "satisfactionPerTicket": 0.05,
    "restingRelaxationPenaltyPerLevel": 2
  },

  "aging": {
    "intelligenceDecayPerYear": 0.5,
    "addictionSusceptibilityPerYear": 0.02,
    "baseDeathAge": 80,
    "healthScoreDeathAgeBonus": 0.2
  },

  "wizardFame": {
    "decayPerDay": 0.1
  }
}
```

### How it works in code

```typescript
import balance from './data/balance.json';

// Systems reference balance values, never hardcode numbers
function calculateChillDecay(elapsedMinutes: number): number {
  return elapsedMinutes * balance.chill.decayPerMinute;
}

function calculateAffinityPayout(basePayout: number, affinity: number): number {
  const multiplier = 1 + (affinity * balance.affinity.scaleFactor);
  return Math.floor(basePayout * multiplier);
}
```

New tuning values are added to this file as systems are built. The file grows with each sprint but never needs restructuring.

---

## 9. Scratch-Off Ticket Engine

The scratch system is the core mechanic and deserves specific architectural attention.

### Ticket types as data

Each ticket type is a self-contained product definition. Different types can use completely different game formats. The system is extensible — new types are added as data entries, and stores can be configured to stock specific subsets.

```typescript
interface TicketType {
  id: string;
  name: string;              // e.g., "Lucky 9", "Triple Line"
  cost: number;              // $1, $2, $5, etc.
  format: TicketFormat;      // grid_match | row_match | match_numbers | etc.
  grid: { rows: number; cols: number };
  winCondition: WinCondition; // e.g., { type: 'match_n', n: 3 }
  payoutTable: PayoutEntry[];
  symbolWeights?: Record<GodId, number>; // override default symbol distribution
}

// Example ticket types (defined in data/tickets.ts)
const TICKET_TYPES: TicketType[] = [
  {
    id: 'lucky_9',
    name: 'Lucky 9',
    cost: 1,
    format: 'grid_match',
    grid: { rows: 3, cols: 3 },
    winCondition: { type: 'match_n', n: 3 },
    payoutTable: [
      { matches: 3, payout: 5 },
      { matches: 4, payout: 15 },
      // ...
    ],
  },
  // More ticket types...
];
```

EV for every ticket type is negative at base. God affinity bonuses push winning payouts higher, potentially making specific ticket types positive EV when the player has invested in the right gods. This makes the god affinity system the core economic engine of the game.

### Ticket generation

When a ticket is purchased, its outcome is pre-determined:

1. Roll against the win probability for this ticket type.
2. If a win: select a winning symbol (weighted by neighborhood god strength), place required matches, fill remaining cells randomly.
3. If a loss: fill all cells randomly, verify no accidental match (re-roll if needed).

The pre-determined result is stored in the scratch session state. The reveal is purely presentational.

### Payout calculation

```
base_payout = ticket_type.payoutTable[match_count]
affinity_multiplier = 1 + (affinity[winning_symbol.god] * balance.affinity.scaleFactor)
final_payout = floor(base_payout * affinity_multiplier)
```

Negative affinity reduces the multiplier below 1.0, penalizing payouts. At zero affinity, payout equals base. With strong positive affinity, payouts exceed base — this is how the player turns negative-EV tickets profitable.

### Scratch reveal UX

The scratch screen is the most interactive part of the UI. Each ticket's cells start fully covered and are revealed by tapping.

**Cell degradation sequence:**

```
█  →  ▓  →  ▒  →  ░  →  glyph
(covered)  (scratching)  (revealed)
```

Each tap on a covered cell advances it one step through the degradation sequence. The glyph becomes visible beneath the thinning overlay. Four taps to fully reveal a cell.

The player must tap every cell on every ticket. There is no "Scratch All" button. This is intentional — the tedium of scratching is a design lever. Future spells can improve the scratch experience (double taps, row/column reveals, instant reveals), making scratch-quality-of-life a meaningful axis of progression.

**Scratch session state:**

```typescript
interface ScratchSessionState {
  tickets: GeneratedTicket[];
  currentTicketIndex: number;
  cellStates: CellState[][];  // per-ticket, per-cell scratch progress (0-4)
}

type CellState = 0 | 1 | 2 | 3 | 4;
// 0 = █ (covered), 1 = ▓, 2 = ▒, 3 = ░, 4 = fully revealed
```

The scratch screen does NOT do full innerHTML replacement on each tap — it updates individual cell elements in place for responsive feel on mobile.

### Store stocking

Each store (bodega/gas station) defines which ticket types it stocks. This enables neighborhood-specific ticket availability and can be expanded over time:

```typescript
interface StoreInventory {
  ticketTypes: string[];    // ticket type IDs available at this store
  snacks: string[];         // food item IDs
}
```

---

## 10. Data Model for Static Content

Static game data (gods, symbols, neighborhoods, etc.) is defined as typed constants. This keeps data separate from logic and makes it easy to audit against `scope.md`.

### Gods and Opposition Circle

```typescript
// data/gods.ts
const GODS = {
  mesin:   { name: 'Mesin',   element: 'life',  strongMonths: [3, 6] },
  gul:     { name: 'Gul',     element: 'death', strongMonths: [9, 12] },
  klossa:  { name: 'Klossa',  element: 'earth', strongMonths: [2] },
  skarhol: { name: 'Skarhol', element: 'earth', strongMonths: [8] },
  marena:  { name: 'Marena',  element: 'water', strongMonths: [1] },
  azorius: { name: 'Azorius', element: 'water', strongMonths: [7] },
  ara:     { name: 'Ara',     element: 'air',   strongMonths: [4] },
  finhorn: { name: 'Finhorn', element: 'air',   strongMonths: [10] },
  beroan:  { name: 'Beroan',  element: 'fire',  strongMonths: [5] },
  sofiel:  { name: 'Sofiel',  element: 'fire',  strongMonths: [11] },
} as const;

// Opposition pairs derived from the circle:
// Mesin ↔ Gul, Klossa ↔ Sofiel, Marena ↔ Finhorn, Ara ↔ Azorius, Beroan ↔ Skarhol
const OPPOSITION: Record<GodId, GodId> = {
  mesin: 'gul', gul: 'mesin',
  klossa: 'sofiel', sofiel: 'klossa',
  marena: 'finhorn', finhorn: 'marena',
  ara: 'azorius', azorius: 'ara',
  beroan: 'skarhol', skarhol: 'beroan',
};
```

### Symbol Table

```typescript
// data/symbols.ts — all 30 symbols from scope.md
const SYMBOLS: Symbol[] = [
  { id: 1,  glyph: '♪', name: "Mesin's Spark",      element: 'life',  god: 'mesin',   strength: 'weak',   color: '#7EC87E' },
  { id: 2,  glyph: '☼', name: 'The Rising Breath',   element: 'life',  god: 'mesin',   strength: 'mid',    color: '#7EC87E' },
  { id: 3,  glyph: '♫', name: 'Staff of Living',     element: 'life',  god: 'mesin',   strength: 'strong', color: '#7EC87E' },
  // ... all 30, directly transcribed from scope.md
];
```

---

## 11. Save System

### Auto-save triggers

- After every action dispatch (the game is action-based, so this is after every player decision)
- On `visibilitychange` (tab backgrounding)
- On `beforeunload`

### Save format

```typescript
interface SaveData {
  version: number;       // schema version for migration
  state: GameState;
  timestamp: number;     // real-world timestamp
}
```

### Migration

Each save has a version number. On load, if the version is older than current, a chain of migration functions transforms the state forward:

```typescript
const MIGRATIONS: Record<number, (state: any) => any> = {
  2: (s) => ({ ...s, addictionNeed: 0, addictionSatisfaction: 0 }),
  3: (s) => ({ ...s, colorScheme: 'blue' }),
  // one migration per sprint that changes state shape
};
```

This is critical for a sprint-based project where state shape changes every sprint.

### Settings vs. game state

Color scheme preference is stored separately from the game save in its own localStorage key. This way the player's theme choice persists even when starting a new run.

---

## 12. RNG Strategy

The game uses a **seeded PRNG** (mulberry32) for all gameplay randomness. Benefits:

- **Reproducible bugs.** If a player reports an issue, the seed + action log can reproduce it exactly.
- **Testability.** Tests can assert on specific outcomes with known seeds.
- **Anti-save-scum resilience.** The seed advances deterministically, so reloading and re-scratching produces the same result.

The seed is generated once per run and stored in `GameState`. All random calls go through a central `rng(state)` function that advances the seed.

```typescript
// util/rng.ts
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
```

---

## 13. Sprint Alignment

The architecture is designed so that each sprint adds code in isolated areas without restructuring existing systems.

| Sprint | What gets added | Files touched |
|--------|----------------|---------------|
| 1 | Scratch engine, bodega screen, basic state | `systems/scratch.ts`, `ui/screens/bodega.ts`, `ui/screens/scratch.ts`, `state/`, `data/tickets.ts`, `data/balance.json` |
| 2 | Time system, tower screen, travel | `engine/time.ts`, `systems/travel.ts`, `ui/screens/tower.ts` |
| 3 | Rent check, game over screen | `systems/rent.ts`, `ui/screens/game-over.ts` |
| 4 | Neighborhood data, travel UI | `data/neighborhoods.ts`, `ui/screens/neighborhood.ts` |
| 5 | Chill system, HUD bar | `systems/chill.ts`, `ui/hud.ts` |
| 6 | Mana system | `systems/mana.ts` |
| 7 | Inventory, food data | `systems/inventory.ts`, `data/food.ts` |
| 8 | Stats display | Extend `state/types.ts`, UI stat block |
| 9 | Affinity system, temple screen | `systems/affinity.ts`, `data/gods.ts`, `ui/screens/temple.ts` |
| 10 | Wire affinity into scratch payouts | Modify `systems/scratch.ts` |
| 11 | Strong month logic | Modify `systems/affinity.ts` |
| 12 | Passive decay | Modify `systems/affinity.ts` |
| 13 | Tower furniture, furniture store | `data/furniture.ts`, `ui/screens/furniture-store.ts` |
| 14 | Spellbook, university | `systems/spellbook.ts`, `ui/screens/university.ts` |
| 15 | First spells with effects | `data/spells.ts`, extend `systems/spellbook.ts` |
| 16 | Spell scrolls | Extend `systems/inventory.ts` |
| 17 | Addiction mechanic | `systems/addiction.ts` |
| 18 | Aging system | `systems/aging.ts` |
| 19 | Crystal ball UI | Extend `ui/screens/tower.ts` |
| 20 | Project system | `systems/projects.ts` |
| 21 | Monument donations | Extend `systems/affinity.ts` |
| 22 | Dad's house | New location screen, extend events |
| 23 | Random events | `systems/events.ts` |
| 24 | Neighborhood god strength | Extend `data/neighborhoods.ts`, `systems/scratch.ts` |
| 25 | University bar | New location screen |
| 26 | Legacy screen | `ui/screens/legacy.ts` |
| 27 | Color scheme toggle | `ui/theme.ts` |

No sprint requires restructuring a previous sprint's code — only extending it.

---

## 14. Testing Strategy

### Unit tests (Vitest)

Pure system functions are the primary test target:

- **Scratch engine:** Given a seed, ticket type, and affinity map, assert correct payout and match detection.
- **Affinity math:** Donation to god X increases X, decreases opposed god Y. Strong month doubles gains. Opposition circle produces correct pairings.
- **Time snapping:** Assert all edge cases for :15 snap behavior, scratch session timing (15s/ticket, 1 min minimum, round up).
- **Chill/Mana:** Decay rates, regen on sleep, passout penalties per neighborhood.
- **Rent:** Game over triggers on day 1 with insufficient cash.
- **Ticket type validation:** Each ticket type's payout table produces the expected EV given its cost.

### Integration tests

Simulate multi-action game sequences: wake up, travel, buy tickets, scratch, travel home, sleep. Assert state is consistent after a full day cycle.

### No E2E tests at launch

The UI is simple enough that manual testing during sprint development is sufficient. E2E can be added if the UI grows complex.

---

## 15. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| State shape changes break saves | Players lose progress | Versioned save format with migration chain (Section 11) |
| Time system bugs (snapping, curfew) | Game logic breaks | Extensive unit tests for time module; fuzz test with random action sequences |
| Affinity math imbalance | Game too easy/hard | All tuning constants in `balance.json`; tweak without code changes |
| Ticket EV imbalance | Game unwinnable or trivial | Unit tests validate EV per ticket type; balance.json tuning |
| DOM rendering too slow on low-end mobile | UI lag during scratch sessions | Scratch screen updates individual cells (no full re-render); profile early |
| Scope creep within sprints | Sprints take too long | Architecture enforces clear module boundaries; each sprint touches isolated files |
| localStorage quota exceeded | Save fails silently | Monitor save size; compress if needed (unlikely with text-only state) |
| Tap fatigue on large scratch sessions | Player frustration | Intentional design — spell system provides QoL upgrades as progression |

---

## 16. Resolved Design Decisions

These were resolved during architecture review and are now final:

1. **Time model:** Action-based, not real-time. The clock advances only when the player takes an action. No game loop interval, no idle handling, no game speed setting.

2. **Scratch reveal:** Tap-to-reveal with Unicode degradation (`█ → ▓ → ▒ → ░ → glyph`). Four taps per cell. No "Scratch All" button — tedium is intentional and improved by spells.

3. **Ticket formats:** Multiple distinct formats per price tier (grid match, row match, bingo-style, etc.). Each ticket type is a data definition. Stores stock subsets of available types.

4. **Ticket economics:** All tickets have negative base EV. God affinity bonuses are the mechanism that pushes specific tickets into positive EV territory. This makes the god system the core economic engine.

5. **Tuning values:** All gameplay-affecting numbers live in `data/balance.json`. Human-readable, easy to tweak without code changes.

6. **Starting values:** $250 cash, $100/month rent, start in The Skids. All tunable in balance.json.

7. **Day cycle:** Wake at 10:00 AM, curfew at 2:00 AM. 16 waking hours per day.

8. **Passout penalties:** Per-neighborhood cash penalties and chill/mana restoration ratios. All in balance.json.

9. **Color schemes:** Three retro computing themes — DOS Blue/Cyan, Terminal Green on Black, Amber on Black. Toggle persists in localStorage separately from game save.
