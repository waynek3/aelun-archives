# AELUN AWAKENED - FINAL GAME DESIGN DOCUMENT
**Single Source of Truth for Game Design**

**Project Status:** Pre-Production (Sprint 1)  
**Document Version:** Final Consolidated v1.0  
**Last Updated:** October 27, 2025  
**Target Platform:** Portrait Mobile (iOS/Android) - 100% Offline

---

## DOCUMENT PURPOSE

This is the authoritative game design document for Aelun Awakened. All game mechanics, systems, content design, player experience, and design philosophy are defined here. AI agents implementing this game should reference this document for all game design decisions.

---

## 1. EXECUTIVE SUMMARY

### 1.1 Core Concept

Aelun Awakened is a single-player, 100% offline, narrative deck-building roguelite for portrait mobile devices. The game's unique mechanic is the **Predicate Card System**—a "dual-deck" interaction model where players use an evolving **Action Deck** (representing abilities and skills) to interact with a world presented as a **Predicate Deck** (representing locations, situations, and events).

### 1.2 Core Fantasy

"What if I could go back and try it again?" The player's excitement comes from discovering that while they *can* replay the world, randomness and emergent systems ensure every run is fundamentally different—creating new stories and synergies rather than replaying the same one.

### 1.3 Key Features

- **Dual-Deck System:** Action Cards (player abilities) interact with Predicate Cards (world situations)
- **Permadeath Roguelite:** Characters die permanently, but meta-progression persists
- **Failure-Driven Progression:** Failing with cards unlocks new, better cards across all runs
- **Interactive Lifepath:** Create unique characters through branching choice-based creation
- **Persistent Meta-Progression:** Graveyard (character history) and Compendium (encyclopedia of discoveries)
- **100% Offline:** All data stored locally, no internet required
- **DOS Aesthetic:** Retro terminal-style UI with ASCII/Unicode art

### 1.4 Target Audience

**Primary:**
- Players who enjoy roguelike/roguelite games (Hades, FTL, Slay the Spire)
- Players with nostalgia for retro/DOS-era games
- Players who value emergent, replayable experiences over linear narratives

**Secondary:**
- Deck-building game enthusiasts
- Players interested in procedural generation and systemic design
- Indie game enthusiasts

---

## 2. CORE DESIGN PILLARS

These five pillars guide all design decisions:

### 2.1 Emergence Over Linearity
Systems interact to create unpredictable, story-rich moments rather than predetermined narratives. The game creates stories through systemic interactions, not scripted sequences.

### 2.2 Accessibility Through Depth
Simple core loop that scales into complex, interconnected systems. Easy to learn, difficult to master.

### 2.3 Replayability Through Randomness
Procedural world generation, deck evolution, and trait systems ensure each run is unique.

### 2.4 Local & Persistent
100% offline with local save data that persists across runs (Graveyard, Compendium, card unlocks).

### 2.5 Retro Charm
DOS-era aesthetic grounds the game in timeless, performance-efficient design.

---

## 3. CORE GAMEPLAY LOOP

### 3.1 The Predicate Engine: Six-Step Turn Flow

Every action in the game follows this standardized, turn-based cycle:

**STEP 1: SET THE SCENE**
- The **Active Predicate Card** defines the entire context
- Outputs: Scene Tags, Timescale, Current State

**STEP 2: BUILD THE ACTION WHEEL**
- Engine filters player's Action Deck against Scene Tags and Timescale
- Only matching cards displayed as available options

**STEP 3: IDENTIFY ACTION TYPES**
- Each card identified as Untargeted (acts on scene) or Targeted (requires target selection)

**STEP 4: PLAYER CHOOSES ACTION**
- Player selects one action card
- If Targeted, player selects target Predicate Card
- Player can duplicate cards to add advantage dice

**STEP 5: BUILD THE DICE POOL**
- **Advantage Dice (d20s):** Number determined by duplicate cards played (keep highest)
- **Bonus Dice (d4s, d6s):** Added to final d20 result from stats, traits, jobs, affinities

**STEP 6: RESOLVE OUTCOME**
- Player rolls dice pool
- Roll Result passed to Active Predicate Card's Outcome Logic
- Outcomes: stat changes, flag sets, scene transitions, card unlocks

### 3.2 Example Turn Sequence

```
1. SCENE: "The Gnarled Woods" (Tags: [Forest, Wilderness, Dangerous], Timescale: [Day])
2. ACTION WHEEL: Shows "Travel...", "Take It In", "Quick Attack", "Pray"
3. PLAYER: Selects "Quick Attack" (Untargeted, Combat action)
4. DICE POOL: 1d20 (base) + 1d4 (Strength) + 1d4 (Warrior trait)
5. ROLL: 14 (d20) + 3 (d4) + 2 (d4) = 19
6. OUTCOME: "You strike the goblin! Deal 1d6 damage. Goblin counterattacks..."
```

---

## 4. CARD SYSTEMS

### 4.1 Action Cards (Player Abilities)

**Definition:** Skills, abilities, or actions the player can take. The "verbs" of the game.

**Card Structure:**
```
- Card Name: "Quick Attack"
- Action Type: Untargeted | Targeted
- Tags: [Combat, Physical, Basic]
- Timescales: [Encounter]
- Dice Modifier: "+1d4" (optional)
- Failure Field: Array of unlock tiers (see Section 4.3)
- Description: Flavor text
```

**Core Action Cards (MVP):**

| Card Name | Action Type | Tags | Timescales | Description |
|-----------|------------|------|-----------|-------------|
| Pray | Targeted | [Universal] | [AllScales] | Pray to your chosen deity |
| Travel... | Targeted | [Universal] | [Day, 3-Hour, 20-Min] | Move to a new location |
| Take It In | Untargeted | [Universal] | [Day, 3-Hour, 20-Min] | Observe surroundings |
| Work | Untargeted | [Homestead] | [Day, 3-Hour] | Perform mundane work |
| Quick Attack | Untargeted | [Combat] | [Encounter] | Fast, low-damage attack |

### 4.2 Predicate Cards (The World)

**Definition:** Locations, events, situations, or "nouns" in the game world. The canvas on which actions are resolved.

**Card Structure:**
```
- Card Name: "The Gnarled Woods"
- Scene Tags: [Forest, Wilderness, Dangerous]
- Timescale: [Day]
- Outcome Logic: Table of (Action + Roll) → Outcome mappings
- State Flags: Conditions affecting this location
- Available Exits: List of connected Predicate Cards
```

**Predicate Categories:**
- **Homestead:** Safe locations (home, inn, monastery)
- **Wilderness:** Travel locations (forests, roads, mountains)
- **Settlement:** Social locations (towns, villages, cities)
- **Dungeon:** Dangerous locations (caves, ruins, crypts)
- **Event:** Temporary situations (ambush, merchant, ritual)

### 4.3 Card Unlock System: Failure Fields

**Core Mechanic:** Failing with a card unlocks better cards through tiered progression.

**Data Structure:**
```typescript
failureField: [
  {
    tier: 0,
    requiresFailures: 1,        // Fails needed to trigger
    maxUnlocks: 1,              // Times this tier can unlock
    pool: ["Quick Attack +1", "Riposte"]  // Available unlocks
  },
  {
    tier: 1,
    requiresFailures: 3,
    maxUnlocks: 1,
    pool: ["Flurry of Blows", "Counter-Attack"]
  }
]
```

**Unlock Process:**
1. Player fails roll using "Quick Attack"
2. Failure counter increments (now at 1)
3. Check Tier 0: requires 1 failure → UNLOCKED
4. Player chooses one card from pool: ["Quick Attack +1", "Riposte"]
5. Selected card added to Action Deck permanently
6. Tier 0 marked as used (can't unlock again unless maxUnlocks modified)

**Design Notes:**
- Failures accumulate across ALL runs (meta-progression)
- Cards unlocked in one run remain unlocked forever
- Different Lifepaths have different failure field designs:
  - **Wanderer:** Broad, short chains (exploration)
  - **Soldier:** Deep, focused chains (specialization)
  - **Priest/Scholar:** Conditional chains (affinity-gated)

**Post-MVP Extensions:**
- Conditional tiers (requires affinity, lifepath, or meta-unlocks)
- Variable maxUnlocks (meta-progression increases unlock opportunities)
- Dynamic pool modification (equipment/items affect available cards)
- Meta-items that affect failure fields globally

---

## 5. CHARACTER SYSTEMS

### 5.1 Lifepath Character Creation

**Concept:** Interactive character creation through meaningful choices that define starting conditions.

**Process:**
1. **Origin Question:** "Where did you grow up?"
   - Options: Village, City, Wilderness, Monastery, etc.
   - Sets: Starting location, 1-2 traits, initial stats

2. **Formative Event:** "What shaped your youth?"
   - Options: War, Loss, Discovery, Betrayal, etc.
   - Sets: Additional traits, affinity modifiers, special cards

3. **Recent Past:** "What brought you to Aelun?"
   - Options: Quest, Exile, Wanderlust, Duty, etc.
   - Sets: Starting job, deity relationship, final stats

4. **Deity Selection:** "Who watches over you?"
   - Options: God of War, Forest Spirits, None, etc.
   - Sets: Starting divine affinity, deity-specific prayer outcomes

**Outputs:**
- Character name and backstory summary
- Starting stats (6 base stats TBD: Strength, Insight, Charisma, etc.)
- Starting traits (3-5 traits)
- Starting Action Deck (5-10 cards based on choices)
- Starting affinities (faction/deity relationships)
- Starting location in world

**Design Goals:**
- 10-20 total Lifepath variations (MVP: 2-3)
- Each creates distinct playstyle
- Replayability through different choices
- No "bad" choices—all viable

### 5.2 Stats System

**Six Base Stats:** (Exact names and scale TBD in content phase)

Example structure:
- **Strength:** Physical power, melee damage
- **Agility:** Speed, evasion, ranged attacks
- **Insight:** Perception, magic, understanding
- **Charisma:** Social influence, negotiation
- **Fortitude:** Health, stamina, resistance
- **Will:** Mental strength, faith, determination

**Stat Usage:**
- Add bonus dice to relevant rolls (e.g., +1d4 per stat point)
- Scale: 0-5 for MVP (0 = no bonus, 5 = +5d4)
- Modified by traits, jobs, equipment (post-MVP)

### 5.3 Traits System

**Definition:** Dynamic attributes that grant passive effects or triggered events.

**Trait Structure:**
```
- Name: "Devout"
- Type: Passive | Triggered
- Effect: "+1d4 to all Divine actions"
- Acquisition: From Lifepath or gameplay events
- Stackable: Yes/No
```

**Trait Categories:**
- **Background:** From Lifepath (permanent)
- **Situational:** Temporary effects (buffs/debuffs)
- **Achievement:** Unlocked through gameplay

**Examples:**
- "Devout" → +1d4 to Divine actions
- "Scarred" → -1 to social rolls, +1 to intimidation
- "Lucky" → Reroll one die per day
- "Outlaw" → Negative affinity with law enforcement

### 5.4 Hidden Affinities System

**Definition:** Numerical relationship tracking between player and entities (factions, deities, NPCs).

**Affinity Entities:**
- **Factions:** Silver Hand Bandits, The Monastery, Warrior's Guild
- **Deities:** God of War, Forest Spirits, Death God
- **NPCs:** Named characters with persistent relationships

**Affinity Scale:** -10 to +10 (or 0-100, TBD in content phase)

**How Affinities Work:**

**ACCUMULATION:**
- Actions affect affinities (e.g., "Pray" → +1 Divine Affinity)
- Quest completion modifies faction standing
- Location discovery affects entity relationships
- Combat outcomes change faction opinions

**UNIVERSAL CHOICE ENGINE WEIGHTING:**
```
Example:
Player encounters tavern NPC
Base pool: ["Buy drink", "Play dice", "Start fight", "Negotiate"]

With Silver Hand Affinity: 5, Monastery Affinity: 2
Weighted pool:
- "Buy drink" (neutral) → weight 1
- "Play dice" (neutral) → weight 1  
- "Start fight" (criminal) → weight 2 (+1 from Silver Hand)
- "Negotiate" (peaceful) → weight 1.5 (+0.5 from Monastery)

Engine rolls weighted random → "Start Fight" (criminals are friendlier)
```

**THRESHOLD UNLOCKS:**
```
Divine Affinity < 3: "Pray" available
Divine Affinity >= 3: "Divine Blessing" unlocks
Divine Affinity >= 5: "Miracle" unlocks
Divine Affinity < 0: "Blasphemy" unlocks
```

**VISIBILITY OPTION (RECOMMENDED: SEMI-VISIBLE):**

During Play:
- Notifications show changes: "Divine Affinity +1"
- Action hints: "(Monastery favors this option)"
- Outcome explanations: "(Silver Hand approved)"

In Compendium (Post-Run):
```
DISCOVERED RELATIONSHIPS:
├─ Divine Forces
│  └─ Current: +3, Peak: +5
├─ Silver Hand (Faction)
│  └─ Current: +2, Peak: +4
└─ The Monastery (Faction)
   └─ Current: -1, Peak: +2
```

Benefits:
- Players learn system through play
- Veterans can strategize
- Balances mystery with transparency
- Post-run review creates "aha" moments

### 5.5 Jobs System (Post-MVP)

**Definition:** Acquired roles that grant passive bonuses and unlock job-specific actions.

**Job Acquisition:** Through gameplay (not Lifepath)
- Complete apprenticeship quest
- Demonstrate mastery of skills
- Faction sponsorship

**Examples:**
- "Blacksmith" → +1d6 to crafting, unlocks "Forge" action
- "Hedge Witch" → +1d4 to nature magic, unlocks "Brew Potion"
- "Caravan Guard" → +1d4 to combat, +1 to travel safety

---

## 6. WORLD & SYSTEMS

### 6.1 Timescales

**Purpose:** Control which actions are available and how much time passes per turn.

**Four Timescales:**

1. **Day** (24 hours per turn)
   - High-level decisions
   - Travel between regions
   - Long-term activities (farming, crafting)

2. **3-Hour Block** (3 hours per turn)
   - Local exploration
   - Short tasks
   - Regional movement

3. **20-Minute Scene** (20 minutes per turn)
   - Detailed exploration
   - Conversations
   - Setup actions

4. **Encounter** (seconds per turn)
   - Combat
   - Crisis situations
   - Immediate danger

**Timescale Transitions:**
- Automatic: Combat encounter starts → switch to Encounter timescale
- Player choice: "Rest" action → advance time to next Day
- Predicate-driven: "Long Journey" → multiple Days pass

### 6.2 World Generation

**Semi-Procedural Approach:**
- Core locations hand-designed (cities, major landmarks)
- Wilderness areas procedurally placed
- Quest chains semi-randomized
- NPC placement varied

**World Seed:** Each new character generates unique world from seed
- Same seed = same world geography
- Different seeds = different layout, quest availability
- Player never sees seed (hidden complexity)

**World Structure:**
- **Hex Map:** High-level overworld (20-40 hexes)
- **Region Detail:** Each hex contains 3-10 Predicate Cards
- **Fast Travel:** Unlocked locations accessible via "Travel" action

### 6.3 Content Loops (Optional Playstyles)

**Philosophy:** Loops are optional and buffet-style. Players choose engagement level.

**Loop 1: Farming/Homestead**
- Goal: Build sustainable home base
- Activities: Work, Harvest, Trade, Craft
- Rewards: Resource accumulation, peaceful progression
- Can be ignored entirely or pursued exclusively

**Loop 2: Faith/Divine**
- Goal: Build relationship with deity
- Activities: Pray, Ritual, Temple questing
- Rewards: Divine blessings, miracles, god-specific cards
- Optional based on player interest

**Loop 3: Combat/Exploration**
- Goal: Defeat enemies, discover locations
- Activities: Fight, Travel, Loot, Quest
- Rewards: Combat mastery, loot, affinity with martial factions
- Most universally engaged but not required

**Loop 4: Social/Faction**
- Goal: Build reputation with factions
- Activities: Negotiate, Persuade, Quest for factions
- Rewards: Faction-specific actions, political power
- Enables alternative win conditions

**Design Principle:** Players naturally gravitate to 1-2 loops based on Lifepath and interests. All loops viable. None mandatory.

---

## 7. COMBAT SYSTEM

### 7.1 Combat Encounters

**Simplified Design:**
- Typical combat: 1-2 action exchanges (quick resolution)
- Boss/special combat: 3-7 action exchanges (extended challenge)
- No movement mechanics (positional complexity removed)
- Focus on action selection and dice management

**Combat Flow:**
1. Encounter starts → switch to Encounter timescale
2. Action Wheel shows combat-tagged cards only
3. Player chooses action (Attack, Defend, Special)
4. Dice pool built and rolled
5. Outcome resolved (damage, status effects, enemy action)
6. Repeat until combat ends (victory, flee, or death)

**Enemy Count:**
- Most encounters: 1-3 enemies
- Large battles: 4-5 enemies (rare)
- Each enemy has simple HP and 2-3 attack patterns

**Combat Outcomes:**
- **Victory:** Loot, affinity changes, card unlock chance
- **Flee:** Escape with penalties (injuries, lost resources)
- **Death:** Permadeath → Graveyard entry → new character

### 7.2 Death & Failure Mechanics

**PERMADEATH:**
- Character death is permanent
- No resurrection, no rewind
- Character added to Graveyard (permanent log)

**WHAT PERSISTS (Meta-Progression):**
- Graveyard: All past characters' stories and achievements
- Compendium: All discovered content (cards, locations, lore)
- Card Unlocks: All unlocked cards from failure fields
- Affinity Knowledge: Discovered faction/deity relationships (but not scores)

**WHAT RESETS:**
- Character stats, traits, inventory
- Current world state, flags, quest progress
- Specific relationships (must rebuild from zero)
- Current Action Deck (restart with Lifepath deck)

**GRAVEYARD ENTRY:**
```
CHARACTER: Kael the Wanderer
LIFEPATH: Village → War → Exile → None
SURVIVED: 45 turns (15 Days)
DIED: Ambushed by bandits in Gnarled Woods
ACHIEVEMENTS: 
- Discovered Silver Hand hideout
- Unlocked "Riposte" (Quick Attack failure)
- Peak Divine Affinity: +5
```

---

## 8. META-PROGRESSION PHILOSOPHY

### 8.1 Three Phases of Discovery

**PHASE 1: LEARNING (Runs 1-5)**
- Goal: Understand core systems
- Discovery: Basic mechanics, initial cards, simple failure chains
- Unlocks: First-tier cards from common actions
- Experience: Frequent deaths, rapid learning

**PHASE 2: EXPLORATION (Runs 6-40)**
- Goal: Discover content breadth
- Discovery: All Lifepaths, locations, factions, deities
- Unlocks: Deeper failure chains, conditional cards
- Experience: Intentional character builds, strategy emerges

**PHASE 3: REFINEMENT (Runs 40+)**
- Goal: Master systems, complete Compendium
- Discovery: Rare combinations, hidden synergies, edge cases
- Unlocks: Deepest failure tiers, meta-items (post-MVP)
- Experience: Perfect builds, challenge runs, self-imposed goals

### 8.2 Asymptotic Win Condition

**Primary Goal:** Complete the Compendium (100% discovery)

**No Traditional "Win State":**
- No final boss that ends the game
- No credits roll that stops play
- Game is asymptotic: approaching but never fully completing

**Compendium Categories:**
- **Action Cards:** Discover all cards through failures
- **Predicate Cards:** Visit all locations across runs
- **Traits:** Acquire all possible traits
- **Affinities:** Discover all factions/deities/NPCs
- **Lore Entries:** Unlock all story fragments

**Completion Reality:**
- True 100% completion extremely difficult (by design)
- Most players reach 60-80% (dozens of hours)
- Hardcore players chase 95%+ (hundreds of hours)
- Perfect 100% reserved for most dedicated

**Secondary Goals:**
- Challenge runs (no-death streak, speedrun, specific build)
- Graveyard diversity (different Lifepaths, playstyles)
- Personal narrative goals (roleplay-driven objectives)

### 8.3 The Compendium

**Purpose:** Permanent encyclopedia of all discovered content.

**Structure:**
```
COMPENDIUM
├─ ACTION CARDS (45/120 Discovered)
│  ├─ Combat Cards (12/30)
│  ├─ Social Cards (8/25)
│  ├─ Divine Cards (5/15)
│  └─ Universal Cards (20/50)
│
├─ PREDICATE CARDS (23/60 Discovered)
│  ├─ Homesteads (3/5)
│  ├─ Wilderness (12/30)
│  ├─ Settlements (5/15)
│  └─ Dungeons (3/10)
│
├─ TRAITS (18/45 Discovered)
├─ AFFINITIES (7/20 Discovered)
└─ LORE (34/80 Fragments)
```

**Discovery Mechanics:**
- Card discovered when first acquired/unlocked
- Location discovered when first visited
- Trait discovered when first acquired
- Affinity discovered when first interaction occurs
- Lore discovered through specific actions/locations

**Compendium Display:**
- Entry name, description, unlock method
- Usage stats (times used, success rate)
- Failure progress (for Action Cards)
- Related entries (connected content)

---

## 9. CONTENT DESIGN GUIDELINES

### 9.1 Content Scale (MVP)

**MVP Targets:**
- **Action Cards:** 30-50 unique cards
- **Predicate Cards:** 20-40 unique locations/events
- **Traits:** 15-30 unique traits
- **Lifepaths:** 2-3 complete paths
- **Affinities:** 5-10 entities (factions/deities)

**Expansion Targets (Post-MVP):**
- 100+ Action Cards
- 60+ Predicate Cards
- 45+ Traits
- 6+ Lifepaths
- 20+ Affinity entities

### 9.2 Writing Guidelines

**Tone:**
- Serious but not grimdark
- Grounded fantasy (no absurdism)
- Player agency emphasized
- Consequences meaningful but not punishing

**Text Length:**
- Scene descriptions: 2-4 sentences
- Card descriptions: 1-2 sentences
- Outcome text: 1-3 sentences
- Lore fragments: 3-5 sentences

**Voice:**
- Second person ("You enter the woods")
- Present tense ("The goblin lunges")
- Active voice (minimize passive constructions)

### 9.3 Balance Principles

**Dice Scaling:**
- Base d20 for all actions
- Bonus dice (d4, d6) scale with character strength
- Typical roll: 1d20 + 2-5 bonus dice
- DC ranges: 5-10 (easy), 11-15 (medium), 16-20 (hard), 21+ (very hard)

**Failure Rate Design:**
- Early game: 40-60% failure rate (rapid unlocks)
- Mid game: 30-40% failure rate (steady unlocks)
- Late game: 20-30% failure rate (rare unlocks create excitement)

**Resource Pacing:**
- HP/resources regenerate through rest
- No grinding required (anti-grind design)
- Progression through exploration, not repetition

---

## 10. TECHNICAL DESIGN INTEGRATION POINTS

These sections define where game design interfaces with technical implementation:

### 10.1 Data Structures Required

**Minimum Viable Data Models:**
- ActionCard (with failureField array)
- PredicateCard (with outcomeLogic table)
- Character (stats, traits, deck, progress)
- CardProgress (failureCount, tiersUsed per card)
- MetaProgression (graveyard, compendium, unlocks)
- WorldState (current location, flags, time)
- AffinityScores (entity relationships)

### 10.2 Save Data Requirements

**Per-Character Save:**
- Character definition (stats, traits, name, lifepath)
- Current Action Deck
- Current location and world state
- Affinity scores for this character
- Card progress (failure counts, unlocks used)
- Time played, turns taken

**Meta-Progression Save:**
- Graveyard (all past characters)
- Compendium (all discovered content)
- Global card unlocks (failure field tiers)
- Settings and preferences

**Save Versioning:**
- All saves must be versioned
- Migration system for format changes
- Backward compatibility for 2-3 versions

### 10.3 Performance Targets

**Load Times:**
- Game launch: <3 seconds
- Save/Load: <1 second
- Scene transitions: <500ms
- Dice roll resolution: <200ms

**Memory:**
- Maximum memory usage: <300MB
- Content database: <50MB
- Save file size: <5MB per character

**Frame Rate:**
- Maintain 60 FPS during normal play
- 30 FPS minimum during complex animations
- Web Worker offloads heavy computation

---

## 11. DESIGN QUESTIONS & DECISIONS

### 11.1 Resolved Design Decisions

âœ" **Permadeath:** Yes, with meta-progression persistence  
âœ" **Failure unlocks cards:** Yes, tiered failure field system  
âœ" **Affinity visibility:** Semi-visible (notifications + Compendium)  
âœ" **Combat complexity:** Simplified (1-2 actions typical)  
âœ" **Win condition:** Asymptotic (Compendium completion)  
âœ" **Content loops:** Optional, buffet-style engagement  
âœ" **Card unlock structure:** Tiered pools with requiresFailures counters  

### 11.2 Remaining Open Questions (Content Phase)

**Character Systems:**
- [ ] Exact stat names and scale (0-5? 1-10?)
- [ ] Number of starting traits per Lifepath
- [ ] Job system details (active abilities vs passive bonuses?)

**Content & Balance:**
- [ ] Specific DC values for common actions
- [ ] Exact failure chains for each MVP card
- [ ] Complete Affinity entity list with threshold values
- [ ] Damage formulas and HP scaling

**World & Lore:**
- [ ] Full faction/deity list with personalities
- [ ] World geography details
- [ ] Major NPC names and roles
- [ ] Lore fragment distribution

---

## 12. APPENDICES

### Appendix A: Glossary of Terms

- **Action Card:** Card representing player ability/skill
- **Action Deck:** Player's collection of Action Cards
- **Action Type:** Targeted (needs target) or Untargeted (acts on scene)
- **Affinity:** Hidden relationship score with faction/deity/NPC
- **Compendium:** Encyclopedia of all discovered content
- **Dice Pool:** Collection of dice rolled for action resolution
- **Encounter:** Closest/fastest timescale (combat, immediate danger)
- **Failure Field:** Tiered unlock system triggered by card failures
- **Graveyard:** Log of all past characters and achievements
- **Lifepath:** Interactive character creation system
- **Meta-Progression:** Persistent advancement across character deaths
- **Permadeath:** Character death is permanent and final
- **Predicate Card:** Card representing location/event/situation
- **Predicate Deck:** World's collection of Predicate Cards
- **Predicate Engine:** Core system resolving (Action + Roll) outcomes
- **Scene Tags:** Keywords defining current location's properties
- **Timescale:** Duration of single turn (Day/3-Hour/20-Min/Encounter)
- **Trait:** Dynamic attribute granting passive effects
- **Universal Choice Engine:** Weighted random decision system
- **World Seed:** Procedural seed generating specific world layout

### Appendix B: Design Philosophy Summary

**Aelun Awakened is designed to:**
- Reward discovery over completion
- Teach through failure, not punishment
- Provide agency through meaningful choices
- Respect player time (no grinding)
- Create emergent stories through systems
- Balance accessibility with depth
- Preserve mystery while enabling mastery

**Aelun Awakened is NOT:**
- A completionist's paradise (intentionally asymptotic)
- A story-driven narrative game (emergent storytelling)
- A traditional RPG (no XP/levels in classical sense)
- A puzzle game (no single correct solution)
- A grind-fest (anti-grind by design)

### Appendix C: For Content Creators

**When designing new content:**
1. Ask: "Does this create interesting choices?"
2. Ask: "Can this interact with existing systems?"
3. Ask: "Does this respect player time?"
4. Avoid: Binary good/bad choices
5. Avoid: Trap options that feel unfair
6. Favor: Lateral progression over vertical
7. Favor: Systemic interactions over scripted events

**When balancing content:**
1. Failure should feel like learning, not punishment
2. Success should feel earned, not guaranteed
3. Rare outcomes should delight, not frustrate
4. Common outcomes should feel fair
5. Player agency matters more than challenge

---

## END OF GAME DESIGN DOCUMENT

This document represents the complete game design vision for Aelun Awakened. All systems, mechanics, and design philosophies are defined here. Technical implementation details are documented separately in FINAL_architecture.md. Visual implementation is documented in FINAL_ui.md.

**Version Control:**
- v1.1 - October 27, 2025 - Phase 1 implementation complete (types, data, persistence scaffolding)
- v1.2 - October 27, 2025 - Sprint 5 Part 1 complete (interactive Lifepath structure implemented)
- v1.0 - October 26, 2025 - Initial consolidated master document
- Future versions will be tracked with changelog at document start

**Document Maintenance:**
- Update this document when core mechanics change
- Keep technical details in architecture document
- Keep UI details in UI specification document
- This document = "what" and "why", not "how"
