# Contributing to Quid

Thanks for your interest in Quid! This project was built for the Casper
Agentic Buildathon 2026 and is under active development. Issues and pull
requests are welcome.

## Repo layout

| Path | What it is |
|---|---|
| `contracts/` | QuidPool smart contract — [Odra](https://odra.dev) (Rust) targeting Casper. See [contracts/DEPLOY.md](contracts/DEPLOY.md) for build + deploy. |
| `agent/` | The money agent + backend (TypeScript, `casper-js-sdk` v5, Plaid). |
| `web/` | React PWA (Vite + Tailwind). See [web/README.md](web/README.md). |
| `api/` | Vercel serverless functions (Plaid, Stripe, on/off-ramp, on-chain reads). |
| `site/` | Landing page (quid.fund). |
| `docs/` | Product briefs, user flows, demo script. |

## Getting started

**Web app**

```bash
cd web
npm install
npm run dev        # local dev server
npm run typecheck  # tsc --noEmit
npm run build      # production build
```

**Agent**

```bash
cd agent
npm install
cp .env.example .env   # fill in keys (Plaid sandbox, Casper node, wallet)
npm run dev            # autonomous loop, watch mode
npm run demo           # scripted end-to-end demo
```

**Contracts** (requires Rust + the Odra toolchain)

```bash
cd contracts
cargo odra test        # unit tests
cargo odra build       # produce wasm
```

See [contracts/DEPLOY.md](contracts/DEPLOY.md) for deploying to Casper Testnet.

## Guidelines

- Keep changes focused — one concern per PR.
- Run the relevant typecheck/tests before opening a PR
  (`npm run typecheck` in `web/` and `agent/`, `cargo odra test` in `contracts/`).
- Never commit secrets or key material. `.env*`, `keys/`, and `*.pem` are
  gitignored — keep it that way.
- The app is deployed from `main`, so `main` should always be in a working state.

## Questions

Open an issue, or find us in the Casper community:
[Telegram devs group](https://t.me/CSPRDevelopers) ·
[Discord](https://discord.com/invite/caspernetwork).
