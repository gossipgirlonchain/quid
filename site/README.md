# Quid · marketing site

The landing page for [quid.fund](https://quid.fund): a personal money agent that advances you cash before payday and repays itself when your wages land.

It shares one design language with the app prototype in `../web/quid-mockup.html` (neobrutalism: 3px ink borders, hard offset shadows, Unbounded / Hanken Grotesk / Space Mono). Tokens and principles live in `../docs/Quid-frontend-brief.md`.

**Stack:** Vite + React + TypeScript + Tailwind CSS v4. Fully static, no backend.

## Run locally

```sh
npm install
npm run dev      # http://localhost:5173
```

## Production build

```sh
npm run build    # type-checks, then outputs static files to dist/
npm run preview  # serve the built site locally
```

## Deploy

**Vercel**

1. Import the repo at vercel.com/new (or run `npx vercel` from `site/`).
2. Set **Root Directory** to `site/`. Framework preset: **Vite**.
3. Build command `npm run build`, output directory `dist`. Deploy.

**Netlify**

1. New site from Git (or run `npx netlify deploy --prod --dir=dist` from `site/` after a build).
2. Set **Base directory** to `site/`, build command `npm run build`, publish directory `site/dist`.

Then point the `quid.fund` domain at the deployment in the host's domain settings.

## Waitlist form

The "Get early access" form is a front-end stub: it validates the address, shows the success state, and keeps the email in `localStorage`. When you have a real endpoint (Formspree, Buttondown, your own API), wire it up in `src/components/Waitlist.tsx` inside `submit`.

## Where things live

- `src/index.css` - design tokens (`@theme`) and the brutalist primitives (`.card`, `.btn`, `.tag`, the phone frame).
- `src/components/` - one file per section: `Nav`, `Hero` (with `Phone`, the recreated app home screen), `HowItWorks`, `Agent`, `TrustRow`, `Pricing`, `Faq`, `Waitlist`, `Footer`.
