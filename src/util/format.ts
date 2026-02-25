// Format a dollar amount for display. Always shows cents.
// e.g. 250 → "$250.00", 3.5 → "$3.50", -10 → "-$10.00"
export function formatCash(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toFixed(2);
  return amount < 0 ? `-$${formatted}` : `$${formatted}`;
}

// Format a net gain/loss with a leading + or -.
// e.g. 5 → "+$5.00", -3 → "-$3.00", 0 → "$0.00"
export function formatNet(amount: number): string {
  if (amount > 0) return `+${formatCash(amount)}`;
  return formatCash(amount);
}

// Snap scratch session seconds to the next :15 minute increment.
// 15s/ticket, min 60s, then ceil to :15.
export function calcScratchTimeCost(numTickets: number): number {
  const seconds = Math.max(numTickets * 15, 60);
  const minutes = seconds / 60;
  return Math.ceil(minutes / 15) * 15;
}

// Render a text progress bar.
// fillChar and emptyChar default to block chars.
export function progressBar(
  value: number,
  max: number,
  width: number = 10,
  fillChar: string = '█',
  emptyChar: string = '░',
): string {
  const ratio = Math.min(Math.max(value / max, 0), 1);
  const filled = Math.round(ratio * width);
  return fillChar.repeat(filled) + emptyChar.repeat(width - filled);
}
