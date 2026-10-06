// Solana layer: the agent holds its own wallet and calls the QuidPool program
// (program/, the Anchor port of the Odra contract). Selected with CHAIN=solana;
// exports the same surface as casper.ts so the loop doesn't change.
//
// The agent signs issue_advance / repay_advance with its own keypair. Borrowers
// hold the stablecoin in their associated token account and approve the pool
// PDA as delegate once (the CEP-18 `approve` analog) so repayment can be pulled.
//
// SIM mode: when QUID_SOLANA_PROGRAM_ID is unset we don't touch the chain; we
// log what we would do and return a fake signature.

import { readFileSync } from "node:fs";
import anchor from "@anchor-lang/core";
import type { Program as AnchorProgram } from "@anchor-lang/core";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SIM } from "./config.js";
import idl from "./idl/quid_pool.json" with { type: "json" };
import type { QuidPool } from "./idl/quid_pool.js";

// @anchor-lang/core is a CJS bundle whose named exports Node's ESM loader can't
// see, so default-import it and destructure (same pattern as casper-js-sdk).
const { AnchorProvider, BN, EventParser, Program, Wallet } = anchor;

export const DECIMALS = 6; // stablecoin (mock dUSDC) base units
export const RPC_URL = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const CLUSTER = process.env.SOLANA_CLUSTER || "devnet";

let program: AnchorProgram<QuidPool> | undefined;
let agent: Keypair | undefined;

/** Build the connection + Anchor client and load the agent key. No-op in SIM. */
export function attachContract(): void {
  if (SIM) return;
  agent = loadKeypair();
  const connection = new Connection(RPC_URL, "confirmed");
  const provider = new AnchorProvider(connection, new Wallet(agent), { commitment: "confirmed" });
  // The IDL carries the program id; QUID_SOLANA_PROGRAM_ID may point at a redeploy.
  program = new Program<QuidPool>(
    { ...(idl as QuidPool), address: process.env.QUID_SOLANA_PROGRAM_ID! },
    provider,
  );
}

/**
 * Local dev: read the keypair JSON (solana-keygen format) from
 * SOLANA_AGENT_KEYPAIR_PATH. Deployed (Vercel, etc.): paste the JSON array into
 * SOLANA_AGENT_SECRET_KEY instead; that takes priority when set.
 */
function loadKeypair(): Keypair {
  const raw =
    process.env.SOLANA_AGENT_SECRET_KEY ||
    readFileSync(process.env.SOLANA_AGENT_KEYPAIR_PATH || "../program/keys/agent.json", "utf-8");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw) as number[]));
}

/** The attached client; throws outside live mode. Exposed for the demo / seed scripts. */
export function liveClient(): { program: AnchorProgram<QuidPool>; agent: Keypair; connection: Connection } {
  if (!program || !agent) {
    throw new Error("Solana client not attached. Call attachContract() in live mode.");
  }
  return { program, agent, connection: program.provider.connection };
}

// ---------------------------------------------------------------- PDAs

export function poolPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("pool")], programId)[0];
}
export function vaultPda(programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("vault")], programId)[0];
}
export function advancePda(programId: PublicKey, id: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("advance"), new BN(id).toArrayLike(Buffer, "le", 8)],
    programId,
  )[0];
}
export function reputationPda(programId: PublicKey, borrower: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("reputation"), borrower.toBuffer()], programId)[0];
}

// ---------------------------------------------------------------- act / settle

/** Agent issues an advance on-chain. Returns the transaction signature. */
export async function issueAdvance(
  borrowerAddress: string,
  amountUsd: number,
  dueDateTs: number,
): Promise<string> {
  if (SIM) {
    const sig = simSig();
    console.log(`  on-chain  issue_advance(borrower=${short(borrowerAddress)}, amount=$${amountUsd}) -> ${sig}`);
    return sig;
  }
  const { program } = liveClient();
  const pool = await program.account.pool.fetch(poolPda(program.programId));
  const borrower = new PublicKey(borrowerAddress);
  return program.methods
    .issueAdvance(borrower, toUnits(amountUsd), new BN(dueDateTs))
    .accountsPartial({
      advance: advancePda(program.programId, pool.nextId.toNumber()),
      borrowerWallet: borrower,
      mint: pool.mint,
    })
    .rpc();
}

/** Agent settles an advance when income lands. Returns the transaction signature. */
export async function repayAdvance(advanceId: number): Promise<string> {
  if (SIM) {
    const sig = simSig();
    console.log(`  on-chain  repay_advance(id=${advanceId}) -> ${sig}`);
    return sig;
  }
  const { program } = liveClient();
  const pool = await program.account.pool.fetch(poolPda(program.programId));
  const advance = advancePda(program.programId, advanceId);
  const { borrower } = await program.account.advance.fetch(advance);
  return program.methods
    .repayAdvance(new BN(advanceId))
    .accountsPartial({
      advance,
      borrowerToken: getAssociatedTokenAddressSync(pool.mint, borrower),
      mint: pool.mint,
    })
    .rpc();
}

/** Seed liquidity into the pool from the agent's own token account. */
export async function fundPool(amountUsd: number): Promise<string> {
  if (SIM) {
    const sig = simSig();
    console.log(`  on-chain  fund_pool(amount=$${amountUsd}) -> ${sig}`);
    return sig;
  }
  const { program, agent } = liveClient();
  const pool = await program.account.pool.fetch(poolPda(program.programId));
  return program.methods
    .fundPool(toUnits(amountUsd))
    .accountsPartial({
      funder: agent.publicKey,
      funderToken: getAssociatedTokenAddressSync(pool.mint, agent.publicKey),
      mint: pool.mint,
    })
    .rpc();
}

/**
 * Read a borrower's Quid score from their Reputation PDA. Absent account = 0
 * (a new user is priced off income alone); errors also read as 0 so the
 * decision loop stays robust, matching casper.ts.
 */
export async function reputationOf(borrowerAddress: string): Promise<number> {
  if (SIM) return 6; // pretend a returning user with some history
  if (!program) return 0;
  try {
    const pda = reputationPda(program.programId, new PublicKey(borrowerAddress));
    const rep = await program.account.reputation.fetchNullable(pda);
    return rep ? rep.score : 0;
  } catch {
    return 0;
  }
}

/**
 * Poll until a submitted transaction is finalized; throw if it failed on-chain.
 * No-op in SIM. Devnet finality is typically well under a minute.
 */
export async function waitForSettlement(signature: string): Promise<void> {
  if (SIM) return;
  const { connection } = liveClient();
  const deadline = Date.now() + 2 * 60_000;
  while (Date.now() < deadline) {
    const { value } = await connection.getSignatureStatuses([signature], { searchTransactionHistory: true });
    const status = value[0];
    if (status?.err) {
      throw new Error(`transaction ${signature} failed on-chain: ${JSON.stringify(status.err)}`);
    }
    if (status?.confirmationStatus === "finalized") return;
    await new Promise((res) => setTimeout(res, 2_000));
  }
  throw new Error(`timed out waiting for transaction ${signature}`);
}

/**
 * Read the new advance id from the AdvanceIssued event an executed
 * issue_advance transaction emitted. Call after waitForSettlement.
 */
export async function advanceIdFromIssueTx(signature: string): Promise<number> {
  if (SIM) return 0;
  const ev = await findEvent(signature, "advanceIssued");
  return Number(ev.id.toString());
}

/** Decode a named QuidPool event from a confirmed transaction's logs. */
export async function findEvent(signature: string, name: "advanceIssued" | "advanceRepaid") {
  const { program, connection } = liveClient();
  const tx = await connection.getTransaction(signature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });
  const parser = new EventParser(program.programId, program.coder);
  for (const ev of parser.parseLogs(tx?.meta?.logMessages ?? [])) {
    if (ev.name === name) return ev.data as { id: { toString(): string }; [k: string]: unknown };
  }
  throw new Error(`${name} event not found in transaction ${signature}`);
}

/** Explorer link for a transaction signature or an address. */
export function explorerUrl(kind: "tx" | "address", value: string): string {
  return `https://explorer.solana.com/${kind}/${value}?cluster=${CLUSTER}`;
}

export function toUnits(usd: number): InstanceType<typeof BN> {
  return new BN(Math.round(usd * 10 ** DECIMALS));
}
function simSig(): string {
  return "sim-" + Math.random().toString(16).slice(2, 10);
}
function short(addr: string): string {
  return addr.length > 10 ? addr.slice(0, 4) + "…" + addr.slice(-4) : addr;
}
