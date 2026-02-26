import type { GameState } from './types';
import balance from '../data/balance.json';

export const SAVE_VERSION = 2;

export function createInitialState(): GameState {
  return {
    phase: 'playing',
    cash: balance.starting.cash,
    // Sprint 2: time & calendar
    clock: balance.dayCycle.wakeTime,  // 600 = 10:00 AM
    day: 1,
    month: 1,
    year: 1,
    // Sprint 2: location
    currentNeighborhood: 'the_skids',
    currentLocation: 'tower',          // new runs start at the tower
    lastPassoutPenalty: null,
    // Scratch session
    scratchSession: null,
    totalTicketsScratched: 0,
    bestSingleWin: 0,
    rngSeed: (Math.random() * 0xFFFFFFFF) | 0,
    colorScheme: 'blue',
  };
}
