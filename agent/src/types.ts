// Shared types for the Quid agent.

export type PlanTier = "free" | "starter" | "plus" | "pro";

export const TIER_CAP_USD: Record<PlanTier, number> = {
  free: 50,
  starter: 100,
  plus: 250,
  pro: 500,
};

export interface CashflowSnapshot {
  /** Current available balance, USD. */
  balanceUsd: number;
  /** Projected balance at next payday if nothing changes, USD. */
  projectedAtPaydayUsd: number;
  /** Next expected income date (unix seconds). */
  paydayTs: number;
  /** Verified incoming income amount, USD. */
  verifiedIncomeUsd: number;
}

export interface AdvanceDecision {
  approved: boolean;
  /** Amount the agent will advance, USD (0 if declined). */
  amountUsd: number;
  /** Max it could safely advance right now, USD. */
  safeCeilingUsd: number;
  reason: string;
}

export interface User {
  id: string;
  plaidAccessToken: string;
  casperPublicKey: string;
  tier: PlanTier;
  autoCover: boolean;
  /** Granted QuidPool the standing repayment allowance (the onboarding `approve`). */
  repayAuthorized: boolean;
}
