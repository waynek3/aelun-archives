// Pure functions for god affinity manipulation.
// Handles donations (private/public), prayer buff creation, buff expiry,
// and affinity-based payout multiplier calculation (Sprint 10+).

import type { GodId, PrayerBuff } from '../state/types';
import { getOpposedGod, getGod } from '../data/gods';
import balance from '../data/balance.json';

const aff = balance.affinity;

// ─── Timestamp Math ──────────────────────────────────────────────────────────

// Convert game timestamp to total minutes for comparison.
function toTotalMinutes(year: number, month: number, day: number, clock: number): number {
  return year * 360 * 1440 + month * 30 * 1440 + day * 1440 + clock;
}

// Add minutes to a game timestamp, handling day/month/year rollover.
export function addMinutesToTimestamp(
  clock: number, day: number, month: number, year: number, minutes: number,
): { clock: number; day: number; month: number; year: number } {
  let c = clock + minutes;
  let d = day;
  let m = month;
  let y = year;
  while (c >= 1440) {
    c -= 1440;
    d++;
    if (d > 30) { d = 1; m++; }
    if (m > 12) { m = 1; y++; }
  }
  return { clock: c, day: d, month: m, year: y };
}

// ─── Prayer Buff Checks ─────────────────────────────────────────────────────

export function isBuffActive(
  buff: PrayerBuff, clock: number, day: number, month: number, year: number,
): boolean {
  const now = toTotalMinutes(year, month, day, clock);
  const expiry = toTotalMinutes(buff.expiresInYear, buff.expiresInMonth, buff.expiresOnDay, buff.expiresAtClock);
  return now < expiry;
}

export function hasPrayerBuff(
  buffs: PrayerBuff[], godId: GodId, clock: number, day: number, month: number, year: number,
): boolean {
  return buffs.some(b => b.godId === godId && isBuffActive(b, clock, day, month, year));
}

export function pruneExpiredBuffs(
  buffs: PrayerBuff[], clock: number, day: number, month: number, year: number,
): PrayerBuff[] {
  return buffs.filter(b => isBuffActive(b, clock, day, month, year));
}

// ─── Prayer Buff Creation ────────────────────────────────────────────────────

export function createPrayerBuff(
  godId: GodId, durationMinutes: number,
  clock: number, day: number, month: number, year: number,
): PrayerBuff {
  const expiry = addMinutesToTimestamp(clock, day, month, year, durationMinutes);
  return {
    godId,
    expiresAtClock: expiry.clock,
    expiresOnDay: expiry.day,
    expiresInMonth: expiry.month,
    expiresInYear: expiry.year,
  };
}

// ─── Donation ────────────────────────────────────────────────────────────────

// Apply a donation and return updated affinity record.
// gain/loss formula: amount * scaleFactor * donationTypeMultiplier
// Prayer buff on target god doubles gain; prayer buff on opposed god halves loss.
// Sprint 24: dominantGods boosts gain when the target god is locally strong.
export function applyDonation(
  affinity: Record<GodId, number>,
  godId: GodId,
  donationAmount: number,
  isPublic: boolean,
  buffs: PrayerBuff[],
  clock: number, day: number, month: number, year: number,
  dominantGods: GodId[] = [],
): Record<GodId, number> {
  const multiplier = isPublic ? aff.publicDonationMultiplier : aff.privateDonationMultiplier;
  const baseChange = donationAmount * aff.scaleFactor * multiplier;

  const opposedGod = getOpposedGod(godId);

  // Prayer buff modifiers
  const hasTargetBuff = hasPrayerBuff(buffs, godId, clock, day, month, year);
  const hasOpposedBuff = hasPrayerBuff(buffs, opposedGod, clock, day, month, year);

  // Sprint 11: strong month doubles gain (but not loss) for the target god.
  const isStrongMonth = getGod(godId).strongMonths.includes(month);
  const strongMultiplier = isStrongMonth ? aff.strongMonthMultiplier : 1;

  // Sprint 24: neighborhood god strength boosts gain (but not loss).
  const nbStrength = (balance as Record<string, unknown>).neighborhoodGodStrength as { affinityGainMultiplier: number };
  const neighborhoodMultiplier = dominantGods.includes(godId) ? nbStrength.affinityGainMultiplier : 1;

  const gain = baseChange * (hasTargetBuff ? aff.prayerBuffMultiplier : 1) * strongMultiplier * neighborhoodMultiplier;
  const loss = hasOpposedBuff ? baseChange * aff.prayerDebuffMultiplier : baseChange;

  const result = { ...affinity };
  result[godId] = result[godId] + gain;
  result[opposedGod] = result[opposedGod] - loss;
  return result;
}

// ─── Monument Donation (Sprint 21) ──────────────────────────────────────────

// Apply a monument donation and return updated affinity record.
// Monuments give fixed affinity gains (larger than cash donations) based on size.
// Prayer buffs and strong month multipliers apply the same way as cash donations.
// Sprint 24: dominantGods boosts gain when the target god is locally strong.
export function applyMonumentDonation(
  affinity: Record<GodId, number>,
  godId: GodId,
  size: 'small' | 'medium' | 'large',
  buffs: PrayerBuff[],
  clock: number, day: number, month: number, year: number,
  dominantGods: GodId[] = [],
): Record<GodId, number> {
  const monBal = (balance as Record<string, unknown>).monumentDonation as
    Record<string, { affinityGain: number; opposedLoss: number }>;
  const { affinityGain: baseGain, opposedLoss: baseLoss } = monBal[size];

  const opposedGod = getOpposedGod(godId);
  const hasTargetBuff = hasPrayerBuff(buffs, godId, clock, day, month, year);
  const hasOpposedBuff = hasPrayerBuff(buffs, opposedGod, clock, day, month, year);

  const isStrongMonth = getGod(godId).strongMonths.includes(month);
  const strongMultiplier = isStrongMonth ? aff.strongMonthMultiplier : 1;

  // Sprint 24: neighborhood god strength boosts gain (but not loss).
  const nbStrength = (balance as Record<string, unknown>).neighborhoodGodStrength as { affinityGainMultiplier: number };
  const neighborhoodMultiplier = dominantGods.includes(godId) ? nbStrength.affinityGainMultiplier : 1;

  const gain = baseGain * (hasTargetBuff ? aff.prayerBuffMultiplier : 1) * strongMultiplier * neighborhoodMultiplier;
  const loss = hasOpposedBuff ? baseLoss * aff.prayerDebuffMultiplier : baseLoss;

  const result = { ...affinity };
  result[godId] = result[godId] + gain;
  result[opposedGod] = result[opposedGod] - loss;
  return result;
}

// ─── Passive Decay (Sprint 12) ───────────────────────────────────────────────

// Apply daily passive decay to all god affinities.
// Scores move toward zero: positive values decrease, negative values increase.
// Decay never crosses zero (no sign flip).
export function applyAffinityDecay(
  affinity: Record<GodId, number>,
  daysPassed: number,
): Record<GodId, number> {
  const decayAmount = aff.passiveDecayPerDay * daysPassed;
  const result = { ...affinity };
  for (const godId of Object.keys(result) as GodId[]) {
    const score = result[godId];
    if (score > 0) {
      result[godId] = Math.max(0, score - decayAmount);
    } else if (score < 0) {
      result[godId] = Math.min(0, score + decayAmount);
    }
  }
  return result;
}

// ─── Payout Multiplier (Sprint 10) ──────────────────────────────────────────

// Returns the payout multiplier for a winning symbol based on the player's
// affinity with the associated god.
// multiplier = clamp(payoutMultiplierFloor, ∞, 1 + affinity * payoutAffinityScale)
// e.g. affinity 20, scale 0.05 → 2× payout; affinity −20 → 0× (wiped out)
export function calcAffinityPayoutMultiplier(
  affinity: Record<GodId, number>,
  godId: GodId,
): number {
  const score = affinity[godId] ?? 0;
  const raw = 1 + score * aff.payoutAffinityScale;
  return Math.max(aff.payoutMultiplierFloor, raw);
}
