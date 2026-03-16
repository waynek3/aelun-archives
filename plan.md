# Sprint 18: Aging System — Implementation Plan

## What Sprint 18 Delivers
Per `sprints.md`: "Add the aging system. Wizard ages in real calendar time. Intelligence degrades slowly with age. Addiction susceptibility increases with age. Death age is determined by hidden Age Health Score (food quality, lifestyle). On death, show the legacy screen."

## What's In Scope
1. **Age tracking** — wizard has a starting age, ages as game calendar years pass
2. **Intelligence decay** — degrades slowly with age (`balance.aging.intelligenceDecayPerYear`)
3. **Addiction susceptibility** — increases with age (`balance.aging.addictionSusceptibilityPerYear`)
4. **Age Health Score** — hidden stat, starts at 100, modified by food quality (greasy/salty/sugary = bad, healthy/gourmet = good)
5. **Death age** — computed from ageHealthScore: `baseDeathAge + ageHealthScore * healthScoreDeathAgeBonus`
6. **Death check** — when wizard's age reaches deathAge, game ends
7. **Basic legacy screen** — shown on death (Sprint 26 fleshes it out later)

## What's NOT In Scope
- Slow Aging Potions (Sprint 20 — Wizard Projects)
- Crystal Ball reveal of ageHealthScore (Sprint 19)
- Full legacy screen details (Sprint 26)
- Random Events affecting ageHealthScore (Sprint 23)
- Longevity Potion (Sprint 20)

---

## Implementation Steps

### Step 1: Add balance values for aging/food health
**File:** `src/data/balance.json`
- The `aging` section already exists with correct values
- Add `healthImpact` values per food descriptor under `snacks`:
  ```json
  "snacks": {
    "chillRestore": { ... },
    "healthImpact": {
      "greasy": -1,
      "salty": -1,
      "sugary": -1,
      "bland": 0,
      "healthy": 1,
      "gourmet": 1
    }
  }
  ```

### Step 2: Add aging fields to GameState
**File:** `src/state/types.ts`
- Add `Phase` value `'legacy'` (for death screen)
- Add fields to `GameState`:
  - `startingAge: number` — age at game start (from balance, e.g. 22)
  - `ageHealthScore: number` — hidden stat tracking lifestyle impact on death age
  - `deathAge: number` — computed from ageHealthScore

### Step 3: Update initial state
**File:** `src/state/initial.ts`
- Bump `SAVE_VERSION` to 14
- Initialize new fields:
  - `startingAge: balance.starting.startingAge` (add to balance.json starting section, e.g. 22)
  - `ageHealthScore: balance.starting.ageHealthScore` (already 100 in balance)
  - `deathAge`: computed from initial ageHealthScore using the formula

### Step 4: Add save migration
**File:** `src/state/save.ts`
- Add migration `13:` → adds `startingAge`, `ageHealthScore`, `deathAge` fields to old saves

### Step 5: Create aging system
**File:** `src/systems/aging.ts` (NEW)
- Pure functions:
  - `getCurrentAge(startingAge, startYear, currentYear)` — returns current wizard age
  - `computeDeathAge(ageHealthScore)` — `baseDeathAge + ageHealthScore * healthScoreDeathAgeBonus`
  - `applyYearlyAging(state)` — called on year rollover: decay intelligence, increase addiction susceptibility
  - `applyFoodHealthImpact(ageHealthScore, descriptor)` — modifies ageHealthScore when eating
  - `checkDeath(state)` — returns true if current age >= deathAge

### Step 6: Wire food health impact into CONSUME_SNACK
**File:** `src/engine/dispatch.ts`
- In the `CONSUME_SNACK` handler, after applying chill restore, also apply `applyFoodHealthImpact()` to ageHealthScore and recompute deathAge

### Step 7: Wire yearly aging into SLEEP action
**File:** `src/engine/dispatch.ts`
- In the `SLEEP` handler (and passout `WAKE_UP`), after `advanceDay()`, check if the year rolled over
- If year changed: apply `applyYearlyAging()` (intelligence decay + addiction susceptibility)
- After any day advance, run `checkDeath()` — if dead, set `phase: 'legacy'`

### Step 8: Create basic legacy screen
**File:** `src/ui/screens/legacy.ts` (NEW)
- Basic death screen showing:
  - "You lived to age X"
  - Days survived
  - Best single win
  - Total tickets scratched
  - Final cash
  - "New Game" button
- Minimal for now — Sprint 26 fleshes it out

### Step 9: Wire legacy screen into renderer
**File:** `src/ui/renderer.ts`
- Add case for `phase === 'legacy'` to render the legacy screen

### Step 10: Wire addiction susceptibility modifier
**File:** `src/systems/addiction.ts`
- Modify `growNeed()` to accept an age susceptibility modifier
- Or: apply the modifier in dispatch when calling `growNeed()`
- The aging system provides a multiplier: `1 + (yearsOld * addictionSusceptibilityPerYear)`

### Step 11: Add tests
**File:** `test/systems/aging.test.ts` (NEW)
- Test `getCurrentAge()` computation
- Test `computeDeathAge()` formula
- Test `applyYearlyAging()` intelligence decay
- Test `applyFoodHealthImpact()` with each descriptor
- Test `checkDeath()` boundary conditions

---

## Key Design Decisions

1. **Starting age**: 22 (wizard lost his scholarship — college age). Stored in balance.json.
2. **Age computation**: `startingAge + (currentYear - 1)` since game starts at year 1.
3. **Yearly aging trigger**: On day advancing from year N to year N+1 (during sleep or passout wake).
4. **Death check location**: After every day advance (sleep and passout), since that's when calendar progresses.
5. **Food health impact**: Applied instantly on snack consumption, same as chill restore.
6. **Addiction susceptibility**: Applied as a multiplier on need growth, not as a separate stat field. The multiplier is computed from current age on the fly.
