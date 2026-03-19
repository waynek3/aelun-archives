// Loan system — pure functions for Dad's House loans (Sprint 22).

import type { GameState, LoanState } from '../state/types';
import balance from '../data/balance.json';

const cfg = balance.dadsHouse;

export function calculateLoanCap(wizardFame: number): number {
  return Math.min(cfg.maxLoanCap, cfg.baseLoanCap + wizardFame * cfg.fameCapBonus);
}

export function calculateInterestRate(wizardFame: number): number {
  return Math.max(cfg.minInterestRate, cfg.baseInterestRate - wizardFame * cfg.fameInterestReduction);
}

export function getAvailableLoanAmounts(wizardFame: number): number[] {
  const cap = calculateLoanCap(wizardFame);
  return cfg.loanAmounts.filter((a: number) => a <= cap);
}

export function takeLoan(state: GameState, amount: number): GameState | null {
  if (!state.dadAlive) return null;
  if (state.loan !== null) return null;

  const cap = calculateLoanCap(state.wizardFame);
  if (amount > cap) return null;
  if (!cfg.loanAmounts.includes(amount)) return null;

  const interestRate = calculateInterestRate(state.wizardFame);
  const collateral = amount >= cfg.collateralThreshold;

  const loan: LoanState = { principal: amount, interestRate, collateral };
  return {
    ...state,
    cash: state.cash + amount,
    loan,
  };
}

export function repayLoan(state: GameState, amount: number): GameState | null {
  if (!state.loan) return null;
  if (amount <= 0) return null;

  const repayAmount = Math.min(amount, state.loan.principal, state.cash);
  if (repayAmount <= 0) return null;

  const newPrincipal = Math.round((state.loan.principal - repayAmount) * 100) / 100;
  const newLoan: LoanState | null = newPrincipal <= 0
    ? null
    : { ...state.loan, principal: newPrincipal };

  return {
    ...state,
    cash: state.cash - repayAmount,
    loan: newLoan,
  };
}

export function accrueInterest(state: GameState): GameState {
  if (!state.loan) return state;
  const interest = Math.round(state.loan.principal * state.loan.interestRate * 100) / 100;
  return {
    ...state,
    loan: { ...state.loan, principal: state.loan.principal + interest },
  };
}

export function isSpellbookLocked(state: GameState): boolean {
  return state.loan?.collateral ?? false;
}
