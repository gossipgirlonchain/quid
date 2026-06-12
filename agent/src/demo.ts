// The hero demo: a real advance lifecycle on Casper Testnet, end to end.
//
//   issue_advance  agent -> borrower   ($180 dUSDC leaves the pool)
//   approve        borrower -> pool    (borrower lets the pool pull repayment)
//   repay_advance  agent               (income landed; pool made whole, reputation +1)
//
// The borrower is a separate wallet (generated on first run, gassed by the agent
// with a native CSPR transfer) — same shape as a real user's CSPR.click wallet.
// Every step waits for on-chain finality and prints a cspr.live link; the advance
// id is read back from the AdvanceIssued event, so reruns just work.
//
//   npm run demo

import "dotenv/config";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import casperSdk from "casper-js-sdk";
import { SIM, NETWORK } from "./config.js";
import {
  attachContract,
  issueAdvance,
  repayAdvance,
  waitForSettlement,
  advanceIdFromIssueTx,
} from "./casper.js";

const { RpcClient, HttpHandler, PrivateKey, KeyAlgorithm, Key, CLValue, Args, ContractCallBuilder, NativeTransferBuilder, PurseIdentifier } =
  casperSdk;

const BORROWER_PEM = "./keys/borrower_secret_key.pem";
const ADVANCE_USD = 180; // the SIM-mode story: short $180 before payday
const GAS_CSPR = 25; // sent to a fresh borrower so it can sign its approve
const DECIMALS = 6;
const PAYMENT_MOTES = 5_000_000_000;

const link = (h: string) => `https://testnet.cspr.live/deploy/${h}`;
const toUnits = (usd: number) => BigInt(Math.round(usd * 10 ** DECIMALS)).toString();

function packageHex(h: string): string {
  return h.replace(/^(contract-package-|hash-)/, "");
}

/** Load the borrower wallet, generating it on first run. */
async function borrowerKey(): Promise<InstanceType<typeof PrivateKey>> {
  if (existsSync(BORROWER_PEM)) {
    return PrivateKey.fromPem(readFileSync(BORROWER_PEM, "utf-8"), KeyAlgorithm.ED25519);
  }
  const key = await PrivateKey.generate(KeyAlgorithm.ED25519);
  writeFileSync(BORROWER_PEM, key.toPem(), { mode: 0o600 });
  console.log(`  generated borrower wallet -> ${BORROWER_PEM}`);
  return key;
}

async function csprBalance(
  rpc: InstanceType<typeof RpcClient>,
  pub: InstanceType<typeof PrivateKey>["publicKey"],
): Promise<bigint> {
  try {
    const r = await rpc.queryLatestBalance(PurseIdentifier.fromPublicKey(pub));
    return BigInt(r.balance.toString());
  } catch {
    return 0n; // account doesn't exist yet
  }
}

async function main() {
  if (SIM) {
    throw new Error("demo needs live mode — set QUID_CONTRACT_HASH in .env (see contracts/DEPLOY.md)");
  }
  const token = process.env.QUID_STABLECOIN_ADDRESS!;
  const pool = process.env.QUID_CONTRACT_HASH!;

  attachContract();
  const rpc = new RpcClient(new HttpHandler(process.env.CASPER_NODE_URL!));
  const agent = PrivateKey.fromPem(
    readFileSync(process.env.AGENT_SECRET_KEY_PATH!, "utf-8"),
    KeyAlgorithm.ED25519,
  );
  const borrower = await borrowerKey();
  const borrowerHex = borrower.publicKey.toHex();
  console.log(`borrower wallet: ${borrowerHex}\n`);

  // 0) Gas the borrower (first run only): native CSPR transfer from the agent.
  if ((await csprBalance(rpc, borrower.publicKey)) < 5_000_000_000n) {
    console.log(`— gas the borrower (${GAS_CSPR} CSPR from the agent) —`);
    const tx = new NativeTransferBuilder()
      .from(agent.publicKey)
      .target(borrower.publicKey)
      .amount(String(GAS_CSPR * 1_000_000_000))
      .id(Date.now())
      .chainName(NETWORK)
      .payment(100_000_000)
      .build();
    tx.sign(agent);
    const res = await rpc.putTransaction(tx);
    const hash = String(res.transactionHash.toHex?.() ?? res.transactionHash);
    console.log(`  submitted: ${link(hash)}`);
    await waitForSettlement(hash);
    console.log("  finalized ✓\n");
  }

  // 1) Agent issues the advance: pool pushes $180 dUSDC to the borrower.
  console.log(`— issue_advance: $${ADVANCE_USD} to the borrower —`);
  const dueDate = Math.floor(Date.now() / 1000) + 7 * 86_400;
  const issueHash = await issueAdvance(borrowerHex, ADVANCE_USD, dueDate);
  console.log(`  submitted: ${link(issueHash)}`);
  await waitForSettlement(issueHash);
  const advanceId = await advanceIdFromIssueTx(issueHash);
  console.log(`  finalized ✓ — advance id ${advanceId} (from the AdvanceIssued event), borrower holds the stablecoin\n`);

  // 2) Borrower approves the pool to pull repayment (a real user's wallet signs this).
  console.log("— borrower approves the pool for repayment —");
  const approveArgs = Args.fromMap({
    spender: CLValue.newCLKey(Key.newKey(pool)),
    amount: CLValue.newCLUInt256(toUnits(ADVANCE_USD)),
  });
  const approveTx = new ContractCallBuilder()
    .from(borrower.publicKey)
    .byPackageHash(packageHex(token))
    .entryPoint("approve")
    .runtimeArgs(approveArgs)
    .chainName(NETWORK)
    .payment(PAYMENT_MOTES)
    .build();
  approveTx.sign(borrower);
  const approveRes = await rpc.putTransaction(approveTx);
  const approveHash = String(approveRes.transactionHash.toHex?.() ?? approveRes.transactionHash);
  console.log(`  submitted: ${link(approveHash)}`);
  await waitForSettlement(approveHash);
  console.log("  finalized ✓\n");

  // 3) Income landed -> agent settles. Pool pulls the $180 back, reputation +1.
  console.log(`— repay_advance(${advanceId}) —`);
  const repayHash = await repayAdvance(advanceId);
  console.log(`  submitted: ${link(repayHash)}`);
  await waitForSettlement(repayHash);
  console.log("  finalized ✓ — pool made whole, AdvanceRepaid event carries new_reputation\n");

  console.log("Full advance lifecycle on Casper Testnet:");
  console.log(`  issue:  ${link(issueHash)}`);
  console.log(`  approve:${link(approveHash)}`);
  console.log(`  repay:  ${link(repayHash)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
