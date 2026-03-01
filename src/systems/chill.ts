// Chill meter system — pure functions for chill manipulation.
// Sprint 5: loss on scratch losses, gain on scratch wins, restore on passout.
// Future sprints add passive decay, snack/bong restoration, sleep effects.

// Reduce chill by amount, floored at 0.
export function applyChillLoss(chill: number, amount: number): number {
  return Math.max(0, chill - amount);
}

// Increase chill by amount. No hard cap per scope.md.
export function applyChillGain(chill: number, amount: number): number {
  return chill + amount;
}
