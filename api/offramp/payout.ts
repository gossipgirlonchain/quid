import type { VercelRequest, VercelResponse } from "@vercel/node";

// Off-ramp: cash a Casper advance out to the user's linked bank account.
//
// There's no turnkey Casper->fiat provider, so this is a scaffold (same
// mock-fallback pattern as the Plaid/Stripe endpoints). When an off-ramp
// provider is configured via OFFRAMP_PROVIDER it would convert the pool
// stablecoin and ACH-payout to the Plaid-linked account; until then it returns a
// realistic simulated payout so the cash-out flow is fully clickable end to end.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const amountUsd = Number(req.body?.amountUsd ?? 0);
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return res.status(400).json({ error: "invalid_amount" });
  }

  const provider = process.env.OFFRAMP_PROVIDER; // e.g. "coinflow" | "stripe" | "dwolla"
  if (!provider) {
    // MOCK: simulate an ACH payout kicked off to the linked bank.
    return res.status(200).json({ status: "processing", etaBusinessDays: 2, mock: true });
  }

  // TODO(live): convert the pool's dUSDC -> USD and initiate a payout to the
  // user's Plaid-linked account via `provider`; persist the payout id.
  return res.status(501).json({ error: "offramp_provider_not_implemented", provider });
}
