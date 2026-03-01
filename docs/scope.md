# Chill Scratch-Off Wizard Simulator — Game Scope Document

---

## Overview

You are Chill Wizard, a recently-defunded slacker mage who lost his scholarship and got cut off by his rich wizard dad. You live in a dingy tower and refuse to work. Your only source of income is scratch-off lottery tickets. You buy scratchers, you cast spells to improve your odds, you pray to gods of dubious reliability, and you try not to get evicted. The game ends when you can't pay rent, or when you die. Your score is your legacy.

---

## Core Game Loop

- The player wakes up each morning at their tower and must return to sleep before curfew
- The only source of income is scratch-off lottery tickets purchased at bodegas and gas stations
- Money is spent on scratchers, rent, food, drinks, university classes, furniture, potions, spell scrolls, and loans
- Rent is due on the 1st of every month; failure to pay is an immediate game over
- The game is score-based with no explicit win condition; the goal is to survive as long as possible and maximize your legacy score

---

## Time System

- The game runs on a real-time in-game clock
- All non-scratcher tasks snap to the next 15-minute increment (:00, :15, :30, :45)
- Scratching tickets takes 15 seconds per ticket with a minimum session time of 1 minute
- Travel within the same neighborhood costs 5 minutes
- Travel to a different neighborhood costs an additional 10 minutes (15 total)
- The player must return to the tower and go to sleep before curfew or they pass out
- Passing out incurs a neighborhood-based cash penalty (e.g. ~$100 in Richville, ~$20 in The Skids) and the wizard wakes up the next day with reduced mana and chill; the ratio varies by neighborhood:
  - **University Heights** — more mana restored, less chill restored (academic hangover, spiritually okay)
  - **Richville** — more chill restored, less mana restored (comfortable surroundings, magically drained)
  - **The Burbs** — balanced reduction, slightly worse than average (soul-crushing normalcy)
  - **Center City** — moderate chill loss, moderate mana loss (chaotic but stimulating)
  - **Downtown** — heavy mana loss, heavy chill loss (worst neighborhood to pass out in)
  - **The Skids** — heavy chill loss, moderate mana loss (rough night, magic mostly intact)
- A visible in-game calendar shows the current day, month, and year
- The wizard ages over time; aging is a difficulty ratchet (see Aging)

---

## Player Stats

All stats are visible to the player except where noted as hidden.

- **Intelligence** — determines how quickly the wizard learns spells at the university; degrades slightly with age
- **Bookbinding** — determines how many spells the spellbook can hold at once; learned as a skill at the university
- **Wizard Fame** — unlocks items and shop inventory; affects loan amounts from dad; affects Random Event probability and outcomes; gained through Wizard Projects, public temple donations, and Random Events; decays slowly over time if not maintained
- **Relaxation Rate** — the rate at which Chill naturally restores over time; can be improved by items, spells, and upgrades
- **Resting Relaxation** — the baseline Chill level the wizard settles toward with no active impacts; distinct from Relaxation Rate

### Hidden Stats (revealed via Crystal Ball spells)
- **Addiction Level** — tracks scratcher dependency; hidden from player by default
- **Age Health Score** — composite of food quality, potion use, and lifestyle choices that determines eventual death age; hidden from player by default

---

## Chill Meter

- Chill is a mood meter tracking how relaxed the wizard is feeling
- Chill has a floor (0) and no hard cap, but practically bounded by items and upgrades
- Chill decays when the wizard loses on scratchers, works on Lab Projects, or is in stressful situations
- Chill restores passively at the Relaxation Rate toward the Resting Relaxation baseline
- Chill restores actively via snacks, drinks at the University Bar, bong use, and sleep
- Spells have an increased chance of misfiring when Chill is low
- Lab Project progress is reduced when Chill is low (measured at 15-minute increments during work sessions)
- The Chill meter is always visible to the player as a percentage bar; the true numeric value is only revealed via Crystal Ball spell

---

## Addiction Mechanic

- Hidden stat tracking scratcher dependency
- Two components: **Need** (craving between sessions) and **Satisfaction** (hit from scratching)
- Need builds faster the more frequently the player buys scratchers
- Satisfaction scales with how many tickets are scratched per session
- Need and Satisfaction scale together — high addiction means high highs and low lows
- As addiction increases, the player's baseline Resting Relaxation decreases (harder to feel chill without scratching)
- Addiction level is revealed only via Crystal Ball spell
- Aging increases susceptibility to addiction over time

---

## Aging

- The wizard ages in real calendar time
- Aging is a progressive difficulty ratchet:
  - Intelligence degrades slowly with age (slower spell learning)
  - Addiction susceptibility increases with age
- Death age is not fixed; it is determined by cumulative lifestyle choices: food quality, use of Longevity Potions, Random Events, and hidden Age Health Score
- Slow Aging Potions can suspend aging effects temporarily
- On death, the run ends and a legacy screen is displayed

---

## Mana

- The wizard has a mana pool that is always visible
- Mana is spent casting spells and using the Crystal Ball
- Running out of mana is limiting, not dangerous — the wizard simply cannot cast
- Mana regenerates from: sleep (amount determined by bed quality), prayer at temples, snacks (some), and certain spells
- The wizard wakes up with reduced mana after passing out (half mana)
- University spell learning costs mana (cost scales steeply with spell level)

---

## Neighborhoods

Six neighborhoods, each with distinct personality, dominant gods, and location inventory. God strength in a neighborhood affects affinity gain rates and symbol frequency on scratchers purchased there.

- **The Skids** — where the lovable loser protagonist always ends up, trash blowing past, a pawn shop on every corner, everyone's got a scheme
- **The Burbs** — pristine lawns, nosy neighbors, an Applebee's visible from everywhere, deeply sinister underneath the friendliness
- **Richville** — old money, gated everything, the kind of place where everyone knows your dad and is disappointed in you
- **Center City** — the arts district that sold out, overpriced coffee, galleries that are actually fronts, always a film crew somewhere
- **Downtown** — the business district that never sleeps but also never has fun, brutalist architecture, a surprising number of pigeons
- **University Heights** — perpetually 1994, everyone's in a band, the pizza is incredible, someone's always moving a couch

Each neighborhood has 1-2 gods that are locally strong. Neighborhood god strength should shift over time (mechanic TBD — seasonal, event-driven, or gradual drift).

---

## Location Types

All locations of the same type present the same menu structure regardless of neighborhood.

### Wizard Tower (Home Base)
- Starting location every day
- Contains furniture slots (max 10)
- Interact with owned furniture items (Bed, Lab Table, Bong, Crystal Ball, others TBD)
- Spellbook management: add or remove spells (see Spellbook)
- Embark on Wizard Projects via Lab Table

### Bodega / Gas Station
- Buy scratch-off tickets ($1, $2, $5, $10, $20)
- Buy snacks (food items with quality descriptors)
- Inventory varies slightly by neighborhood and Wizard Fame level

### Temple
- Make private donations (cash → affinity gain, higher impact than public)
- Make public donations (cash → affinity gain, lower impact than private, grants Wizard Fame)
- Donate Monuments (crafted items; impact depends on monument type and size)
- Pray (player chooses duration; grants timed 2x affinity gain buff and halved affinity penalty for equal duration)

### University (University Heights only)
- Three spell classes available per day, randomly selected from full spell bank
- Available 10am–4pm only
- Each class costs money, time, and mana
- Mana cost increases steeply with spell level being studied
- Intelligence determines learning speed
- Bookbinding classes available to increase spellbook capacity

### University Bookstore (University Heights only)
- Sells Spell Scrolls (one-use castings of spells not in the wizard's book)

### University Bar (University Heights only)
- Menu of drinks, each with: drink time, chill increase, mana reduction
- Food also available (see Food)

### Furniture Store
- Sells Beds (affects overnight mana and chill regeneration)
- Sells Lab Tables (required for Wizard Projects)
- Sells Bongs (chill restore item, breakable)
- Other furniture TBD

### Potion Store
- Sells Restore Mana potions and other potions TBD

### Spell Scroll Store
- Sells one-use Spell Scrolls

### Dad's House (Richville)
- Take out a loan (cash, must be repaid with interest)
- Loan cap scales with Wizard Fame
- Interest rate is lower for small amounts and high Wizard Fame; higher for large amounts and low Wizard Fame
- Dad may take spellbook as collateral on large loans
- Random Event: Dad Dies — after this event, Dad's House becomes Dad's Grave
- Dad's Grave: visiting increases mana, decreases chill

---

## Scratch-Off Tickets

### Ticket Tiers
- **$1 Scratcher** — lowest odds, lowest max payout
- **$2 Scratcher**
- **$5 Scratcher**
- **$10 Scratcher**
- **$20 Scratcher** — best odds, highest max payout

Each tier uses symbols from the symbol set below. All symbols are associated with an element, a god, and a strength tier (Weak, Mid, Strong). Matching symbols pays out; payout is modified by the player's affinity with the associated god.

### Scratch Mechanics
- At a bodega/gas station the player chooses quantities of each ticket tier and any snack/drink items they want before purchasing
- The store warns the player if non-scratcher inventory items won't fit in their 5 slots
- Scratchers never occupy inventory slots
- On hitting BUY the player goes to the scratch screen and scratches all purchased tickets in sequence at the counter (lore text only, no visual change to UI)
- Total scratch session time = number of tickets × 15 seconds, minimum 1 minute, rounded up to the next 15-minute clock increment
- Affinity with the winning symbol's god multiplies payout (positive affinity = bonus, negative affinity = penalty)

### Symbol Set

All 30 symbols use CP437 / Basic Multilingual Plane glyphs only — universally renderable in all browsers and mobile OS with no image assets required. Each symbol has a hex color for rendering in-game, derived from its element.

Symbols are grouped in triads per god (Weak / Mid / Strong). The alchemical name is the lore/design reference; the in-game name is what the player sees.

#### Element Color Reference
| Element | Hex |
|---------|-----|
| Life | `#7EC87E` |
| Death | `#9B8FB5` |
| Earth | `#C8A96E` |
| Water | `#6EB5C8` |
| Air | `#B0C8A0` |
| Fire | `#C86E6E` |

#### Full Symbol Table

| # | Glyph | Alchemical Ref | In-Game Name | Unicode | Element | God | Strength | Hex Color |
|---|-------|----------------|--------------|---------|---------|-----|----------|-----------|
| 1 | ♪ | Quintessence | Mesin's Spark | U+266A | Life | Mesin | Weak | `#7EC87E` |
| 2 | ☼ | Air (Upward Force) | The Rising Breath | U+263C | Life | Mesin | Mid | `#7EC87E` |
| 3 | ♫ | Caduceus | Staff of Living | U+266B | Life | Mesin | Strong | `#7EC87E` |
| 4 | · | Sublimation | Gul's Passage | U+00B7 | Death | Gul | Weak | `#9B8FB5` |
| 5 | § | Putrefaction | The Rotting Crown | U+00A7 | Death | Gul | Mid | `#9B8FB5` |
| 6 | ◙ | Black Sulfur | The Void Ember | U+25D9 | Death | Gul | Strong | `#9B8FB5` |
| 7 | • | Earth | Klossa's Ground | U+2022 | Earth | Klossa | Weak | `#C8A96E` |
| 8 | ¶ | Salt | The Gnome's Salt | U+00B6 | Earth | Klossa | Mid | `#C8A96E` |
| 9 | ※ | Vitriol | Bitter Stone | U+203B | Earth | Klossa | Strong | `#C8A96E` |
| 10 | ♂ | Iron Ore | Skarhol's Vein | U+2642 | Earth | Skarhol | Weak | `#C8A96E` |
| 11 | √ | Copper Ore | The Forge Metal | U+221A | Earth | Skarhol | Mid | `#C8A96E` |
| 12 | ◘ | Gold | Skarhol's Crown | U+25D8 | Earth | Skarhol | Strong | `#C8A96E` |
| 13 | ♀ | Water | Marena's Tide | U+2640 | Water | Marena | Weak | `#6EB5C8` |
| 14 | ≈ | Sea Water | The Deep Pull | U+2248 | Water | Marena | Mid | `#6EB5C8` |
| 15 | Ω | Rain Water | Heaven's Mercy | U+03A9 | Water | Marena | Strong | `#6EB5C8` |
| 16 | α | Dew | The Veil Drop | U+03B1 | Water | Azorius | Weak | `#6EB5C8` |
| 17 | δ | Spring Water | Threshold Water | U+03B4 | Water | Azorius | Mid | `#6EB5C8` |
| 18 | © | Vinegar | The Turning Gate | U+00A9 | Water | Azorius | Strong | `#6EB5C8` |
| 19 | ► | Air (Rising) | Ara's Warmth | U+25BA | Air | Ara | Weak | `#B0C8A0` |
| 20 | ★ | Quintessence | The Lover's Breath | U+2605 | Air | Ara | Mid | `#B0C8A0` |
| 21 | ☆ | Air | Ara's Wing | U+2606 | Air | Ara | Strong | `#B0C8A0` |
| 22 | β | Nitre | The Wandering Dust | U+03B2 | Air | Finhorn | Weak | `#B0C8A0` |
| 23 | φ | Potassium Nitrate | Halfling's Powder | U+03C6 | Air | Finhorn | Mid | `#B0C8A0` |
| 24 | ε | Realgar | Finhorn's Gust | U+03B5 | Air | Finhorn | Strong | `#B0C8A0` |
| 25 | Γ | Fire | Beroan's Breath | U+0393 | Fire | Beroan | Weak | `#C86E6E` |
| 26 | Σ | Sulfur | The Dragon's Heart | U+03A3 | Fire | Beroan | Mid | `#C86E6E` |
| 27 | π | Black Sulfur | Beroan's Pyre | U+03C0 | Fire | Beroan | Strong | `#C86E6E` |
| 28 | ± | Cinnabar | Sofiel's Brand | U+00B1 | Fire | Sofiel | Weak | `#C86E6E` |
| 29 | σ | Arsenic | War Smoke | U+03C3 | Fire | Sofiel | Mid | `#C86E6E` |
| 30 | ☻ | Orpiment | The Conqueror's Mark | U+0263B | Fire | Sofiel | Strong | `#C86E6E` |

#### Glyph Assignment Philosophy
Symbols were chosen for abstract resonance over literal meaning, so players can learn the system intuitively without it feeling over-explained:
- **♪ ☼ ♫** — sound and light as animating forces; Life
- **· § ◙** — fading, dividing, voiding; Death
- **• ¶ ※** — seed, structure, anchor; Earth/Klossa
- **♂ √ ◘** — male/iron, precision, stamped seal; Earth/Skarhol
- **♀ ≈ Ω** — female/Venus, waves, the deep; Water/Marena
- **α δ ©** — threshold, change, sealed gate; Water/Azorius
- **► ★ ☆** — directed warmth, radiant love, unbound; Air/Ara
- **β φ ε** — second path, clever ratio, volatile small; Air/Finhorn
- **Γ Σ π** — the jaw, the sum, the infinite; Fire/Beroan
- **± σ ☻** — cost of war, spreading smoke, dark victory; Fire/Sofiel

#### Rendering Note
All glyphs are from the Basic Multilingual Plane (Latin-1 Supplement, Greek, Miscellaneous Symbols, General Punctuation, Geometric Shapes). They render universally without image assets, special fonts, or fallbacks. The two Earth gods share a hex color (`#C8A96E`) and the two Water gods share a hex color (`#6EB5C8`) — differentiation within an element is handled by glyph shape alone.

---

## God Affinity System

### The Ten Gods
Each god is associated with an element, has an opposed god, and has one strong month per year.

| God | Form | Element | Strong Month |
|-----|------|---------|--------------|
| Mesin | Animating Energy | Life | March & June |
| Gul | Non-Binary Hooded Figure of Death | Death | September & December |
| Klossa | Female Gnome | Earth | February |
| Skarhol | Male Dwarf | Earth | August |
| Marena | Female Mermaid | Water | January |
| Azorius | Male Human | Water | July |
| Ara | Female Elf | Air | April |
| Finhorn | Male Halfling | Air | October |
| Beroan | Male Dragon | Fire | May |
| Sofiel | Female Human | Fire | November |

### The Opposition Circle
Mesin and Gul sit at opposite poles. The remaining eight gods form a ring between them. Proposed circle layout (clockwise from Mesin):

**Mesin → Klossa → Marena → Ara → Beroan → Gul → Sofiel → Finhorn → Azorius → Skarhol → back to Mesin**

Each god's direct opposite on the circle is their rival. This creates non-obvious pairings — fire doesn't simply oppose water, the relationships are weird and emergent:
- Mesin (Life) opposes Gul (Death) — the only obvious one, intentionally so
- Klossa (Earth/Gnome) opposes Sofiel (Fire/Human)
- Marena (Water/Mermaid) opposes Finhorn (Air/Halfling)
- Ara (Air/Elf) opposes Azorius (Water/Human)
- Beroan (Fire/Dragon) opposes Skarhol (Earth/Dwarf)

The circle is secret lore — the player discovers it through play, not a tutorial.

### Affinity Mechanics
- Every god has a numeric affinity score, tracked silently
- Affinity score affects payout multipliers when that god's symbols win on a scratcher
- High positive affinity = bonus multiplier; negative affinity = payout penalty
- No hard cap on affinity — Balatro-style synergy stacking is intentional

### Gaining and Losing Affinity
- Donating cash to a temple increases affinity with that temple's god by base value; decreases opposed god's affinity by base value
- Public donations: lower affinity gain, grants Wizard Fame
- Private donations: higher affinity gain, no Wizard Fame
- Praying: time spent praying grants a timed buff — for equal duration after prayer, all affinity gains and bonuses to that god are 2x, all affinity losses and penalties to that god are halved
- Affinity decays passively over time for neglected gods (universal base decay rate; items and spells can modify individual rates)

### Strong Month Modifier
- During a god's strong month, affinity gains with that god are doubled
- Affinity losses to the opposed god remain at base value during the strong month (not doubled)

### Neighborhood God Strength
- Each neighborhood has locally dominant and locally weak gods
- Being in a neighborhood where a god is strong increases affinity gain rate and increases frequency of that god's symbols on scratchers purchased there
- Neighborhood god strength shifts over time (mechanic TBD)

---

## Spellbook & Spells

### Spellbook
- The wizard always carries their spellbook (no inventory slot used)
- Spellbook capacity is determined by the Bookbinding skill
- Spells can only be added or removed at the Wizard Tower
- Adding a spell to the book costs 3x that spell's casting time
- Removing a spell from the book costs 1/2 that spell's casting time
- The wizard can cancel the process but loses the time spent

### Learning Spells
- Three spell classes are offered at the University each day (randomly selected from full spell bank)
- Classes are available 10am–4pm only
- Each class costs money, time, and mana
- Mana cost scales steeply with the level of spell being studied
- Intelligence determines how fast progress accumulates per hour of study
- Each spell has multiple levels; higher levels cost more time and mana to learn
- Bookbinding is learned at the University the same way as spells

### Spell Misfires
- All spells have a base misfire chance
- Misfire chance increases when Chill is low
- Launch misfire outcome: double mana cost (the spell fires but drains twice the mana)
- Future misfire outcomes TBD (wrong god targeted, affinity reversed, etc.)

### Spell Scrolls
- One-use inventory items that cast a spell the wizard doesn't know
- Sold at University Bookstore and Spell Scroll Stores
- Take up one inventory slot each

### Starter Spell Bank (launch spells TBD in full — representative examples)
- Affinity manipulation spells (boost or harm specific god affinities)
- Odds manipulation spells (affect scratcher symbol probabilities)
- Reveal spells (Crystal Ball: reveal addiction level, age health score, etc.)
- Slow Aging spell
- Travel spells (reduce travel time)
- Chill manipulation spells
- Mana restoration spells

---

## Inventory

- 5 inventory slots total
- Spellbook does not occupy a slot
- Items are: Spell Scrolls, Potions, Food/Snacks, and other consumables
- Consumable items are used and removed from inventory
- Some items are permanent until used; some may stack (TBD)

---

## Food & Snacks

Food has quality descriptors that imply their effect without showing numbers:

| Descriptor | Chill Impact | Health Impact | Notes |
|------------|-------------|---------------|-------|
| Greasy | High chill gain | Bad for health/aging | |
| Salty | High chill gain | Bad for health/aging | |
| Sugary | High chill gain | Bad for health/aging | |
| Bland | Low chill gain | Neutral | |
| Healthy | Low chill gain | Good for health/aging | |
| Gourmet | High chill gain | Good for health/aging | Best of both worlds, expensive |

Some food items have god affinities (positive or negative) — not all food, but select items.

---

## Wizard Tower & Furniture

- The tower starts dingy and sparse — the wizard recently lost his scholarship and was cut off
- Furniture slots: maximum 10
- Furniture is purchased at Furniture Stores
- Furniture can be recycled (removed) but not sold back for cash
- Each piece of furniture is interacted with from the tower menu

### Furniture Items

**Bed**
- Required for sleep
- Quality determines overnight mana and chill regeneration
- Upgradeable (better beds sold at Furniture Stores)

**Lab Table**
- Required for Wizard Projects
- One active project at a time, no queue
- Working on a project decreases chill
- Project progress is measured by Chill level at each 15-minute increment during work
- Progress is shown as a bar with no numbers — the player learns the feel over time
- Canceling a project loses all progress

**Bong**
- Restores chill on use
- Each use has a chance to trigger a Random Event where the bong breaks
- Counts as one furniture slot per bong owned

**Crystal Ball**
- Costs mana to use
- Reveals hidden stats when the wizard knows the appropriate reveal spell
- Upgradeable (TBD)

---

## Wizard Projects

- Accessed via the Lab Table at the tower
- One active project at a time; canceling loses all progress
- Projects take days, weeks, or months of in-game time — the player gets the feel through play
- Progress bar visible, no numbers shown
- Working decreases chill; low chill during a work session reduces progress made
- Completed projects produce inventory items

### Launch Project List
- **Longevity Potion** — suspends aging effects for a period of time
- **Luck Potion** — temporarily improves scratcher odds
- **Small Monument** — donate to a temple for a moderate affinity gain
- **Medium Monument** — donate to a temple for a significant affinity gain; longer project time
- **Large Monument** — donate to a temple for a major affinity gain; very long project time
- Monument affinity impact depends on monument type (god-specific monuments TBD)

---

## Random Events

- Can occur anywhere; each event is restricted to specific valid location types
- Probability of an event triggering depends on location, god affinities, Wizard Fame, and other factors
- Events present one line of flavor text and three choices
- Outcome is determined by the choice made + relevant stats + RNG
- Most events can repeat; some are one-time-only (marked below)
- Roughly a dozen events at launch, continuously expanded

### Launch Random Events

1. **The Birthday** *(triggers every year on the wizard's chosen birthday)*
   - Valid locations: anywhere
   - Flavor: "It's your birthday. You don't feel any different."
   - Choices lead to minor stat outcomes; the player sees which god is strong this month as a birthday "gift"

2. **Dad Dies** *(one-time per run)*
   - Valid locations: anywhere
   - Flavor: "You get a call. Your father has passed."
   - Dad's House becomes Dad's Grave permanently; visiting the grave increases mana, decreases chill

3. **The Bong Breaks**
   - Valid locations: Wizard Tower (triggered on bong use)
   - Flavor: "You hear a crack."
   - Choices: mourn it / try to fix it / throw it out; outcomes affect chill and inventory

4. **Suspicious Clerk**
   - Valid locations: Bodega / Gas Station
   - Flavor: "The clerk is watching you very carefully today."
   - Choices affect whether you can buy scratchers this visit, future prices, or chill

5. **Fellow Scratcher**
   - Valid locations: Bodega / Gas Station
   - Flavor: "Someone else at the counter has a handful of tickets."
   - Choices lead to minor affinity, chill, or cash outcomes

6. **Temple Judgment**
   - Valid locations: Temple
   - Flavor: "A priest looks at you like they know something."
   - Choices affect affinity with that temple's god

7. **Campus Encounter**
   - Valid locations: University, University Bar, University Bookstore
   - Flavor: "Someone recognizes you from your scholarship days."
   - Choices affect Wizard Fame

8. **Loan Shark**
   - Valid locations: The Skids locations
   - Flavor: "A person in a very nice coat offers you money."
   - Higher loan cap than dad, brutal interest rate; no collateral mechanic

9. **Storm Warning**
   - Valid locations: traveling between any two locations (outdoor travel trigger)
   - Flavor: "The sky looks wrong."
   - Choices affect travel time and chill
   - *Future: certain events should only trigger when traveling between specific neighborhood pairs*

10. **The Winning Ticket**
    - Valid locations: Bodega / Gas Station
    - Flavor: "Someone just won big. You watched it happen."
    - Choices affect chill and addiction meter

11. **Wizard Fame Moment**
    - Valid locations: Center City, Downtown, Richville
    - Only triggers above certain Wizard Fame threshold
    - Flavor: "Someone knows who you are."
    - Choices affect Wizard Fame and potentially unlock items

12. **The Bad Batch**
    - Valid locations: Bodega / Gas Station
    - Flavor: "These tickets feel different."
    - Choices affect odds on current scratch session and chill

---

## Legacy Screen

- Displayed on death (old age or future causes TBD)
- Programmatically generated summary of the wizard's life — no AI-generated text or art
- Includes: final score, age at death, highest Wizard Fame achieved, best single scratch-off win, gods most and least favored, notable Random Events experienced, total tickets scratched
- After the legacy screen the player can start a new run
- No meta-progression at launch

---

## New Run Setup

- Player picks the wizard's birthday (day and month)
- The game displays which god is strong in the birth month
- All stats reset; no carry-over from previous runs

---

## Out of Scope for Launch

- Social layer / NPC relationships
- Multiple wizards or co-op
- Meta-progression between runs
- AI-generated text or art
- Neighborhood god strength drift mechanic (flagged as TBD)
- Full spell bank (representative examples only at launch)
- Full furniture catalog beyond core items
- Full potion catalog beyond core items
