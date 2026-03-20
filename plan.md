# Sprint 23: Random Events — Implementation Plan

## Overview

Implement the Random Event system with all 12 launch events from scope.md. Events trigger based on location, affinity, Wizard Fame, and RNG. Each event presents one flavor line and three choices; outcomes modify stats.

**Dependency Note:** Sprint 22 (Dad's House) was planned but never coded — no `dadAlive` field, no Dad's House location, no loan system. Two events depend on it:
- **Dad Dies**: Will be stubbed — sets `dadAlive = false` flag and records the notable event, but doesn't convert a location (since Dad's House doesn't exist yet). Full location conversion happens when Sprint 22 is built.
- **Loan Shark**: Fully functional as a standalone event in The Skids — offers a quick-cash loan independent of the Dad's House loan system (different mechanic: brutal interest, no collateral, no Sprint 22 dependency).

---

## Step 1: State Changes

### `src/state/types.ts`

Add `'event'` to the `Phase` union:
```typescript
export type Phase = 'setup' | 'playing' | 'scratching' | 'passedout' | 'game_over' | 'event';
```

Add event-related interfaces:
```typescript
export interface ActiveEvent {
  eventId: string;
  flavor: string;
  choices: { label: string }[];
  resolved: boolean;
  outcomeText: string | null;
  choiceIndex: number | null;
}
```

Add fields to `GameState`:
```typescript
// ── Random Events (Sprint 23) ──
activeEvent: ActiveEvent | null;
dadAlive: boolean;
eventsTriggered: Record<string, number>;
notableEvents: string[];
loanSharkDebt: number;
loanSharkInterestRate: number;
lastBirthdayYear: number;
```

### `src/state/initial.ts`

Bump `SAVE_VERSION` to 16. Add defaults:
```
activeEvent: null,
dadAlive: true,
eventsTriggered: {},
notableEvents: [],
loanSharkDebt: 0,
loanSharkInterestRate: 0,
lastBirthdayYear: 0,
```

### `src/state/save.ts`

Add migration from version 15 to 16 adding all new fields with their defaults.

---

## Step 2: Balance Config (`src/data/balance.json`)

Add `randomEvents` section with tuning values for all 12 events (probabilities, stat changes, thresholds, costs).

---

## Step 3: Event Data Definitions

### New file: `src/data/events.ts`

Define all 12 events as typed data:

```typescript
export interface RandomEventDef {
  id: string;
  name: string;
  flavor: string;
  validLocationTypes: LocationType[] | 'any' | 'travel';
  validNeighborhoods?: NeighborhoodId[];
  triggerOn: 'action' | 'travel' | 'bong_break' | 'birthday';
  oneTime: boolean;
  minWizardFame?: number;
  baseProbability: number;
  choices: { label: string }[];
}
```

IDs: `birthday`, `dad_dies`, `bong_breaks`, `suspicious_clerk`, `fellow_scratcher`, `temple_judgment`, `campus_encounter`, `loan_shark`, `storm_warning`, `winning_ticket`, `wizard_fame_moment`, `bad_batch`.

---

## Step 4: Event System Logic

### New file: `src/systems/events.ts`

Pure functions:

- `checkForEvent(state, action)` — roll for eligible events after each action
- `createActiveEvent(def, state)` — build ActiveEvent from definition
- `resolveEvent(state, choiceIndex)` — apply outcome, return updated state
- Per-event resolution handlers (birthday, dadDies, bongBreaks, etc.)

**Trigger logic:**
- Birthday: triggers on first action when `month === birthdayMonth && lastBirthdayYear < year`
- Bong Breaks: triggers when USE_BONG and break roll succeeds (replaces current silent removal)
- Storm Warning: triggers on cross-neighborhood TRAVEL actions only
- Location-based events: check current location type matches event's valid locations
- One-time events: skip if `eventsTriggered[id] > 0`
- Fame-gated: skip if `wizardFame < minWizardFame`
- RNG roll against baseProbability

---

## Step 5: Actions (`src/engine/actions.ts`)

Add:
```typescript
| { type: 'RESOLVE_EVENT'; choiceIndex: number }
| { type: 'DISMISS_EVENT' }
```

---

## Step 6: Dispatch Integration (`src/engine/dispatch.ts`)

1. After every action in `applyAction`, call `checkForEvent()`. If event triggers, set `phase: 'event'` and populate `activeEvent`.

2. **Refactor USE_BONG**: Remove inline break logic. Bong still restores chill. If break roll succeeds, trigger "Bong Breaks" event instead of silent removal. Player choices determine outcome.

3. **RESOLVE_EVENT handler**: Call `resolveEvent()`, set `resolved: true`, populate `outcomeText`.

4. **DISMISS_EVENT handler**: Clear `activeEvent`, set phase back to `'playing'`, increment `eventsTriggered[id]`, optionally add to `notableEvents`.

5. **Loan shark debt**: On day rollover, if `loanSharkDebt > 0`, apply interest. On rent day, attempt collection (deduct from cash; if can't pay full amount, apply chill penalty).

---

## Step 7: Event Screen UI

### New file: `src/ui/screens/event.ts`

Modal screen when `phase === 'event'`:
- Event name header
- Flavor text
- Three choice buttons (pre-resolution)
- Outcome text + [CONTINUE] button (post-resolution)

Uses existing components: `makeHeader()`, `makeButton()`, `makeResultLine()`, `makeDivider()`.

### `src/ui/renderer.ts`

Add event phase routing and import `renderEvent`.

---

## Step 8: Bong Breaks Refactor

Current: USE_BONG rolls for break, silently removes bong.
New: USE_BONG rolls for break, triggers "Bong Breaks" event with 3 choices:
1. "Mourn it" — bong removed, chill loss
2. "Try to fix it" — 30% success; bong stays on success, removed on fail
3. "Throw it out" — bong removed, small chill gain

---

## The 12 Events — Choice/Outcome Summary

### 1. The Birthday
- **Trigger**: First action of day when month = birthdayMonth (once/year)
- **Flavor**: "It's your birthday. You don't feel any different."
- Choices: Celebrate alone (chill+) / Buy something (cash-, chill++) / Contemplate mortality (mana+)
- Bonus: Shows which god is strong this month

### 2. Dad Dies (stubbed)
- **Trigger**: Random, anywhere, one-time, after year 3
- **Flavor**: "You get a call. Your father has passed."
- Choices: Grieve (chill-, mana+) / Check the will (cash+) / "Already dead to me" (chill+)
- Effect: Sets `dadAlive = false`

### 3. The Bong Breaks
- **Trigger**: On USE_BONG when break roll succeeds
- **Flavor**: "You hear a crack."
- Choices: Mourn (chill-) / Try to fix (30% fix chance) / Throw it out (chill+)

### 4. Suspicious Clerk
- **Trigger**: Random at bodega
- **Flavor**: "The clerk is watching you very carefully today."
- Choices: Act natural (chill+) / Leave (chill-, skip buying) / Smooth talk (fame-gated, big chill+)

### 5. Fellow Scratcher
- **Trigger**: Random at bodega
- **Flavor**: "Someone else at the counter has a handful of tickets."
- Choices: Chat (chill+) / Ignore (find cash) / Share tips (random god affinity+)

### 6. Temple Judgment
- **Trigger**: Random at temple
- **Flavor**: "A priest looks at you like they know something."
- Choices: Confess (affinity+ with temple god) / Deny (chill-, affinity-) / Laugh (fame+)

### 7. Campus Encounter
- **Trigger**: Random at university/bookstore
- **Flavor**: "Someone recognizes you from your scholarship days."
- Choices: Brag (fame+) / Hide (no effect) / Catch up (chill+, fame+)

### 8. Loan Shark
- **Trigger**: Random at The Skids locations
- **Flavor**: "A person in a very nice coat offers you money."
- Choices: Take loan (cash+, debt) / Decline (chill+) / Tell them off (chill-)

### 9. Storm Warning
- **Trigger**: Random on cross-neighborhood TRAVEL
- **Flavor**: "The sky looks wrong."
- Choices: Push through (extra time, chill-) / Shelter (more time, chill+) / Turn back (cancel travel)

### 10. The Winning Ticket
- **Trigger**: Random at bodega
- **Flavor**: "Someone just won big. You watched it happen."
- Choices: Cheer (chill+) / Seethe (chill-, addiction+) / Ask for cut (cash+)

### 11. Wizard Fame Moment
- **Trigger**: Random at Center City/Downtown/Richville, fame >= 10
- **Flavor**: "Someone knows who you are."
- Choices: Embrace (fame+, chill+) / Deny (fame-) / Exploit (cash+, fame-)

### 12. The Bad Batch
- **Trigger**: Random at bodega (before scratching)
- **Flavor**: "These tickets feel different."
- Choices: Scratch anyway (odds penalty, chill-) / Swap (time cost) / Leave (chill-)

---

## Files Changed

| File | Change |
|------|--------|
| `src/state/types.ts` | Add `'event'` phase, `ActiveEvent` interface, 7 new GameState fields |
| `src/state/initial.ts` | Bump SAVE_VERSION to 16, add defaults |
| `src/state/save.ts` | Add v15→v16 migration |
| `src/data/events.ts` | **NEW** — 12 event definitions |
| `src/data/balance.json` | Add `randomEvents` section |
| `src/systems/events.ts` | **NEW** — trigger checking + resolution logic |
| `src/engine/actions.ts` | Add `RESOLVE_EVENT`, `DISMISS_EVENT` |
| `src/engine/dispatch.ts` | Wire event checking, handle event actions, refactor USE_BONG |
| `src/ui/screens/event.ts` | **NEW** — event modal screen |
| `src/ui/renderer.ts` | Add event phase routing |
| `src/engine/time.ts` | Loan shark interest on day rollover |

---

## Implementation Order

1. Types & State (types.ts, initial.ts, save.ts)
2. Balance config (balance.json)
3. Event data definitions (src/data/events.ts)
4. Event system logic (src/systems/events.ts)
5. Actions (actions.ts)
6. Dispatch integration (dispatch.ts) + USE_BONG refactor
7. Event screen UI (src/ui/screens/event.ts)
8. Renderer routing (renderer.ts)
9. Loan shark debt collection (time.ts)
10. Build & test

---

## Remaining Sprints After Sprint 23

**4 sprints remain** (24–27):

- **Sprint 24**: Neighborhood God Strength — dominant gods per neighborhood boost affinity gains and symbol frequency on local scratchers
- **Sprint 25**: University Bar — new location with drinks menu (chill gain, mana reduction)
- **Sprint 26**: Legacy Screen — programmatic life summary on death (stats, achievements, notable events)
- **Sprint 27**: Color Scheme Toggle — EGA blue/cyan vs green/orange theme switcher (UI-only sprint)
