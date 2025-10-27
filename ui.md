# AELUN AWAKENED: UI Specification Document
**Version:** 2.0 Final - Master Reference  
**Date:** October 27, 2025  
**Status:** Complete - Ready for Implementation  
**Design Aesthetic:** DOS-Era / Terminal / ASCII Art

This is the **complete UI specification** extracted and synthesized from all project documents. Implement all screens and components exactly as specified.

## QUICK REFERENCE

### Color Palette
```css
--color-bg: #1A1A2E;              /* Background */
--color-text: #E8E8E8;            /* Primary text */
--color-success: #00FF00;         /* Green - actions, success */
--color-focus: #FFFF00;           /* Yellow - selection, hover */
--color-danger: #FF4444;          /* Red - death, failure */
--color-info: #44CCFF;            /* Cyan - stats, info */
--color-warning: #FF8800;         /* Orange - warnings */
--color-meta: #8844FF;            /* Purple - meta-progression */
--color-disabled: #666666;        /* Gray - disabled */
```

### Typography
- **Font:** Monospace (Courier New, Consolas, IBM Plex Mono)
- **Headers:** ALL CAPS, bold
- **Body:** normal weight, mixed case
- **No italics:** Monospace fonts don't render well in italic

### Spacing
- Uses `ch` units (character width)
- Scale: 0.5ch, 1ch, 2ch, 4ch, 8ch

### Border Characters
- **Double-line (╔═╗):** Primary buttons
- **Single-line (┌─┐):** Secondary buttons, panels
- **Heavy-line (┏━┓):** Warnings, death screens

### Unicode Symbols
```
Dice: ⚀ ⚁ ⚂ ⚃ ⚄ ⚅
Stars: ★ ☆
Status: ✓ ✗ ⚠
Bars: █ ░
Arrows: ► ◄ ▲ ▼
```

---

## ALL SCREENS

### 1. MAIN MENU

Layout shows:
- Title: "AELUN AWAKENED" (centered, large, green)
- Tagline: "[A Narrative Deckbuilding Roguelite]" (cyan)
- Primary button: "NEW ADVENTURE" (double-line, green)
- Secondary buttons: Graveyard, Compendium, Settings (single-line, cyan)
- Footer: Progress %, version, offline status

Interactions:
- NEW ADVENTURE → Lifepath Screen
- VIEW GRAVEYARD → Graveyard Screen
- COMPENDIUM → Compendium Screen
- SETTINGS → Settings modal
- Hover: Yellow border
- Keyboard: Arrows navigate, Enter selects

---

### 2. LIFEPATH (CHARACTER CREATION)

Shows 10-step narrative character creation:
- Header: "LIFEPATH: YOUR ORIGINS"
- Step counter: "STEP X OF 10"
- Narrative prompt
- 2-4 choice buttons showing mechanical bonuses
- Progress bar at bottom
- [TAB] to view character preview panel

Each choice shows:
- Choice name
- Stats granted
- Traits granted
- Starting cards

Preview panel shows developing character:
- Core stats (Strength, Insight, Charisma, Spirit)
- Traits acquired
- Starting action deck
- Hidden affinities (if any)

---

### 3. GAME LOOP PRIMARY

Main gameplay screen with 3 sections:

**Top: Scene Description Panel**
- Title: Current location name
- Tags: [FOREST] [WILDERNESS] [DANGEROUS]
- Timescale: [DAY] or [3-HOUR] or [20-MINUTE] or [ENCOUNTER]
- Narrative text (wrapped, 66ch, scrollable if >8 lines)
- State: SAFE / CAUTION / DANGER (color-coded)

**Middle: Action Wheel**
- "WHAT DO YOU DO?"
- 4-8 action buttons (filtered by tags + timescale)
- Primary action: Double-line, green
- Secondary actions: Single-line, cyan
- Shows "(Untargeted)" or "(Targeted: Type)"
- Hover shows card details

**Bottom: Status Bar**
- HP: Visual bar + numeric [70/100]
- Resources: ★★★☆☆
- Traits: Count + link
- Turn counter: "TURN: 12 (Day Timescale)"
- Affinity: "HIDDEN" or semi-visible

Header has [PAUSE] and [≡ MENU] buttons (top-right)

---

### 4. TARGETED ACTION SELECTION

If action is Targeted, show target selection screen:
- Header: "SELECT [ACTION TYPE] TARGET"
- Context info (current location, etc.)
- List of valid targets (3-6 options)
- Primary target: Double-line (recommended)
- Secondary targets: Single-line
- [CANCEL] button at bottom

For "PRAY" action:
- THE FOREST ITSELF (local, likely to respond)
- A GOD YOU REVERE (personal deity)
- AN UNKNOWN POWER (risk/reward)

For "TRAVEL" action:
- List of adjacent locations
- Shows distance, danger level
- Previews what's there (if known)

---

### 5. DICE POOL ASSEMBLY & ROLL

Shows assembled dice pool before rolling:

**Dice Pool Panel:**
- Action name & target
- Difficulty: DC [number]
- Advantage Dice section:
  - ⚀ d20 (Base action)
  - ⚀ d20 (Duplicate card played)
  - etc.
- Bonus Dice section:
  - +1d4 (Strength stat)
  - +1d4 (Trait: "Aggressive")
  - +1d6 (Affinity: Hidden bonus)

**[► ROLL DICE] button** (double-line, green, centered)

**After clicking ROLL:**
- Animation: Cycle through die faces for 1 second
- Show results:
  - Advantage rolls (all d20s, highlight kept)
  - Bonus rolls (sum shown)
  - TOTAL: X vs DC Y
  - Result: ✓ SUCCESS / ⚠ MARGINAL / ✗ FAILURE
- Color-coded by outcome:
  - Critical Success (DC+10): Bright green, ★★★
  - Success: Green, ✓
  - Marginal: Yellow, ⚠
  - Failure: Red, ✗
  - Critical Failure (DC-10): Bright red, ✗✗
- **[► CONTINUE]** button to proceed

---

### 6. OUTCOME RESOLUTION

Displays narrative outcome + mechanical changes:

**Header:** "YOU [ACTION VERB]..." (colored by outcome)

**Roll Summary:** "Roll: X vs DC Y [symbol] [type] ([margin])"

**Narrative Panel:**
- Box with outcome text
- Tone matches result (triumphant/grim)
- Wrapped, justified, 66ch

**Mechanical Updates Section:**
- Header: "⚙ MECHANICAL UPDATES:"
- Bulleted list with ✓ checkmarks:
  - Damage dealt/received
  - Items gained/lost
  - Quest flags updated
  - Locations discovered
  - Hidden affinity changes (if Option B)

**[► CONTINUE]** button to return to Game Loop

---

### 7. CARD UNLOCK CHOICE

When failure counter triggers unlock:

**Header:** "CARD EVOLUTION UNLOCKED!"

**Context:**
- "Failed with [Card Name] enough times"
- "Choose 1 card from Tier [X]:"

**Card Choices:** (2-4 options)
- Each card shown with:
  - Name
  - Description
  - Tags, timescales
  - Evolution path preview

**[► SELECT]** buttons under each card

Player chooses one → card added to global pool

---

### 8. DEATH SCREEN

Heavy-line borders (┏━┓), red theme:

**Symbols:** ⚰ ⚰ ⚰ (centered)

**Header:** "YOU HAVE DIED" (large, red)

**Narrative Panel:**
- Describes death
- Thematic text: "But death is not the end..."

**Character Summary:**
- Name & lifepath
- Survived X turns
- Cause of death

**Meta-Progression Gained:**
- ★ Card failure counters updated
- ★ Locations discovered
- ★ Compendium % increased

**Buttons:**
- [► VIEW GRAVEYARD] (primary)
- [► NEW ADVENTURE] (secondary)
- [► MAIN MENU] (secondary)

---

### 9. GRAVEYARD

Memorial to past characters:

**Header:** "THE GRAVEYARD" 
**Subheader:** "(A Memorial to Past Characters)"

**Summary Stats:**
- Total Characters: X
- Longest Run: Y turns

**Character Entries:** (scrollable list)
Each entry shows:
```
┌────────────────────────────────────┐
│ 12. Kael the Wanderer              │
│     Died: Turn 47                  │
│     Cause: Devoured by Dire Wolf   │
│     Notable: Discovered Hidden Glade │
└────────────────────────────────────┘
```

**[► RETURN TO MENU]** button at bottom

---

### 10. COMPENDIUM

Encyclopedia of discovered content:

**Header:** "COMPENDIUM OF DISCOVERY"
**Subheader:** "(X% Complete - Y / Z Entries)"

**Category Tabs:**
- [ACTION CARDS] [LOCATIONS] [TRAITS] [NPCS] [FACTIONS] [OUTCOMES]
- Active tab: Yellow underline
- Each shows completion %

**Content View:**
Scrollable list of discovered entries in active category.

For ACTION CARDS:
- Card name
- Type, tags
- Usage stats: "Used X times | Failed Y times"
- **Unlock Progress Tree:**
  ```
  ├─ Tier 0 (1 fail) ✓ UNLOCKED
  │  ├─ Quick Attack +1 [IN DECK]
  │  └─ Riposte [Available]
  ├─ Tier 1 (3 fails) ✓ UNLOCKED
  │  ├─ Flurry of Blows [IN DECK]
  │  └─ Counter-Attack [Available]
  └─ Tier 2 (6 fails) ⏳ PROGRESS: 5/6
     ├─ Perfect Strike [Locked]
     └─ Riposte Mastery [Locked]
  ```

Color coding:
- ✓ Green: Unlocked
- ⏳ Yellow: In progress
- Gray: Locked

**[► RETURN TO MENU]** at bottom

---

### 11. PAUSE MENU

Overlay during gameplay:

**Header:** "┌─ PAUSED ─┐"
**Subtext:** "(Game paused - click RESUME to continue)"

**Options:**
- [► RESUME ADVENTURE] (primary, double-line)
- [► CHARACTER SHEET] (view stats/traits/inventory)
- [► COMPENDIUM] (access discovery log)
- [► CURRENT QUEST LOG] (active quests)
- [► SETTINGS] (text size, accessibility)
- [► SAVE & QUIT TO MENU] (⚠ warning)
- [► QUIT TO DESKTOP] (⚠ warning)

Warnings show: "⚠ This will lose unsaved progress"

---

## COMPONENT LIBRARY

### BUTTON STATES

**Primary:**
```
╔═══════════════════╗   Normal (green)
║  ► BUTTON TEXT    ║
╚═══════════════════╝

╔═══════════════════╗   Hover (yellow, glow)
║▶► BUTTON TEXT     ║
╚═══════════════════╝

║  ► BUTTON TEXT    ║   Disabled (gray)
```

**Secondary:**
```
┌───────────────────┐   Normal (cyan)
│  ► BUTTON TEXT    │
└───────────────────┘
```

### STAT BARS

```
HP: ███████░░░ [70/100]
```
- Full: █ (green)
- Empty: ░ (gray)
- Color grades: >75% green, 50-75% yellow, 25-50% orange, <25% red

### PROGRESS BARS

```
[STEP 5 OF 10] ██████████░░░░░░░░░░  [50%]
```

### TAGS

```
[FOREST] [WILDERNESS] [DANGEROUS]
```
- Cyan, uppercase, bracketed

### MODALS

```
╔══════════════════════╗
║   CONFIRM ACTION     ║
╠══════════════════════╣
║                      ║
║  Are you sure?       ║
║                      ║
║  ╔═══╗  ┌─────┐     ║
║  ║YES║  │ NO  │     ║
║  ╚═══╝  └─────┘     ║
╚══════════════════════╝
```

---

## ANIMATIONS

### Timing
- Button hover: 100ms
- Screen transitions: 200ms fade
- Dice roll: 1000ms cycle

### Dice Roll Animation
1. Cycle through ⚀→⚁→⚂→⚃→⚄→⚅ for 1 second
2. Land on final result
3. Flash outcome color 3 times (200ms each)
4. Hold final state

### Success/Failure Flash
- Border flashes in outcome color
- 3 pulses, 200ms each
- Returns to normal

---

## RESPONSIVE BREAKPOINTS

### Mobile (< 600px)
- Width: 36ch
- Font: 0.95em
- Buttons: Full width, stack vertically
- Touch targets: 44px min
- Scene panel: 10 rows max

### Tablet (600-1023px)
- Width: 60ch
- Font: 1em
- Some buttons: 2 per row
- Touch targets: 48px

### Desktop (1024px+)
- Width: 80ch
- Font: 1em
- All layouts as designed

---

## ACCESSIBILITY

### Color Contrast
- All text: WCAG AAA (7:1 minimum)
- Focus indicators: Yellow outline, 3px
- Reduced motion: Respect `prefers-reduced-motion`

### Keyboard Navigation
- Tab: Navigate focusables
- Arrow keys: Navigate lists
- Enter: Select
- Escape: Cancel/back
- Space: Alternative select

### Screen Readers
- All buttons: `aria-label`
- All panels: `role="region"`
- Live regions for dice rolls, outcomes
- Skip links for long content

---

## IMPLEMENTATION NOTES FOR AI AGENTS

### CSS Architecture
```
styles/
├── globals.css       (resets, base styles)
├── tokens.css        (color, spacing variables)
├── typography.css    (fonts, sizes)
├── components.css    (buttons, panels, bars)
└── screens.css       (screen-specific styles)
```

### Component Props Pattern
```typescript
interface ButtonProps {
  variant: "primary" | "secondary" | "warning";
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}
```

### Responsive Pattern
```tsx
<div className="scene-panel
  w-full               // mobile: full width
  md:w-[60ch]          // tablet: 60ch
  lg:w-[80ch]          // desktop: 80ch
">
```

### Animation Pattern
```css
.button {
  transition: all 100ms ease-in-out;
}

.button:hover {
  border-color: var(--color-focus);
  box-shadow: 0 0 8px rgba(255, 255, 0, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }
}
```

---

## END OF UI SPECIFICATION DOCUMENT

**Implementation Priority:**
1. Main Menu
2. Lifepath Screen ✓ (Sprint 5 Part 1 implemented: structure, choices, progress, preview)
3. Game Loop Primary
4. Dice Pool & Roll
5. Outcome Resolution
6. Death & Graveyard
7. Compendium
8. Pause Menu
9. Targeted Action screens
10. Card Unlock Choice

**Reference Documents:**
- Game design: `FINAL_gdd.md`
- Architecture: `FINAL_architecture.md`
- Build sequence: `FINAL_instructions.md`
