# Quid

**A personal money agent on Casper.** Quid watches your cash flow, advances you stablecoin against verified income before payday, and repays itself the moment you're paid - building an on-chain reputation that makes every advance cheaper.

Built for the Casper Agentic Buildathon 2026.

| | |
|---|---|
| 🟢 **Live app** | **https://app.quid.fund** |
| 🌐 **Landing** | https://quid.fund |
| 📦 **Repo** | https://github.com/gossipgirlonchain/quid |
| 🎬 **Demo video** | _(link)_ |

---

## It's live on Casper Testnet

This isn't a mockup - the contract is deployed, seeded, and the agent has issued and repaid **real advances** on-chain. Every link below is a real transaction you can open on cspr.live.

| What | On-chain |
|---|---|
| **QuidPool contract** | [`hash-ccdd94c7…ce34`](https://testnet.cspr.live/contract-package/ccdd94c7cf3b559906616f97c0d6624d97969ff5ca5cad7c8e749159ccd4ce34) · [install tx](https://testnet.cspr.live/transaction/35c0b3043257ab1c23e2e0beab2898c608d79a5c10ef767a6e624b0fa1d1f765) |
| **Test stablecoin (CEP-18 dUSDC)** | [`hash-8665867c…1e89`](https://testnet.cspr.live/transaction/9a9274617fceb51c93922bb5b4d952be34d8a777037cf4dd99c1e41620f3b99d) |
| **Pool seeded ($10,000)** | [approve](https://testnet.cspr.live/transaction/8d7e070bbb28c163907a2505b068e2636dd1f83b86bf1088863bb1e3a5e8e9c6) → [fund_pool](https://testnet.cspr.live/transaction/4de71a843a5a80b46fe1385310dab52534cc3fdcb6a19310880b8d6d7625d1c3) |
| **Full advance lifecycle** | [issue](https://testnet.cspr.live/transaction/5c0293673c6aca3b5b0cfca8d1d48c4441c21c6de5dc2cd02d4f74408aaac9b6) → [borrower approve](https://testnet.cspr.live/transaction/1ba9bba313e77a1c14a14db84666e755bde52c93bafa5758c2eeffa722fda999) → [repay](https://testnet.cspr.live/transaction/4276667858322b88f41a254e630addc3a44a044b2ada08dd541d189d2a367e1d) |
| **Autonomous loop advance** | [issue](https://testnet.cspr.live/transaction/2512cb6b34cdd54e0d441b7f177839cc8642d6ba3dc3d32d1deb735967b3047c) → [repay](https://testnet.cspr.live/transaction/c00d1366334f2302001921b71ce6228ef9e5f89e2a4b5299759f6626af9af3f0) (advance id read from the `AdvanceIssued` event) |

The app's **Activity** screen reads these events straight from the QuidPool contract over JSON-RPC - what you see in the app is the chain.

---

## What it does

Most "money before payday" apps are centralized black boxes. Quid is an **autonomous agent** that runs a tight loop on your behalf:

```
perceive → verify → decide → act → settle
```

1. **Perceive** - reads your balance, recurring bills, and income via Plaid; projects whether you'll go short before payday.
2. **Verify** - pays per-call over x402 to verify the income it would lend against.
3. **Decide** - computes a safe advance = min(plan cap, what your next paycheck can repay). It **declines** rather than over-lend.
4. **Act** - signs `issue_advance` from its own Casper wallet; stablecoin moves from the pool to your wallet.
5. **Settle** - when wages land, it `repay_advance`s itself automatically and your on-chain **Quid score** ticks up, so the next advance is cheaper.

The agent is the protagonist. It holds its own wallet, decides, signs, and acts - the person just benefits.

---

## What's real vs. demo

We kept this honest. The on-chain credit layer is real; the consumer rails that need merchant accounts / KYC are scaffolded with mock fallbacks (same pattern throughout - live when keys are present, graceful demo otherwise).

**Real, working today**
- ✅ **QuidPool contract** on Testnet - CEP-18 pull/push/pull-back, reputation, CES events. Built + unit-tested with Odra.
- ✅ **Agent issues & repays real advances** via `casper-js-sdk` v5, reading the advance id back from the on-chain event.
- ✅ **Autonomous decision loop** - runs live against Plaid + Testnet; covers shortfalls and **declines** over-ceiling asks.
- ✅ **Plaid Sandbox** - real balance / recurring-income / transaction signals.
- ✅ **Activity feed** - decodes QuidPool events from the chain.
- ✅ **Signup + users** - Supabase (username → profile, per-user Plaid token).
- ✅ **On-ramp** - Ramp Network (an official Casper partner) for funding the wallet.

**Scaffolded (mock fallback, real when keyed)**
- ⏳ **CSPR.click** login / silent wallet - demo wallet until `VITE_CSPRCLICK_APP_ID` is set.
- ⏳ **x402** income verification - returns a stub until a facilitator URL is wired.
- ⏳ **Stripe Billing** for the plan tiers.
- ⏳ **Off-ramp / cash-out** - simulated ACH payout; there's no turnkey Casper→fiat provider, so this routes through a payout provider (Coinflow/Stripe/Dwolla) once configured. See the roadmap.

---

## Architecture

```
  Person ──connect bank──> Plaid (balance, recurring income, txns)
                                │  signals: "short before payday" + "income landed"
                                ▼
                        [ Money Agent ]  ──x402 pay──> income / risk verification
                         own Casper wallet (Ed25519 / CSPR.click)
                                │  decide: safe amount = min(plan cap, repayable-from-income)
                  issue_advance() / repay_advance()      reputationOf()
                                ▼
                     QuidPool - Odra contract on Casper Testnet
                     advances · repayments · on-chain reputation · CES events
                                │
                       CEP-18 stablecoin (dUSDC) ──> person's Casper wallet
                                │
                       cash out ──> off-ramp provider ──> bank account
```

- **On-chain (Odra contract):** the credit layer - advances, repayments, reputation, pool accounting.
- **Off-chain (agent):** rules, thresholds, Plaid signals, the risk model, x402 calls, Casper signing.
- **App + API:** React PWA on Vercel; serverless functions mirror the agent's backend (Plaid, Stripe, on/off-ramp, on-chain Activity).

---

## Stack

| Layer | Tool |
|---|---|
| Smart contract | **Odra** (Rust) → Casper Testnet |
| Agent + backend | Node / TypeScript, `casper-js-sdk` v5, Plaid SDK |
| App | React 18 + Vite 6 + Tailwind 4 (PWA) |
| Hosting / API | Vercel (static + serverless `api/`) |
| Users / DB | Supabase (Postgres) |
| Login + wallet | CSPR.click |
| Bank + income | Plaid (Sandbox) |
| Paid agent calls | x402 (Casper facilitator) |
| Fiat on-ramp | Ramp Network |
| Subscriptions | Stripe Billing |
| Stablecoin | CEP-18 (dUSDC) |

---

## Repo layout

```
quid/
  contracts/   Odra (Rust) smart contract: the advance pool + reputation  (DEPLOY.md)
  agent/       TypeScript agent: Plaid, x402, decisioning, Casper signing
               npm run dev (SIM/live) · npm run demo · npm run seed · npm run plaid:sandbox
  api/         Vercel serverless functions (Plaid, Stripe, on/off-ramp, on-chain activity, users)
  web/         React + Vite + Tailwind PWA  (the app at app.quid.fund)
  site/        Marketing landing page  (quid.fund)
  docs/        Briefs, user flows, demo script, submission write-up
```

## Run it yourself

```bash
# 1. Contract - builds & tests with no keys
cd contracts
cargo odra build            # -> wasm/QuidPool.wasm
cargo odra test             # issues + repays + checks reputation
# deploy to Testnet: see contracts/DEPLOY.md (two cargo runs + npm run seed)

# 2. Agent - runs in SIM mode out of the box
cd ../agent
npm install
npm start                   # prints one full simulated cycle, no keys needed
# go live: cp .env.example .env  (fill QUID_CONTRACT_HASH, Casper node, Plaid keys)
npm run dev                 # autonomous loop against Plaid + Testnet
npm run demo                # one real advance lifecycle on Testnet (issue → approve → repay)

# 3. App
cd ../web
npm install && npm run dev  # http://localhost:5173  (talks to the agent backend on :8787)
```

> **macOS / iCloud note:** this repo lives under `~/Documents` (iCloud-synced), which evicts `node_modules`/`target` contents and hangs builds. They're symlinked to `*.nosync` dirs locally; re-apply after `npm install` if a build hangs. See `CLAUDE-CODE-CHECKLIST.md`.

## Roadmap (post-hackathon)

- **Real off-ramp** - wire a payout provider (Coinflow is the natural fit: USDC→bank ACH/RTP) into `api/offramp/payout.ts` so advances cash out to a real bank.
- **Make x402 real** against the Casper facilitator; expose a reputation-oracle endpoint other agents pay to query (B2B revenue).
- **Liquidity/yield** - park idle pool stablecoin (e.g. WiseLending) while keeping credit risk in Quid's contract.
- **Multi-chain settlement** - evaluate a Base/Solana settlement rail for the money movement while the credit + reputation layer stays on Casper.
- **Harden** - Supabase RLS (service-role), CSPR.click silent wallets, real subscriptions.

## Docs

- Product brief - `docs/Quid-project-brief.md`
- Product & stack breakdown - `docs/Quid-product-and-stack.md`
- User flows - `docs/Quid-user-flows.md`
- Demo script - `docs/Quid-demo-script.md`
- Submission write-up - `docs/Quid-submission.md`
- Contract deploy - `contracts/DEPLOY.md`
- Build checklist + status - `CLAUDE-CODE-CHECKLIST.md`
