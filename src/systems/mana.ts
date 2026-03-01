// Mana pool system — pure functions for mana manipulation.
// Sprint 6: restore on sleep, reduce on passout.
// Future sprints add spell casting costs, potion restores, etc.

// Spend mana, floored at 0.
export function applyManaSpend(mana: number, amount: number): number {
  return Math.max(0, mana - amount);
}

// Restore mana, capped at maxMana.
export function applyManaRestore(mana: number, amount: number, maxMana: number): number {
  return Math.min(maxMana, mana + amount);
}
