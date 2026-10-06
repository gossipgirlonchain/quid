// Runtime config. The agent runs in SIM mode (no real chain / Plaid / x402)
// whenever the active chain's deployment is unset, so `npm run dev` works out
// of the box. Fill .env (QUID_CONTRACT_HASH etc.) to go live.
//
// CHAIN picks the settlement chain for act/settle: "casper" (default) or
// "solana". Perceive / verify / decide are chain-agnostic.

export type Chain = "casper" | "solana";

export const CHAIN: Chain = process.env.CHAIN === "solana" ? "solana" : "casper";

export const SIM =
  CHAIN === "solana" ? !process.env.QUID_SOLANA_PROGRAM_ID : !process.env.QUID_CONTRACT_HASH;

export const POLL_MS =
  (Number(process.env.POLL_INTERVAL_SECONDS) || (SIM ? 3 : 60)) * 1000;

export const NETWORK = process.env.CASPER_NETWORK ?? "casper-test";
