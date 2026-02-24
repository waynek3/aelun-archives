# Chill Scratch-Off Wizard Simulator

A mobile-first browser game. You are Chill Wizard — a slacker mage who refuses to work and survives entirely on scratch-off lottery tickets. Score-based survival game with no win condition. The game ends when you can't pay rent or die of old age.

## Project Docs

Before starting any sprint, read the relevant docs:

- `docs/scope.md` — full game design spec; source of truth for all mechanics, systems, and content
- `docs/sprints.md` — sprint list; each sprint delivers exactly one new playable feature

Always read `scope.md` before implementing any mechanic. If something isn't in scope.md, ask before building it.

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
