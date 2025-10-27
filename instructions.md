# AELUN AWAKENED - IMPLEMENTATION INSTRUCTIONS
**Step-by-Step Guide for AI Coding Agents**

**Document Version:** Final v1.0  
**Last Updated:** October 27, 2025  
**Target:** AI Coding Agents (Claude Code, Copilot, etc.)

---

## DOCUMENT PURPOSE

This is the authoritative implementation guide for AI coding agents building Aelun Awakened. It provides the **order** and **sequence** in which to implement features, referencing the three master documents:

1. **FINAL_gdd.md** - What the game IS (design, mechanics, content)
2. **FINAL_architecture.md** - How to BUILD it (technical implementation)
3. **FINAL_ui.md** - How it LOOKS (visual design)

**Critical Rule:** Follow this document's sequence. Do not skip ahead. Each phase builds on the previous.

---

## IMPLEMENTATION OVERVIEW

### Total Timeline
**16 Sprints** (2-week each) = **32 weeks** (~8 months)

### Development Philosophy
- **Build iteratively:** Each sprint produces a playable artifact
- **Test continuously:** Every feature must work before moving on
- **Deploy frequently:** Push to Netlify after each sprint
- **Document progress:** Update this file with completion status

### Three Document Reference Pattern
For every feature:
1. Read **GDD** to understand WHAT it should do
2. Read **ARCHITECTURE** to understand HOW to build it
3. Read **UI** to understand how it should LOOK
4. Implement following all three specifications

---

## PHASE 1: FOUNDATION (Sprints 1-3)

### SPRINT 1: Project Setup & Infrastructure

**Goal:** Create deployable skeleton with all tools configured

**Tasks:**

1. **Initialize Project**
   ```bash
   npm create vite@latest aelun-awakened -- --template react-ts
   cd aelun-awakened
   npm install
   ```

2. **Install Dependencies**
   ```bash
   npm install zustand
   npm install -D tailwindcss postcss autoprefixer
   npm install -D vitest @testing-library/react @testing-library/jest-dom
   npx tailwindcss init -p
   ```

3. **Configure Tailwind**
   - Reference: **ARCHITECTURE.md** Section 2.2, **UI.md** Section 9.2
   - File: `tailwind.config.js`
   - Add DOS color palette
   - Configure monospace font

4. **Configure Vite**
   - Reference: **ARCHITECTURE.md** Section 6.1
   - File: `vite.config.ts`
   - Set up path aliases
   - Configure Web Worker support
   - Configure build optimization

5. **Create Project Structure**
   - Reference: **ARCHITECTURE.md** Section 4.1
   - Create all directories:
     ```
     src/
     ├── components/
     │   ├── screens/
     │   ├── ui/
     │   └── game/
     ├── stores/
     ├── lib/
     │   ├── engine/
     │   ├── persistence/
     │   ├── workers/
     │   └── utils/
     ├── types/
     ├── data/
     └── styles/
     ```

6. **Set Up Git & Netlify**
   - Initialize Git repository
   - Create `netlify.toml` (Reference: **ARCHITECTURE.md** Section 6.2)
   - Connect to Netlify via GitHub
   - Deploy empty app to verify pipeline

7. **Create Global Styles**
   - Reference: **UI.md** Sections 2, 9.1
   - Files: `globals.css`, `tokens.css`, `ascii.css`
   - Implement design tokens as CSS variables
   - Add monospace font imports
   - Set up box-drawing character support

**Acceptance Criteria:**
- ✓ App deploys to Netlify successfully
- ✓ Hot reload works locally (`npm run dev`)
- ✓ Build completes without errors (`npm run build`)
- ✓ Tailwind CSS functioning with DOS palette
- ✓ Directory structure matches architecture spec

**References:**
- Architecture: Sections 2, 4.1, 6
- UI: Sections 2, 9

---

### SPRINT 2: TypeScript Types & Data Structures

**Goal:** Define all core type definitions and game content structure

**Tasks:**

1. **Create Core Types**
   - Reference: **ARCHITECTURE.md** Section 4.2, **GDD.md** Section 4
   - Files: `src/types/`
   
   Create these files with complete type definitions:
   - `cards.ts` (ActionCard, PredicateCard, CardFailureTier)
   - `character.ts` (Character, Stats, Trait)
   - `game.ts` (GameState, TurnPhase, DicePool, Outcome)
   - `meta.ts` (MetaProgression, GraveyardEntry, Compendium)

2. **Create Game Content JSON Schema**
   - Reference: **GDD.md** Sections 4.1, 4.2, 5
   - File: `src/data/game-content.json`
   
   Structure:
   ```json
   {
     "version": 1,
     "actionCards": [ /* 5 starter cards */ ],
     "predicateCards": [ /* 3 starter locations */ ],
     "traits": [ /* 5 starter traits */ ],
     "lifepaths": [ /* 1 starter lifepath */ ]
   }
   ```
   
   Implement ONLY these 5 action cards initially:
   - Pray
   - Travel
   - Take It In
   - Work
   - Quick Attack

3. **Create Validation Functions**
   - Reference: **ARCHITECTURE.md** Section 4.2
   - File: `src/lib/utils/validation.ts`
   - Validate game content structure
   - Validate save data structure
   - Type guards for runtime validation

4. **Create Constants**
   - Reference: **GDD.md** Sections 5, 6, **ARCHITECTURE.md** Section 4.2
   - File: `src/data/constants.ts`
   - Timescales
   - Dice types
   - Scene tags
   - Action types

**Acceptance Criteria:**
- ✓ All TypeScript types compile without errors
- ✓ Game content JSON validates against types
- ✓ No `any` types in codebase
- ✓ Validation functions have unit tests

**References:**
- GDD: Sections 4, 5, 6
- Architecture: Sections 4.2, 9.1

---

### SPRINT 3: State Management & Persistence

**Goal:** Implement Zustand stores and IndexedDB persistence layer

**Tasks:**

1. **Create IndexedDB Wrapper**
   - Reference: **ARCHITECTURE.md** Sections 4.3, 5
   - File: `src/lib/persistence/indexedDB.ts`
   - Open database connection
   - Create object stores
   - Implement basic CRUD operations
   - Add migration system

2. **Implement Save Manager**
   - Reference: **ARCHITECTURE.md** Section 4.3
   - File: `src/lib/persistence/saveManager.ts`
   - Save character
   - Load character
   - List saves
   - Delete save
   - Export save (JSON)

3. **Create Game Store**
   - Reference: **ARCHITECTURE.md** Section 4.4
   - File: `src/stores/gameStore.ts`
   - Character state
   - Current predicate state
   - Turn phase state
   - Action selection logic
   - Basic state mutations

4. **Create Meta Store**
   - Reference: **ARCHITECTURE.md** Section 4.4, **GDD.md** Section 8
   - File: `src/stores/metaStore.ts`
   - Graveyard management
   - Compendium tracking
   - Card unlocks
   - Statistics

5. **Create UI Store**
   - Reference: **ARCHITECTURE.md** Section 4.4
   - File: `src/stores/uiStore.ts`
   - Current screen
   - Modal state
   - Notifications
   - Loading states

6. **Seed Initial Content**
   - File: `src/lib/persistence/seeding.ts`
   - Load game-content.json into IndexedDB on first run
   - Verify content loads correctly

7. **Write Persistence Tests**
   - Test save/load cycle
   - Test data integrity
   - Test migration system
   - Test IndexedDB operations

**Acceptance Criteria:**
- ✓ Can save character to IndexedDB
- ✓ Can load character from IndexedDB
- ✓ Game content loads on app initialization
- ✓ Zustand stores update correctly
- ✓ Browser dev tools show IndexedDB populated
- ✓ All persistence tests passing

**References:**
- Architecture: Sections 4.3, 4.4
- GDD: Sections 4, 8

---

## PHASE 2: CORE UI SCREENS (Sprints 4-6)

### SPRINT 4: Main Menu & Basic Components

**Goal:** Implement Main Menu screen and reusable UI components

**Tasks:**

1. **Create UI Component Library**
   - Reference: **UI.md** Section 3
   - Files: `src/components/ui/`
   
   Implement these components:
   - `Button.tsx` (all variants)
   - `Panel.tsx` (all variants)
   - `Modal.tsx`
   - `StatBar.tsx`
   - `Card.tsx` (display component)

2. **Implement Main Menu Screen**
   - Reference: **UI.md** Section 4.1, **GDD.md** Section 2
   - File: `src/components/screens/MainMenuScreen.tsx`
   - Title display (ASCII art)
   - Menu buttons
   - Footer info
   - Navigation logic

3. **Create Layout Components**
   - Reference: **UI.md** Sections 3, 4
   - Files: `src/components/ui/Layout.tsx`
   - Screen container
   - Header/footer layout
   - Responsive breakpoints

4. **Implement Routing**
   - File: `src/App.tsx`
   - Screen navigation based on UI store
   - Route between screens
   - Handle back navigation

5. **Add Animations**
   - Reference: **UI.md** Section 5
   - File: `src/styles/animations.css`
   - Screen transitions
   - Button hover effects
   - Fade in/out animations

**Acceptance Criteria:**
- ✓ Main Menu displays correctly
- ✓ All buttons have correct visual states
- ✓ Can navigate to other screens (even if empty)
- ✓ Animations smooth at 60fps
- ✓ Responsive on mobile (320px width)
- ✓ Matches UI spec pixel-perfect

**References:**
- UI: Sections 3, 4.1, 5
- GDD: Section 2

---

### SPRINT 5: Lifepath Character Creation (Part 1)

**Goal:** Implement first half of character creation flow

**Tasks:**

1. **Create Lifepath Screen Structure**
   - Reference: **UI.md** Section 4.2, **GDD.md** Section 5.1
   - File: `src/components/screens/LifepathScreen.tsx`
   - Step counter
   - Narrative panel
   - Choice buttons
   - Progress indicator

2. **Implement Lifepath Logic**
   - Reference: **GDD.md** Section 5.1, **ARCHITECTURE.md** Section 4.2
   - File: `src/lib/engine/lifepath.ts`
   - Load lifepath data
   - Step-by-step progression
   - Choice tracking
   - Character building from choices

3. **Create Lifepath Data**
   - Reference: **GDD.md** Section 5.1
   - File: `src/data/lifepaths.json`
   - Define 1 complete lifepath (10 steps)
   - Each step has:
     - Narrative text
     - 2-3 choices
     - Stat/trait/card consequences

4. **Implement Character Builder**
   - Reference: **ARCHITECTURE.md** Section 5, **GDD.md** Section 5
   - File: `src/lib/engine/characterBuilder.ts`
   - Accumulate stats from choices
   - Accumulate traits from choices
   - Build starting Action Deck
   - Generate character name/summary

**Acceptance Criteria:**
- ✓ Can progress through all 10 lifepath steps
- ✓ Each choice affects character correctly
- ✓ Narrative displays properly
- ✓ UI matches spec
- ✓ Character object valid at end

**References:**
- UI: Section 4.2
- GDD: Section 5.1
- Architecture: Sections 4.2, 5

---

### SPRINT 6: Lifepath Character Creation (Part 2)

**Goal:** Complete character creation and save first character

**Tasks:**

1. **Add Character Summary Screen**
   - Reference: **UI.md** Section 4.2
   - Show final character:
     - Name
     - Stats
     - Traits  
     - Starting deck
     - Backstory summary

2. **Implement Character Save**
   - When player confirms character:
     - Save to IndexedDB (characters store)
     - Set as active character in game store
     - Transition to game loop

3. **Add Character Name Input**
   - Allow player to name character
   - Default name generator if skipped
   - Validation (no empty names)

4. **Add Exit/Cancel Handling**
   - Warn before abandoning lifepath
   - Return to main menu
   - Don't save incomplete character

5. **Polish Lifepath UX**
   - Add smooth transitions between steps
   - Highlight selected choices
   - Show "locked in" choices
   - Add back button for last step only

**Acceptance Criteria:**
- ✓ Can complete full lifepath and save character
- ✓ Character loads into game store correctly
- ✓ Character persists in IndexedDB
- ✓ Can return to menu without saving
- ✓ Summary screen shows all character details
- ✓ Name input functional

**References:**
- UI: Section 4.2
- GDD: Section 5.1
- Architecture: Sections 4.3, 4.4

---

## PHASE 3: CORE GAMEPLAY (Sprints 7-10)

### SPRINT 7: Game Loop Screen & Action Wheel

**Goal:** Display game state and available actions

**Tasks:**

1. **Create Game Loop Screen**
   - Reference: **UI.md** Section 4.3, **GDD.md** Section 3
   - File: `src/components/screens/GameLoopScreen.tsx`
   - Header (title, menu buttons)
   - Scene description panel
   - Action wheel
   - Status bar

2. **Implement Scene Display**
   - Reference: **GDD.md** Section 4.3
   - File: `src/components/game/ScenePanel.tsx`
   - Predicate card rendering
   - Scene tags display
   - Timescale display
   - State indicators (safe/danger)

3. **Create Action Wheel Component**
   - Reference: **UI.md** Section 4.3, **GDD.md** Section 3
   - File: `src/components/game/ActionWheel.tsx`
   - Filter actions by tags + timescale
   - Display available actions
   - Highlight primary action
   - Show action types (Targeted/Untargeted)

4. **Implement Action Filtering Logic**
   - Reference: **GDD.md** Section 3.1
   - File: `src/lib/engine/actionFilter.ts`
   - Match scene tags to action tags
   - Match timescale to action timescales
   - Return filtered list

5. **Create Status Bar**
   - Reference: **UI.md** Section 4.3
   - File: `src/components/game/StatusBar.tsx`
   - HP bar with visual + numeric
   - Resource display (stars)
   - Traits count + link
   - Turn counter
   - Affinity indicator (hidden for now)

**Acceptance Criteria:**
- ✓ Scene displays with correct formatting
- ✓ Action wheel shows only valid actions
- ✓ Status bar displays character state
- ✓ All components match UI spec
- ✓ Can click actions (no resolution yet)

**References:**
- UI: Section 4.3
- GDD: Sections 3, 4
- Architecture: Section 5

---

### SPRINT 8: Dice System & Rolling

**Goal:** Implement dice pool assembly and rolling mechanics

**Tasks:**

1. **Create Dice Pool Screen**
   - Reference: **UI.md** Section 4.4, **GDD.md** Section 3.1
   - File: `src/components/screens/DicePoolScreen.tsx`
   - Show selected action
   - Display dice pool assembly
   - Show advantage dice
   - Show bonus dice with sources
   - Roll button

2. **Implement Dice System**
   - Reference: **GDD.md** Section 3.1, **ARCHITECTURE.md** Section 5
   - File: `src/lib/engine/diceSystem.ts`
   - Roll d20 (advantage dice, keep highest)
   - Roll bonus dice (d4, d6, etc.)
   - Calculate total
   - Return result

3. **Create Dice Pool Builder**
   - Reference: **GDD.md** Section 3.1, **ARCHITECTURE.md** Section 5
   - File: `src/lib/engine/dicePoolBuilder.ts`
   - Count advantage dice (duplicates)
   - Add stat bonuses
   - Add trait bonuses
   - Add affinity bonuses (placeholder)
   - Return DicePool object

4. **Implement Dice Display Component**
   - Reference: **UI.md** Section 3.5
   - File: `src/components/game/DiceDisplay.tsx`
   - Visual dice representation
   - Unicode die faces (⚀⚁⚂⚃⚄⚅)
   - Source labels
   - Total calculation display

5. **Create Roll Animation**
   - Reference: **UI.md** Section 5
   - Animate dice rolling
   - Show result dramatically
   - Transition to outcome

**Acceptance Criteria:**
- ✓ Dice pool builds correctly from character
- ✓ Can roll dice and get result
- ✓ Advantage dice work (keep highest)
- ✓ Bonus dice add correctly
- ✓ Animation smooth and clear
- ✓ Result displays prominently

**References:**
- UI: Sections 3.5, 4.4, 5
- GDD: Section 3.1
- Architecture: Section 5

---

### SPRINT 9: Predicate Engine (Core Resolution)

**Goal:** Implement action resolution system

**Tasks:**

1. **Create Predicate Engine**
   - Reference: **ARCHITECTURE.md** Section 5.1, **GDD.md** Section 3.1
   - File: `src/lib/engine/predicateEngine.ts`
   - Resolve (action, predicate, roll) → outcome
   - Load outcome logic tables
   - Evaluate conditions
   - Execute outcomes
   - Return Outcome object

2. **Implement Web Worker**
   - Reference: **ARCHITECTURE.md** Section 4.5
   - File: `src/lib/workers/gameEngine.worker.ts`
   - Message handler for engine commands
   - Offload heavy computation
   - Return results to main thread

3. **Create Worker Client**
   - Reference: **ARCHITECTURE.md** Section 4.5
   - File: `src/lib/utils/workerClient.ts`
   - Send commands to worker
   - Handle responses
   - Promise-based API

4. **Implement Outcome Execution**
   - Reference: **GDD.md** Section 3.1, **ARCHITECTURE.md** Section 5.1
   - File: `src/lib/engine/outcomeExecutor.ts`
   - Apply damage
   - Modify stats
   - Change affinities
   - Update flags
   - Transition scenes
   - Unlock content

5. **Create Outcome Display Screen**
   - Reference: **UI.md** Section 4.5, **GDD.md** Section 3.1
   - File: `src/components/screens/OutcomeScreen.tsx`
   - Narrative outcome text
   - Effects list
   - Success/failure indicator
   - Continue button

6. **Define Simple Outcome Tables**
   - Reference: **GDD.md** Section 4.3
   - Add to `game-content.json`
   - For each predicate:
     - Outcome logic for each action
     - Success/failure conditions
     - Effect specifications

**Acceptance Criteria:**
- ✓ Can resolve action → outcome
- ✓ Outcomes execute correctly
- ✓ Character state updates
- ✓ Worker doesn't block main thread
- ✓ Outcome screen displays results
- ✓ Can continue back to game loop

**References:**
- Architecture: Sections 4.5, 5.1
- GDD: Sections 3.1, 4.3
- UI: Section 4.5

---

### SPRINT 10: Turn Loop Integration

**Goal:** Complete the full turn cycle

**Tasks:**

1. **Connect All Screens**
   - Scene display → Action wheel → Dice pool → Outcome → Scene display
   - Handle all transitions
   - Maintain state across screens

2. **Implement Turn Advancement**
   - Reference: **GDD.md** Section 6.1
   - Increment turn counter
   - Update timescale if needed
   - Check for time-based events
   - Save character state

3. **Add Pause Menu**
   - Reference: **UI.md** Section 4.3
   - File: `src/components/screens/PauseMenuScreen.tsx`
   - Resume
   - Save and quit
   - View stats/traits
   - Settings

4. **Implement Auto-Save**
   - Save after each turn
   - Save on pause
   - Save before quit
   - Background save (async)

5. **Add Error Handling**
   - Try-catch around all engine calls
   - Graceful failure states
   - Error display to user
   - Logging for debugging

6. **Polish Turn Flow**
   - Loading states
   - Transitions smooth
   - No jank or flicker
   - Responsive feel

**Acceptance Criteria:**
- ✓ Can play multiple turns in sequence
- ✓ Character state persists correctly
- ✓ Can pause and resume
- ✓ Auto-save works
- ✓ No errors in console
- ✓ Turn loop feels smooth

**References:**
- GDD: Sections 3, 6.1
- UI: Sections 4.3, 5
- Architecture: Sections 4.3, 4.4

---

## PHASE 4: META-PROGRESSION (Sprints 11-13)

### SPRINT 11: Death & Graveyard

**Goal:** Implement permadeath and character history

**Tasks:**

1. **Implement Death Detection**
   - Reference: **GDD.md** Section 7.2
   - Check HP <= 0 after each outcome
   - Trigger death sequence
   - No resurrection

2. **Create Death Screen**
   - Reference: **UI.md** Section 4.6, **GDD.md** Section 7.2
   - File: `src/components/screens/DeathScreen.tsx`
   - Death message
   - Character summary
   - Achievements list
   - Options: View graveyard, New character, Menu

3. **Implement Graveyard Entry Creation**
   - Reference: **ARCHITECTURE.md** Section 4.4, **GDD.md** Section 7.2
   - File: `src/lib/engine/graveyardManager.ts`
   - Extract character data
   - Create GraveyardEntry
   - Save to IndexedDB
   - Update meta store

4. **Create Graveyard Screen**
   - Reference: **UI.md** Section 4.6, **GDD.md** Section 8
   - File: `src/components/screens/GraveyardScreen.tsx`
   - List all past characters
   - Virtual scrolling for performance
   - Detail view on select
   - Stats summary

5. **Add Graveyard Sorting/Filtering**
   - Sort by: date, survival time, cause of death
   - Filter by: lifepath, achievements
   - Search by name

**Acceptance Criteria:**
- ✓ Death triggers when HP <= 0
- ✓ Character added to graveyard
- ✓ Graveyard persists across sessions
- ✓ Can view all past characters
- ✓ Death screen matches UI spec
- ✓ Can start new character from death

**References:**
- GDD: Sections 7.2, 8
- UI: Section 4.6
- Architecture: Section 4.4

---

### SPRINT 12: Compendium & Discovery

**Goal:** Implement discovery tracking system

**Tasks:**

1. **Create Compendium Screen**
   - Reference: **UI.md** Section 4.7, **GDD.md** Section 8.3
   - File: `src/components/screens/CompendiumScreen.tsx`
   - Category overview
   - Completion percentages
   - Detail views for each category

2. **Implement Discovery System**
   - Reference: **GDD.md** Section 8.3, **ARCHITECTURE.md** Section 4.4
   - File: `src/lib/engine/discoveryManager.ts`
   - Track discovered content
   - Update Compendium
   - Calculate completion %
   - Persist discoveries

3. **Add Discovery Triggers**
   - Card used → discover card
   - Location visited → discover location
   - Trait gained → discover trait
   - Affinity interaction → discover entity

4. **Create Detail Views**
   - Action card details with stats
   - Predicate card details
   - Trait descriptions
   - Affinity entity info
   - Lore fragments

5. **Implement Search/Filter**
   - Search by name
   - Filter by category
   - Filter by discovered/locked
   - Sort options

**Acceptance Criteria:**
- ✓ Content discovered during play
- ✓ Compendium persists across runs
- ✓ Completion % accurate
- ✓ Can browse all categories
- ✓ Locked content shows ???
- ✓ UI matches spec

**References:**
- GDD: Section 8.3
- UI: Section 4.7
- Architecture: Section 4.4

---

### SPRINT 13: Card Unlock System (Failure Fields)

**Goal:** Implement failure-driven progression

**Tasks:**

1. **Create Card Evolution Manager**
   - Reference: **ARCHITECTURE.md** Section 5.3, **GDD.md** Section 4.3
   - File: `src/lib/engine/cardEvolution.ts`
   - Track failures per card
   - Check tier thresholds
   - Trigger unlocks
   - Save progress

2. **Implement Failure Tracking**
   - Detect failed rolls
   - Increment failure counter
   - Check for tier unlock
   - Persist to meta-progression

3. **Create Unlock Selection UI**
   - Reference: **UI.md** Section 4.5
   - Show available cards in tier pool
   - Player selects one card
   - Card added to meta-progression
   - Notification displayed

4. **Add Failure Fields to Card Data**
   - Reference: **GDD.md** Section 4.3
   - Update `game-content.json`
   - Define failure fields for all cards
   - Specify tiers, thresholds, pools

5. **Implement Unlock Notifications**
   - Reference: **UI.md** Section 5
   - Show when tier unlocked
   - Celebration animation
   - Clear "new" indicator

6. **Update Compendium for Unlocks**
   - Show failure progress per card
   - Display tier information
   - Show unlock history

**Acceptance Criteria:**
- ✓ Failures tracked correctly
- ✓ Tiers unlock at correct thresholds
- ✓ Player can select from pool
- ✓ Unlocks persist forever
- ✓ Unlocked cards appear in future decks
- ✓ Notification shows clearly

**References:**
- GDD: Section 4.3
- Architecture: Section 5.3
- UI: Sections 4.5, 5

---

## PHASE 5: SYSTEMS & POLISH (Sprints 14-16)

### SPRINT 14: Affinity System

**Goal:** Implement hidden relationship tracking

**Tasks:**

1. **Implement Affinity Manager**
   - Reference: **GDD.md** Section 5.4, **ARCHITECTURE.md** Section 5
   - File: `src/lib/engine/affinityManager.ts`
   - Track affinity scores
   - Modify affinities
   - Check thresholds
   - Unlock content at thresholds

2. **Integrate Affinity with Predicate Engine**
   - Actions affect affinities
   - Quest completion affects affinities
   - Location discovery affects affinities

3. **Implement Universal Choice Engine**
   - Reference: **ARCHITECTURE.md** Section 5.2, **GDD.md** Section 5.4
   - File: `src/lib/engine/choiceEngine.ts`
   - Weighted random selection
   - Affinity-based weight modification
   - Seeded RNG

4. **Add Affinity Notifications**
   - Reference: **GDD.md** Section 5.4 (Semi-Visible option)
   - Show "+1 Divine Affinity" etc.
   - Subtle, non-intrusive
   - Can be toggled in settings

5. **Update Compendium for Affinities**
   - Show discovered relationships
   - Display current/peak scores
   - Show threshold unlocks
   - Show history

**Acceptance Criteria:**
- ✓ Affinities track correctly
- ✓ Actions affect affinities as designed
- ✓ Choice engine weights work
- ✓ Notifications display
- ✓ Compendium shows affinities
- ✓ Thresholds unlock content

**References:**
- GDD: Section 5.4
- Architecture: Sections 5, 5.2
- UI: Sections 4.3, 4.7

---

### SPRINT 15: Content Production

**Goal:** Expand game content to MVP targets

**Tasks:**

1. **Expand Action Cards**
   - Reference: **GDD.md** Section 9.1
   - Target: 30-50 unique cards
   - Define failure fields for all
   - Balanced across categories
   - Test each card

2. **Expand Predicate Cards**
   - Target: 20-40 unique locations/events
   - Define outcome tables for all
   - Connect to world map
   - Test each predicate

3. **Define Traits**
   - Target: 15-30 unique traits
   - Balance passive vs triggered
   - Integrate with game systems

4. **Expand Lifepaths**
   - Target: 2-3 complete paths
   - Unique starting decks each
   - Different playstyles

5. **Define Affinities**
   - Target: 5-10 entities
   - Factions, deities, NPCs
   - Threshold unlocks
   - Integration points

6. **Write Lore Fragments**
   - World building text
   - Character backstories
   - Historical events
   - Discovery triggers

**Acceptance Criteria:**
- ✓ 30+ action cards defined and tested
- ✓ 20+ predicate cards defined and tested
- ✓ 15+ traits defined
- ✓ 2+ lifepaths playable
- ✓ 5+ affinity entities defined
- ✓ Lore fragments scattered
- ✓ All content validated

**References:**
- GDD: Sections 4, 5, 9

---

### SPRINT 16: Polish & Launch Prep

**Goal:** Bug fixes, optimization, final polish

**Tasks:**

1. **Performance Optimization**
   - Reference: **ARCHITECTURE.md** Section 7
   - Bundle size < 600KB
   - Load time < 3 seconds
   - 60 FPS maintained
   - Memory < 300MB

2. **Visual Polish**
   - Reference: **UI.md** Sections 3-7
   - Perfect alignment of all elements
   - Smooth all animations
   - Fix any visual bugs
   - Mobile responsive testing

3. **Bug Fixing**
   - Fix all known bugs
   - Test all edge cases
   - Handle errors gracefully
   - No console errors

4. **Accessibility Audit**
   - Reference: **UI.md** Section 7
   - Keyboard navigation works
   - Screen reader compatible
   - Color contrast meets standards
   - Touch targets sized correctly

5. **Cross-Browser Testing**
   - Chrome (desktop & mobile)
   - Firefox (desktop & mobile)
   - Safari (desktop & mobile)
   - Edge (desktop)

6. **Documentation**
   - Update README
   - Add inline code comments
   - Document known issues
   - Create player guide

7. **Deployment**
   - Final Netlify deploy
   - Verify offline mode
   - Test on real devices
   - Monitor for errors

**Acceptance Criteria:**
- ✓ No critical bugs
- ✓ Performance targets met
- ✓ Works offline perfectly
- ✓ Accessible per standards
- ✓ Tested on all browsers
- ✓ Deployed to production
- ✓ Ready for players

**References:**
- Architecture: Section 7
- UI: Sections 6, 7

---

## TESTING STRATEGY

### Unit Tests (Continuous)
- Write tests alongside features
- Coverage targets:
  - Engine functions: 90%+
  - Stores: 80%+
  - Utilities: 95%+

### Integration Tests (Sprint End)
- Test full user flows
- Critical paths:
  - Character creation → save
  - Turn cycle → outcome
  - Death → graveyard
  - Unlock → compendium

### Manual Testing (Weekly)
- Play through game
- Try edge cases
- Test on different devices
- Check offline mode

---

## DEPLOYMENT CHECKLIST

**Before Each Deploy:**
- [ ] All tests passing
- [ ] No console errors
- [ ] Build succeeds
- [ ] Version number updated

**Deploy Process:**
1. Push to main branch
2. Netlify auto-builds
3. Check deploy preview
4. Test deployed version
5. Merge if successful

---

## PROGRESS TRACKING

Update this section as you complete work:

### Sprint Completion Status

- [x] Sprint 1: Project Setup
- [x] Sprint 2: Types & Data
- [x] Sprint 3: State & Persistence
- [x] Sprint 4: Main Menu & Components
- [ ] Sprint 5: Lifepath (Part 1)
- [ ] Sprint 6: Lifepath (Part 2)
- [ ] Sprint 7: Game Loop & Actions
- [ ] Sprint 8: Dice System
- [ ] Sprint 9: Predicate Engine
- [ ] Sprint 10: Turn Loop
- [ ] Sprint 11: Death & Graveyard
- [ ] Sprint 12: Compendium
- [ ] Sprint 13: Card Unlocks
- [ ] Sprint 14: Affinity System
- [ ] Sprint 15: Content Production
- [ ] Sprint 16: Polish & Launch

### Blockers & Issues

Document any blockers here:
- None currently

### Notes

Document implementation notes, decisions, or deviations from spec here:
- Phase 1 complete (Sprints 1–3):
  - Created project structure per architecture (components, stores, lib, types, data)
  - Implemented core TypeScript types (`cards`, `character`, `game`, `meta`)
  - Added constants and initial `game-content.json` (5 actions, 3 predicates, 5 traits, 1 lifepath)
  - Implemented validation utils with unit test
  - Implemented IndexedDB wrapper, migrations, and initial content seeding
  - Implemented save manager (save/load/list/delete/export)
  - Added Zustand stores (game, meta, ui, settings)
  - Wired seeding into app startup
  - Lint, build, and tests passing
- Sprint 4 complete:
  - Added reusable UI components: `Button`, `Panel`, `Modal`, `StatBar`, `Card`, `Layout`
  - Implemented `MainMenuScreen` with navigation
  - Added placeholder screens: `LifepathScreen`, `GameLoopScreen`, `CompendiumScreen`, `GraveyardScreen`, `PauseMenuScreen`
  - Implemented screen routing via `uiStore` in `App.tsx`
  - Ensured styles align with DOS aesthetic; hover/focus states per UI spec
  - Installed `clsx` for class composition
  - Build and unit tests passing; no linter errors

---

## CRITICAL IMPLEMENTATION RULES

### 1. **Reference Documents First**
Before implementing ANY feature:
1. Read GDD section to understand WHAT
2. Read Architecture section to understand HOW
3. Read UI section to understand LOOK
4. Then implement

### 2. **No Skipping Ahead**
Do not implement Sprint 10 before Sprint 9. Each sprint builds on previous work. Skipping breaks the foundation.

### 3. **Test Before Moving On**
Every feature must work before moving to next sprint. No accumulating broken features.

### 4. **Deploy Frequently**
Push to Netlify after every sprint. Verify it works in production, not just local.

### 5. **Ask Before Deviating**
If you need to deviate from specs, document WHY and get approval before proceeding.

### 6. **Update This Document**
As you work, update completion status, blockers, and notes. Keep this document current.

### 7. **Commit Often**
Commit code frequently with clear messages. Don't work for days without committing.

---

## EMERGENCY CONTACTS

**If stuck:**
1. Re-read the three master documents
2. Check similar implementations in codebase
3. Search documentation online
4. Ask for help if truly blocked

**If documents conflict:**
- GDD defines WHAT (authority on game design)
- Architecture defines HOW (authority on technical approach)
- UI defines LOOK (authority on visual design)
- This doc defines WHEN (authority on sequence)

---

## FINAL NOTES

This is a comprehensive project. Follow the sequence, test thoroughly, and reference the master documents constantly. By Sprint 16, you'll have a complete, polished game ready for players.

Good luck, and happy coding!

---

**Version Control:**
- v1.0 - October 26, 2025 - Initial implementation guide

**END OF IMPLEMENTATION INSTRUCTIONS**
