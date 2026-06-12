# Quid, Project Brief

**quid.fund**

**Casper Agentic Buildathon 2026 · Casper Innovation Track**

> Your personal money agent notices you're short before payday, autonomously sources an advance against your verified pending income, and repays it the moment your money lands. You don't lift a finger.

---

## The one-liner

Quid is a personal money agent that lives on Casper. It watches your cash flow, and when it sees you'll come up short before payday, it autonomously advances you cash against income you're already owed, then repays itself the moment that income arrives. The person is the beneficiary. The agent is the one perceiving, deciding, and transacting.

## Why this wins

Look at the rest of the field in this buildathon: payment rails, agent treasuries, oracles, working-capital infra. **Every submission is B2B or infrastructure. Nobody built a consumer product.** That matters for two reasons:

- **Community votes.** The top 3 community-voted projects skip judging entirely. A relatable consumer story ("get paid before payday") is something normal people can understand and vote for. Infra is not.
- **Differentiation.** Most submitted agents serve other agents or developers. An agent that autonomously manages a real person's money is the agent economy applied to actual life. That's a stronger, more legible vision, and it's wide open.

It also stays squarely on-brief. The agent is unambiguously the autonomous actor: it holds its own Casper wallet, spends via x402, signs its own transactions, and decides when to act. This is the brief's own example #1 ("transforming a passive wallet into an active, self-driving portfolio manager"), pointed at a consumer's life instead of a DeFi portfolio.

---

## How it works, the agent loop

The agent perceives, decides, and acts autonomously. That is the "agentic" story the judges want.

1. **Perceive.** The agent reads your cash flow (balance + transactions) and sees a shortfall coming before your next payout.
2. **Verify.** It confirms the pending income you're owed is real (income/payroll verification).
3. **Pay per call via x402.** For the verification and risk checks, the agent calls a paid endpoint, gets an HTTP 402 + price, signs an authorization, and gets the result back in seconds. This is the flagship-protocol hook.
4. **Decide & price.** It computes an advance amount and a small fee from the risk and your on-chain repayment history (reputation).
5. **Act.** The agent issues the advance on Casper and releases CSPR to you immediately, funded by a lender pool.
6. **Repay.** When your income lands, the agent detects it and repays the advance plus fee on its own. Your on-chain reputation updates, so future advances get cheaper.

```
Person ──connect bank──> Plaid (balance, txns, income)
                              │  signals: "short" + "income pending / landed"
                              ▼
                    [ Money Agent ]  ──x402 pay──> verify / risk
                     own Casper wallet, signs its own txns
                              │
                  issue_advance() / repay()
                              ▼
            Casper Odra contract + lender pool  ──> CSPR to person
```

---

## The stack

**Data / income layer (the agent's eyes), Plaid.** Two products: Transactions + Balance to detect the shortfall, and Income/Payroll verification to confirm the pending income the advance is secured against. Use **Plaid Sandbox** for the build: it works instantly with fake institutions and needs no bank approvals, which is ideal for a demo. (Argyle or Pinwheel are gig/payroll-specialist alternatives if you want to target freelancers specifically.)

**The agent (the brain).** An orchestration layer (LLM + logic) that reads the Plaid signals, decides the advance amount and terms, pays per-call via x402 for verification/risk, and signs Casper transactions. This is the protagonist.

**On-chain layer (the wallet + settlement), Casper Testnet.** The Odra contract handles advance issuance, the lender pool, repayment, and the reputation map. The agent holds its own wallet and signs via the CSPR.build / CSPR.click agent skill. CSPR.cloud / MCP for reading chain state and repayment history.

**x402.** The agent's paid per-request calls for verification and risk scoring. Real usage of the protocol the $100k in credits is meant for.

**Frontend.** Minimal consumer onboarding: connect bank via Plaid Link, set your rules once, watch the agent work.

### Critical scoping call: Plaid = eyes, Casper = money

Keep the **value** flow entirely in CSPR. Use Plaid only as the **verification + trigger** signal, never as a money-movement rail. The advance is paid in CSPR and repayment is in CSPR; Plaid's only jobs are (a) prove the pending income is real and (b) tell the agent when income lands so it can repay. The moment you try to move real fiat (ACH, etc.) you need a processor like Dwolla/Stripe plus banking approvals, which will sink the timeline.

---

## Smart contract interface (Odra / Rust)

Keep it lean for the hackathon:

```rust
// agent issues an advance secured by verified pending income
fn issue_advance(borrower: Address, amount: U256,
                 expected_income_date: u64, fee_bps: u16) -> AdvanceId;

// lenders fund the pool the advances draw from
fn fund_pool(); // payable

// agent repays advance + fee when income lands; bumps reputation
fn repay_advance(id: AdvanceId); // payable

// read-only: borrower reputation used in pricing
fn reputation_of(borrower: Address) -> u32;
```

The `issue_advance` + `repay_advance` flow is the **transaction-producing on-chain component** the qualification round requires. Everything else is upside.

---

## How it maps to the brief

| Brief requirement | How Quid hits it |
|---|---|
| RWA focus | The pending payout you're owed is a real-world receivable, tokenized on Casper as the advance's collateral. |
| DeFi focus | A lender pool funds the advances and earns yield (paid from subscription revenue). On-chain consumer credit market. |
| Agentic AI | The agent perceives the shortfall, verifies income, decides terms, issues funds, and repays itself. Full perceive-decide-act loop with real wallet authority. |
| x402 (flagship) | Agent pays per-call via HTTP 402 for income verification and risk checks. |
| Working contract on Testnet | Odra `issue_advance` / `repay_advance` produces the required on-chain transactions. |
| MCP / CSPR.cloud | Agent reads on-chain repayment history to build the reputation score. |
| Real-world applicability | "Get paid before payday" is a universal, emotionally legible consumer need. |

---

## Casper tooling to use

From the Casper AI Toolkit ([casper.network/ai](https://www.casper.network/ai)):

- **Odra Framework**, Rust smart contract framework with prebuilt modules and AI-discoverable docs. Your contract layer. ([odra.dev/docs](https://odra.dev/docs/), [docs.rs/odra](https://docs.rs/odra/latest/odra/))
- **x402 Facilitator**, live on Casper, HTTP-native pay-per-request for the agent's verification calls. Casper is the first WebAssembly-native L1 with live x402.
- **CSPR.click / CSPR.build Agent Skill**, wallet creation, transaction signing, CSPR.cloud API proxy, contract deployment via Odra. Fastest path to giving the agent its own wallet.
- **Casper MCP server**, lets the agent query balances, read contract state, and monitor transfers. ([github.com/msanlisavas/casper-mcp](https://github.com/msanlisavas/casper-mcp))
- **CSPR.cloud APIs**, REST + Streaming middleware for indexed on-chain data (repayment history into reputation). ([docs.cspr.cloud](https://docs.cspr.cloud/))

---

## Competitive landscape

What's already submitted to the Casper Innovation Track, and where Quid sits:

- **x402 payment rails (crowded):** AgentPay Guard, x402 Crypto API, AgentPay-x402, AiFinPay, Phoenix Zero. Five+ projects building the same machine-to-machine payment infra. Avoid this lane.
- **RWA oracle (taken):** Casper RWA Oracle. Generic off-chain data feeds.
- **DeFi portfolio / yield (taken):** Agent Casper.
- **Working capital (adjacent):** credmesh.xyz, but it's crypto-native working capital (Solana/Arbitrum tags), not a consumer product.
- **Remittances:** Kawi (Brazil), different problem.

**Quid's open ground:** the only consumer-facing agent in the field, and the only one where an agent autonomously manages a real person's everyday money. Differentiation is built in.

---

## Business model

Quid is subscription-only. No per-advance fee, no interest, no tip. You pay a flat monthly membership for access, and the tier you choose sets how much you can borrow.

### Pricing tiers

| Tier | Price | Borrow up to |
|---|---|---|
| Free | $0 | $50 |
| Starter | $5/mo | $100 |
| Plus | $9/mo | $250 |
| Pro | $15/mo | $500 |

Your real limit is the lower of your tier cap and the safe ceiling the agent computes from your verified income, so a plan never lets you borrow more than you can repay. Annual plans add a discount and reduce churn. Billing runs on Stripe Billing, which handles tiers, upgrades, and proration out of the box.

**The subscription trigger (freemium hook).** Everyone starts free with a $50 ceiling, no card required, so there is zero friction to get the first advance. The paywall appears at the exact moment of intent: during onboarding (and later on the cap slider), the instant the user drags their limit above $50, Quid surfaces the plan that unlocks it. They feel the value before they pay for it, which is the highest-converting place to ask.

### Why subscription, not per-advance fees

Per-advance fees are exactly what gets cash-advance apps classified as disguised lending, because the fee reads as a finance charge or APR. A flat membership with no per-advance fee and no interest is the cleanest structure in the category. Brigit runs this way today (subscription-only, no per-advance fee, no tip). Tiering the membership by borrow limit is a sensible upgrade on it.

### Why the economics work: the float is short

An advance is outstanding only about 5 days, so the cost of capital per user is tiny. If the lender pool earns ~8% APY and a user holds ~$150 for 5 days, the yield Quid owes the pool is about $0.16 for that cycle. A $5 to $15/mo subscription comfortably funds the lender APY and leaves most of the fee as margin. The model is recurring, capital-light (the pool, not Quid, fronts the cash), and high-margin.

### Where the money flows

Subscription revenue funds two things: the lender pool's APY (compensating whoever supplies the CSPR liquidity) and Quid's own margin. Lenders earn yield for supplying the float; Quid keeps the difference. The on-chain Quid score is the long-term moat: as users build repayment history, default risk falls, so the same subscription supports a higher ceiling at the same cost, which lifts retention.

(x402 is a cost line for the agent's verification calls, not a revenue source.)

### The legal caveat still applies

Subscription-only is the safer structure, but it is not a free pass. The CFPB and several US states are actively looking at earned-wage-access and membership advance models, and tying the membership price to the borrow limit could still draw finance-charge scrutiny. The crypto pool adds money-transmission, lending-license, and securities questions depending on jurisdiction. None of this blocks the hackathon, which runs on Testnet with no real funds, but a real-money launch needs real counsel on EWA-vs-lending classification, licensing, and how the pool and its yield are framed.

*This is general information, not legal or financial advice.*

---

## Build plan

### MVP for the Qualification Round (deadline: June 30)

Thinnest vertical slice that qualifies (working Testnet prototype with a transaction-producing component):

- Odra contract with `issue_advance` + `repay_advance` deployed to Testnet.
- Agent reads Plaid Sandbox data, detects a shortfall, and verifies a pending income event.
- One x402-paid verification/risk call wired in (even a stub paid endpoint shows the protocol working).
- Agent holds a Casper wallet and signs its own transactions via the CSPR.build skill.
- Minimal frontend: connect bank (Plaid Link), set rules, watch the agent advance and repay. Show the Testnet transactions in the explorer.
- README with setup + usage, plus a 90-second demo video.

### Stretch for the Final Round

- Repayment auto-trigger on income arrival + the reputation loop (cheaper future advances).
- Real lender pool with yield (DeFi depth).
- Rules engine: user sets thresholds and the agent runs autonomously within their plan tier.
- Polished UX, landing page, and socials (the comp scores "long-term launch plans").

### Suggested 30-day rhythm

- **Week 1**, Odra contract skeleton on Testnet; agent wallet + signing via CSPR.build skill; Plaid Sandbox connected.
- **Week 2**, wire issue_advance + repay end to end; basic frontend; first on-chain transaction in the demo.
- **Week 3**, x402 verification call; shortfall detection + risk scoring; reputation read.
- **Week 4**, repayment trigger + reputation write (stretch); record demo video; README; socials; submit before June 30.

---

## Qualification checklist

- [ ] Working prototype on Casper Testnet with a transaction-producing on-chain component
- [ ] Open-source GitHub repo with README (setup + usage)
- [ ] Public demo video (walkthrough)
- [ ] Original code, newly built for the buildathon
- [ ] Submitted via DoraHacks before June 30, 2026

---

## Onboarding & login

Casper's recommended onboarding tool is **CSPR.click**, and it fits a consumer app perfectly. It offers social login (Google, Apple) that instantly provisions a self-custodial Casper wallet behind the scenes, with no seed phrase and no browser extension, plus built-in fiat on-ramps and a CSPR.cloud client. Quid uses CSPR.click for sign-in so the wallet is invisible to the user. Docs: [docs.cspr.click](https://docs.cspr.click/).

The onboarding flow is four steps:

1. **Welcome**, the value proposition and a single Get started button.
2. **Login**, Continue with Apple / Google via CSPR.click. A Casper wallet is created silently.
3. **Connect bank**, Plaid Link, read-only, to read cash flow and verify income.
4. **Set expected borrowing**, a slider. Up to $50 stays free; the moment the user drags above $50, the plan paywall appears to unlock the higher limit.

## Resolved decisions

- **Income signal:** Plaid (Transactions + Balance + Income/Payroll), Sandbox for the build.
- **Login/auth:** CSPR.click social login (Casper's recommendation). Wallet is self-custodial and invisible to the user.
- **On-chain vs off-chain (Casper's hybrid guidance):** valuable, trust-critical state lives on-chain in the Odra contract (the lender pool, advances, repayments, reputation); the user's rules and thresholds live off-chain in the agent config. For the MVP, a single seeded pool is fine.
- **Reputation:** scored from verified income, so a brand-new user with no Casper history is priced off their income alone, and the on-chain score builds from there as they repay.

## Funding, ramps & custody

You integrate ramps, you do not build them. Casper documents the full path.

- **Asset:** advances are denominated in a Casper-native USD stablecoin (dUSDC / csprUSD), not CSPR, so the value is stable. The agent holds a little CSPR for gas.
- **Liquidity (WiseLending):** Quid's advance pool uses [WiseLending](https://casper.wiselending.com/), Casper's lending/borrowing market, as its capital backbone. Idle pool stablecoin earns variable APY on WiseLending between advances, and Quid draws liquidity from it on demand. Important distinction: WiseLending is *collateralized* DeFi lending, so it does not underwrite the *uncollateralized* income-based advance itself. That credit risk and the income underwriting stay in Quid's own Odra contract. WiseLending is the yield and liquidity layer; Quid is the credit layer. This keeps Quid capital-light and gives idle float a yield instead of sitting dead.
- **On-ramp (fiat in):** CSPR.click's SDK ships a built-in on-ramp UI (buy CSPR or stablecoins by card or wire, multiple providers). CSPR.live and Casper Wallet have the same built-in Buy flow. Funding a wallet is a drop-in, not a build. ([docs.cspr.click](https://docs.cspr.click/))
- **Off-ramp (cash out):** the reverse, via a CEX (e.g. KuCoin) or partner ramps (Ramp, Uphold, Alchemy Pay, Guardarian, Bit2Me, NOWPayments) to the user's bank. A 1-2 day cash-out is standard and acceptable for this product; nothing custom to build. ([Casper funding docs](https://docs.casper.network/users/funding-from-exchanges))
- **Wallets:** the user's wallet is the self-custodial CSPR.click wallet created at login. The lender pool is an Odra contract; the x402 treasury is a standard Casper account. CSPR.click's agent skill creates and signs from the agent's wallet.
- **MVP scope:** on Testnet, advances land as a stablecoin in the CSPR.click wallet and repay on-chain. Real fiat on/off-ramp is a partner integration for production, not something Quid builds.

---

*Sources: [Casper AI Toolkit](https://www.casper.network/ai), [Odra docs](https://odra.dev/docs/), [Casper AI Toolkit launch coverage](https://chainwire.org/2026/06/04/casper-network-launches-ai-toolkit-becoming-first-webassembly-native-blockchain-with-live-x402-payments/), [casper-mcp](https://github.com/msanlisavas/casper-mcp), [CSPR.cloud docs](https://docs.cspr.cloud/), [Plaid Income/Transactions](https://plaid.com/docs/).*
