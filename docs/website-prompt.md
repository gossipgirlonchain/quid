# Claude Code prompt, Quid marketing site

Paste everything in the box below into Claude Code (run it from the repo root so it can read the referenced files).

---

Build a marketing landing page for **Quid** (quid.fund), a personal money agent that advances people cash before payday and repays itself when they're paid. It must match the exact neobrutalist design language of the existing app prototype, the site and the product should feel like one brand.

**First, read these for the design system, pricing, and voice (match them precisely):**
- `web/quid-mockup.html` , the app prototype. Match its colours, fonts, borders, shadows, and button behaviour exactly.
- `docs/Quid-frontend-brief.md` , design tokens and principles.
- `docs/Quid-project-brief.md` , product, pricing tiers, positioning, business model.

**Stack:** Vite + React + TypeScript + Tailwind. One responsive landing page, static build, deployable to Vercel or Netlify. Put it in a new `site/` folder at the repo root so it never touches the app in `web/`. Deliver a working `npm run dev` and a short `README.md` with run + deploy steps.

**Design system (must match the app):**
- Neobrutalism: `3px solid #111` borders, hard offset shadows with zero blur (`6px 6px 0 #111`; small controls `4px 4px 0 #111`). No soft/blurred shadows, no gradients, no glassmorphism, no glow.
- Colours: paper `#F1F2F2` (cool off-white grey, never beige), ink `#111111`, quid green `#13C26B` (primary, positive, money), coral `#FF5A3C` (accent, alert), sun `#FFD23E` (highlight), surface `#FFFFFF`, muted `#6B6B5E`. Use one accent colour of meaning per section.
- Fonts (Google Fonts): Display = **Unbounded** (700/800) for headlines, the wordmark, and big numbers; Body = **Hanken Grotesk**; Mono = **Space Mono** for eyebrows, labels, and numbers. Unbounded runs wide, so size headlines down a step and tighten letter-spacing slightly. Use `tabular-nums` on numbers. Never use Inter, Roboto, or Space Grotesk.
- Corners: 16px cards, 12px buttons; keep nested radii concentric.
- Buttons: border + hard offset shadow; on press, translate `(3px,3px)` and collapse the shadow to `0 0` (the neobrutalist "push"). Primary = green fill, secondary = white fill, both with the ink border.
- Background: a subtle grey dot-grid (radial-gradient dots) like the app's backdrop.
- Motion: subtle, feedback ≤200ms, ease-out on enter, animate only `transform`/`opacity`, respect `prefers-reduced-motion`. A light staggered reveal on sections is fine.
- Accessibility: WCAG AA contrast, visible bold ink focus outlines, 44px hit targets, semantic HTML.

**Sections, top to bottom:**
1. Sticky nav: "Quid" wordmark (Unbounded) left; links How it works, Pricing, FAQ; a primary CTA button "Get early access".
2. Hero: big Unbounded headline "Money before payday, handled for you." with a one-line subhead ("Quid is a personal money agent that covers you when you're short, then pays itself back when you're paid."). Primary CTA "Get early access" + ghost secondary "See how it works". Beside it (below on mobile) a neobrutalist phone frame showing a simplified version of the app's green "You're covered" card with a big number. Recreate the card, do not iframe the mockup.
3. How it works: four chunky numbered cards , (1) Connect your bank, read-only via Plaid; (2) Quid watches your cash flow; (3) It advances you before you go short; (4) It repays itself when your wages land. One line each.
4. "An agent, not an app": short section, it acts autonomously, you set your limit once, it handles the rest, and it knows when to say no.
5. Trust row: three cards , "Built on Casper (on-chain)", "No fees per advance, ever", "Bank-grade and read-only (Plaid)". Mention the Quid score (reputation that makes future advances cheaper).
6. Pricing: four neobrutalist cards , Free $0 (up to $50), Starter $5/mo (up to $100), Plus $9/mo (up to $250, highlighted as most popular), Pro $15/mo (up to $500). Caption: "No fees per advance, ever. Just your plan." Each card has a CTA.
7. FAQ accordion: "Is this a loan?", "How do you make money?", "Is my bank data safe?", "What if I can't repay?", "When can I get it?". Short, honest answers.
8. Final CTA band (green): "Get paid before payday." with an email waitlist capture. Wire the form to a stub handler (or Formspree) and show a success state.
9. Footer: wordmark, nav links, "Built on Casper", social placeholders, and a small line: "This is general information, not financial advice."

**Copy voice:** plain-spoken, calm, a little British, no hype, no crypto jargon, no emojis, and no em dashes. Always be clear there are no per-advance fees and this is not a payday loan. Don't overpromise. Keep it mobile-first.

---
