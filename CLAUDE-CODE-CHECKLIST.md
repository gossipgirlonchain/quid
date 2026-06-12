# Quid, Claude Code Checklist

Everything to do in Claude Code (CC) to take this scaffold from "runs in SIM" to "functional on Casper Testnet and demoable." Ordered so each step unblocks the next. Each milestone has concrete actions, suggested CC prompts, and how to verify.

The MVP that *qualifies* is milestones 1, 2, and 3 (a real Testnet transaction from the agent). Everything after that strengthens the final-round submission.

---

## 0. Prerequisites (accounts & keys)

- [ ] Install toolchains: Node 20+, Rust + `cargo install cargo-odra`, and the Casper client.
- [ ] Get a **Testnet account** and fund it from the Casper Testnet faucet (cspr.live testnet).
- [ ] **Plaid** dashboard account → grab Sandbox `client_id` + `secret`.
- [ ] **CSPR.click** → register at console.cspr.build, generate an API key (docs.cspr.click).
- [ ] **Stripe** account → test-mode secret key + create the 3 products (Starter/Plus/Pro).
- [ ] Confirm the current **Odra** version and pin it in `contracts/Cargo.toml`.

> CC prompt: "Check the latest Odra version at odra.dev/docs and update contracts/Cargo.toml to match. Then verify casper-js-sdk's current major version and reconcile agent/src/casper.ts with its real API."

---

## 1. Smart contract on Testnet

- [x] Build: `cd contracts && cargo odra build`. Fix any API drift the compiler flags (storage types, `odra_type`, event/error macros). → `wasm/QuidPool.wasm`
- [x] Test: `cargo odra test` (the included test issues + repays and checks reputation).
- [x] Add the **CEP-18 stablecoin** transfers marked `TODO` in `lib.rs` (pull on `fund_pool`, push on `issue_advance`, pull back on `repay_advance`). Done — pool lends an external CEP-18; deploy our own test dUSDC via `bin/livenet_cep18.rs`.
- [x] Deploy the Wasm to **Testnet** (2026-06-12, deployer/admin = agent wallet `019884e5…aced`):
  - QuidPool: `hash-ccdd94c7cf3b559906616f97c0d6624d97969ff5ca5cad7c8e749159ccd4ce34` ([install tx](https://testnet.cspr.live/transaction/35c0b3043257ab1c23e2e0beab2898c608d79a5c10ef767a6e624b0fa1d1f765))
  - Test dUSDC (CEP-18): `hash-8665867ccff5f10ebcec71750f45a02599d467ea8a6371fbc8e828ccd2461e89` ([install tx](https://testnet.cspr.live/transaction/9a9274617fceb51c93922bb5b4d952be34d8a777037cf4dd99c1e41620f3b99d))
- [x] Verify a manual `issue_advance` + `repay_advance` round-trip shows on cspr.live testnet. Done 2026-06-12 via `npm run demo` (borrower wallet `01dc95e5…7edd`, $180): [issue](https://testnet.cspr.live/deploy/5c0293673c6aca3b5b0cfca8d1d48c4441c21c6de5dc2cd02d4f74408aaac9b6) → [borrower approve](https://testnet.cspr.live/deploy/1ba9bba313e77a1c14a14db84666e755bde52c93bafa5758c2eeffa722fda999) → [repay](https://testnet.cspr.live/deploy/4276667858322b88f41a254e630addc3a44a044b2ada08dd541d189d2a367e1d). Rerun with `npm run demo -- <nextId>`.

> CC prompt: "Build and test the Odra contract, fix compile errors against the installed Odra version, then add CEP-18 transfers for [dUSDC/csprUSD] in fund_pool/issue_advance/repay_advance. Walk me through deploying to Testnet and give me the contract hash."

## 2. Agent goes live

- [x] `cp .env.example .env` — done; wired to the funded agent wallet `agent/keys/secret_key.pem` (`019884e5…aced`). Still blank: Plaid sandbox keys, `QUID_CONTRACT_HASH` + `QUID_STABLECOIN_ADDRESS` (from the deploy).
- [x] Implement live `getCashflow` + `incomeHasLanded` in `plaid.ts` (balances, recurring transactions, income verification).
- [x] Finish `casper.ts`: confirmed against the deployed contract (`byPackageHash` calls), real advance ids parsed from the `AdvanceIssued` CES event — verified live: the 2nd demo run issued, read **id 1** from the event, and repaid it ([issue](https://testnet.cspr.live/deploy/2512cb6b34cdd54e0d441b7f177839cc8642d6ba3dc3d32d1deb735967b3047c) → [repay](https://testnet.cspr.live/deploy/c00d1366334f2302001921b71ce6228ef9e5f89e2a4b5299759f6626af9af3f0)). `reputationOf` dictionary read still unverified (needs the dict UREF; the `AdvanceRepaid` event shows reputation on cspr.live meanwhile).
- [ ] Run `npm run dev` (no longer SIM) and confirm it issues a **real** advance on Testnet, then repays. **Everything is staged:** paste Plaid Sandbox `PLAID_CLIENT_ID`+`PLAID_SECRET` into agent/.env, run `npm run plaid:sandbox` (bootstraps the watched bank item, writes `PLAID_ACCESS_TOKEN`), optionally `DEMO_EXTRA_OUTFLOW_USD=300` to stage the shortfall, then `npm run dev`. Demo borrower wallet + $5k standing allowance already on-chain ([approve tx](https://testnet.cspr.live/deploy/d85b2f53681fa4d729c7f360260f8ddbd1b4f83f5f4c582fac641a131c5c2a0a)).

> CC prompt: "Wire agent/src/plaid.ts to real Plaid Sandbox calls and agent/src/casper.ts to the deployed contract. Make the live loop issue and repay a real Testnet advance, and read reputation from chain. Verify the deploy hashes on cspr.live."

## 3. Liquidity & pool

- [x] Seed the pool with Testnet stablecoin via `fund_pool` (team-seeded for MVP). Seeded $10,000 dUSDC on 2026-06-12: [approve](https://testnet.cspr.live/deploy/8d7e070bbb28c163907a2505b068e2636dd1f83b86bf1088863bb1e3a5e8e9c6) → [fund_pool](https://testnet.cspr.live/deploy/4de71a843a5a80b46fe1385310dab52534cc3fdcb6a19310880b8d6d7625d1c3) (`npm run seed` re-runs this).
- [ ] (Later) integrate **WiseLending**: park idle pool stablecoin to earn APY, withdraw on demand. Keep credit risk in Quid's contract.

> CC prompt: "Seed the QuidPool with test stablecoin, then sketch the WiseLending integration so idle pool funds earn yield while staying withdrawable for advances."

---

## 4. Web app (PWA)

- [x] Scaffold **React + Tailwind + Vite** in `web/`. Port the design from `web/quid-mockup.html` (it's the source of truth) using the tokens in `docs/Quid-frontend-brief.md`.
- [x] Build screens in this order: onboarding → home → advance flow → auto-covered/declined → activity → profile.
- [ ] Add `vite-plugin-pwa`: manifest, icons, service worker, offline shell.

> CC prompt: "Scaffold a React + Tailwind + Vite PWA in web/, recreating quid-mockup.html screen-for-screen using the frontend brief's tokens. Keep the neobrutalist styling and the motion rules."

## 5. Consumer integrations

- [ ] **CSPR.click** login (Apple/Google) → silent self-custodial wallet. Replace the mock login screen.
- [ ] **Plaid Link** in the connect-bank step → exchange the public token for an access token on the backend.
- [ ] **Stripe Billing** for the tiers; the paywall fires when the borrow slider passes $50. Handle upgrade/downgrade/cancel + webhooks.

> CC prompt: "Integrate CSPR.click login, Plaid Link, and Stripe Billing into the web app and a small backend. Wire the $50 paywall trigger to Stripe Checkout for the chosen tier."

## 6. x402 (pay and earn)

- [ ] **Pay:** finish `x402.ts` `signX402Payment` against the Casper facilitator so the agent really pays for the verification call.
- [ ] **Earn (optional, strong):** expose a `reputation oracle` endpoint gated by x402 so other agents pay to query a Quid score. This is your B2B revenue demo.

> CC prompt: "Implement the real x402 payment handshake in agent/src/x402.ts against the Casper facilitator, then stand up an x402-gated reputation-oracle endpoint that returns a wallet's Quid score for a per-call fee."

## 7. Notifications

- [ ] Web Push: the heads-up notification is the hero. Backend triggers a push when the agent detects a shortfall; tapping it deep-links into the confirm flow.
- [ ] PWA install prompt.

---

## 8. End-to-end test (the demo path)

- [ ] New user → CSPR.click login → Plaid Sandbox connect → set borrowing → agent detects shortfall → x402 verify → issue on Testnet → funds in wallet → income lands → auto-repay → Quid score up.
- [ ] Confirm every on-chain step is visible on cspr.live testnet.
- [ ] Record the 2-minute video per `docs/Quid-demo-script.md`.

## 9. Submission (DoraHacks)

- [ ] Public **GitHub repo** with this README and setup instructions.
- [ ] **Working prototype** on Casper Testnet with a transaction-producing component (milestones 1–2).
- [ ] **Demo video** (public link).
- [ ] Set up **socials / landing page** (scored under long-term launch plans).
- [ ] Submit before **June 30, 2026**.

---

## Honest status (updated 2026-06-12)

- The agent **runs today** in SIM mode (`npm start`) end-to-end with no keys.
- The contract is **complete** (CEP-18 pull/push/pull-back + reputation + events), tested, and the wasm is built. Livenet deploy bins compile (`QuidPool` + a test `Cep18`).
- The web app is a **built React PWA shell** (`web/`, `npm run build` green): all six screens, Plaid Link + Stripe Checkout + CSPR.click wired through `src/lib/integrations.ts` with mock fallbacks, talking to the zero-dependency backend in `agent/src/server.ts` (`npm run server`).
- `plaid.ts` and `casper.ts` are **live implementations**; `x402.ts` still stubs `signX402Payment` (milestone 6).
- **Deployed & seeded on Casper Testnet (2026-06-12).** QuidPool `hash-ccdd94c7…ce34` + test dUSDC `hash-8665867c…1e89`, pool holds $10,000, all four install/seed transactions verifiable on cspr.live (links in milestones 1 and 3). `agent/.env` is fully wired — the agent is out of SIM. Advance ids are read from the `AdvanceIssued` event (verified live), the demo borrower holds a $5k standing allowance, and `npm run demo` runs the full lifecycle hands-free. The only thing the live loop still needs: Plaid Sandbox keys in `.env`, then `npm run plaid:sandbox` → `npm run dev`.

### Environment gotcha (read if builds hang)

This repo lives under `~/Documents`, which iCloud syncs — it was **evicting file contents** from `node_modules`/`target`, making npm/tsc/cargo hang at 0% CPU. Fix in place: `node_modules` and `contracts/target` are now symlinks to `*.nosync` dirs, which iCloud ignores. **npm install replaces the symlink with a real dir** — if installs/builds ever hang again, re-apply:
`mv node_modules node_modules.nosync && ln -s node_modules.nosync node_modules` (same for `contracts/target`).

Start at milestone 1 and let CC drive each prompt. Keep the briefs in `docs/` open as context.
