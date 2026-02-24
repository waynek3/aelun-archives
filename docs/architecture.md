# Chill Scratch-Off Wizard Simulator — Technical Architecture Proposal

---

## 1. Stack Recommendation

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language | **TypeScript** | Complex interconnected game state (10 gods, 30 symbols, hidden stats, opposition circle math) benefits heavily from static typing. Catches misconfigurations at compile time rather than at runtime mid-play. |
| Build Tool | **Vite** | Fast HMR for iterative sprint development. Zero-config TypeScript support. Produces a single optimized bundle for mobile deployment. No webpack complexity. |
| UI Framework | **None (vanilla DOM)** | The UI is text-driven menus and progress bars — no component trees, no virtual DOM diffing, no reactive templating needed. A lightweight rendering layer that writes to the DOM directly keeps the bundle small and the architecture transparent. If menu complexity grows beyond expectations, Preact (3KB) can be dropped in later without restructuring. |
| Styling | **Plain CSS with CSS custom properties** | EGA palette and the two color schemes map directly to CSS custom properties. Toggle themes by swapping a `data-theme` attribute on `<body>`. No preprocessor needed. |
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

The game is structured as a **state machine with a tick-based game loop**. All game logic operates on a single centralized state object. The UI is a thin rendering layer that reads state and dispatches player actions.

```
┌─────────────────────────────────────────────────┐
│                   Game Loop                      │
│  (requestAnimationFrame / setInterval hybrid)    │
│                                                  │
│  1. Process elapsed time                         │
│  2. Run active systems (decay, regen, aging)     │
│  3. Check triggers (events, rent, curfew)        │
│  4. Render current screen                        │
└────────────┬────────────────────┬────────────────┘
             │                    │
      ┌──────▼──────┐     ┌──────▼──────┐
      │  Game State  │     │  UI Layer   │
      │  (single     │◄────│  (reads     │
      │   object)    │     │   state,    │
      │              │────►│   dispatches│
      └──────────────┘     │   actions)  │
                           └─────────────┘
```

### Why a centralized state object

The game has deeply interconnected systems:
- Scratching a ticket touches: cash, chill, addiction (need + satisfaction), god affinity (payout multiplier), time, and potentially random events.
- Praying touches: time, mana, god affinity (timed buff), and indirectly chill.
- Sleeping touches: time, mana (bed quality), chill (bed quality), and advances the calendar (aging, rent).

A single state object avoids scattered state synchronization bugs. Every system reads from and writes to the same source of truth.

### Why NOT Redux / Zustand / signals

The game has one consumer (the renderer) and one producer (the game loop). There's no concurrent UI that needs fine-grained reactivity. A plain object with a `render()` call after each state change is sufficient and easier to debug. If this proves insufficient during development, a pub/sub layer can be added without restructuring.

---

## 3. State Shape

Top-level state structure. All fields are serializable to JSON for localStorage persistence.

```typescript
interface GameState {
  // Core
  phase: 'new_run' | 'playing' | 'game_over' | 'legacy';
  cash: number;
  rent: number;
  day: number;           // day of month (1-based)
  month: number;         // 1-12
  year: number;
  clock: number;         // minutes since midnight (0-1439)
  birthday: { day: number; month: number };

  // Location
  currentNeighborhood: NeighborhoodId;
  currentLocation: LocationId | 'traveling';
  travelTarget?: { neighborhood: NeighborhoodId; location: LocationId };
  travelEndTime?: number;

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

  // Events
  dadAlive: boolean;
  eventsTriggered: Record<string, number>;  // event id -> count
  bongBreakCount: number;

  // Meta
  totalTicketsScratched: number;
  bestSingleWin: number;
  highestFame: number;
  notableEvents: string[];

  // Settings
  colorScheme: 'blue' | 'green';
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
| **Travel** | currentNeighborhood, clock | currentLocation, clock | 2, 4 |
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

### Example: Scratch System

```typescript
// systems/scratch.ts

interface ScratchSession {
  tickets: { tier: TicketTier; count: number }[];
}

function resolveScratchSession(
  state: GameState,
  session: ScratchSession
): StateUpdate {
  const totalTickets = session.tickets.reduce((s, t) => s + t.count, 0);
  const sessionTime = Math.max(60, totalTickets * 15); // seconds
  const clockCost = snapToQuarter(Math.ceil(sessionTime / 60)); // minutes

  let cashDelta = 0;
  let chillDelta = 0;
  const results: TicketResult[] = [];

  for (const { tier, count } of session.tickets) {
    cashDelta -= tierCost(tier) * count;
    for (let i = 0; i < count; i++) {
      const result = scratchTicket(tier, state.affinity);
      results.push(result);
      cashDelta += result.payout;
      chillDelta += result.payout > 0 ? chillOnWin(result) : chillOnLoss(tier);
    }
  }

  return {
    cash: state.cash + cashDelta,
    chill: Math.max(0, state.chill + chillDelta),
    clock: state.clock + clockCost,
    totalTicketsScratched: state.totalTicketsScratched + totalTickets,
    bestSingleWin: Math.max(state.bestSingleWin, ...results.map(r => r.payout)),
    // addiction updates delegated to addiction system
    _scratchResults: results, // passed to UI for reveal animation
  };
}
```

This pattern — pure function, state in, partial state update out — applies to every system.

---

## 5. Time System Design

Time is the most cross-cutting system. It needs careful design upfront because every sprint builds on it.

```
Real time (browser)  ──►  Game tick  ──►  In-game clock (minutes)
                          (1s interval)     │
                                            ├── Task snapping (:15 increments)
                                            ├── Scratch timing (15s/ticket)
                                            ├── Passive decay/regen (per-minute rates)
                                            ├── Curfew check
                                            └── Calendar advancement (day/month/year)
```

### Tick model

The game loop runs on a **1-second real-time interval**. Each tick:

1. Advances the in-game clock by a configurable number of minutes (game speed).
2. Checks if any active timed action (scratching, traveling, praying, studying, working) has completed.
3. Runs per-minute systems: chill decay/regen, mana regen, affinity decay.
4. Checks triggers: curfew, rent day, aging threshold, event rolls.
5. Calls `render()`.

### Task snapping

All non-scratch tasks snap to :15 using:

```typescript
function snapToQuarter(minutes: number): number {
  return Math.ceil(minutes / 15) * 15;
}
```

Scratch sessions calculate raw seconds, convert to minutes, then snap.

### Idle handling

If the browser tab is backgrounded and returns, the game calculates elapsed real time and fast-forwards the game clock, running only passive systems (decay, regen) in bulk. Active player decisions are never auto-resolved.

---

## 6. UI Architecture

### Screen stack

The UI is a simple screen stack, not a router. Each screen is a function that takes state and returns DOM content.

```typescript
type Screen =
  | { type: 'new_run' }
  | { type: 'tower' }
  | { type: 'travel'; to: NeighborhoodId }
  | { type: 'neighborhood'; id: NeighborhoodId }
  | { type: 'location'; id: LocationId }
  | { type: 'scratch'; results: TicketResult[] }
  | { type: 'game_over' }
  | { type: 'legacy' };
```

### Rendering approach

Each screen exports a `render(state, container)` function that writes to a root `<div>`. On state change, the current screen's render function is called. No diffing — full replacement of the screen container's innerHTML. This is fast enough for text-only UI with no images.

### HUD

A persistent HUD bar sits above the screen area and shows:
- Cash
- Clock (HH:MM)
- Calendar (Day Month Year)
- Chill bar (percentage, no number)
- Mana bar (shows current/max)

The HUD re-renders on every tick independently of the screen.

### EGA Theme

Two themes defined as CSS custom property sets:

```css
[data-theme="blue"] {
  --bg: #0000AA;
  --fg: #55FFFF;
  --accent: #FFFFFF;
  --bar-fill: #55FFFF;
  --bar-empty: #000055;
  --warn: #FF5555;
  --muted: #555555;
}

[data-theme="green"] {
  --bg: #002200;
  --fg: #55FF55;
  --accent: #FFAA00;
  --bar-fill: #55FF55;
  --bar-empty: #003300;
  --warn: #FF5555;
  --muted: #555555;
}
```

All UI elements reference custom properties. Theme toggle swaps `data-theme` on `<body>`.

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
│   ├── main.ts                    # Entry point: init, game loop, render
│   ├── state/
│   │   ├── types.ts               # GameState, all type definitions
│   │   ├── initial.ts             # Default starting state for new run
│   │   └── save.ts                # localStorage serialize/deserialize
│   ├── engine/
│   │   ├── loop.ts                # Game loop (setInterval, tick dispatch)
│   │   ├── time.ts                # Clock advancement, calendar, snapping
│   │   └── actions.ts             # Player action dispatcher
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
│   │   ├── gods.ts                # God definitions, opposition circle
│   │   ├── symbols.ts             # 30 symbols, element/god/strength mapping
│   │   ├── neighborhoods.ts       # 6 neighborhoods, god strengths
│   │   ├── locations.ts           # Location type definitions, menus
│   │   ├── food.ts                # Snack/food definitions
│   │   ├── furniture.ts           # Furniture definitions
│   │   ├── spells.ts              # Spell bank definitions
│   │   ├── potions.ts             # Potion definitions
│   │   └── tickets.ts             # Ticket tier odds and payout tables
│   ├── ui/
│   │   ├── renderer.ts            # Core render loop, screen manager
│   │   ├── hud.ts                 # Persistent HUD bar
│   │   ├── components.ts          # Reusable: progress bars, menus, buttons
│   │   ├── screens/
│   │   │   ├── new-run.ts         # Birthday selection, new game
│   │   │   ├── tower.ts           # Wizard tower menu
│   │   │   ├── neighborhood.ts    # Neighborhood location picker
│   │   │   ├── bodega.ts          # Bodega purchase screen
│   │   │   ├── scratch.ts         # Scratch reveal screen
│   │   │   ├── temple.ts          # Temple menu (donate, pray)
│   │   │   ├── university.ts      # University class selection
│   │   │   ├── furniture-store.ts # Furniture purchase
│   │   │   ├── game-over.ts       # Eviction screen
│   │   │   └── legacy.ts          # Death summary screen
│   │   └── theme.ts               # Theme toggle logic
│   └── util/
│       ├── rng.ts                 # Seeded RNG for deterministic testing
│       └── format.ts              # Currency, time, bar rendering helpers
├── test/
│   ├── systems/
│   │   ├── scratch.test.ts
│   │   ├── affinity.test.ts
│   │   ├── chill.test.ts
│   │   └── ...
│   └── engine/
│       └── time.test.ts
├── docs/
│   └── architecture.md            # This document
├── scope.md
├── sprints.md
└── CLAUDE.md
```

---

## 8. Data Model for Static Content

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

// Opposition pairs derived from the circle
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
// data/symbols.ts
const SYMBOLS: Symbol[] = [
  { id: 1,  glyph: '♪', name: "Mesin's Spark",     unicode: 'U+266A', element: 'life',  god: 'mesin',   strength: 'weak',   color: '#7EC87E' },
  { id: 2,  glyph: '☼', name: 'The Rising Breath',  unicode: 'U+263C', element: 'life',  god: 'mesin',   strength: 'mid',    color: '#7EC87E' },
  // ... all 30 symbols
];
```

---

## 9. Scratch-Off Ticket Engine

The scratch system is the core mechanic and deserves specific architectural attention.

### Ticket generation

Each ticket tier defines:
- **Cost** ($1, $2, $5, $10, $20)
- **Grid size** (e.g., 3x3 for $1, up to 5x5 for $20)
- **Win probability** and **payout table**
- **Symbol pool** (all 30 symbols, weighted by neighborhood god strength)

A ticket is generated by:
1. Rolling against the win probability table for this tier.
2. If a win: selecting a winning symbol (weighted by neighborhood god strength), placing the required matches, filling remaining cells randomly.
3. If a loss: filling all cells randomly, verifying no accidental match (re-roll if needed).

### Payout calculation

```
base_payout = tier_payout_table[match_type]
affinity_multiplier = 1 + (affinity[symbol.god] * AFFINITY_SCALE_FACTOR)
final_payout = floor(base_payout * affinity_multiplier)
```

Where `AFFINITY_SCALE_FACTOR` is a tuning constant. Negative affinity reduces the multiplier below 1.0, penalizing payouts.

### Reveal sequence

The scratch screen reveals tickets one at a time. Each ticket shows its grid with cells initially covered (e.g., `[?]`). The player taps cells or a "Scratch All" button. This is purely presentational — the outcome is pre-determined at purchase time.

---

## 10. Save System

### Auto-save triggers

- End of each in-game day (on sleep)
- On any purchase or significant action
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
  // ...
};
```

This is critical for a sprint-based project where state shape changes every sprint.

---

## 11. RNG Strategy

The game uses a **seeded PRNG** (e.g., a simple mulberry32 or xoshiro128) for all gameplay randomness. Benefits:

- **Reproducible bugs.** If a player reports an issue, the seed + action log can reproduce it exactly.
- **Testability.** Tests can assert on specific outcomes with known seeds.
- **Anti-save-scum resilience** (optional). The seed advances deterministically, so reloading and re-scratching produces the same result.

The seed is generated once per run and stored in `GameState`. All random calls go through a central `rng(state)` function that advances the seed.

---

## 12. Sprint Alignment

The architecture is designed so that each sprint adds code in isolated areas without restructuring existing systems.

| Sprint | What gets added | Where |
|--------|----------------|-------|
| 1 | Scratch engine, bodega screen, basic state | `systems/scratch.ts`, `ui/screens/bodega.ts`, `ui/screens/scratch.ts`, `state/` |
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

## 13. Testing Strategy

### Unit tests (Vitest)

Pure system functions are the primary test target:

- **Scratch engine:** Given a seed, ticket tier, and affinity map, assert correct payout.
- **Affinity math:** Donation to god X increases X, decreases opposed god Y. Strong month doubles gains. Opposition circle produces correct pairings.
- **Time snapping:** Assert all edge cases for :15 snap behavior, scratch session timing (15s/ticket, 1 min minimum, round up).
- **Chill/Mana:** Decay rates, regen on sleep, passout penalties per neighborhood.
- **Rent:** Game over triggers on day 1 with insufficient cash.

### Integration tests

Simulate multi-turn game sequences: wake up, travel, buy tickets, scratch, travel home, sleep. Assert state is consistent after a full day cycle.

### No E2E tests at launch

The UI is simple enough that manual testing during sprint development is sufficient. E2E can be added if the UI grows complex.

---

## 14. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| State shape changes break saves | Players lose progress | Versioned save format with migration chain (Section 10) |
| Time system bugs (snapping, curfew) | Game logic breaks | Extensive unit tests for time module; fuzz test with random action sequences |
| Affinity math imbalance | Game too easy/hard | Tuning constants extracted to `data/` files; easy to adjust without code changes |
| DOM rendering too slow on low-end mobile | UI lag | Profile early. Fallback: batch DOM writes with `documentFragment`, or switch to innerHTML string building |
| Scope creep within sprints | Sprints take too long | Architecture enforces clear module boundaries; each sprint touches isolated files |
| localStorage quota exceeded | Save fails silently | Monitor save size; compress with `JSON.stringify` + `LZString` if needed (unlikely with text-only state) |

---

## 15. Open Questions

These should be resolved before or during early sprints:

1. **Game speed multiplier.** How many in-game minutes pass per real second? This determines session length. Recommendation: start at 1 real second = 1 in-game minute, tunable.
2. **Scratch reveal UX.** Tap-to-reveal individual cells, or auto-reveal with animation? The spec says "reveals each ticket one at a time" but doesn't specify cell-level interaction.
3. **Ticket grid sizes per tier.** Not specified in scope.md. Need to define grid dimensions and match-to-win rules (3-in-a-row? match-3? etc.).
4. **Payout tables.** Specific dollar amounts per tier and match type are not in scope.md. These need to be defined and balanced.
5. **Starting cash and rent amount.** Not specified. These set the initial difficulty curve.
6. **Passout cash penalties.** Scope says "~$100 in Richville, ~$20 in The Skids" — need exact values for all 6 neighborhoods.
7. **Sleep/curfew times.** What time is curfew? What time does the wizard wake up? Not specified.
