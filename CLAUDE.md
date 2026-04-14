# Chill Scratch-Off Wizard Simulator

A mobile-first browser game. You are Chill Wizard — a slacker mage who refuses to work and survives entirely on scratch-off lottery tickets. Score-based survival game with no win condition. The game ends when you can't pay rent or die of old age.

## Project Docs

Before starting any sprint, read the relevant docs:

- `docs/scope.md` — full game design spec; source of truth for all mechanics, systems, and content
- `docs/sprints.md` — sprint list; each sprint delivers exactly one new playable feature
- `docs/architecture.md` — technical architecture, state shape, system design, file structure

Always read `scope.md` before implementing any mechanic. If something isn't in scope.md, ask before building it.

## Implementation Notes (for sprint continuity)

### Balance Data Access
- All tuning constants live in `src/data/balance.json`
- **Always import `bal` from `src/data/balance-types.ts`** — never import `balance.json` directly
- `balance-types.ts` provides full TypeScript type safety via the `BalanceData` interface
- To add a new balance field: add the interface field in `balance-types.ts`, add the value in `balance.json`

### Save System
- Current `SAVE_VERSION`: 18 (in `src/state/initial.ts`)
- Migrations are in `src/state/save.ts`, keyed by source version (e.g. `3:` migrates v3→v4)
- Every sprint that adds fields to `GameState` must bump `SAVE_VERSION` in `src/state/initial.ts` and add a migration
- Update the SAVE_VERSION assertion in test files when bumping

### State & Systems Pattern
- All game state lives in the flat `GameState` interface in `src/state/types.ts`
- Systems are pure functions in `src/systems/*.ts` — no side effects, no held state
- Action dispatch flows through `src/engine/dispatch.ts` → systems → `src/ui/renderer.ts`
- See the guide comment at the top of `dispatch.ts` for how to add new actions

### Calendar & Time Constants
- Shared constants in `src/engine/time.ts`: `MINUTES_PER_QUARTER`, `MINUTES_PER_DAY`, `DAYS_PER_MONTH`, `MONTHS_PER_YEAR`, `DAYS_PER_YEAR`
- Use `toTotalMinutes()` from `src/engine/time.ts` for all timestamp comparisons (never reimplement inline)
- Use `advanceClock()` for all clock advancement; it handles :15 snapping automatically

### HUD Layout
- HUD is two rows: Row 1 = cash/clock/date, Row 2 = meter bars (chill, mana)
- CSS class `.hud-row` for the info row, `.hud-bars` for the meters row
- Use `progressBar()` from `src/util/format.ts` for all text-based bars

### DOM Rendering
- All screen render functions use `container.replaceChildren()` to clear content (never `innerHTML = ''`)
- All DOM creation uses `createElement` + `textContent` — no innerHTML string injection
- HUD uses `el.replaceChildren(row1, row2)` for atomic updates

### Passout System
- `applyPassout()` in `src/engine/time.ts` handles all passout effects
- Uses per-neighborhood entries from `bal.passout` with `cashPenalty`, `chillRestore`, `manaRestore`
- Chill set to `chillRestore * 100`, mana set to `manaRestore * maxMana`

### Chill Meter (Sprint 5+)
- `chill` field on GameState, starts at 50, floor 0, no hard cap
- Decreases on scratch losses, increases on scratch wins (both in `scratchCell()`)
- Set to `chillRestore * 100` on passout
- Sprint 7: snacks restore chill via `CONSUME_SNACK` action (amounts in `bal.snacks.chillRestore`)
- Sprint 13: bong restores chill (`bal.chill.bongRestoreAmount`)

### Mana Pool (Sprint 6)
- `mana` and `maxMana` fields on GameState, starts at 20/30
- Restores on sleep based on bed quality (`bal.furniture.beds[bedId]`), capped at maxMana
- Set to `manaRestore * maxMana` on passout (per-neighborhood ratios in `bal.passout`)
- Pure functions in `src/systems/mana.ts`: `applyManaSpend()`, `applyManaRestore()`

### Inventory & Snacks (Sprint 7)
- `inventory` field on GameState: `(InventoryItem | null)[]`, length 5
- Pure functions in `src/systems/inventory.ts`: `freeSlots()`, `addItem()`, `removeItem()`, `addMultipleItems()`
- Snack definitions in `src/data/food.ts` with 6 descriptors: greasy, salty, sugary, bland, healthy, gourmet
- Chill restore per descriptor in `bal.snacks.chillRestore`
- Shared helper `addSnacksToInventory()` in `dispatch.ts` handles snack→inventory conversion (used by BUY_TICKETS and ORDER_DRINK)

### God Affinity & Temples (Sprint 9+)
- `affinity: Record<GodId, number>` and `prayerBuffs: PrayerBuff[]` fields on GameState
- 10 gods defined in `src/data/gods.ts` with opposition circle (`OPPOSITION` record)
- 10 temple locations (1 per god) across 6 neighborhoods in `src/data/locations.ts`
- Pure functions in `src/systems/affinity.ts`: `applyDonation()`, `hasPrayerBuff()`, `pruneExpiredBuffs()`, `createPrayerBuff()`, `applyAffinityDecay()`
- `addMinutesToTimestamp()` exported from `affinity.ts` for prayer buff expiry calculation
- Sprint 12: `applyAffinityDecay()` called daily during SLEEP action
- Sprint 24: neighborhood dominant gods boost affinity gain and symbol frequency

### Wizard Tower & Furniture (Sprint 13)
- `furniture: FurnitureItem[]` field on GameState (max 10 slots, from `bal.furniture.maxSlots`)
- `FurnitureType = 'bed' | 'lab_table' | 'bong' | 'crystal_ball'`
- Furniture catalog in `src/data/furniture.ts`: 3 bed tiers, 1 lab table, 1 bong, 1 crystal ball
- Pure functions in `src/systems/furniture.ts`: `getBed()`, `addFurniture()`, `removeFurniture()`, `replaceBed()`, `findBong()`, `hasLabTable()`, `hasCrystalBall()`
- Bed quality determines sleep mana/chill restore (values in `bal.furniture.beds[bedId]`)
- Bong restores chill with break chance; broken bong triggers `bong_breaks` random event (Sprint 23)
- Tower starts with one basic Bed ("Dusty Mattress", quality 1)

### Spellbook & Casting (Sprint 14-16)
- `knownSpells: string[]`, `equippedSpells: string[]`, `luckBuff: LuckBuff | null`
- 11 spells in `src/data/spells.ts` across 7 categories
- Per-spell balance data in `bal.spells` (typed via `SpellBalance` interface)
- Misfire chance: `baseMisfireChance + max(0, 50 − chill) × chillMisfireScaling` (in `calcMisfireChance()`)
- `applySpellEffect()` in `dispatch.ts` handles all spell effects by category
- Sprint 22: spellbook locked as loan collateral (`isSpellbookLocked()` in `loan.ts`)

### Addiction (Sprint 17)
- `addictionNeed` and `addictionSatisfaction` hidden stats on GameState
- Grows on ticket purchase, satisfaction on session finish (in `src/systems/addiction.ts`)
- Affects `restingRelaxation` via `computeRestingRelaxation()`

### Crystal Ball & Hidden Stats (Sprint 19)
- `crystalBallReveal` transient field cleared on every action in `dispatch.ts`
- `USE_CRYSTAL_BALL` action gate-checks via `knownSpells` (learning is the gate)
- Three reveal spells: `true_sight` (Chill), `inner_eye` (Addiction), `vital_scan` (Age Health)
- Mana cost from `bal.crystalBall.revealManaCost`

### Wizard Projects (Sprint 20-21)
- `activeProject: ProjectState | null` on GameState
- Project definitions in `src/data/projects.ts`, balance in `bal.projects`
- Pure functions in `src/systems/projects.ts`: `startProject()`, `workOnProject()`, `cancelProject()`, `collectProject()`

### Dad's House & Loans (Sprint 22)
- `dadAlive`, `loan: LoanState | null` on GameState
- Loan system in `src/systems/loan.ts`: `takeLoan()`, `repayLoan()`, `accrueInterest()`
- Balance in `bal.dadsHouse`

### Random Events (Sprint 23)
- 12 events in `src/data/events.ts`, balance in `bal.randomEvents`
- Pure functions in `src/systems/events.ts`: `checkForEvent()`, `createActiveEvent()`, `resolveEvent()`
- Events trigger after most actions when in 'playing' phase
- Loan shark debt tracked separately: `loanSharkDebt`, `loanSharkInterestRate`

### Bar (Sprint 25)
- Drink definitions in `src/data/drinks.ts`, balance in `bal.bar.drinks`
- `ORDER_DRINK` action supports optional snack purchase (uses shared `addSnacksToInventory()`)

## Stack

- Mobile-first browser game (no native app)
- TypeScript + Vite, Vitest for testing, ESLint for linting
- No backend required at this stage
- No AI-generated text or art — ever
- No external assets; all visuals are text/Unicode glyphs only (CP437 / BMP only — see scope.md Symbol Set)

## Key Rules

- **One sprint at a time.** Never implement features from a future sprint.
- **No numbers in the UI** except money, clock, and calendar. Progress bars show bars, not values. Chill shows as a % bar only. True stat values are hidden behind Crystal Ball spells.
- **All tasks snap to :15 increments** (:00, :15, :30, :45) except scratch sessions, which use their own timing (15s/ticket, 1 min minimum, then snap).
- **No art.** If a feature seems to need an image, find a CP437/Unicode glyph solution instead.
- **Consult scope.md for all god affinity math, symbol assignments, and opposition circle logic** before implementing any of those systems.
- **Use `bal` from `balance-types.ts`** for all balance data access. Never import `balance.json` directly.
- **Use `toTotalMinutes()` from `time.ts`** for timestamp comparisons. Never reimplement locally.
- **Use `container.replaceChildren()`** to clear DOM elements. Never use `innerHTML = ''`.
- **Independently diagnose bugs before fixing.** When a user reports a visual or behavioral bug, read the relevant code first and derive your own root cause. Do not treat the user's description as a technical diagnosis — they describe symptoms, not causes.

## Style

EGA aesthetic. Two color schemes toggleable by the player: blue/cyan and green/orange. Keep UI minimal and text-driven. All menus are consistent per location type regardless of neighborhood.

## When in Doubt

Check `scope.md` first. If it's not there, ask.
