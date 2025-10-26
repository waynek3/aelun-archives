# AELUN AWAKENED - FINAL ARCHITECTURE DOCUMENT
**Single Source of Truth for Technical Implementation**

**Document Version:** Final Consolidated v1.0  
**Last Updated:** October 26, 2025  
**Build Constraint:** Claude Code + Netlify deployment, 100% offline, no external APIs

---

## DOCUMENT PURPOSE

This is the authoritative technical architecture document for Aelun Awakened. All technology choices, implementation patterns, data structures, and technical decisions are defined here. AI agents implementing this game should reference this document for all technical decisions.

---

## 1. EXECUTIVE TECHNICAL SUMMARY

### 1.1 Architecture Overview

Aelun Awakened is a **browser-native, offline-first, single-page application** with zero backend infrastructure. All game logic, state management, and persistence happens in the browser using:

- **React 18.2+** for UI components
- **TypeScript 5.x** for type-safe game logic
- **IndexedDB** for local data persistence
- **Web Worker** for game engine computation
- **Netlify** for static hosting and deployment

### 1.2 Core Architectural Principles

**ZERO INFRASTRUCTURE:**
- No backend servers
- No database servers
- No API layer
- No external services

**100% OFFLINE:**
- Complete game functionality without internet
- All saves stored locally in IndexedDB
- No network calls during gameplay

**BROWSER-FIRST:**
- All game logic runs in browser
- Web Worker offloads heavy computation
- Local storage for all persistence

**NETLIFY DEPLOYMENT:**
- Static site hosting (free tier)
- Git push → automatic deployment
- No DevOps management needed

### 1.3 Why This Architecture

**Constraints Met:**
- âœ" Built entirely in Claude Code (React/TypeScript)
- âœ" Deployed via Netlify (static hosting)
- âœ" No external tools or APIs required
- âœ" 100% offline gameplay
- âœ" Zero infrastructure management

**Technical Benefits:**
- Zero monthly hosting costs
- Instant deployment (Git push)
- Perfect offline capability
- No network latency
- Local saves (<100ms load time)
- Simple development setup

---

## 2. TECHNOLOGY STACK

### 2.1 Core Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend Framework** | React | 18.2+ | Component-based UI |
| **Language** | TypeScript | 5.x | Type-safe development |
| **Build Tool** | Vite | 5.x | Fast dev/prod builds |
| **Styling** | Tailwind CSS | 3.x | Rapid UI styling |
| **State Management** | Zustand | 4.4+ | Lightweight Redux alternative |
| **Persistence** | IndexedDB | Native | Browser database |
| **Computation** | Web Worker | Native | Background processing |
| **Deployment** | Netlify | - | Static hosting |

### 2.2 Development Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "typescript": "^5.2.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.1.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vitest": "^0.34.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

### 2.3 Bundle Size Targets

- **React App:** ~400KB (gzipped)
- **Web Worker:** ~100KB (gzipped)
- **Game Content JSON:** ~50KB (bundled)
- **Total Initial Load:** <600KB
- **Post-Cache Load:** <100KB

---

## 3. SYSTEM ARCHITECTURE

### 3.1 High-Level Architecture Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                      BROWSER (React App)                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    UI Layer (React)                     │ │
│  │  • Main Menu Screen                                     │ │
│  │  • Lifepath Screen                                      │ │
│  │  • Game Loop Screen                                     │ │
│  │  • Compendium / Graveyard                               │ │
│  │  • Pause Menu                                           │ │
│  └─────────────────────────────────────────────────────────┘ │
│           ↕ (Actions)                  ↕ (State Updates)     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              State Management (Zustand)                 │ │
│  │  • gameState: current character, world, deck           │ │
│  │  • metaState: graveyard, compendium, unlocks           │ │
│  │  • uiState: screen routing, modals                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│           ↕ (Engine Commands)          ↕ (Results)           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Game Engine (Web Worker)                   │ │
│  │  ┌───────────────────────────────────────────────────┐ │ │
│  │  │  • Predicate Engine (action resolution)          │ │ │
│  │  │  • Universal Choice Engine (weighted RNG)        │ │ │
│  │  │  • Card Evolution Manager (failure tracking)     │ │ │
│  │  │  • World Simulation (NPC behavior, state)        │ │ │
│  │  │  • Procedural Generation (seeded world gen)      │ │ │
│  │  └───────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│           ↕ (Read/Write)                ↕ (Query)            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Persistence Layer (IndexedDB)                 │ │
│  │  ┌───────────────────────────────────────────────────┐ │ │
│  │  │  Object Stores:                                   │ │ │
│  │  │  • gameContent: cards, predicates, traits        │ │ │
│  │  │  • characters: current saves                     │ │ │
│  │  │  • graveyard: past character records             │ │ │
│  │  │  • compendium: discovered content                │ │ │
│  │  │  • metaProgression: card unlocks, stats          │ │ │
│  │  │  • settings: user preferences                    │ │ │
│  │  └───────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

        ↓ Deployed to Netlify (Static Hosting)
```

### 3.2 Data Flow

**Game Initialization:**
```
1. React app loads
2. IndexedDB connection established
3. Game content loaded into memory
4. Meta-progression loaded
5. Main Menu rendered
```

**Gameplay Turn:**
```
1. Player action selected in UI
2. Action dispatched to Zustand store
3. Store sends command to Web Worker
4. Worker executes Predicate Engine
5. Result sent back to main thread
6. Store updates state
7. React re-renders UI
8. IndexedDB saves state (async)
```

**Character Death:**
```
1. Death event triggered
2. Character data sent to Graveyard store
3. Compendium updated with discoveries
4. Card unlocks saved to meta-progression
5. Character save deleted
6. Return to Main Menu
```

---

## 4. DETAILED IMPLEMENTATION

### 4.1 Project Structure

```
aelun-awakened/
├── public/
│   └── index.html
│
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Root component
│   │
│   ├── components/
│   │   ├── screens/
│   │   │   ├── MainMenuScreen.tsx
│   │   │   ├── LifepathScreen.tsx
│   │   │   ├── GameLoopScreen.tsx
│   │   │   ├── ActionWheelScreen.tsx
│   │   │   ├── DicePoolScreen.tsx
│   │   │   ├── OutcomeScreen.tsx
│   │   │   ├── CompendiumScreen.tsx
│   │   │   ├── GraveyardScreen.tsx
│   │   │   └── PauseMenuScreen.tsx
│   │   │
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── StatBar.tsx
│   │   │   ├── DiceDisplay.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Layout.tsx
│   │   │
│   │   └── game/
│   │       ├── ActionWheel.tsx
│   │       ├── PredicateCard.tsx
│   │       ├── TraitsList.tsx
│   │       └── AffinityDisplay.tsx
│   │
│   ├── stores/
│   │   ├── gameStore.ts          # Current game state
│   │   ├── metaStore.ts          # Meta-progression
│   │   ├── uiStore.ts            # UI state
│   │   └── settingsStore.ts      # User settings
│   │
│   ├── lib/
│   │   ├── engine/
│   │   │   ├── predicateEngine.ts
│   │   │   ├── choiceEngine.ts
│   │   │   ├── cardEvolution.ts
│   │   │   ├── worldSimulation.ts
│   │   │   ├── proceduralGen.ts
│   │   │   └── diceSystem.ts
│   │   │
│   │   ├── persistence/
│   │   │   ├── indexedDB.ts
│   │   │   ├── saveManager.ts
│   │   │   ├── migrations.ts
│   │   │   └── export.ts
│   │   │
│   │   ├── workers/
│   │   │   └── gameEngine.worker.ts
│   │   │
│   │   └── utils/
│   │       ├── random.ts
│   │       ├── validation.ts
│   │       └── helpers.ts
│   │
│   ├── types/
│   │   ├── cards.ts
│   │   ├── character.ts
│   │   ├── game.ts
│   │   └── meta.ts
│   │
│   ├── data/
│   │   ├── game-content.json     # All cards, predicates, traits
│   │   ├── lifepaths.json        # Character creation data
│   │   └── constants.ts          # Game constants
│   │
│   └── styles/
│       ├── globals.css
│       ├── ascii.css             # DOS aesthetic styles
│       └── theme.css             # Color palette
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── setup.ts
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── netlify.toml
└── README.md
```

### 4.2 TypeScript Type Definitions

**Core Game Types:**

```typescript
// cards.ts
export interface ActionCard {
  id: string;
  name: string;
  description: string;
  actionType: "Targeted" | "Untargeted";
  tags: string[];
  timescales: string[];
  diceModifier?: string;
  failureField: CardFailureTier[];
}

export interface CardFailureTier {
  tier: number;
  requiresFailures: number;
  maxUnlocks: number;
  pool: string[];
}

export interface PredicateCard {
  id: string;
  name: string;
  description: string;
  sceneTags: string[];
  timescale: string;
  outcomeLogic: OutcomeTable;
  stateFlags: Record<string, any>;
  exits: string[];
}

export interface OutcomeTable {
  [actionId: string]: OutcomeRule[];
}

export interface OutcomeRule {
  condition: string;  // e.g., "roll > 10"
  outcome: string;    // e.g., "deal_damage"
  parameters: any;
}

// character.ts
export interface Character {
  id: string;
  name: string;
  lifepath: LifepathChoice[];
  stats: Stats;
  traits: Trait[];
  actionDeck: string[];  // Array of ActionCard IDs
  currentHP: number;
  maxHP: number;
  affinities: Record<string, number>;
  location: string;
  worldState: WorldState;
  createdAt: number;
  turnCount: number;
}

export interface Stats {
  strength: number;
  agility: number;
  insight: number;
  charisma: number;
  fortitude: number;
  will: number;
}

export interface Trait {
  id: string;
  name: string;
  type: "Passive" | "Triggered";
  effect: string;
}

// game.ts
export interface GameState {
  character: Character | null;
  currentPredicate: string;
  activeTimescale: string;
  turnPhase: TurnPhase;
  dicePool: DicePool;
  recentOutcome: Outcome | null;
}

export type TurnPhase = 
  | "scene_display"
  | "action_selection"
  | "target_selection"
  | "dice_assembly"
  | "dice_roll"
  | "outcome_resolution";

export interface DicePool {
  advantageDice: number;  // Number of d20s
  bonusDice: Die[];
}

export interface Die {
  faces: number;  // 4, 6, 8, 10, 12, 20
  source: string;  // "Strength", "Trait: Devout"
}

// meta.ts
export interface MetaProgression {
  version: number;
  cardUnlocks: Record<string, Record<number, string>>;
  graveyard: GraveyardEntry[];
  compendium: Compendium;
  statistics: GameStatistics;
}

export interface GraveyardEntry {
  characterId: string;
  name: string;
  lifepath: string[];
  survived: number;
  diedAt: string;
  causeOfDeath: string;
  achievements: string[];
  peakAffinities: Record<string, number>;
  timestamp: number;
}

export interface Compendium {
  discoveredCards: Set<string>;
  discoveredPredicates: Set<string>;
  discoveredTraits: Set<string>;
  discoveredAffinities: Set<string>;
  loreFragments: Set<string>;
  completionPercentage: number;
}
```

### 4.3 IndexedDB Schema

**Database Name:** `aelun-awakened`  
**Version:** 1  

**Object Stores:**

```typescript
// gameContent store
{
  keyPath: "id",
  indexes: [
    { name: "type", keyPath: "type", unique: false },
    { name: "tags", keyPath: "tags", unique: false, multiEntry: true }
  ]
}
// Stores: ActionCards, PredicateCards, Traits, base game data

// characters store
{
  keyPath: "id",
  indexes: [
    { name: "createdAt", keyPath: "createdAt", unique: false }
  ]
}
// Stores: Active character saves

// graveyard store
{
  keyPath: "characterId",
  indexes: [
    { name: "timestamp", keyPath: "timestamp", unique: false }
  ]
}
// Stores: All past characters

// metaProgression store
{
  keyPath: "key"
}
// Stores: Global meta-progression data (singleton)

// compendium store
{
  keyPath: "id",
  indexes: [
    { name: "category", keyPath: "category", unique: false }
  ]
}
// Stores: Discovery tracking

// settings store
{
  keyPath: "key"
}
// Stores: User preferences
```

**IndexedDB Operations:**

```typescript
// Save character
async function saveCharacter(character: Character): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("characters", "readwrite");
  await tx.objectStore("characters").put(character);
  await tx.done;
}

// Load character
async function loadCharacter(id: string): Promise<Character | null> {
  const db = await openDB();
  const character = await db.get("characters", id);
  return character || null;
}

// Add to graveyard
async function addToGraveyard(entry: GraveyardEntry): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("graveyard", "readwrite");
  await tx.objectStore("graveyard").put(entry);
  await tx.done;
}

// Update compendium
async function discoverContent(
  category: string,
  id: string
): Promise<void> {
  const db = await openDB();
  const meta = await db.get("metaProgression", "main");
  
  if (category === "cards") {
    meta.compendium.discoveredCards.add(id);
  }
  // ... similar for other categories
  
  await db.put("metaProgression", meta, "main");
}
```

### 4.4 State Management (Zustand)

**Game Store:**

```typescript
// stores/gameStore.ts
import create from 'zustand';

interface GameStore {
  // State
  character: Character | null;
  currentPredicate: PredicateCard | null;
  activeTimescale: string;
  turnPhase: TurnPhase;
  availableActions: ActionCard[];
  dicePool: DicePool;
  
  // Actions
  startNewGame: (lifepath: LifepathChoice[]) => void;
  selectAction: (cardId: string) => void;
  selectTarget: (targetId: string) => void;
  rollDice: () => Promise<number>;
  resolveOutcome: (roll: number) => Promise<void>;
  advanceTime: () => void;
  
  // Character management
  updateCharacter: (updates: Partial<Character>) => void;
  addCardToDeck: (cardId: string) => void;
  modifyAffinity: (entity: string, change: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  character: null,
  currentPredicate: null,
  activeTimescale: "Day",
  turnPhase: "scene_display",
  availableActions: [],
  dicePool: { advantageDice: 1, bonusDice: [] },
  
  // Action implementations
  startNewGame: async (lifepath) => {
    const character = await createCharacterFromLifepath(lifepath);
    await saveCharacter(character);
    set({ character, turnPhase: "scene_display" });
  },
  
  selectAction: (cardId) => {
    const card = getActionCard(cardId);
    // Determine if targeted or untargeted
    if (card.actionType === "Targeted") {
      set({ turnPhase: "target_selection" });
    } else {
      set({ turnPhase: "dice_assembly" });
      get().assembleDicePool(cardId);
    }
  },
  
  // ... other actions
}));
```

**Meta Store:**

```typescript
// stores/metaStore.ts
interface MetaStore {
  // State
  graveyard: GraveyardEntry[];
  compendium: Compendium;
  cardUnlocks: Record<string, Record<number, string>>;
  statistics: GameStatistics;
  
  // Actions
  addToGraveyard: (character: Character, causeOfDeath: string) => Promise<void>;
  unlockCard: (baseCardId: string, tier: number, unlockedCardId: string) => Promise<void>;
  discoverContent: (category: string, id: string) => Promise<void>;
  getCompletionPercentage: () => number;
}
```

### 4.5 Web Worker Implementation

**Worker Structure:**

```typescript
// lib/workers/gameEngine.worker.ts
import { PredicateEngine } from '../engine/predicateEngine';
import { ChoiceEngine } from '../engine/choiceEngine';
import { CardEvolutionManager } from '../engine/cardEvolution';

interface WorkerCommand {
  type: string;
  payload: any;
  requestId: string;
}

interface WorkerResponse {
  type: string;
  payload: any;
  requestId: string;
  error?: string;
}

// Initialize engines
const predicateEngine = new PredicateEngine();
const choiceEngine = new ChoiceEngine();
const cardEvolution = new CardEvolutionManager();

// Message handler
self.onmessage = async (event: MessageEvent<WorkerCommand>) => {
  const { type, payload, requestId } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case "RESOLVE_ACTION":
        result = await predicateEngine.resolve(payload);
        break;
        
      case "MAKE_WEIGHTED_CHOICE":
        result = await choiceEngine.choose(payload);
        break;
        
      case "TRACK_FAILURE":
        result = await cardEvolution.trackFailure(payload);
        break;
        
      case "GENERATE_WORLD":
        result = await generateWorld(payload.seed);
        break;
        
      default:
        throw new Error(`Unknown command: ${type}`);
    }
    
    const response: WorkerResponse = {
      type: `${type}_SUCCESS`,
      payload: result,
      requestId
    };
    
    self.postMessage(response);
    
  } catch (error) {
    const response: WorkerResponse = {
      type: `${type}_ERROR`,
      payload: null,
      requestId,
      error: error.message
    };
    
    self.postMessage(response);
  }
};
```

**Main Thread Usage:**

```typescript
// lib/utils/workerClient.ts
class GameEngineClient {
  private worker: Worker;
  private pendingRequests: Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>;
  
  constructor() {
    this.worker = new Worker(
      new URL('../workers/gameEngine.worker.ts', import.meta.url),
      { type: 'module' }
    );
    this.pendingRequests = new Map();
    
    this.worker.onmessage = (event) => {
      const { requestId, payload, error } = event.data;
      const request = this.pendingRequests.get(requestId);
      
      if (request) {
        if (error) {
          request.reject(new Error(error));
        } else {
          request.resolve(payload);
        }
        this.pendingRequests.delete(requestId);
      }
    };
  }
  
  async resolveAction(
    action: string,
    predicate: string,
    roll: number
  ): Promise<Outcome> {
    const requestId = crypto.randomUUID();
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      
      this.worker.postMessage({
        type: "RESOLVE_ACTION",
        payload: { action, predicate, roll },
        requestId
      });
    });
  }
}

export const gameEngine = new GameEngineClient();
```

---

## 5. GAME ENGINE IMPLEMENTATION

### 5.1 Predicate Engine

**Core Logic:**

```typescript
// lib/engine/predicateEngine.ts
export class PredicateEngine {
  private gameContent: GameContent;
  
  constructor() {
    this.gameContent = loadGameContent();
  }
  
  async resolve(params: {
    actionCardId: string;
    predicateCardId: string;
    rollResult: number;
    character: Character;
  }): Promise<Outcome> {
    const { actionCardId, predicateCardId, rollResult, character } = params;
    
    // Get cards
    const actionCard = this.gameContent.actionCards[actionCardId];
    const predicateCard = this.gameContent.predicates[predicateCardId];
    
    // Get outcome logic for this action
    const outcomeRules = predicateCard.outcomeLogic[actionCardId];
    
    if (!outcomeRules) {
      return this.defaultOutcome(actionCard, predicateCard);
    }
    
    // Find matching rule
    const matchingRule = outcomeRules.find(rule => 
      this.evaluateCondition(rule.condition, rollResult, character)
    );
    
    if (!matchingRule) {
      return this.failureOutcome(actionCard, predicateCard, rollResult);
    }
    
    // Execute outcome
    return this.executeOutcome(matchingRule, character);
  }
  
  private evaluateCondition(
    condition: string,
    roll: number,
    character: Character
  ): boolean {
    // Parse condition string: "roll > 10", "roll >= 15 AND hasT trait:devout"
    // Simple parser for MVP, can be expanded
    
    const operators = {
      '>': (a: number, b: number) => a > b,
      '>=': (a: number, b: number) => a >= b,
      '<': (a: number, b: number) => a < b,
      '<=': (a: number, b: number) => a <= b,
      '==': (a: number, b: number) => a === b,
    };
    
    // Example: "roll > 10"
    const match = condition.match(/roll\s*(>|>=|<|<=|==)\s*(\d+)/);
    if (match) {
      const [, operator, value] = match;
      return operators[operator](roll, parseInt(value));
    }
    
    return false;
  }
  
  private async executeOutcome(
    rule: OutcomeRule,
    character: Character
  ): Promise<Outcome> {
    const outcome: Outcome = {
      text: "",
      effects: [],
      stateChanges: {},
      success: true
    };
    
    switch (rule.outcome) {
      case "deal_damage":
        const damage = this.rollDamage(rule.parameters.dice);
        outcome.text = `You deal ${damage} damage!`;
        outcome.effects.push({ type: "damage", value: damage });
        break;
        
      case "gain_resource":
        const resource = rule.parameters.resource;
        const amount = rule.parameters.amount;
        outcome.text = `You gain ${amount} ${resource}!`;
        outcome.effects.push({ type: "gain", resource, value: amount });
        break;
        
      case "change_affinity":
        const entity = rule.parameters.entity;
        const change = rule.parameters.change;
        outcome.text = `${entity} ${change > 0 ? 'likes' : 'dislikes'} you more.`;
        outcome.effects.push({ type: "affinity", entity, value: change });
        break;
        
      case "unlock_location":
        const location = rule.parameters.location;
        outcome.text = `You discovered: ${location}!`;
        outcome.effects.push({ type: "unlock", category: "location", id: location });
        break;
        
      // ... more outcome types
    }
    
    return outcome;
  }
}
```

### 5.2 Universal Choice Engine

**Weighted Random Selection:**

```typescript
// lib/engine/choiceEngine.ts
export class ChoiceEngine {
  private rng: SeededRandom;
  
  constructor(seed?: number) {
    this.rng = new SeededRandom(seed || Date.now());
  }
  
  choose<T>(options: WeightedOption<T>[]): T {
    // Calculate total weight
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    
    // Roll random number
    const roll = this.rng.random() * totalWeight;
    
    // Find selected option
    let cumulative = 0;
    for (const option of options) {
      cumulative += option.weight;
      if (roll <= cumulative) {
        return option.value;
      }
    }
    
    // Fallback (should never reach)
    return options[options.length - 1].value;
  }
  
  modifyWeightsByAffinity(
    options: WeightedOption<any>[],
    affinities: Record<string, number>
  ): WeightedOption<any>[] {
    return options.map(option => {
      let modifiedWeight = option.weight;
      
      // Check if this option has affinity tags
      if (option.affinityTags) {
        for (const tag of option.affinityTags) {
          const affinity = affinities[tag] || 0;
          // Positive affinity increases weight
          // Negative affinity decreases weight
          modifiedWeight += affinity * 0.2; // Scale factor
        }
      }
      
      // Ensure weight doesn't go negative
      modifiedWeight = Math.max(0.1, modifiedWeight);
      
      return {
        ...option,
        weight: modifiedWeight
      };
    });
  }
}

interface WeightedOption<T> {
  value: T;
  weight: number;
  affinityTags?: string[];
}

// Seeded RNG for deterministic world generation
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  random(): number {
    // Simple LCG (Linear Congruential Generator)
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }
}
```

### 5.3 Card Evolution Manager

**Failure Tracking:**

```typescript
// lib/engine/cardEvolution.ts
export class CardEvolutionManager {
  async trackFailure(params: {
    cardId: string;
    characterId: string;
  }): Promise<UnlockResult | null> {
    const { cardId, characterId } = params;
    
    // Load card definition
    const card = await getActionCard(cardId);
    
    // Load progress
    const progress = await getCardProgress(cardId);
    
    // Increment failure count
    progress.failureCount += 1;
    
    // Check each tier in order
    for (let i = 0; i < card.failureField.length; i++) {
      const tier = card.failureField[i];
      
      // Skip if already used
      if (progress.tiersUsed[i]) {
        continue;
      }
      
      // Check if threshold met
      if (progress.failureCount >= tier.requiresFailures) {
        // Mark tier as used
        progress.tiersUsed[i] = true;
        
        // Save progress
        await saveCardProgress(cardId, progress);
        
        // Return unlock options
        return {
          unlocked: true,
          tier: i,
          pool: tier.pool,
          cardId: cardId
        };
      }
    }
    
    // No unlock this time, just save progress
    await saveCardProgress(cardId, progress);
    return null;
  }
  
  async selectUnlock(params: {
    cardId: string;
    tier: number;
    selectedCard: string;
  }): Promise<void> {
    const { cardId, tier, selectedCard } = params;
    
    // Update meta-progression
    const meta = await getMetaProgression();
    
    if (!meta.cardUnlocks[cardId]) {
      meta.cardUnlocks[cardId] = {};
    }
    
    meta.cardUnlocks[cardId][tier] = selectedCard;
    
    await saveMetaProgression(meta);
    
    // Discover in compendium
    await discoverContent("cards", selectedCard);
  }
}
```

---

## 6. DEPLOYMENT & BUILD CONFIGURATION

### 6.1 Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@types': path.resolve(__dirname, './src/types'),
    }
  },
  
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'state-vendor': ['zustand'],
          'game-engine': [
            './src/lib/engine/predicateEngine.ts',
            './src/lib/engine/choiceEngine.ts',
            './src/lib/engine/cardEvolution.ts',
          ]
        }
      }
    }
  },
  
  worker: {
    format: 'es'
  }
});
```

### 6.2 Netlify Configuration

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer"
```

### 6.3 Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint src --ext ts,tsx",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 7. PERFORMANCE OPTIMIZATION

### 7.1 Code Splitting Strategy

**Lazy Load Non-Critical Screens:**
```typescript
// App.tsx
const CompendiumScreen = lazy(() => import('./components/screens/CompendiumScreen'));
const GraveyardScreen = lazy(() => import('./components/screens/GraveyardScreen'));
const SettingsScreen = lazy(() => import('./components/screens/SettingsScreen'));
```

**Critical Path:**
- Main Menu (immediate)
- Lifepath (immediate)
- Game Loop (immediate)

**Lazy Loaded:**
- Compendium (accessed less frequently)
- Graveyard (accessed less frequently)
- Settings (accessed rarely)

### 7.2 IndexedDB Optimization

**Batch Operations:**
```typescript
async function batchUpdateCompendium(
  discoveries: Array<{ category: string; id: string }>
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(["compendium", "metaProgression"], "readwrite");
  
  for (const { category, id } of discoveries) {
    const meta = await tx.objectStore("metaProgression").get("main");
    meta.compendium[`discovered${category}`].add(id);
    await tx.objectStore("metaProgression").put(meta, "main");
  }
  
  await tx.done;
}
```

**Caching Strategy:**
```typescript
// Cache game content in memory after first load
let cachedGameContent: GameContent | null = null;

async function getGameContent(): Promise<GameContent> {
  if (cachedGameContent) {
    return cachedGameContent;
  }
  
  const db = await openDB();
  const content = await db.getAll("gameContent");
  
  cachedGameContent = {
    actionCards: indexBy(content.filter(c => c.type === "action"), "id"),
    predicates: indexBy(content.filter(c => c.type === "predicate"), "id"),
    traits: indexBy(content.filter(c => c.type === "trait"), "id"),
  };
  
  return cachedGameContent;
}
```

### 7.3 React Performance

**Memoization:**
```typescript
// Expensive components should be memoized
export const ActionWheel = memo(({ actions, onSelect }: ActionWheelProps) => {
  // Component implementation
});

// Expensive computations should use useMemo
const availableActions = useMemo(() => {
  return filterActionsByTags(allActions, currentTags, timescale);
}, [allActions, currentTags, timescale]);
```

**Virtual Scrolling:**
```typescript
// For long lists (Graveyard, Compendium)
// Use react-window or similar
import { FixedSizeList } from 'react-window';

const GraveyardList = ({ entries }: { entries: GraveyardEntry[] }) => (
  <FixedSizeList
    height={600}
    itemCount={entries.length}
    itemSize={80}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <GraveyardEntryCard entry={entries[index]} />
      </div>
    )}
  </FixedSizeList>
);
```

---

## 8. TESTING STRATEGY

### 8.1 Unit Tests

**Test Coverage Targets:**
- Predicate Engine: 90%+
- Choice Engine: 95%+
- Card Evolution: 90%+
- Dice System: 95%+
- State Stores: 80%+

**Example Test:**
```typescript
// tests/unit/predicateEngine.test.ts
import { describe, it, expect } from 'vitest';
import { PredicateEngine } from '@/lib/engine/predicateEngine';

describe('PredicateEngine', () => {
  it('resolves successful combat action', async () => {
    const engine = new PredicateEngine();
    
    const result = await engine.resolve({
      actionCardId: 'quick_attack',
      predicateCardId: 'gnarled_woods',
      rollResult: 15,
      character: mockCharacter
    });
    
    expect(result.success).toBe(true);
    expect(result.effects).toContainEqual({
      type: 'damage',
      value: expect.any(Number)
    });
  });
  
  it('handles failure and tracks for unlocks', async () => {
    const engine = new PredicateEngine();
    
    const result = await engine.resolve({
      actionCardId: 'quick_attack',
      predicateCardId: 'gnarled_woods',
      rollResult: 3,
      character: mockCharacter
    });
    
    expect(result.success).toBe(false);
    // Verify failure was tracked
    const progress = await getCardProgress('quick_attack');
    expect(progress.failureCount).toBeGreaterThan(0);
  });
});
```

### 8.2 Integration Tests

**Critical Paths to Test:**
- Character creation → first turn
- Action selection → dice roll → outcome
- Character death → graveyard entry
- Card unlock flow → deck addition
- Save/load cycle

### 8.3 Manual Testing Checklist

- [ ] Game loads in <3 seconds
- [ ] Offline mode works (airplane mode test)
- [ ] Save persists after browser restart
- [ ] All screens render correctly on mobile
- [ ] Touch targets are ≥44px
- [ ] No console errors during normal play
- [ ] Memory usage stays <300MB
- [ ] Frame rate stays ≥30 FPS

---

## 9. MIGRATION & VERSIONING

### 9.1 Save Data Versioning

**Version Structure:**
```typescript
interface SaveData {
  version: number;  // e.g., 1, 2, 3
  data: any;
}
```

**Migration System:**
```typescript
// lib/persistence/migrations.ts
const migrations: Record<number, (data: any) => any> = {
  1: (data) => {
    // v0 → v1: Add affinity tracking
    return {
      ...data,
      affinities: {}
    };
  },
  
  2: (data) => {
    // v1 → v2: Restructure card progress
    return {
      ...data,
      cardProgress: Object.entries(data.oldCardProgress).map(
        ([id, count]) => ({ id, failureCount: count, tiersUsed: [] })
      )
    };
  }
};

export async function migrateSave(
  save: SaveData,
  targetVersion: number
): Promise<SaveData> {
  let currentVersion = save.version || 0;
  let data = save.data;
  
  while (currentVersion < targetVersion) {
    const migration = migrations[currentVersion + 1];
    if (!migration) {
      throw new Error(`No migration from v${currentVersion}`);
    }
    
    data = migration(data);
    currentVersion++;
  }
  
  return { version: targetVersion, data };
}
```

### 9.2 Content Updates

**Hot-Reload Content:**
```typescript
// Update game content without changing code
async function updateGameContent(newContentUrl: string): Promise<void> {
  const response = await fetch(newContentUrl);
  const newContent = await response.json();
  
  // Validate content structure
  validateGameContent(newContent);
  
  // Update IndexedDB
  const db = await openDB();
  const tx = db.transaction("gameContent", "readwrite");
  const store = tx.objectStore("gameContent");
  
  await store.clear();
  
  for (const item of newContent) {
    await store.put(item);
  }
  
  await tx.done;
  
  // Clear cache
  cachedGameContent = null;
  
  console.log("Game content updated!");
}
```

---

## 10. SECURITY & PRIVACY

### 10.1 Data Privacy

**Principles:**
- All data stays local (IndexedDB)
- No telemetry unless user explicitly enables
- No third-party analytics
- No ad tracking
- No external API calls

**User Rights:**
- Export all data (JSON)
- Delete all data (clear IndexedDB)
- View all stored data

### 10.2 Save File Integrity (Optional)

```typescript
// lib/persistence/integrity.ts
import { createHash } from 'crypto';

function generateChecksum(data: any): string {
  const json = JSON.stringify(data);
  return createHash('sha256').update(json).digest('hex');
}

export function signSaveData(data: any): SignedSaveData {
  const checksum = generateChecksum(data);
  return { data, checksum };
}

export function verifySaveData(
  signedData: SignedSaveData
): { valid: boolean; data: any } {
  const expectedChecksum = generateChecksum(signedData.data);
  const valid = expectedChecksum === signedData.checksum;
  
  if (!valid) {
    console.warn("Save file may have been tampered with");
  }
  
  return { valid, data: signedData.data };
}
```

---

## 11. DEBUGGING & DEVELOPMENT TOOLS

### 11.1 Development Mode Features

```typescript
// lib/utils/devTools.ts
export const devTools = {
  enabled: import.meta.env.DEV,
  
  // Skip to any screen
  navigateTo(screen: string) {
    if (!this.enabled) return;
    // Implementation
  },
  
  // Give character any card
  giveCard(cardId: string) {
    if (!this.enabled) return;
    // Implementation
  },
  
  // Set affinity
  setAffinity(entity: string, value: number) {
    if (!this.enabled) return;
    // Implementation
  },
  
  // Unlock all content
  unlockAll() {
    if (!this.enabled) return;
    // Implementation
  },
  
  // View current game state
  dumpState() {
    if (!this.enabled) return;
    console.log(JSON.stringify(useGameStore.getState(), null, 2));
  }
};

// Expose to window in dev mode
if (import.meta.env.DEV) {
  (window as any).devTools = devTools;
}
```

### 11.2 Performance Monitoring

```typescript
// lib/utils/performance.ts
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  
  start(label: string) {
    this.marks.set(label, performance.now());
  }
  
  end(label: string): number {
    const start = this.marks.get(label);
    if (!start) return 0;
    
    const duration = performance.now() - start;
    
    if (import.meta.env.DEV) {
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }
    
    this.marks.delete(label);
    return duration;
  }
}

export const perf = new PerformanceMonitor();
```

---

## 12. DEPLOYMENT CHECKLIST

**Pre-Deployment:**
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Bundle size <600KB
- [ ] No console errors in production build
- [ ] IndexedDB migrations tested
- [ ] Offline mode verified
- [ ] Mobile responsiveness checked
- [ ] Performance metrics captured

**Deployment:**
- [ ] Push to main branch
- [ ] Netlify auto-deploys
- [ ] Verify deploy preview
- [ ] Test deployed version
- [ ] Monitor for errors

**Post-Deployment:**
- [ ] Test on real mobile devices
- [ ] Verify save/load functionality
- [ ] Check bundle loading times
- [ ] Monitor error logs (if enabled)

---

## END OF ARCHITECTURE DOCUMENT

This document defines the complete technical architecture for Aelun Awakened. All implementation details, patterns, and technical decisions are specified here.

**Maintenance:**
- Update when architecture changes
- Keep design decisions in GDD
- Keep UI details in UI specification
- This document = "how to build it"

**Version Control:**
- v1.0 - October 26, 2025 - Initial consolidated master document
