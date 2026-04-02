// All 30 symbols from scope.md — CP437/BMP glyphs only.
// To add or tune symbols, edit symbols.json — no code changes needed.

import type { GodId, ElementId, StrengthId } from '../state/types';
import rawSymbols from './symbols.json';

export interface SymbolDef {
  id: number;
  glyph: string;
  name: string;
  element: ElementId;
  god: GodId;
  strength: StrengthId;
  color: string;
}

export const SYMBOLS: SymbolDef[] = rawSymbols as SymbolDef[];

// Lookup by id (1-indexed)
export function getSymbol(id: number): SymbolDef {
  const sym = SYMBOLS[id - 1];
  if (!sym) throw new Error(`Unknown symbol id: ${id}`);
  return sym;
}
