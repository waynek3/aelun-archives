# Chill Scratch-Off Wizard Simulator

A mobile-first browser game. You are Chill Wizard — a slacker mage who refuses to work and survives entirely on scratch-off lottery tickets. Score-based survival game with no win condition. The game ends when you can't pay rent or die of old age.

## Project Docs

Before starting any sprint, read the relevant docs:

- `scope.md` — full game design spec; source of truth for all mechanics, systems, and content (root of repo)
- `sprints.md` — sprint list; each sprint delivers exactly one new playable feature (root of repo)
- `docs/architecture.md` — technical architecture, state shape, system design, file structure

Always read `scope.md` before implementing any mechanic. If something isn't in scope.md, ask before building it.

## Implementation Notes (for sprint continuity)

### Save System
- Current `SAVE_VERSION`: 4 (as of Sprint 5)
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
- Uses per-neighborhood entries from `balance.passout` with `cashPenalty`, `chillRestore`
- Sprint 6 should add `manaRestore` wiring in the same function (entries already in balance.json)

### Chill Meter (Sprint 5)
- `chill` field on GameState, starts at 50, floor 0, no hard cap
- Decreases on scratch losses, increases on scratch wins (both in `scratchCell()`)
- Set to `chillRestore * 100` on passout
- No passive time-based decay, no sleep restore, no snack/bong restore yet

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
