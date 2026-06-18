// One-shot pool seeding (DEPLOY.md step 4): approve QuidPool as a spender on the
// CEP-18 stablecoin, wait for finality, then fund_pool. Run after both deploys:
//
//   npm run seed            # seeds $10,000
//   npm run seed -- 25000   # custom USD amount
//
// Needs QUID_CONTRACT_HASH + QUID_STABLECOIN_ADDRESS in .env. In SIM mode it
// just logs the two calls and exits.

import "dotenv/config";
import { SIM } from "./config.js";
import { attachContract, approveStablecoin, fundPool, waitForSettlement } from "./casper.js";

async function main() {
  const amountUsd = Number(process.argv[2] ?? 10_000);
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    throw new Error(`invalid seed amount: ${process.argv[2]}`);
  }

  attachContract();

  if (SIM) {
    console.log("SIM mode (QUID_CONTRACT_HASH unset) - logging the calls only.\n");
    await approveStablecoin("hash-token", "hash-pool", amountUsd);
    await fundPool(amountUsd);
    return;
  }

  const token = process.env.QUID_STABLECOIN_ADDRESS;
  const pool = process.env.QUID_CONTRACT_HASH;
  if (!token || !pool) {
    throw new Error("set QUID_STABLECOIN_ADDRESS and QUID_CONTRACT_HASH in .env first");
  }

  console.log(`Seeding pool with $${amountUsd}…`);

  const approveHash = await approveStablecoin(token, pool, amountUsd);
  console.log(`  approve submitted: ${approveHash}`);
  await waitForSettlement(approveHash);
  console.log("  approve finalized ✓");

  const fundHash = await fundPool(amountUsd);
  console.log(`  fund_pool submitted: ${fundHash}`);
  await waitForSettlement(fundHash);
  console.log("  fund_pool finalized ✓");

  console.log(`\nPool seeded. Verify on https://testnet.cspr.live/transaction/${fundHash}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
