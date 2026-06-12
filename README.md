# Quid

**A personal money agent on Casper.** Quid watches your cash flow, advances you stablecoin against verified income before payday, and repays itself the moment you're paid, building an on-chain reputation that makes every advance cheaper.

Built for the Casper Agentic Buildathon 2026.

> This is a scaffold. It lays out the architecture and gives you working skeletons for each layer with clear TODOs. It is not a finished product. Check the linked SDK docs for current APIs.

## Architecture

```
  Person ──connect bank──> Plaid (balance, txns, income)
                                │  signals: "short" + "income pending / landed"
                                ▼
                        [ Money Agent ]  ──x402 pay──> income / risk verification
                         own Casper wallet (CSPR.click)
                                │  decide: safe amount, terms
                  issue_advance() / repay_advance()
                                ▼
              Casper Odra contract  ◄── liquidity ──► WiseLending (yield on idle float)
                     advances · repayments · reputation
                                │
                          stablecoin (dUSDC / csprUSD) ──> person's wallet
```

- **Agent is the protagonist.** It holds its own wallet, decides, signs, and acts. The person just benefits.
- **On-chain (Odra contract):** advances, repayments, reputation, and credit risk.
- **Off-chain (agent):** rules, thresholds, Plaid signals, risk model, x402 calls.
- **Liquidity:** WiseLending is the yield/liquidity layer; Quid keeps the credit risk.

## Layout

```
quid/
  contracts/        Odra (Rust) smart contract: the advance pool + reputation
  agent/            TypeScript agent: Plaid, x402, decisioning, Casper signing
  web/              Frontend (PWA). Prototype: web/quid-mockup.html
  docs/             Briefs, user flows, demo script
  CLAUDE-CODE-CHECKLIST.md   Step-by-step to make it functional
```

## Stack

| Layer | Tool |
|---|---|
| Login + wallet + on-ramp | CSPR.click |
| Bank + income | Plaid (Sandbox for dev) |
| On-chain contract | Odra → Casper Testnet |
| Paid agent calls + B2B revenue | x402 |
| Subscriptions | Stripe Billing |
| Liquidity / yield | WiseLending |
| Stablecoin | dUSDC / csprUSD |

## Quick start

```bash
# 1. Contract
cd contracts
cargo odra build              # build the Wasm
cargo odra test               # run tests
# deploy to Testnet with your preferred Casper client, then note the contract hash

# 2. Agent  (runs in SIM mode out of the box, no keys needed)
cd ../agent
npm install
npm start                     # prints one full simulated cycle
# then to go live:
cp .env.example .env          # fill QUID_CONTRACT_HASH, Casper node, Plaid sandbox keys
npm run dev                   # watches + runs live against Plaid + Testnet

# 3. Web
# Prototype: open web/quid-mockup.html in a browser.
# Production app: see web/README.md (React + Tailwind + PWA).
```

## MVP scope (Qualification Round)

The thinnest slice that qualifies: `issue_advance` + `repay_advance` deployed to Casper Testnet, the agent reading Plaid Sandbox and making one x402-paid verification call, and a transaction visible in the explorer. Everything else is upside.

## Docs

- Product brief: `docs/Quid-project-brief.md`
- Frontend brief: `docs/Quid-frontend-brief.md`
- User flows + stack: `docs/Quid-user-flows.md`
- Demo script: `docs/Quid-demo-script.md`
- Claude Code checklist: `CLAUDE-CODE-CHECKLIST.md`

## SDK references

- Odra: https://odra.dev/docs/
- CSPR.click: https://docs.cspr.click/
- CSPR.cloud: https://docs.cspr.cloud/
- Casper docs: https://docs.casper.network/
- Plaid: https://plaid.com/docs/
- x402 / Casper AI Toolkit: https://www.casper.network/ai
- WiseLending: https://casper.wiselending.com/
