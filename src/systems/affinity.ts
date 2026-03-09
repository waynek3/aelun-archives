// Pure functions for god affinity manipulation.
// Handles donations (private/public), prayer buff creation, and buff expiry.

import type { GodId, PrayerBuff } from '../state/types';
import { getOpposedGod } from '../data/gods';
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
export function applyDonation(
  affinity: Record<GodId, number>,
  godId: GodId,
  donationAmount: number,
  isPublic: boolean,
  buffs: PrayerBuff[],
  clock: number, day: number, month: number, year: number,
): Record<GodId, number> {
  const multiplier = isPublic ? aff.publicDonationMultiplier : aff.privateDonationMultiplier;
  const baseChange = donationAmount * aff.scaleFactor * multiplier;

  const opposedGod = getOpposedGod(godId);

  // Prayer buff modifiers
  const hasTargetBuff = hasPrayerBuff(buffs, godId, clock, day, month, year);
  const hasOpposedBuff = hasPrayerBuff(buffs, opposedGod, clock, day, month, year);

  const gain = hasTargetBuff ? baseChange * aff.prayerBuffMultiplier : baseChange;
  const loss = hasOpposedBuff ? baseChange * aff.prayerDebuffMultiplier : baseChange;

  const result = { ...affinity };
  result[godId] = result[godId] + gain;
  result[opposedGod] = result[opposedGod] - loss;
  return result;
}
