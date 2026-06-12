// Casper layer: the agent holds its own wallet and calls the QuidPool contract.
//
// In the consumer app, user wallets come from CSPR.click (social login, silent
// self-custodial wallet). The agent backend uses its own Ed25519 keypair to sign
// the issue_advance / repay_advance calls. Reads go through the node RPC.
//
// SIM mode: when QUID_CONTRACT_HASH is unset we don't touch the chain; we log
// what we would do and return a fake deploy hash.
//
// Written against casper-js-sdk v5 (the modular RpcClient / Transaction API).
// See https://github.com/casper-ecosystem/casper-js-sdk and docs.casper.network.

import { readFileSync } from "node:fs";
import casperSdk from "casper-js-sdk";
import { SIM, NETWORK } from "./config.js";

// casper-js-sdk v5 ships a webpack CJS bundle whose named exports aren't
// statically detectable by Node's ESM loader, so we default-import the module
// object and destructure the values from it (the .d.ts still provides full types).
const { RpcClient, HttpHandler, PrivateKey, PublicKey, KeyAlgorithm, Key, CLValue, Args, ContractCallBuilder } =
  casperSdk;

const DECIMALS = 6; // stablecoin (dUSDC / csprUSD) base units
const PAYMENT_MOTES = 5_000_000_000; // 5 CSPR ceiling per contract call

let rpc: InstanceType<typeof RpcClient> | undefined;
let signer: InstanceType<typeof PrivateKey> | undefined;
let contractHash: string | undefined;

/** Build the RPC client + load the agent key. No-op in SIM. */
export function attachContract(): void {
  if (SIM) return;
  rpc = new RpcClient(new HttpHandler(process.env.CASPER_NODE_URL!));
  // Local dev: read the .pem from disk (AGENT_SECRET_KEY_PATH).
  // Deployed (Vercel, etc.): the .pem file isn't shipped, so paste its contents
  // into AGENT_SECRET_KEY_PEM instead. That takes priority when set.
  const pem = process.env.AGENT_SECRET_KEY_PEM
    ? process.env.AGENT_SECRET_KEY_PEM
    : readFileSync(process.env.AGENT_SECRET_KEY_PATH!, "utf-8");
  signer = PrivateKey.fromPem(pem, KeyAlgorithm.ED25519);
  contractHash = process.env.QUID_CONTRACT_HASH!;
}

function liveClient() {
  if (!rpc || !signer) {
    throw new Error("Casper client not attached. Call attachContract() in live mode.");
  }
  return { rpc, signer };
}

function poolHash(): string {
  if (!contractHash) throw new Error("QUID_CONTRACT_HASH is not set.");
  return contractHash;
}

/** Odra prints contract addresses as package hashes ("hash-…"); the builder wants bare hex. */
function packageHex(h: string): string {
  return h.replace(/^(contract-package-|hash-)/, "");
}

/** Sign + submit an entrypoint call on any contract; resolve to the tx hash. */
async function callContract(
  targetHash: string,
  entryPoint: string,
  args: InstanceType<typeof Args>,
): Promise<string> {
  const { rpc, signer } = liveClient();
  const tx = new ContractCallBuilder()
    .from(signer.publicKey)
    .byPackageHash(packageHex(targetHash))
    .entryPoint(entryPoint)
    .runtimeArgs(args)
    .chainName(NETWORK)
    .payment(PAYMENT_MOTES)
    .build();
  tx.sign(signer);
  const res = await rpc.putTransaction(tx);
  return toHex(res.transactionHash);
}

/** Agent issues an advance on-chain. Returns the transaction hash. */
export async function issueAdvance(
  borrowerPk: string,
  amountUsd: number,
  dueDateTs: number,
): Promise<string> {
  if (SIM) {
    const hash = simHash();
    console.log(`  on-chain  issue_advance(borrower=${short(borrowerPk)}, amount=$${amountUsd}) -> ${hash}`);
    return hash;
  }
  const borrower = Key.newKey(PublicKey.fromHex(borrowerPk).accountHash().toPrefixedString());
  const args = Args.fromMap({
    borrower: CLValue.newCLKey(borrower),
    amount: CLValue.newCLUInt256(toUnits(amountUsd).toString()),
    due_date: CLValue.newCLUint64(dueDateTs),
  });
  return callContract(poolHash(), "issue_advance", args);
}

/** Agent settles an advance when income lands. Returns the transaction hash. */
export async function repayAdvance(advanceId: number): Promise<string> {
  if (SIM) {
    const hash = simHash();
    console.log(`  on-chain  repay_advance(id=${advanceId}) -> ${hash}`);
    return hash;
  }
  const args = Args.fromMap({ id: CLValue.newCLUint64(advanceId) });
  return callContract(poolHash(), "repay_advance", args);
}

/** Seed liquidity into the pool (after approving it as a spender — see below). */
export async function fundPool(amountUsd: number): Promise<string> {
  if (SIM) {
    const hash = simHash();
    console.log(`  on-chain  fund_pool(amount=$${amountUsd}) -> ${hash}`);
    return hash;
  }
  const args = Args.fromMap({ amount: CLValue.newCLUInt256(toUnits(amountUsd).toString()) });
  return callContract(poolHash(), "fund_pool", args);
}

/** Approve the pool to pull `amountUsd` of the CEP-18 stablecoin (precedes fund/repay). */
export async function approveStablecoin(
  tokenHash: string,
  spenderPoolHash: string,
  amountUsd: number,
): Promise<string> {
  if (SIM) {
    const hash = simHash();
    console.log(`  on-chain  approve(spender=${short(spenderPoolHash)}, amount=$${amountUsd}) -> ${hash}`);
    return hash;
  }
  const args = Args.fromMap({
    spender: CLValue.newCLKey(Key.newKey(spenderPoolHash)),
    amount: CLValue.newCLUInt256(toUnits(amountUsd).toString()),
  });
  return callContract(tokenHash, "approve", args);
}

/**
 * Read a borrower's reputation for pricing. Reads the `reputation` dictionary
 * the contract maintains and decodes the U32. Returns 0 if absent / on error so
 * the decision loop stays robust (a new user is simply priced off income alone).
 *
 * Set QUID_REPUTATION_DICT_UREF to the contract's `reputation` dictionary seed
 * URef (a post-deploy artifact, visible in the contract's named keys on
 * cspr.live). The item key is the borrower's account-hash; confirm Odra's exact
 * Mapping key encoding against the deployed contract if a known score reads 0.
 */
export async function reputationOf(borrowerPk: string): Promise<number> {
  if (SIM) return 6; // pretend a returning user with some history
  const dictUref = process.env.QUID_REPUTATION_DICT_UREF;
  if (!rpc || !dictUref) return 0;
  try {
    const itemKey = PublicKey.fromHex(borrowerPk).accountHash().toHex();
    const res = await rpc.getDictionaryItem(null, dictUref, itemKey);
    const raw = res.storedValue?.clValue?.ui32?.toString();
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

/**
 * Poll the node until a submitted transaction executes; throw if it executed
 * with an error. No-op in SIM. Casper Testnet finality is typically <1 min.
 */
export async function waitForSettlement(txHash: string): Promise<void> {
  if (SIM) return;
  const { rpc } = liveClient();
  const deadline = Date.now() + 4 * 60_000;
  while (Date.now() < deadline) {
    try {
      const r = await rpc.getTransactionByTransactionHash(txHash);
      if (r.executionInfo) {
        const err = r.executionInfo.executionResult?.errorMessage;
        if (err) throw new Error(`transaction ${txHash} failed on-chain: ${err}`);
        return;
      }
    } catch (e) {
      // "no such transaction" while the deploy propagates -> keep polling.
      if (e instanceof Error && e.message.includes("failed on-chain")) throw e;
    }
    await new Promise((res) => setTimeout(res, 5_000));
  }
  throw new Error(`timed out waiting for transaction ${txHash}`);
}

// CES events are CLValue bytes of (name, ...fields); AdvanceIssued declares
// `id: u64` first, so the id is the 8 LE bytes right after the name marker.
const ADVANCE_ISSUED_HEX = Buffer.from("event_AdvanceIssued").toString("hex");

/**
 * Read the new advance id from the AdvanceIssued event an executed
 * issue_advance transaction emitted. Call after waitForSettlement.
 */
export async function advanceIdFromIssueTx(txHash: string): Promise<number> {
  if (SIM) return 0;
  const { rpc } = liveClient();
  const r = await rpc.getTransactionByTransactionHash(txHash);
  const raw = r.rawJSON ? JSON.stringify(r.rawJSON) : JSON.stringify(r);
  const m = new RegExp(ADVANCE_ISSUED_HEX + "([0-9a-fA-F]{16})").exec(raw);
  if (!m) throw new Error(`AdvanceIssued event not found in transaction ${txHash}`);
  return Number(Buffer.from(m[1], "hex").readBigUInt64LE());
}

function toUnits(usd: number): bigint {
  return BigInt(Math.round(usd * 10 ** DECIMALS));
}
function toHex(h: unknown): string {
  const maybe = h as { toHex?: () => string };
  return typeof maybe?.toHex === "function" ? maybe.toHex() : String(h);
}
function simHash(): string {
  return "sim-" + Math.random().toString(16).slice(2, 10);
}
function short(pk: string): string {
  return pk.length > 10 ? pk.slice(0, 6) + "…" + pk.slice(-3) : pk;
}
