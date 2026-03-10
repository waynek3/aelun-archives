import { describe, it, expect } from 'vitest';
import {
  applyDonation,
  applyAffinityDecay,
  hasPrayerBuff,
  pruneExpiredBuffs,
  createPrayerBuff,
  addMinutesToTimestamp,
  isBuffActive,
} from '../../src/systems/affinity';
import { getOpposedGod, ALL_GOD_IDS } from '../../src/data/gods';
import type { GodId, PrayerBuff } from '../../src/state/types';

// Helpers
function zeroAffinity(): Record<GodId, number> {
  return {
    mesin: 0, gul: 0, klossa: 0, skarhol: 0, marena: 0,
    azorius: 0, ara: 0, finhorn: 0, beroan: 0, sofiel: 0,
  };
}

describe('opposition circle', () => {
  it('is bidirectional for all gods', () => {
    for (const godId of ALL_GOD_IDS) {
      expect(getOpposedGod(getOpposedGod(godId))).toBe(godId);
    }
  });

  it('has 5 unique opposing pairs', () => {
    const pairs = new Set<string>();
    for (const godId of ALL_GOD_IDS) {
      const pair = [godId, getOpposedGod(godId)].sort().join(':');
      pairs.add(pair);
    }
    expect(pairs.size).toBe(5);
  });
});

describe('applyDonation', () => {
  it('increases target god and decreases opposed god', () => {
    const result = applyDonation(zeroAffinity(), 'mesin', 100, false, [], 600, 1, 1, 1);
    expect(result.mesin).toBeGreaterThan(0);
    expect(result.gul).toBeLessThan(0);
  });

  it('private multiplier is higher than public', () => {
    const priv = applyDonation(zeroAffinity(), 'mesin', 100, false, [], 600, 1, 1, 1);
    const pub = applyDonation(zeroAffinity(), 'mesin', 100, true, [], 600, 1, 1, 1);
    expect(priv.mesin).toBeGreaterThan(pub.mesin);
  });

  it('does not modify other gods', () => {
    const result = applyDonation(zeroAffinity(), 'mesin', 100, false, [], 600, 1, 1, 1);
    // Only mesin and gul should change
    expect(result.klossa).toBe(0);
    expect(result.ara).toBe(0);
    expect(result.beroan).toBe(0);
  });

  it('prayer buff doubles gain for target god', () => {
    const buff: PrayerBuff = {
      godId: 'mesin',
      expiresAtClock: 900,
      expiresOnDay: 1,
      expiresInMonth: 1,
      expiresInYear: 1,
    };
    const noBuff = applyDonation(zeroAffinity(), 'mesin', 100, false, [], 600, 1, 1, 1);
    const withBuff = applyDonation(zeroAffinity(), 'mesin', 100, false, [buff], 600, 1, 1, 1);
    expect(withBuff.mesin).toBeCloseTo(noBuff.mesin * 2);
  });

  it('prayer buff on opposed god halves the loss', () => {
    const buff: PrayerBuff = {
      godId: 'gul',  // opposed to mesin
      expiresAtClock: 900,
      expiresOnDay: 1,
      expiresInMonth: 1,
      expiresInYear: 1,
    };
    const noBuff = applyDonation(zeroAffinity(), 'mesin', 100, false, [], 600, 1, 1, 1);
    const withBuff = applyDonation(zeroAffinity(), 'mesin', 100, false, [buff], 600, 1, 1, 1);
    expect(withBuff.gul).toBeCloseTo(noBuff.gul * 0.5);
  });
});

describe('isBuffActive', () => {
  it('returns true when buff has not expired', () => {
    const buff: PrayerBuff = {
      godId: 'mesin',
      expiresAtClock: 900,
      expiresOnDay: 1,
      expiresInMonth: 1,
      expiresInYear: 1,
    };
    expect(isBuffActive(buff, 600, 1, 1, 1)).toBe(true);
  });

  it('returns false when buff has expired', () => {
    const buff: PrayerBuff = {
      godId: 'mesin',
      expiresAtClock: 600,
      expiresOnDay: 1,
      expiresInMonth: 1,
      expiresInYear: 1,
    };
    expect(isBuffActive(buff, 700, 1, 1, 1)).toBe(false);
  });

  it('returns false at exact expiry time', () => {
    const buff: PrayerBuff = {
      godId: 'mesin',
      expiresAtClock: 600,
      expiresOnDay: 1,
      expiresInMonth: 1,
      expiresInYear: 1,
    };
    expect(isBuffActive(buff, 600, 1, 1, 1)).toBe(false);
  });
});

describe('hasPrayerBuff', () => {
  it('returns true for matching active buff', () => {
    const buffs: PrayerBuff[] = [{
      godId: 'mesin',
      expiresAtClock: 900,
      expiresOnDay: 1,
      expiresInMonth: 1,
      expiresInYear: 1,
    }];
    expect(hasPrayerBuff(buffs, 'mesin', 600, 1, 1, 1)).toBe(true);
  });

  it('returns false for different god', () => {
    const buffs: PrayerBuff[] = [{
      godId: 'mesin',
      expiresAtClock: 900,
      expiresOnDay: 1,
      expiresInMonth: 1,
      expiresInYear: 1,
    }];
    expect(hasPrayerBuff(buffs, 'gul', 600, 1, 1, 1)).toBe(false);
  });
});

describe('pruneExpiredBuffs', () => {
  it('removes expired buffs and keeps active ones', () => {
    const buffs: PrayerBuff[] = [
      { godId: 'mesin', expiresAtClock: 500, expiresOnDay: 1, expiresInMonth: 1, expiresInYear: 1 },
      { godId: 'gul', expiresAtClock: 900, expiresOnDay: 1, expiresInMonth: 1, expiresInYear: 1 },
    ];
    const result = pruneExpiredBuffs(buffs, 600, 1, 1, 1);
    expect(result).toHaveLength(1);
    expect(result[0].godId).toBe('gul');
  });
});

describe('createPrayerBuff', () => {
  it('creates a buff expiring after the given duration', () => {
    const buff = createPrayerBuff('mesin', 30, 600, 1, 1, 1);
    expect(buff.godId).toBe('mesin');
    expect(buff.expiresAtClock).toBe(630);
    expect(buff.expiresOnDay).toBe(1);
  });

  it('handles day rollover', () => {
    // Clock at 23:30 (1410) + 60 min = 00:30 next day (30)
    const buff = createPrayerBuff('ara', 60, 1410, 1, 1, 1);
    expect(buff.expiresAtClock).toBe(30);
    expect(buff.expiresOnDay).toBe(2);
  });

  it('handles month rollover', () => {
    const buff = createPrayerBuff('ara', 60, 1410, 30, 1, 1);
    expect(buff.expiresOnDay).toBe(1);
    expect(buff.expiresInMonth).toBe(2);
  });

  it('handles year rollover', () => {
    const buff = createPrayerBuff('ara', 60, 1410, 30, 12, 1);
    expect(buff.expiresOnDay).toBe(1);
    expect(buff.expiresInMonth).toBe(1);
    expect(buff.expiresInYear).toBe(2);
  });
});

describe('applyAffinityDecay', () => {
  it('decays positive affinity toward zero', () => {
    const aff = { ...zeroAffinity(), mesin: 10 };
    const result = applyAffinityDecay(aff, 1);
    expect(result.mesin).toBe(9.5); // 10 - 0.5
  });

  it('decays negative affinity toward zero', () => {
    const aff = { ...zeroAffinity(), gul: -10 };
    const result = applyAffinityDecay(aff, 1);
    expect(result.gul).toBe(-9.5); // -10 + 0.5
  });

  it('does not change zero affinity', () => {
    const result = applyAffinityDecay(zeroAffinity(), 1);
    for (const godId of ALL_GOD_IDS) {
      expect(result[godId]).toBe(0);
    }
  });

  it('does not cross zero from positive', () => {
    const aff = { ...zeroAffinity(), mesin: 0.3 };
    const result = applyAffinityDecay(aff, 1); // decay 0.5 > 0.3
    expect(result.mesin).toBe(0);
  });

  it('does not cross zero from negative', () => {
    const aff = { ...zeroAffinity(), gul: -0.3 };
    const result = applyAffinityDecay(aff, 1);
    expect(result.gul).toBe(0);
  });

  it('applies multi-day decay correctly', () => {
    const aff = { ...zeroAffinity(), mesin: 10 };
    const result = applyAffinityDecay(aff, 3);
    expect(result.mesin).toBe(8.5); // 10 - (0.5 * 3)
  });

  it('decays all gods independently', () => {
    const aff = { ...zeroAffinity(), mesin: 10, gul: -5, ara: 2 };
    const result = applyAffinityDecay(aff, 1);
    expect(result.mesin).toBe(9.5);
    expect(result.gul).toBe(-4.5);
    expect(result.ara).toBe(1.5);
    expect(result.klossa).toBe(0);
  });
});

describe('addMinutesToTimestamp', () => {
  it('adds minutes within the same day', () => {
    const result = addMinutesToTimestamp(600, 1, 1, 1, 30);
    expect(result).toEqual({ clock: 630, day: 1, month: 1, year: 1 });
  });

  it('rolls over to next day', () => {
    const result = addMinutesToTimestamp(1400, 1, 1, 1, 60);
    expect(result).toEqual({ clock: 20, day: 2, month: 1, year: 1 });
  });

  it('rolls over month and year', () => {
    const result = addMinutesToTimestamp(1400, 30, 12, 1, 60);
    expect(result).toEqual({ clock: 20, day: 1, month: 1, year: 2 });
  });
});
