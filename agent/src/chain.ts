// Settlement-chain switch for the act / settle steps. CHAIN=solana loads the
// Solana adapter (solana.ts); anything else keeps Casper (casper.ts). Both
// export the same surface, checked here, so the loop is chain-agnostic.
// Only the selected SDK is loaded.

import { CHAIN } from "./config.js";

export interface ChainAdapter {
  attachContract(): void;
  issueAdvance(borrower: string, amountUsd: number, dueDateTs: number): Promise<string>;
  repayAdvance(advanceId: number): Promise<string>;
  reputationOf(borrower: string): Promise<number>;
  waitForSettlement(txHash: string): Promise<void>;
  advanceIdFromIssueTx(txHash: string): Promise<number>;
}

const adapter: ChainAdapter =
  CHAIN === "solana" ? await import("./solana.js") : await import("./casper.js");

export const {
  attachContract,
  issueAdvance,
  repayAdvance,
  reputationOf,
  waitForSettlement,
  advanceIdFromIssueTx,
} = adapter;
