# Quid, web (PWA)

The consumer app. Neobrutalist, installable as a PWA on phone and desktop.

## Prototype

The clickable prototype is **`./quid-mockup.html`** (open it in a browser). It's the source of truth for the design language, screens, and flows, and doubles as the demo storyboard. Design spec: `../docs/Quid-frontend-brief.md`.

## Production build (recommended stack)

- **React + Tailwind** (tokens from the frontend brief as CSS variables).
- **CSPR.click** for login + the silent self-custodial wallet + fiat on-ramp.
- **Plaid Link** for bank connection.
- **Stripe Billing** for the subscription tiers (Free / Starter / Plus / Pro).
- **`motion/react`** for the money-moment springs; **Base UI** (or Radix) for accessible primitives.
- **`vite-plugin-pwa`** for the manifest, service worker, and Web Push (the heads-up notification is the hero, build it first-class).

## Build order

1. Tokens + the brutalist button and card primitives.
2. Onboarding (welcome -> CSPR.click login -> Plaid -> set borrowing + paywall).
3. Home + the agent status card.
4. The advance flow (heads-up -> confirm -> working -> active -> settled).
5. Auto-covered (silent) and declined states.
6. Activity + Profile.
7. PWA shell: manifest, service worker, install prompt, one real Web Push for the heads-up.

Keep the value flow in stablecoin (dUSDC / csprUSD); never show the user a seed phrase or raw wallet. Cash-out is via existing ramps, not built in-house.
