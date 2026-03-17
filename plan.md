# Sprint 22: Dad's House — Implementation Plan

## Summary

Add Dad's House as a new location type in Richville. The player can visit Dad to take out a loan (one at a time), repay loans voluntarily, and manage the spellbook-as-collateral mechanic. Interest accrues monthly on rent day. A `dadAlive` flag enables the future "Dad Dies" Random Event (Sprint 23) that converts the location to Dad's Grave (visiting grants mana, reduces chill).

---

## Design Decisions (from user input)

- **Repayment**: Voluntary — player visits Dad's House and chooses to repay any amount. Interest accrues monthly on rent day. No forced due date, no game-over on default. Debt just grows.
- **Loan count**: One loan at a time. Must repay current loan before taking another.
- **Collateral**: Large loans lock spellbook access (no add/remove/cast equipped spells) until repaid.

---

## Step-by-step Plan

### Step 1: State & Types (`src/state/types.ts`)

Add to `LocationId` union:
```
| 'richville_dads_house'   // Sprint 22
```

Add loan state fields to `GameState`:
```typescript
// ── Dad's House & Loans (Sprint 22+) ──
dadAlive: boolean;                  // true until "Dad Dies" event (Sprint 23)
loan: {
  principal: number;                // remaining principal owed
  interestRate: number;             // monthly rate (decimal, e.g. 0.10 = 10%)
  collateral: boolean;              // true if spellbook is held as collateral
} | null;                           // null = no active loan
```

### Step 2: Balance Config (`src/data/balance.json`)

Add `dadsHouse` section:
```json
"dadsHouse": {
  "loanAmounts": [50, 100, 200, 500],
  "collateralThreshold": 200,
  "repaymentAmounts": [25, 50, 100, 250, 500],
  "baseInterestRate": 0.15,
  "fameInterestReduction": 0.002,
  "minInterestRate": 0.05,
  "baseLoanCap": 200,
  "fameCapBonus": 5,
  "maxLoanCap": 1000,
  "visitTimeCost": 15,
  "graveManaRestore": 8,
  "graveChillLoss": 10
}
```

Interest rate formula: `max(minInterestRate, baseInterestRate - wizardFame * fameInterestReduction)`
Loan cap formula: `min(maxLoanCap, baseLoanCap + wizardFame * fameCapBonus)`

### Step 3: Location Data (`src/data/locations.ts`)

- Add `'dads_house'` to `LocationType`
- Add location entry:
  ```typescript
  { id: 'richville_dads_house', neighborhood: 'richville', type: 'dads_house', displayName: "DAD'S HOUSE" }
  ```
- Add helper: `getNeighborhoodDadsHouse(neighborhoodId): LocationId | null` (returns the location only for richville)
- Keep one location ID; check `state.dadAlive` in screen renderer to show either Dad's House UI or Dad's Grave UI.

### Step 4: Loan System (`src/systems/loan.ts`)

Pure functions:
```typescript
calculateLoanCap(wizardFame: number): number
calculateInterestRate(wizardFame: number): number
takeLoan(state: GameState, amount: number): GameState | null  // null = invalid
repayLoan(state: GameState, amount: number): GameState | null
accrueInterest(state: GameState): GameState  // called on rent day
isSpellbookLocked(state: GameState): boolean  // true if collateral loan active
```

### Step 5: Actions (`src/engine/actions.ts`)

Add:
```typescript
// Sprint 22: Dad's House loan actions.
| { type: 'TAKE_LOAN'; amount: number }
| { type: 'REPAY_LOAN'; amount: number }
| { type: 'VISIT_GRAVE' }    // mana up, chill down
```

### Step 6: Dispatch (`src/engine/dispatch.ts`)

Add handlers for:
- `TAKE_LOAN`: validate at dads_house, dadAlive, no existing loan, amount <= cap, amount <= available amounts. Create loan, add cash, check collateral threshold, lock spellbook if needed. Advance clock by visitTimeCost.
- `REPAY_LOAN`: validate at dads_house, dadAlive, has active loan. Deduct cash (min of repay amount and remaining principal). If fully repaid, clear loan and unlock spellbook.
- `VISIT_GRAVE`: validate at dads_house, !dadAlive. Apply mana restore and chill loss. Advance clock by visitTimeCost.

Modify rent processing: In `checkRent()` (or in the SLEEP/WAKE_UP handlers after checkRent), call `accrueInterest()` on rent day to compound interest onto principal.

Add spellbook lock guards: In `CAST_SPELL`, `ADD_SPELL_TO_BOOK`, `REMOVE_SPELL_FROM_BOOK` handlers, check `isSpellbookLocked(state)` and return state unchanged if locked.

### Step 7: Save Migration (`src/state/save.ts`, `src/state/initial.ts`)

- Bump `SAVE_VERSION` from 15 to 16
- Add migration `15:` that adds `dadAlive: true, loan: null`
- Update `createInitialState()` with `dadAlive: true, loan: null`

### Step 8: Dad's House Screen (`src/ui/screens/dads-house.ts`)

New file following the temple screen pattern.

**When dadAlive = true (Dad's House):**
- Header: "DAD'S HOUSE"
- Subtitle: "Your father lives here. He is disappointed in you."
- Cash display
- If no active loan:
  - TAKE OUT LOAN section
  - Show available loan amounts (up to loan cap), each as a button: `BORROW $X (Y% monthly)`
  - Note: amounts above collateral threshold show `[SPELLBOOK COLLATERAL]`
- If active loan:
  - OUTSTANDING LOAN section showing principal remaining
  - If collateral: warning `Dad is holding your spellbook.`
  - REPAY section with repayment amount buttons (capped at principal and cash)
- Inventory panel
- Travel section (standard pattern)

**When dadAlive = false (Dad's Grave):**
- Header: "DAD'S GRAVE"
- Subtitle: "He's gone. You feel something."
- [VISIT GRAVE] button — restores mana, reduces chill
- Travel section

### Step 9: Renderer (`src/ui/renderer.ts`)

- Add `'dads_house'` to `ScreenId` type
- Import `renderDadsHouse`
- Add routing: `if (locType === 'dads_house') return 'dads_house';`
- Add render case for `dads_house`

### Step 10: Travel Buttons (all location screens)

Add Dad's House to the travel destination lists on all screens (temple, bodega, furniture-store, university, bookstore, scroll-store, tower). Only show for richville neighborhood. Use `getNeighborhoodDadsHouse()` helper, following the same pattern as university/bookstore (null check).

### Step 11: Tests (`test/systems/loan.test.ts`)

Test:
- Loan cap scales with wizard fame
- Interest rate scales with wizard fame
- Taking a loan adds cash, creates loan state
- Repaying reduces principal, clears loan when zero
- Interest accrual on rent day
- Collateral threshold triggers spellbook lock
- Spellbook unlock on full repayment
- Cannot take second loan while one is active
- Cannot borrow above cap

### Step 12: Build & Verify

- Run `npm run build` to verify no type errors
- Run `npm test` to verify no regressions

---

## Files Modified

| File | Change |
|------|--------|
| `src/state/types.ts` | Add `LocationId`, loan fields to `GameState` |
| `src/state/initial.ts` | Bump SAVE_VERSION, add initial loan fields |
| `src/state/save.ts` | Add migration 15→16 |
| `src/data/balance.json` | Add `dadsHouse` section |
| `src/data/locations.ts` | Add `dads_house` type, location entry, helper |
| `src/engine/actions.ts` | Add `TAKE_LOAN`, `REPAY_LOAN`, `VISIT_GRAVE` |
| `src/engine/dispatch.ts` | Handle new actions, spellbook lock, interest accrual |
| `src/systems/loan.ts` | **NEW** — loan pure functions |
| `src/ui/screens/dads-house.ts` | **NEW** — Dad's House / Grave screen |
| `src/ui/renderer.ts` | Route to dads_house screen |
| All location screens | Add Dad's House to travel sections |
| `src/systems/rent.ts` | Call interest accrual on rent day |
| `test/systems/loan.test.ts` | **NEW** — loan system tests |

---

## What is NOT in scope (future sprints)

- Random Event trigger logic for "Dad Dies" (Sprint 23 — we only add the `dadAlive` flag and grave rendering)
- Bong break Random Event (Sprint 23)
- Any other Random Events (Sprint 23)
- Loan Shark (Sprint 23 Random Event)
