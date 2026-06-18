# Quid - DoraHacks Submission

_Paste-ready write-up for the Casper Agentic Buildathon 2026. Trim to fit the form fields._

---

## Tagline

A personal money agent on Casper that covers you before payday and repays itself when you're paid.

## Links

- **Live app:** https://app.quid.fund
- **Landing:** https://quid.fund
- **GitHub:** https://github.com/gossipgirlonchain/quid
- **Demo video:** _(link)_
- **Deployed contract (cspr.live):** https://testnet.cspr.live/contract-package/ccdd94c7cf3b559906616f97c0d6624d97969ff5ca5cad7c8e749159ccd4ce34

## The problem

Millions of people run out of money a few days before payday. The existing fix - payday lenders and earned-wage-access apps - are centralized black boxes with opaque fees and no portable track record. You build trust with one app and it's worth nothing anywhere else.

## The solution

Quid is an **autonomous money agent**. It holds its own Casper wallet, watches your cash flow, and runs a tight loop on your behalf:

**perceive → verify → decide → act → settle**

1. **Perceive** - reads balance, recurring bills, and income via Plaid; projects whether you'll go short before payday.
2. **Verify** - pays per-call over x402 to verify the income it lends against.
3. **Decide** - advance = min(plan cap, what your next paycheck can safely repay). It *declines* rather than over-lend.
4. **Act** - signs `issue_advance` from its own wallet; stablecoin moves from the pool to yours.
5. **Settle** - when wages land it repays itself, and your **on-chain Quid score** rises, so the next advance is cheaper.

The reputation lives on Casper - portable, verifiable, and ownable by the user, not locked inside one company's database.

## What we built (and it's real on Testnet)

The contract is deployed and seeded, and the agent has issued and repaid **real advances** on-chain:

- **QuidPool** Odra contract - CEP-18 pull/push/pull-back, reputation, CES events. [Deployed](https://testnet.cspr.live/contract-package/ccdd94c7cf3b559906616f97c0d6624d97969ff5ca5cad7c8e749159ccd4ce34) + [install tx](https://testnet.cspr.live/transaction/35c0b3043257ab1c23e2e0beab2898c608d79a5c10ef767a6e624b0fa1d1f765).
- **Full advance lifecycle on-chain:** [issue](https://testnet.cspr.live/transaction/5c0293673c6aca3b5b0cfca8d1d48c4441c21c6de5dc2cd02d4f74408aaac9b6) → [borrower approve](https://testnet.cspr.live/transaction/1ba9bba313e77a1c14a14db84666e755bde52c93bafa5758c2eeffa722fda999) → [repay](https://testnet.cspr.live/transaction/4276667858322b88f41a254e630addc3a44a044b2ada08dd541d189d2a367e1d).
- **Autonomous loop** issuing + repaying a second advance, reading the advance id from the on-chain `AdvanceIssued` event: [issue](https://testnet.cspr.live/transaction/2512cb6b34cdd54e0d441b7f177839cc8642d6ba3dc3d32d1deb735967b3047c) → [repay](https://testnet.cspr.live/transaction/c00d1366334f2302001921b71ce6228ef9e5f89e2a4b5299759f6626af9af3f0).
- **Live consumer app** (PWA) - onboarding, the advance flow, cash-out-to-bank, and an **Activity feed that reads QuidPool events straight from the chain**.
- **Plaid Sandbox** integration for real balance / income / transaction signals, and the autonomous agent loop covering shortfalls and declining over-ceiling asks.

## Why Casper

- **Reputation as a first-class on-chain asset** - Quid scores are CES events on the contract, portable across any app that reads them.
- **Agent-owned wallet** - the agent signs its own advances and repayments; the contract enforces that only the pool admin (the agent) can issue/repay.
- **x402** - the agent pays per call to verify income, and can earn by selling its reputation oracle to other agents (B2B revenue).
- Casper's official **on-ramp partners** (Ramp, Alchemy Pay) make funding real.

## Tech

Odra (Rust) contract on Casper Testnet · TypeScript agent (`casper-js-sdk` v5, Plaid) · React + Vite + Tailwind PWA · Vercel serverless API · Supabase · CSPR.click · x402 · Ramp · Stripe.

## Honest status

**Real:** the QuidPool contract, agent-signed advances/repayments, the autonomous decision loop, Plaid Sandbox signals, the on-chain Activity feed, signup/users, and the Ramp on-ramp.
**Scaffolded** (mock fallback, live when keyed): CSPR.click silent wallet, x402 verification, Stripe billing, and the cash-out off-ramp (simulated ACH until a payout provider is wired - there's no turnkey Casper→fiat provider).

## What's next

Real off-ramp via a payout provider (Coinflow), a live x402 reputation oracle, idle-liquidity yield, and hardening (RLS, real wallets, subscriptions).
