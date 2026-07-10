# Security Policy

## Scope

Quid is a buildathon project deployed on **Casper Testnet only**. No mainnet
funds are at risk. Still, we take security reports seriously — the contract,
agent, and API are all in scope.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

- Email **winny@winny.wtf** with a description, reproduction steps, and impact.
- Or use GitHub's private vulnerability reporting on this repository
  (Security tab → "Report a vulnerability").

You can expect an acknowledgement within 72 hours.

## Out of scope

- Issues in third-party services we integrate (Plaid, Stripe, Ramp, Supabase,
  Vercel) — report those upstream.
- Rate limiting / denial of service against the demo deployment.

## Handling of secrets

All keys and wallets in this repo's history are testnet/sandbox credentials.
If you find a leaked credential anyway, please report it via the channel above.
