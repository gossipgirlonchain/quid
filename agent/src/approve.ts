// Borrower onboarding (chain side): grant the pool a standing allowance on the
// stablecoin so the agent can auto-repay advances as income lands - the
// pre-approval the contract's repay_advance expects. In the consumer app the
// user's CSPR.click wallet signs this once during onboarding.
//
//   npm run approve            # $5,000 standing allowance from the demo borrower
//   npm run approve -- 25000   # custom USD amount

import "dotenv/config";
import { readFileSync } from "node:fs";
import casperSdk from "casper-js-sdk";
import { SIM, NETWORK } from "./config.js";
import { attachContract, waitForSettlement } from "./casper.js";

const { RpcClient, HttpHandler, PrivateKey, KeyAlgorithm, Key, CLValue, Args, ContractCallBuilder } = casperSdk;

const BORROWER_PEM = "./keys/borrower_secret_key.pem";
const DECIMALS = 6;
const PAYMENT_MOTES = 5_000_000_000;

async function main() {
  if (SIM) {
    throw new Error("approve needs live mode - set QUID_CONTRACT_HASH in .env (see contracts/DEPLOY.md)");
  }
  const amountUsd = Number(process.argv[2] ?? 5_000);
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    throw new Error(`invalid allowance amount: ${process.argv[2]}`);
  }
  const token = process.env.QUID_STABLECOIN_ADDRESS!;
  const pool = process.env.QUID_CONTRACT_HASH!;

  attachContract(); // arms waitForSettlement's RPC client
  const rpc = new RpcClient(new HttpHandler(process.env.CASPER_NODE_URL!));
  const borrower = PrivateKey.fromPem(readFileSync(BORROWER_PEM, "utf-8"), KeyAlgorithm.ED25519);
  console.log(`borrower ${borrower.publicKey.toHex()} approves the pool for $${amountUsd}…`);

  const args = Args.fromMap({
    spender: CLValue.newCLKey(Key.newKey(pool)),
    amount: CLValue.newCLUInt256(BigInt(Math.round(amountUsd * 10 ** DECIMALS)).toString()),
  });
  const tx = new ContractCallBuilder()
    .from(borrower.publicKey)
    .byPackageHash(token.replace(/^(contract-package-|hash-)/, ""))
    .entryPoint("approve")
    .runtimeArgs(args)
    .chainName(NETWORK)
    .payment(PAYMENT_MOTES)
    .build();
  tx.sign(borrower);
  const res = await rpc.putTransaction(tx);
  const hash = String(res.transactionHash.toHex?.() ?? res.transactionHash);
  console.log(`  submitted: https://testnet.cspr.live/transaction/${hash}`);
  await waitForSettlement(hash);
  console.log("  finalized ✓ - the agent can now auto-repay up to the allowance");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
