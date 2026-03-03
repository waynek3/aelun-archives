# Chill Scratch-Off Wizard Simulator — Sprint Plan

---

**Sprint 1: Core Scratch Loop**
Single store screen. Player has a starting cash balance. They choose quantities of $1–$20 scratchers and hit BUY. Scratch screen reveals each ticket one at a time (15s per ticket, 1 min minimum, rounds to next :15 increment). Wins pay out, losses don't. Return to store menu. No travel, no clock, no inventory. Just buy, scratch, repeat.

---

**Sprint 2: Time & Day Loop**
Add the in-game clock and day cycle. Player wakes at the tower, travels to the store (5 min same neighborhood), scratches, travels back, sleeps. Curfew enforced — miss it and pass out with flat penalties. Calendar visible. Travel time costs applied. All tasks snap to :15 increments except scratching.

---

**Sprint 3: Rent & Game Over**
Add monthly rent due on the 1st. If the player can't pay, game over. Display a simple end screen with final cash and days survived. This sprint makes the loop have stakes.

---

**Sprint 4: Neighborhoods & Travel**
Add all six neighborhoods. Travel between neighborhoods costs 15 min total. Each neighborhood has at least one store location. Player can choose which neighborhood to travel to from a menu. No neighborhood-specific content yet — just the map and travel system.

---

**Sprint 5: Chill Meter**
Add the Chill meter, displayed as a percentage bar. Chill decays on scratcher losses. Passout penalty now applies neighborhood-specific mana/chill ratios. No active Chill restoration yet — just the meter, decay, and its effect on passout outcomes.

---

**Sprint 6: Mana Pool**
Add the Mana pool, always visible. No spells yet. Mana regenerates on sleep (flat amount for now). Passout reduces mana per neighborhood rules. Sets up the resource for Sprint 9 onward.

---

**Sprint 7: Inventory & Snacks**
Add 5-slot inventory. Bodegas/gas stations now sell snacks with quality descriptors (Greasy, Salty, Sugary, Bland, Healthy, Gourmet). Snacks consumed from inventory restore Chill at rates implied by their descriptor. Store warns player if items won't fit inventory before purchase.

---

**Sprint 8: Player Stats**
Add Intelligence, Bookbinding, Wizard Fame, Relaxation Rate, and Resting Relaxation as tracked stats. Stats are visible. No systems feeding into them yet — this sprint wires up the stat block so future sprints can read and write to it.

---

**Sprint 9: God Affinity System**
Track affinity scores for all 10 gods. Add Temples as a location type with private donation, public donation, and prayer menus. Donations move affinity up/down per the opposition circle rules. Prayer grants timed buff. Public donations grant Wizard Fame. No effect on scratchers yet.

---

**Sprint 10: Affinity Payouts**
Wire god affinity into scratcher payouts. Winning symbols now check the player's affinity with the associated god and apply a multiplier. Positive affinity = bonus, negative = penalty. Uses the full symbol table from the scope doc.

---

**Sprint 11: Strong Months**
Add the in-game calendar month to affinity calculations. During a god's strong month, affinity gains with that god are doubled; losses to the opposed god stay at base. Birthday is set during new run setup; displays which god is strong that month.

---

**Sprint 12: Passive Affinity Decay**
Affinity scores now decay slowly over time for neglected gods. Universal base decay rate applied daily. Sets up the pressure to actively maintain god relationships rather than front-load donations.

---

**Sprint 13: Wizard Tower & Furniture**
Add the tower as a proper location with a furniture slot system (max 10). Add Bed (required for sleep, affects mana/chill regen), Lab Table (placeholder), and Bong (restores Chill on use). Add Furniture Stores as a location type. Tower starts with one basic Bed.

---

**Sprint 14: Spellbook & University**
Add University as a location (University Heights, 10am–4pm only). Three random spell classes offered daily. Classes cost money, time, and mana. Intelligence affects learning speed. Add Bookbinding as a learnable skill that increases spellbook capacity. Spellbook management (add/remove spells) available at tower. Spell casting costs mana but no spells have gameplay effects yet.

---

**Sprint 15: First Spells**
Wire up the first batch of spells with real gameplay effects: one affinity-boost spell, one odds-manipulation spell, one Chill-restore spell, one mana-restore spell. Spell misfires implemented — base misfire chance increased by low Chill; misfire outcome is double mana cost.

---

**Sprint 16: Spell Scrolls**
Add Spell Scroll items to inventory. Add University Bookstore and Spell Scroll Stores as location types. Scrolls are one-use castings of spells the wizard doesn't know. Consume one inventory slot each.

---

**Sprint 17: Addiction Mechanic**
Add hidden Addiction stat. Need builds between sessions based on frequency; Satisfaction scales with session volume. High addiction lowers Resting Relaxation baseline. Stat is tracked silently — no UI yet.

---

**Sprint 18: Aging**
Add the aging system. Wizard ages in real calendar time. Intelligence degrades slowly with age. Addiction susceptibility increases with age. Death age is determined by hidden Age Health Score (food quality, lifestyle). On death, show the legacy screen.

---

**Sprint 19: Crystal Ball & Hidden Stats**
Add Crystal Ball as purchasable furniture. Costs mana to use. Reveal spells (learned at university) expose Addiction Level, Age Health Score, and true numeric Chill value. Without the right spell, Crystal Ball does nothing.

---

**Sprint 20: Wizard Projects**
Add Lab Table functionality. Player selects a project (Longevity Potion, Luck Potion, Small/Medium/Large Monument). One active project at a time. Progress bar shown, no numbers. Working costs Chill; low Chill during work reduces progress. Canceling loses all progress.

---

**Sprint 21: Monuments & Enhanced Donations**
Completed Monuments can now be donated at Temples. Monument donations produce larger affinity swings than cash, scaled by size. God-specific monuments TBD — for now all monuments are generic but size-tiered.

---

**Sprint 22: Dad's House**
Add Dad's House to Richville. Player can take out loans (cash, repaid with interest). Loan cap and interest rate scale with Wizard Fame. Dad may take spellbook as collateral on large loans. Random Event hook added (Dad Dies — converts location to Dad's Grave).

---

**Sprint 23: Random Events**
Implement the Random Event system. Events trigger based on location, affinity, Wizard Fame, and RNG. Each event shows one flavor line and three choices; outcomes modify stats per the scope doc. Launch with all 12 events from the scope doc.

---

**Sprint 24: Neighborhood God Strength**
Assign dominant gods per neighborhood. Being in a neighborhood where a god is strong increases affinity gain rate and boosts frequency of that god's symbols on locally purchased scratchers.

---

**Sprint 25: University Bar**
Add University Bar as a location. Menu of drinks each with drink time, Chill increase, and mana reduction. Food also available. Fully functional store using existing inventory and Chill systems.

---

**Sprint 26: Legacy Screen**
Flesh out the legacy screen with a programmatically generated life summary. Includes: final score, age at death, highest Wizard Fame, best single win, most/least favored gods, total tickets scratched, notable Random Events experienced.

---

**Sprint 27: Color Scheme Toggle**
Add UI color scheme toggle between EGA Blue/Cyan and Green/Orange retro-tech palettes. Preference persists across sessions. This is the only purely UI sprint — saved for last so it's applied to the complete game.
