// Typed interface for balance.json — single source of truth for all balance data access.
// Import `bal` from this module instead of importing balance.json directly.
//
// To add a new balance field:
// 1. Add the field to the appropriate interface below
// 2. Add the value to balance.json
// 3. Import `bal` and access it with full type safety — no casts needed

import _balance from './balance.json';

// ─── Sub-interfaces ──────────────────────────────────────────────────────────

export interface StartingBalance {
  cash: number;
  neighborhood: string;
  chill: number;
  mana: number;
  maxMana: number;
  intelligence: number;
  bookbinding: number;
  wizardFame: number;
  relaxationRate: number;
  restingRelaxation: number;
  ageHealthScore: number;
}

export interface RentBalance {
  amount: number;
  dueDay: number;
}

export interface DayCycleBalance {
  wakeTime: number;
  curfewTime: number;
  sleepChillRestore: string;
  sleepManaRestore: string;
}

export interface TravelBalance {
  sameNeighborhoodMinutes: number;
  crossNeighborhoodMinutes: number;
}

export interface ScratchingBalance {
  secondsPerTicket: number;
  minimumSessionSeconds: number;
}

export interface PassoutEntry {
  cashPenalty: number;
  chillRestore: number;
  manaRestore: number;
}

export interface ChillBalance {
  decayPerMinute: number;
  lossPerScratchLoss: number;
  gainPerScratchWin: number;
  bongRestoreAmount: number;
}

export interface ManaBalance {
  passoutPenalty: number;
  sleepManaRestore: number;
}

export interface SnacksBalance {
  chillRestore: Record<string, number>;
}

export interface PrayerBalance {
  manaRestorePerQuarter: number;
  donationAmounts: number[];
  durationOptions: number[];
}

export interface AffinityBalance {
  scaleFactor: number;
  privateDonationMultiplier: number;
  publicDonationMultiplier: number;
  publicDonationFameGain: number;
  strongMonthMultiplier: number;
  passiveDecayPerDay: number;
  prayerBuffMultiplier: number;
  prayerDebuffMultiplier: number;
  payoutAffinityScale: number;
  payoutMultiplierFloor: number;
}

export interface AddictionBalance {
  needGrowthRate: number;
  satisfactionPerTicket: number;
  restingRelaxationPenaltyPerLevel: number;
}

export interface AgingBalance {
  intelligenceDecayPerYear: number;
  addictionSusceptibilityPerYear: number;
  baseDeathAge: number;
  healthScoreDeathAgeBonus: number;
}

export interface WizardFameBalance {
  decayPerDay: number;
}

export interface BedBalance {
  cost: number;
  sleepMana: number;
  sleepChill: number;
}

export interface FurnitureBalance {
  maxSlots: number;
  beds: Record<string, BedBalance>;
  lab_table: { cost: number };
  bong: { cost: number; breakChance: number };
  crystal_ball: { cost: number };
}

export interface CrystalBallBalance {
  revealManaCost: number;
}

export interface StatsBalance {
  displayMax: {
    intelligence: number;
    bookbinding: number;
    wizardFame: number;
    relaxationRate: number;
    restingRelaxation: number;
  };
}

export interface UniversityBalance {
  openTime: number;
  closeTime: number;
  classesPerDay: number;
  bookbindingCost: number;
  bookbindingTime: number;
  bookbindingMana: number;
  intelligenceSpeedFactor: number;
}

export interface SpellbookBalance {
  addTimeMultiplier: number;
  removeTimeMultiplier: number;
}

export interface ScrollsBalance {
  priceByLevel: Record<string, number>;
  bookstoreMarkup: number;
  storePurchaseTimeCost: number;
}

export interface ProjectDefinitionBalance {
  requiredProgress: number;
}

export interface ProjectsBalance {
  chillCostPerQuarter: number;
  lowChillThreshold: number;
  lowChillProgressMultiplier: number;
  baseProgressPerQuarter: number;
  durationOptions: number[];
  definitions: Record<string, ProjectDefinitionBalance>;
}

export interface MonumentDonationEntry {
  affinityGain: number;
  opposedLoss: number;
}

export interface MonumentDonationBalance {
  small: MonumentDonationEntry;
  medium: MonumentDonationEntry;
  large: MonumentDonationEntry;
}

export interface SpellBalance {
  baseMisfireChance: number;
  // Spell-specific fields (each spell has different optional fields)
  affinityGain?: number;
  affinityLoss?: number;
  winChanceBonus?: number;
  durationMinutes?: number;
  chillRestore?: number;
  manaRestore?: number;
  reveals?: string;
}

export interface SpellsBalance {
  favor_boost: SpellBalance;
  divine_slight: SpellBalance;
  lucky_fingers: SpellBalance & { winChanceBonus: number; durationMinutes: number };
  stacked_deck: SpellBalance & { winChanceBonus: number; durationMinutes: number };
  mellow_wave: SpellBalance & { chillRestore: number };
  deep_calm: SpellBalance & { chillRestore: number };
  mana_siphon: SpellBalance & { manaRestore: number };
  inner_eye: SpellBalance & { reveals: string };
  true_sight: SpellBalance & { reveals: string };
  vital_scan: SpellBalance & { reveals: string };
  chillMisfireScaling: number;
  [key: string]: SpellBalance | number;
}

export interface DadsHouseBalance {
  loanAmounts: number[];
  collateralThreshold: number;
  baseInterestRate: number;
  fameInterestReduction: number;
  minInterestRate: number;
  baseLoanCap: number;
  fameCapBonus: number;
  maxLoanCap: number;
  visitTimeCost: number;
  graveManaRestore: number;
  graveChillLoss: number;
}

export interface NeighborhoodGodStrengthBalance {
  affinityGainMultiplier: number;
  symbolWeightBonus: number;
}

export interface DrinkBalance {
  cost: number;
  timeMinutes: number;
  chillRestore: number;
  manaReduction: number;
}

export interface BarBalance {
  drinks: Record<string, DrinkBalance>;
}

export interface RandomEventBalance {
  [key: string]: number;
}

export interface RandomEventsBalance {
  birthday: RandomEventBalance;
  dad_dies: RandomEventBalance;
  bong_breaks: RandomEventBalance;
  suspicious_clerk: RandomEventBalance;
  fellow_scratcher: RandomEventBalance;
  temple_judgment: RandomEventBalance;
  campus_encounter: RandomEventBalance;
  loan_shark: RandomEventBalance;
  storm_warning: RandomEventBalance;
  winning_ticket: RandomEventBalance;
  wizard_fame_moment: RandomEventBalance;
  bad_batch: RandomEventBalance;
}

// ─── Top-level Balance Interface ─────────────────────────────────────────────

export interface BalanceData {
  starting: StartingBalance;
  rent: RentBalance;
  dayCycle: DayCycleBalance;
  travel: TravelBalance;
  scratching: ScratchingBalance;
  passout: Record<string, PassoutEntry>;
  chill: ChillBalance;
  mana: ManaBalance;
  snacks: SnacksBalance;
  prayer: PrayerBalance;
  affinity: AffinityBalance;
  addiction: AddictionBalance;
  aging: AgingBalance;
  wizardFame: WizardFameBalance;
  furniture: FurnitureBalance;
  crystalBall: CrystalBallBalance;
  stats: StatsBalance;
  university: UniversityBalance;
  spellbook: SpellbookBalance;
  scrolls: ScrollsBalance;
  projects: ProjectsBalance;
  monumentDonation: MonumentDonationBalance;
  spells: SpellsBalance;
  dadsHouse: DadsHouseBalance;
  neighborhoodGodStrength: NeighborhoodGodStrengthBalance;
  bar: BarBalance;
  randomEvents: RandomEventsBalance;
}

// ─── Typed Export ─────────────────────────────────────────────────────────────

/** Typed balance data — import this instead of balance.json directly. */
export const bal = _balance as unknown as BalanceData;
