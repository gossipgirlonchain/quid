// The hero demo on Solana: seed the pool, then a real advance lifecycle, end to end.
//
//   setup (first run only)
//     create mint     agent creates a mock devnet stablecoin (dUSDC, 6 decimals)
//     initialize_pool agent becomes the pool admin
//   seed (whenever the pool is under $10,000)
//     mint_to         agent mints itself dUSDC
//     fund_pool       agent tops the pool up to $10,000
//   lifecycle (every run)
//     issue_advance   agent -> borrower   ($180 dUSDC leaves the pool)
//     approve         borrower -> pool    (borrower lets the pool PDA pull repayment)
//     repay_advance   agent               (income landed; pool made whole, Quid score +1)
//
// The borrower is a separate wallet (generated on first run, gassed by the agent
// with a small SOL transfer) - same shape as a real user's wallet. Every step
// waits for finality and prints a Solana Explorer link; the advance id is read
// back from the AdvanceIssued event, so reruns just work.
//
//   npm run demo:solana

import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createApproveInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  getMint,
} from "@solana/spl-token";
import { SIM } from "./config.js";
import {
  DECIMALS,
  RPC_URL,
  advanceIdFromIssueTx,
  attachContract,
  explorerUrl,
  findEvent,
  fundPool,
  issueAdvance,
  liveClient,
  poolPda,
  repayAdvance,
  reputationOf,
  toUnits,
  waitForSettlement,
} from "./solana.js";

const BORROWER_KEY = "./keys/solana_borrower.json";
const POOL_TARGET_USD = 10_000; // matches the Casper seed
const ADVANCE_USD = 180; // the SIM-mode story: short $180 before payday
const GAS_LAMPORTS = 0.01 * LAMPORTS_PER_SOL; // lets a fresh borrower sign its approve

const steps: { label: string; sig: string }[] = [];
const usd = (units: bigint) => Number(units) / 10 ** DECIMALS;

/** Record a submitted transaction, print its link, and wait for finality. */
async function settle(label: string, sig: string): Promise<string> {
  console.log(`  ${label}: ${explorerUrl("tx", sig)}`);
  await waitForSettlement(sig);
  console.log("  finalized ✓");
  steps.push({ label, sig });
  return sig;
}

/** Load the borrower wallet, generating it on first run. */
function borrowerKey(): Keypair {
  if (existsSync(BORROWER_KEY)) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(BORROWER_KEY, "utf-8")) as number[]));
  }
  const key = Keypair.generate();
  mkdirSync("./keys", { recursive: true });
  writeFileSync(BORROWER_KEY, JSON.stringify(Array.from(key.secretKey)), { mode: 0o600 });
  console.log(`  generated borrower wallet -> ${BORROWER_KEY}`);
  return key;
}

async function main() {
  if (SIM) {
    throw new Error("demo:solana needs live mode - set QUID_SOLANA_PROGRAM_ID in .env (see program/README.md)");
  }
  attachContract();
  const { program, agent, connection } = liveClient();
  const pool = poolPda(program.programId);

  console.log(`rpc:     ${RPC_URL}`);
  console.log(`program: ${explorerUrl("address", program.programId.toBase58())}`);
  console.log(`agent:   ${agent.publicKey.toBase58()}`);
  console.log(`         ${(await connection.getBalance(agent.publicKey)) / LAMPORTS_PER_SOL} SOL\n`);

  // 0) Setup (first run only): mock stablecoin + pool.
  let poolAcct = await program.account.pool.fetchNullable(pool);
  if (!poolAcct) {
    let mint: PublicKey;
    if (process.env.QUID_SOLANA_MINT) {
      mint = new PublicKey(process.env.QUID_SOLANA_MINT);
    } else {
      console.log("- create the mock stablecoin (dUSDC, 6 decimals, agent is mint authority) -");
      const mintKp = Keypair.generate();
      const tx = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: agent.publicKey,
          newAccountPubkey: mintKp.publicKey,
          space: MINT_SIZE,
          lamports: await getMinimumBalanceForRentExemptMint(connection),
          programId: TOKEN_PROGRAM_ID,
        }),
        createInitializeMint2Instruction(mintKp.publicKey, DECIMALS, agent.publicKey, null),
      );
      await settle("create mint", await sendAndConfirmTransaction(connection, tx, [agent, mintKp]));
      mint = mintKp.publicKey;
      console.log(`  mint: ${mint.toBase58()}\n`);
    }

    console.log("- initialize_pool (agent becomes admin) -");
    await settle(
      "initialize_pool",
      await program.methods.initializePool().accountsPartial({ admin: agent.publicKey, mint }).rpc(),
    );
    console.log();
    poolAcct = await program.account.pool.fetch(pool);
  }
  const mint = poolAcct.mint;
  console.log(`pool:    ${explorerUrl("address", pool.toBase58())}`);
  console.log(`mint:    ${explorerUrl("address", mint.toBase58())}`);
  console.log(`         pool balance $${usd(BigInt(poolAcct.poolBalance.toString()))}\n`);

  // 1) Seed: top the pool up to $10,000 from the agent's own dUSDC.
  const shortfall = toUnits(POOL_TARGET_USD).sub(poolAcct.poolBalance);
  if (shortfall.gtn(0)) {
    const topUp = BigInt(shortfall.toString());
    console.log(`- seed the pool with $${usd(topUp)} -`);
    const agentAta = getAssociatedTokenAddressSync(mint, agent.publicKey);
    const held = await getAccount(connection, agentAta).then((a) => a.amount, () => 0n);
    if (held < topUp) {
      const mintInfo = await getMint(connection, mint);
      if (!mintInfo.mintAuthority?.equals(agent.publicKey)) {
        throw new Error(`agent holds $${usd(held)} and is not the mint authority of ${mint.toBase58()}; fund it first`);
      }
      const tx = new Transaction().add(
        createAssociatedTokenAccountIdempotentInstruction(agent.publicKey, agentAta, agent.publicKey, mint),
        createMintToInstruction(mint, agentAta, agent.publicKey, topUp - held),
      );
      await settle("mint dUSDC to agent", await sendAndConfirmTransaction(connection, tx, [agent]));
    }
    await settle("fund_pool", await fundPool(usd(topUp)));
    console.log();
  }

  // 2) Borrower wallet; gas it so it can sign its approve.
  const borrower = borrowerKey();
  const borrowerAddr = borrower.publicKey.toBase58();
  console.log(`borrower: ${borrowerAddr}`);
  if ((await connection.getBalance(borrower.publicKey)) < GAS_LAMPORTS / 2) {
    console.log(`- gas the borrower (${GAS_LAMPORTS / LAMPORTS_PER_SOL} SOL from the agent) -`);
    const tx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey: agent.publicKey, toPubkey: borrower.publicKey, lamports: GAS_LAMPORTS }),
    );
    await settle("gas borrower", await sendAndConfirmTransaction(connection, tx, [agent]));
  }
  const scoreBefore = await reputationOf(borrowerAddr);
  console.log(`  Quid score before: ${scoreBefore}\n`);

  // 3) Agent issues the advance: pool pushes $180 dUSDC to the borrower.
  console.log(`- issue_advance: $${ADVANCE_USD} to the borrower -`);
  const dueDate = Math.floor(Date.now() / 1000) + 7 * 86_400;
  const issueSig = await settle("issue_advance", await issueAdvance(borrowerAddr, ADVANCE_USD, dueDate));
  const advanceId = await advanceIdFromIssueTx(issueSig);
  const borrowerAta = getAssociatedTokenAddressSync(mint, borrower.publicKey);
  const held = (await getAccount(connection, borrowerAta)).amount;
  console.log(`  advance id ${advanceId} (from the AdvanceIssued event), borrower holds $${usd(held)} dUSDC\n`);

  // 4) Borrower approves the pool PDA to pull repayment (a real user's wallet signs this).
  console.log("- borrower approves the pool for repayment -");
  const approveTx = new Transaction().add(
    createApproveInstruction(borrowerAta, pool, borrower.publicKey, BigInt(toUnits(ADVANCE_USD).toString())),
  );
  await settle("borrower approve", await sendAndConfirmTransaction(connection, approveTx, [borrower]));
  console.log();

  // 5) Income landed -> agent settles. Pool pulls the $180 back, Quid score +1.
  console.log(`- repay_advance(${advanceId}) -`);
  const repaySig = await settle("repay_advance", await repayAdvance(advanceId));
  const repaid = await findEvent(repaySig, "advanceRepaid");
  const scoreAfter = await reputationOf(borrowerAddr);
  const poolAfter = await program.account.pool.fetch(pool);
  console.log(`  AdvanceRepaid.new_reputation = ${String(repaid.newReputation)}`);
  console.log(`  Quid score ${scoreBefore} -> ${scoreAfter}, pool balance $${usd(BigInt(poolAfter.poolBalance.toString()))}\n`);
  if (scoreAfter !== scoreBefore + 1) {
    throw new Error(`expected the Quid score to rise to ${scoreBefore + 1}, read ${scoreAfter}`);
  }

  console.log("Every transaction in this run:");
  for (const s of steps) console.log(`  ${s.label.padEnd(20)} ${explorerUrl("tx", s.sig)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
