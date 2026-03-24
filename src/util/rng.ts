// Mulberry32 — fast, seeded, deterministic PRNG.
// All random calls go through here to ensure reproducibility and anti-save-scum.
//
// Usage:
//   const [value, nextSeed] = rng(state.rngSeed);
//   state = { ...state, rngSeed: nextSeed };
//
// `value` is in [0, 1).

export function rng(seed: number): [number, number] {
  let s = seed | 0;
  s = (s + 0x6D2B79F5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, s];
}

// Roll an index into a weights array (all weights >= 0, sum > 0).
// Returns the chosen index.
export function weightedRandom(
  weights: readonly number[],
  seed: number,
): [index: number, nextSeed: number] {
  const total = weights.reduce((a, b) => a + b, 0);
  let [r, nextSeed] = rng(seed); // eslint-disable-line prefer-const
  r *= total;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (r < acc) return [i, nextSeed];
  }
  return [weights.length - 1, nextSeed];
}

// Pick a random integer in [0, n).
export function randInt(n: number, seed: number): [number, number] {
  const [r, nextSeed] = rng(seed);
  return [Math.floor(r * n), nextSeed];
}
