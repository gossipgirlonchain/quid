// Runtime config. The agent runs in SIM mode (no real chain / Plaid / x402)
// whenever the contract hash is unset, so `npm run dev` works out of the box.
// Fill .env (QUID_CONTRACT_HASH etc.) to go live.

export const SIM = !process.env.QUID_CONTRACT_HASH;

export const POLL_MS =
  (Number(process.env.POLL_INTERVAL_SECONDS) || (SIM ? 3 : 60)) * 1000;

export const NETWORK = process.env.CASPER_NETWORK ?? "casper-test";
