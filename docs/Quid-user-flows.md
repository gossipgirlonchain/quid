# Quid, User Flows & Stack Map

**quid.fund · Casper Agentic Buildathon 2026**

A complete inventory of every user flow, what state it's in, and the stack that powers it. Status legend:

- **Built** = in the clickable mockup
- **Specced** = described in the briefs, no screen yet
- **Missing** = not yet designed

The headline: every stack below is available and documented today, so nothing is blocked on tooling. The gaps are design and build, not readiness.

## Stack inventory (all ready)

| Layer | Tool | Covers |
|---|---|---|
| Login + wallet + on-ramp | **CSPR.click** | Social login, silent self-custodial wallet, built-in fiat on-ramp |
| Bank + income | **Plaid** | Balance, transactions, income/payroll verification |
| On-chain | **Odra contract (Casper)** | Advances, repayments, reputation, credit risk |
| Liquidity / yield | **WiseLending** | Idle pool funds earn APY; draw liquidity on demand |
| Paid agent calls + B2B revenue | **x402** | Pay-per-call verification/risk; selling reputation data |
| Subscriptions | **Stripe Billing** | Tiers, upgrades, proration, dunning |
| Agent | **Backend (LLM + orchestration)** | Perceive, decide, act |
| On-chain reads | **CSPR.cloud / MCP** | Balances, contract state, repayment history |
| Notifications | **Web Push + service worker** | The heads-up, receipts, PWA shell |
| Cash out | **CEX / partner ramps** | KuCoin, Ramp, Alchemy Pay, etc. (integrate, don't build) |
| Stablecoin | **dUSDC / csprUSD** | Stable unit of account for advances |

---

## 1. Onboarding & account setup

| Flow | Status | Stack |
|---|---|---|
| Sign up / login (Apple, Google) | Built | CSPR.click |
| Silent wallet creation | Specced | CSPR.click |
| Connect bank | Built | Plaid Link |
| Set expected borrowing + plan select | Built | Stripe (paywall) |
| **Bank reconnect / re-auth when token expires** | Missing | Plaid (update mode) |
| **Income too low / can't qualify yet** | Missing | Agent + Plaid |
| **KYC / identity check (higher tiers, compliance)** | Missing | 3rd-party KYC |
| Returning user login | Built | CSPR.click |

## 2. Core advance loop

| Flow | Status | Stack |
|---|---|---|
| Autonomous shortfall detection → heads-up | Built | Agent + Plaid |
| **Auto-cover under cap (acts silently, notifies after)** | Missing | Agent + contract + Push |
| Manual "Need it now" | Built | Agent |
| Advance confirm | Built | Agent |
| Agent working (verify → issue → release) | Built | x402, Odra, CSPR.click |
| **Advance declined (over ceiling, unverifiable income, low score)** | Missing | Agent + contract |
| Advance active | Built | Odra |
| **Use / cash out the advance** | Missing | Partner ramp |

## 3. Repayment & recovery

| Flow | Status | Stack |
|---|---|---|
| Auto-repay when wages land | Built (settled) | Agent + Plaid trigger + contract |
| Repayment receipt | Built + Specced push | Odra + Web Push |
| **Upcoming repayment view / reminder** | Missing | Agent + Push |
| **Wages delayed / not landed → grace or reschedule** | Missing | Agent + contract |
| **Partial repayment / insufficient funds recovery** | Missing | Agent + contract |

## 4. Autonomy & rules

| Flow | Status | Stack |
|---|---|---|
| Auto-cover toggle | Built | Agent config (off-chain) |
| Cap slider (min of tier and income ceiling) | Built | Agent config |
| Ask-first vs auto behaviour | Specced | Agent config |
| **"Warn me below $X" threshold** | Missing | Agent config |

## 5. Subscription & billing

| Flow | Status | Stack |
|---|---|---|
| Plan select at onboarding | Built | Stripe |
| Free → paid upgrade trigger (slider) | Built | Stripe |
| Tiers visible in Profile | Built | Stripe |
| **Upgrade / downgrade plan** | Missing | Stripe Billing |
| **Cancel / pause** | Missing | Stripe Billing |
| **Add / update payment method** | Missing | Stripe |
| **Billing failure / dunning** | Missing | Stripe |

## 6. Money movement & wallet

| Flow | Status | Stack |
|---|---|---|
| Receive advance (stablecoin to wallet) | Built | Odra + dUSDC |
| View on-chain transaction | Built (links) | CSPR.cloud |
| **Cash out advance to bank (off-ramp)** | Missing | CEX / partner ramp |
| **View wallet / balance / export** | Missing | CSPR.click + CSPR.cloud |
| **Top-up / buy (on-ramp)** | Missing (likely not needed) | CSPR.click |

## 7. Reputation & trust

| Flow | Status | Stack |
|---|---|---|
| Quid score view | Built (Profile) | CSPR.cloud |
| Score increase after repay | Built | Odra |
| **Score history / why it changed** | Missing | CSPR.cloud reads |
| Score as a paid oracle (B2B) | Specced | x402 (revenue) |

## 8. Notifications & PWA

| Flow | Status | Stack |
|---|---|---|
| Notification preferences | Built (Profile) | Local |
| **Install PWA prompt** | Missing | Service worker / manifest |
| **Enable push permission** | Missing | Web Push |
| **Heads-up push → deep link into confirm** | Missing | Web Push (the hero) |
| Repayment receipt push | Specced | Web Push |
| Offline shell | Specced | Service worker |

## 9. Account & settings

| Flow | Status | Stack |
|---|---|---|
| Security: Face ID / biometric | Built (toggle) | Device + CSPR.click |
| Manage connected bank | Built (view) | Plaid |
| Logout | Built | CSPR.click |
| **Edit profile (name, email)** | Missing | Backend |
| **Wallet management / view / export** | Missing | CSPR.click |
| **Delete account / data (GDPR/CCPA)** | Missing | Backend |

## 10. Support & edge cases

| Flow | Status | Stack |
|---|---|---|
| **Help / support / chat** | Missing | Support tool |
| **Dispute or report an advance** | Missing | Backend |
| **Error states (Plaid down, chain congestion, x402 fail)** | Missing | All |

## 11. Protocol side: where the liquidity comes from

Casper the network does **not** lend the money or carry default risk, it's infrastructure. The advance capital has to come from somewhere, and Quid owns the credit model and the risk. But the ecosystem gives you sources rather than a cold start:

- **WiseLending (the chosen liquidity layer).** Quid's pool parks idle stablecoin in WiseLending to earn variable APY and draws liquidity on demand. Caveat: WiseLending is *collateralized* lending, so it does not underwrite the uncollateralized income-based advance, Quid's own contract keeps that credit risk. WiseLending = yield + liquidity; Quid = credit.
- **DEX / AMM liquidity** (CasperSwap, Friendly Market, CSPR.trade).
- **csprUSD / dUSDC** native stablecoins as the unit of account.
- **Ecosystem LPs**, CSPR holders have signalled willingness to fund promising DeFi projects, so the pool can attract third-party liquidity.
- **Casper Accelerate grant ($25M)**, can seed the pool or fund the build.

| Flow | Status | Stack |
|---|---|---|
| Supply liquidity to the pool, earn yield | Missing (out of consumer app) | Odra pool contract or existing money market |
| Seed pool for MVP | Team / grant | Treasury wallet |

For the hackathon: seed the pool yourself or via a grant. For production: attract ecosystem LPs or route through an existing Casper money market. A dedicated lender dashboard is only needed if you run your own pool, and may be avoidable entirely.

---

## What to prioritise

**Already covers the demo spine**, the happy path (onboarding → heads-up → confirm → working → active → settled) is built and is enough to qualify and to film.

**Add for a stronger demo and judging (credibility of the agent):**

1. **Advance declined.** Shows the agent has judgment and a safety boundary, not just a yes-machine. High value, low effort.
2. **Auto-cover acts silently, notifies after.** This is the clearest proof of true autonomy, distinct from the ask-first heads-up.
3. **The heads-up as a real push notification + PWA install.** It's the hero moment and the thing that makes it feel like a shipped product.
4. **Wages-delayed / repayment recovery.** Shows robustness, which maps to "technical execution."

**Production, not MVP** (note in the roadmap, don't build for the demo): full Stripe plan management (upgrade/cancel/dunning), bank re-auth, KYC, off-ramp/cash-out screens, wallet management, account deletion, support/disputes, and the lender dashboard.

---

*Pairs with `Quid-project-brief.md` and `Quid-frontend-brief.md`.*
