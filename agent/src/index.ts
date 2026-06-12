// Quid agent loop: perceive -> verify -> decide -> act -> settle.
//
// Run it now: `npm install && npm run dev`. With no .env it runs in SIM mode and
// prints one full cycle (shortfall -> x402 verify -> decide -> issue on Casper ->
// income lands -> repay) using stubbed data. Fill .env to run live.

import "dotenv/config";
import { SIM, POLL_MS } from "./config.js";
import { getCashflow, incomeHasLanded } from "./plaid.js";
import { verifyIncome } from "./x402.js";
import { decideAdvance } from "./decision.js";
import {
  attachContract,
  issueAdvance,
  repayAdvance,
  reputationOf,
  waitForSettlement,
  advanceIdFromIssueTx,
} from "./casper.js";
import type { User } from "./types.js";

// TODO: load real users from your store. One demo user here. The access token
// comes from `npm run plaid:sandbox`; the wallet is the demo borrower's.
const users: User[] = [
  {
    id: "demo",
    plaidAccessToken: process.env.PLAID_ACCESS_TOKEN ?? "access-sandbox-xxx",
    casperPublicKey:
      process.env.DEMO_BORROWER_PUBLIC_KEY ??
      "01abcd000000000000000000000000000000000000000000000000000000ef",
    tier: "plus",
    autoCover: true,
  },
];

const openAdvances = new Map<string, number>();
const inFlight = new Set<string>(); // users with a tx awaiting finality (one tick may span polls)
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One readable, scripted cycle for SIM / demos. */
async function runSimCycle() {
  const u = users[0];

  console.log("— perceive —");
  const cash = await getCashflow(u.plaidAccessToken);
  const short = Math.max(0, -cash.projectedAtPaydayUsd);
  console.log(`  balance $${cash.balanceUsd}, projected at payday $${cash.projectedAtPaydayUsd} (short by $${short})\n`);

  console.log("— verify (x402) —");
  const { verified } = await verifyIncome(u.id);
  console.log(`  paid per-call verification: income ${verified ? "verified" : "unverified"}\n`);

  const rep = await reputationOf(u.casperPublicKey);

  console.log("— decide —");
  const d = decideAdvance(u, cash, verified, rep);
  console.log(`  reputation ${rep}, safe ceiling $${d.safeCeilingUsd}`);
  console.log(`  decision: ${d.approved ? `advance $${d.amountUsd}` : "decline"} — ${d.reason}\n`);
  if (!d.approved) return;

  console.log(`— act (${u.autoCover ? "auto-cover, no ask" : "ask-first"}) —`);
  await issueAdvance(u.casperPublicKey, d.amountUsd, cash.paydayTs);
  console.log(`  released $${d.amountUsd} stablecoin to ${u.id}'s wallet\n`);

  await delay(1000);

  console.log("— settle —");
  if (await incomeHasLanded(u.plaidAccessToken)) {
    await repayAdvance(0);
    console.log(`  income landed, repaid automatically. reputation -> ${rep + 1}\n`);
  }
  console.log("✓ cycle complete");
}

/** Per-user tick for LIVE mode (polled on an interval). */
async function tick(user: User) {
  if (inFlight.has(user.id)) return; // a tx from a previous tick is still settling

  const existing = openAdvances.get(user.id);
  if (existing !== undefined && (await incomeHasLanded(user.plaidAccessToken))) {
    inFlight.add(user.id);
    try {
      const hash = await repayAdvance(existing);
      console.log(`[${user.id}] repaying advance ${existing}, deploy ${hash}`);
      await waitForSettlement(hash);
      openAdvances.delete(user.id);
      console.log(`[${user.id}] repaid on-chain ✓ (reputation +1)`);
    } finally {
      inFlight.delete(user.id);
    }
    return;
  }
  if (existing !== undefined) return;

  const cash = await getCashflow(user.plaidAccessToken);
  const { verified } = await verifyIncome(user.id);
  const reputation = await reputationOf(user.casperPublicKey);
  const decision = decideAdvance(user, cash, verified, reputation);

  if (!decision.approved) {
    if (cash.projectedAtPaydayUsd < 0) {
      console.log(`[${user.id}] declined: ${decision.reason} (safe ceiling $${decision.safeCeilingUsd})`);
    }
    return;
  }
  if (!user.autoCover) {
    console.log(`[${user.id}] heads-up: can advance $${decision.amountUsd}. Awaiting confirm.`);
    return; // TODO: push -> confirm -> issue
  }

  inFlight.add(user.id);
  try {
    const hash = await issueAdvance(user.casperPublicKey, decision.amountUsd, cash.paydayTs);
    console.log(`[${user.id}] auto-covering $${decision.amountUsd}, deploy ${hash}`);
    await waitForSettlement(hash);
    const id = await advanceIdFromIssueTx(hash);
    openAdvances.set(user.id, id);
    console.log(`[${user.id}] advance ${id} confirmed on-chain ✓`);
  } finally {
    inFlight.delete(user.id);
  }
}

async function main() {
  attachContract();
  if (SIM) {
    console.log("Quid agent — SIM MODE (no chain / Plaid / x402 calls).");
    console.log("Fill .env (QUID_CONTRACT_HASH + keys) to go live.\n");
    await runSimCycle();
    console.log("\nRe-run with `npm run dev`. Full picture: docs/Quid-user-flows.md");
    return;
  }
  console.log("Quid agent — LIVE. Watching", users.length, "user(s).");
  setInterval(() => {
    for (const u of users) tick(u).catch((e) => console.error(`[${u.id}]`, e));
  }, POLL_MS);
}

main().catch(console.error);
