// The decision layer: should we advance, and how much?
//
// Safe amount = min( plan tier cap, income-based safe ceiling ).
// The income-based ceiling is what the agent believes it can recover from the
// next paycheck without leaving the user short again. This is the rule that
// makes the agent decline rather than over-lend.

import { TIER_CAP_USD, type AdvanceDecision, type CashflowSnapshot, type User } from "./types.js";

/** Fraction of verified incoming income we're willing to front. Tune with risk + reputation. */
const BASE_INCOME_FRACTION = 0.2;

export function decideAdvance(
  user: User,
  cash: CashflowSnapshot,
  incomeVerified: boolean,
  reputation: number,
): AdvanceDecision {
  if (!incomeVerified) {
    return { approved: false, amountUsd: 0, safeCeilingUsd: 0, reason: "Income could not be verified." };
  }

  const shortfall = Math.max(0, -cash.projectedAtPaydayUsd);

  // Reputation lifts the fraction of income we'll front (capped).
  const repBoost = Math.min(0.15, reputation * 0.01);
  const incomeCeiling = Math.floor(cash.verifiedIncomeUsd * (BASE_INCOME_FRACTION + repBoost));

  const tierCap = TIER_CAP_USD[user.tier];
  const safeCeiling = Math.min(tierCap, incomeCeiling);

  if (shortfall === 0) {
    return { approved: false, amountUsd: 0, safeCeilingUsd: safeCeiling, reason: "No shortfall detected." };
  }
  if (shortfall > safeCeiling) {
    return {
      approved: false,
      amountUsd: 0,
      safeCeilingUsd: safeCeiling,
      reason: `Asked for $${shortfall}, but only $${safeCeiling} repays safely from your income.`,
    };
  }

  return { approved: true, amountUsd: shortfall, safeCeilingUsd: safeCeiling, reason: "Within safe limit." };
}
