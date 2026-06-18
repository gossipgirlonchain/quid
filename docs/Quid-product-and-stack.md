# Quid — Product & Stack Breakdown

A self-contained reference for the product, the agent, the stack, and the on-chain
proof — written so it can be handed to a writer (or another AI) to produce a demo
video script, a pitch, or a deck. Built for the Casper Agentic Buildathon 2026.

- **Live app:** https://app.quid.fund
- **Landing:** https://quid.fund
- **Repo:** https://github.com/gossipgirlonchain/quid

---

## 1. One-liner

A personal money agent on Casper that covers you before payday and repays itself
when you're paid — building an on-chain reputation that makes every advance cheaper.

## 2. The problem

Millions live paycheck-to-paycheck and come up short a few days *before* payday —
rent hits on the 28th, wages land on the 30th. Today's fixes (payday lenders,
earned-wage-access apps like Earnin / DailyPay) are centralized black boxes: opaque
fees, and the trust you build is trapped inside one company. Your good repayment
history is worth nothing anywhere else.

## 3. The solution — an agent, not an app

Quid is an **autonomous money agent**. It holds its *own* Casper wallet, watches
your cash flow, and acts on your behalf. The person doesn't "use a lending app" —
they have an agent that quietly handles the gap. The agent is the protagonist; the
human just benefits.

## 4. How it works — the loop

The agent runs **perceive → verify → decide → act → settle**:

1. **Perceive** — reads balance, recurring bills, and income via Plaid; projects
   whether you'll go short before payday.
2. **Verify** — pays per-call over **x402** to verify the income it would lend against.
3. **Decide** — computes a *safe* advance = **min(plan cap, what your next paycheck
   can comfortably repay)**. Critically, it **declines** rather than over-lend.
4. **Act** — signs `issue_advance` from its own wallet; CEP-18 stablecoin (dUSDC)
   moves from the pool to your Casper wallet.
5. **Settle** — when wages land, it `repay_advance`s itself automatically, and your
   **on-chain Quid score** rises → next advance is cheaper and your ceiling goes up.

The decision math (real, in `agent/src/decision.ts`): income-based ceiling =
verified income × (20% + a reputation bonus, capped). Decline if the shortfall
exceeds the safe ceiling or income can't be verified.

## 5. What the user sees (the journey)

- **Onboarding:** Welcome → pick a **username + social login** (CSPR.click silently
  creates a Casper wallet, no seed phrase) → **connect bank via Plaid** → **set how
  much you might need** (slider: free up to $50; past that a paywall offers plans —
  Free / Starter / Plus / Pro at $0 / $5 / $9 / $15, caps $50 / $100 / $250 / $500).
- **Home:** a calm "You're covered — projected balance, payday in 5 days" card; an
  **Auto-cover** toggle + cap slider; a "Need it now" button; demo-scenario buttons.
- **The advance:** push notification *"you'll be short $180 on the 28th"* → tap →
  confirm sheet (**hold to confirm**) → a 3-step "working" animation (verify wages ·
  issue on Casper · release) → **Active**: *"your advance is ready in your Quid wallet."*
- **Cash out:** "Cash out to bank" → the advance leaves the Casper wallet for the
  linked bank (1–2 business days).
- **Settle:** "wages landed, I repaid $184 automatically" → **Quid score springs up +18**.
- **Auto-covered** (silent, no ask) and **Declined** (*"I won't cover $400 — your
  income can't repay that comfortably, and I'm not putting you in a hole. Borrow $150
  instead."*) outcome screens.
- **Activity:** the on-chain lending log — each advance issue/repay with amounts and
  the resulting score, read **straight from the QuidPool contract**, with "Verify on
  cspr.live."
- **Profile:** Quid score (TRUSTED → 108 pts to PRIME), 7/7 on-time repayments,
  $1,420 advanced lifetime, plan, bank + Casper wallet + "Add funds" (Ramp on-ramp).

## 6. What's real + on-chain proof

Deployed, seeded, and exercised on **Casper Testnet** — every transaction is real
and verifiable:

- **QuidPool contract** `hash-ccdd94c7…ce34` (Odra / Rust): CEP-18 pull/push/pull-back,
  on-chain reputation, CES events. [contract](https://testnet.cspr.live/contract-package/ccdd94c7cf3b559906616f97c0d6624d97969ff5ca5cad7c8e749159ccd4ce34) · [install tx](https://testnet.cspr.live/transaction/35c0b3043257ab1c23e2e0beab2898c608d79a5c10ef767a6e624b0fa1d1f765)
- **Test stablecoin** dUSDC `hash-8665867c…1e89`; **pool seeded with $10,000**.
- **Full advance lifecycle on-chain** (advance #1, $180):
  [issue](https://testnet.cspr.live/transaction/5c0293673c6aca3b5b0cfca8d1d48c4441c21c6de5dc2cd02d4f74408aaac9b6) →
  [borrower approve](https://testnet.cspr.live/transaction/1ba9bba313e77a1c14a14db84666e755bde52c93bafa5758c2eeffa722fda999) →
  [repay](https://testnet.cspr.live/transaction/4276667858322b88f41a254e630addc3a44a044b2ada08dd541d189d2a367e1d)
- **Autonomous loop** issued + repaid a second advance (#2, $104.50), reading the id
  from the on-chain `AdvanceIssued` event:
  [issue](https://testnet.cspr.live/transaction/2512cb6b34cdd54e0d441b7f177839cc8642d6ba3dc3d32d1deb735967b3047c) →
  [repay](https://testnet.cspr.live/transaction/c00d1366334f2302001921b71ce6228ef9e5f89e2a4b5299759f6626af9af3f0)
- The live app's **Activity feed shows 6 real contract events**, decoded from the
  chain over JSON-RPC. The agent **declined** an over-ceiling ask in the live loop —
  real autonomous judgment, not a script.

## 7. The stack

| Layer | Tech | Role |
|---|---|---|
| Smart contract | **Odra 2.7 (Rust)** → Casper Testnet | The credit layer: advances, repayments, reputation, pool accounting, CES events |
| Stablecoin | **CEP-18** (dUSDC) | What the pool lends |
| Agent + backend | **Node / TypeScript**, `casper-js-sdk` v5, Plaid SDK | The loop: Plaid signals, x402, risk decisioning, Casper signing |
| App | **React 18 + Vite 6 + Tailwind 4** (PWA) | The consumer app at app.quid.fund (neobrutalist design) |
| API | **Vercel serverless** (`api/`) | Plaid, Stripe, on/off-ramp, on-chain activity, users — mirrors the agent backend |
| Users / DB | **Supabase** (Postgres) | Username signup + per-user profile / Plaid token |
| Login + wallet | **CSPR.click** | Social login → silent self-custodial Casper wallet |
| Bank + income | **Plaid** (Sandbox) | Balance, recurring income, transactions |
| Paid agent calls | **x402** (Casper facilitator) | Agent pays per call to verify income |
| Fiat on-ramp | **Ramp Network** (Casper partner) | Fund the wallet with a card |
| Subscriptions | **Stripe Billing** | The plan tiers / $50 paywall |
| Hosting | **Vercel** | app.quid.fund (app) + quid.fund (landing) |

## 8. Real vs. scaffolded (keep the pitch honest)

- **Real:** the contract, agent-signed advances/repayments, the autonomous decision
  loop, Plaid Sandbox signals, the on-chain Activity feed, signup/users, the Ramp on-ramp.
- **Scaffolded** (mock fallback, live when keyed): CSPR.click silent wallet, x402
  verification, Stripe billing, and the cash-out off-ramp (simulated ACH — there's no
  turnkey Casper→fiat provider yet; roadmap is a payout provider like Coinflow).

## 9. Why Casper / what's novel

- **Reputation as a first-class on-chain asset** — Quid scores are CES events on the
  contract, *portable* across any app that reads them (vs. trapped in one company's DB).
- **Agent-owned wallet** — the agent signs its own advances/repayments; the contract
  enforces that only the pool admin (the agent) can issue/repay.
- **x402 two-way** — the agent *pays* to verify income, and could *earn* by selling
  its reputation oracle to other agents (B2B revenue).

## 10. Facts & numbers (for the script)

- Live app: **app.quid.fund** · Landing: **quid.fund** · Repo: **github.com/gossipgirlonchain/quid**
- Example shortfall: **$180** (rent on the 28th, wages on the 30th). Autonomous
  advance: **$104.50**. Free-tier cap: **$50**.
- Quid score in the demo: **642 → 660** (+18 on repay); profile shows "TRUSTED,
  108 pts to PRIME, 7/7 on-time, $1,420 lifetime."
- Closing line: *"Your money, handled — before payday. Built on Casper."*

## 11. Suggested narrative arc (~2 min)

Hook (the paycheck-gap problem) → onboarding (no seed phrase, connect bank) → the
agent spots the shortfall and pings you → confirm → **issues on Casper (cut to a real
cspr.live transaction)** → cash out to bank → wages land, auto-repay, **score goes
up** → it also knows when to say no (declined) → Activity feed = the chain → close on
the product.

**Voice:** calm, plain-spoken, first-person ("I covered you"). Quid is a steady,
trustworthy agent — not hypey. End on the product, not the tech.
