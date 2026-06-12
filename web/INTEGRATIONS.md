# Consumer integrations — CSPR.click, Plaid Link, Stripe

All three onboarding integrations are wired with **mock-first fallbacks**: with no keys the
flow is fully clickable (demo mode); add keys and the same code paths go live. The web app
talks to the agent's backend (`agent/src/server.ts`, `npm run server`, port 8787); Vite
proxies `/api` to it.

## Run it

```bash
# terminal 1 — backend (Plaid + Stripe). Mock until you fill agent/.env.
cd agent && npm run server

# terminal 2 — web app
cd web && npm run dev          # http://localhost:5173
```

`GET /api/health` reports whether Plaid and Stripe are `live` or `mock`.

## 1. CSPR.click — login + silent wallet

Client-side. The login screen calls `useAuth().login()` ([src/lib/integrations.ts](src/lib/integrations.ts)).

- **Mock (default):** `login()` is a no-op; onboarding proceeds with a demo wallet.
- **Live:** set `VITE_CSPRCLICK_APP_ID` (from [console.cspr.build](https://console.cspr.build)) in `web/.env`, then wrap the app in CSPR.click's `ClickProvider` and call its sign-in from `login()`:
  ```tsx
  // npm i @make-software/csprclick-ui @make-software/csprclick-core-client
  import { ClickProvider } from "@make-software/csprclick-ui";
  const options = { appName: "Quid", appId: import.meta.env.VITE_CSPRCLICK_APP_ID,
    contentMode: "iframe", providers: ["casper-wallet", "ledger"] };
  // <ClickProvider options={options}><App/></ClickProvider>
  // login(): clickRef.signIn()  -> provisions a self-custodial Casper wallet, no seed phrase
  ```
  See [docs.cspr.click](https://docs.cspr.click/).

## 2. Plaid Link — connect bank

Backend mints a Link token; the client opens Plaid Link; the public token is exchanged for an access token server-side ([usePlaidConnect](src/lib/integrations.ts)).

- **Mock (default):** `/api/plaid/link-token` returns `{ link_token: null }`; "Connect with Plaid" just advances.
- **Live:** set `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV=sandbox` in `agent/.env`. The real Link modal opens; on success `/api/plaid/exchange` stores the access token (wire the `TODO` there to your user store — the agent reads it for cashflow/income).

## 3. Stripe — the $50 paywall

When the borrow slider passes $50, "Subscribe & continue" calls `startCheckout(tier)`, which hits `/api/stripe/checkout` and redirects to Stripe Checkout.

- **Mock (default):** returns `{ url: null }`; the app just continues to Home.
- **Live:** in `agent/.env` set `STRIPE_SECRET_KEY` and the three price IDs (`STRIPE_PRICE_STARTER/PLUS/PRO`); create the products in Stripe first. Set `STRIPE_WEBHOOK_SECRET` and point a webhook at `/api/stripe/webhook` to flip the user's plan tier on `checkout.session.completed` (wire the `TODO` in `server.ts`).

## Env summary

| File | Vars |
|---|---|
| `web/.env` | `VITE_API_BASE`, `VITE_CSPRCLICK_APP_ID` |
| `agent/.env` | `PLAID_CLIENT_ID/SECRET/ENV`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*`, `STRIPE_WEBHOOK_SECRET`, `SERVER_PORT`, `WEB_ORIGIN` |
