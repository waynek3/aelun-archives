# Chill Scratch-Off Wizard Simulator

A mobile-first browser game. You are Chill Wizard — a slacker mage who refuses to work and survives entirely on scratch-off lottery tickets. Score-based survival game with no win condition. The game ends when you can't pay rent or die of old age.

## Project Docs

Before starting any sprint, read the relevant docs:

- `docs/scope.md` — full game design spec; source of truth for all mechanics, systems, and content
- `docs/sprints.md` — sprint list; each sprint delivers exactly one new playable feature
- `docs/architecture.md` — technical architecture, state shape, system design, file structure

Always read `scope.md` before implementing any mechanic. If something isn't in scope.md, ask before building it.

## Implementation Notes (for sprint continuity)

### Save System
- Current `SAVE_VERSION`: 6 (as of Sprint 7)
- Migrations are in `src/state/save.ts`, keyed by source version (e.g. `3:` migrates v3→v4)
- Every sprint that adds fields to `GameState` must bump `SAVE_VERSION` in `src/state/initial.ts` and add a migration

### State & Systems Pattern
- All game state lives in the flat `GameState` interface in `src/state/types.ts`
- Systems are pure functions in `src/systems/*.ts` — no side effects, no held state
- Action dispatch flows through `src/engine/dispatch.ts` → systems → `src/ui/renderer.ts`
- `src/data/balance.json` holds all tuning constants — never hardcode gameplay numbers in code

### HUD Layout
- HUD is two rows: Row 1 = cash/clock/date, Row 2 = meter bars (chill, future: mana)
- CSS class `.hud-row` for the info row, `.hud-bars` for the meters row
- Use `progressBar()` from `src/util/format.ts` for all text-based bars

### Passout System
- `applyPassout()` in `src/engine/time.ts` handles all passout effects
- Uses per-neighborhood entries from `balance.passout` with `cashPenalty`, `chillRestore`, `manaRestore`
- Chill set to `chillRestore * 100`, mana set to `manaRestore * maxMana`

### Chill Meter (Sprint 5+)
- `chill` field on GameState, starts at 50, floor 0, no hard cap
- Decreases on scratch losses, increases on scratch wins (both in `scratchCell()`)
- Set to `chillRestore * 100` on passout
- Sprint 7: snacks restore chill via `CONSUME_SNACK` action (amounts in `balance.snacks.chillRestore`)
- No passive time-based decay, no sleep restore, no bong restore yet

### Mana Pool (Sprint 6)
- `mana` and `maxMana` fields on GameState, starts at 20/30
- Restores on sleep by flat `balance.mana.sleepManaRestore` (15), capped at maxMana
- Set to `manaRestore * maxMana` on passout (per-neighborhood ratios in balance.passout)
- No spells, no mana spending yet — resource pool only for Sprint 9+
- Pure functions in `src/systems/mana.ts`: `applyManaSpend()`, `applyManaRestore()`

### Inventory & Snacks (Sprint 7)
- `inventory` field on GameState: `(InventoryItem | null)[]`, length 5
- Pure functions in `src/systems/inventory.ts`: `freeSlots()`, `addItem()`, `removeItem()`, `addMultipleItems()`
- Snack definitions in `src/data/food.ts` with 6 descriptors: greasy, salty, sugary, bland, healthy, gourmet
- Chill restore per descriptor in `balance.snacks.chillRestore`
- `BUY_TICKETS` action extended with optional `snacks` array; `CONSUME_SNACK` action for eating
- Consuming is instant (no time cost); buying at bodega is part of the store visit
- Inventory panel (`makeInventoryPanel` in `components.ts`) shown on tower and bodega screens
- No item stacking, no health/aging impact yet (Sprint 18), no god affinities on food yet

### God Affinity & Temples (Sprint 9)
- Current `SAVE_VERSION`: 8
- `affinity: Record<GodId, number>` and `prayerBuffs: PrayerBuff[]` fields on GameState
- 10 gods defined in `src/data/gods.ts` with opposition circle (`OPPOSITION` record)
- 10 temple locations (1 per god) across 6 neighborhoods in `src/data/locations.ts`
- `LocationType` now includes `'temple'`; `LocationData` has optional `godId` for temples
- Pure functions in `src/systems/affinity.ts`: `applyDonation()`, `hasPrayerBuff()`, `pruneExpiredBuffs()`, `createPrayerBuff()`
- Donation math: `gain = amount * scaleFactor * donationTypeMultiplier`; opposed god loses same amount; prayer buffs modify gain (2x) and loss (0.5x)
- Prayer advances clock, restores mana (`balance.prayer.manaRestorePerQuarter` per 15 min), creates timed buff
- Actions: `DONATE_PRIVATE`, `DONATE_PUBLIC`, `PRAY` — god inferred from `state.currentLocation`
- Temple screen in `src/ui/screens/temple.ts`; tower/bodega travel sections include temple buttons
- No affinity effects on scratchers yet (Sprint 10), no strong month multipliers (Sprint 11), no passive decay (Sprint 12)

## Stack

- Mobile-first browser game (no native app)
- No backend required at this stage
- No AI-generated text or art — ever
- No external assets; all visuals are text/Unicode glyphs only (CP437 / BMP only — see scope.md Symbol Set)

## Key Rules

- **One sprint at a time.** Never implement features from a future sprint.
- **No numbers in the UI** except money, clock, and calendar. Progress bars show bars, not values. Chill shows as a % bar only. True stat values are hidden behind Crystal Ball spells.
- **All tasks snap to :15 increments** (:00, :15, :30, :45) except scratch sessions, which use their own timing (15s/ticket, 1 min minimum, then snap).
- **No art.** If a feature seems to need an image, find a CP437/Unicode glyph solution instead.
- **Consult scope.md for all god affinity math, symbol assignments, and opposition circle logic** before implementing any of those systems.

## Style

EGA aesthetic. Two color schemes toggleable by the player: blue/cyan and green/orange. Keep UI minimal and text-driven. All menus are consistent per location type regardless of neighborhood.

## When in Doubt

Check `scope.md` first. If it's not there, ask.
