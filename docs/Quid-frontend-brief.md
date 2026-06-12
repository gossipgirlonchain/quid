# Quid, Frontend Brief

**quid.fund · Casper Agentic Buildathon 2026**

> Your personal money agent. It watches your cash flow, spots a shortfall before payday, and advances you the gap, repaying itself the moment your money lands.

This is the UI/UX spec for the consumer app. It pairs with the product brief (`Quid-project-brief.md`). Goal: an interface that feels like a real, shippable consumer fintech, not a hackathon demo, and that works identically as an installable PWA on phones and a desktop app.

---

## 1. Design philosophy

**Aesthetic direction: committed neobrutalism.** One bold direction, executed precisely. The reasoning is product-led, not just style: a money agent that acts on your behalf has to feel *honest and legible*. Neobrutalism earns trust by hiding nothing, thick borders, hard edges, flat blocks of colour, big unambiguous numbers, zero decorative haze. Every surface looks like exactly what it is. It also reads as confident and a little punchy, which fits a British consumer brand called Quid and helps it stand out in a field of generic crypto dashboards.

Three rules the whole app obeys:

1. **The agent is a character, not a dashboard.** Quid speaks in the first person, tells you what it's about to do, and asks before anything irreversible. The UI is a conversation with an agent you trust, not a control panel you operate.
2. **Money is always the hero element.** The single most important number on any screen is the biggest thing on it. Everything else supports it.
3. **No slop.** No Inter/Roboto/Space Grotesk, no SaaS-blue, no purple gradients, no glass morphism, no AI-generated blandness. (Per the bencium and baseline-ui skills.)

### Intentional deviation from the craft skills

The "make-interfaces-feel-better" and bencium skills say *shadows over borders* and *soft layered shadows*. Neobrutalism deliberately inverts that: **hard 3px black borders and solid offset shadows with zero blur** (`6px 6px 0 #111`). This is a conscious aesthetic commitment, not an oversight. Everything *else* from those skills still applies, motion, typography, optical alignment, tabular numbers, hit areas, accessibility. We keep the craft, we just swap the shadow language.

---

## 2. Platform requirements (PWA + desktop)

One responsive codebase, installable everywhere.

- **Installable PWA.** Web app manifest with name, icons (192/512/maskable), `display: standalone`, `theme-color`, and a start URL. Installable on iOS/Android home screen and as a desktop app.
- **Offline shell.** Service worker caches the app shell so it opens instantly and shows last-known state offline; live data (balance, advances) revalidates on reconnect.
- **Push notifications are the product.** The hero moment ("you're short, want me to cover it?") arrives as a push. Build for Web Push from day one; treat the notification as a first-class screen.
- **Mobile-first, desktop-comfortable.** Phone is the primary canvas. On desktop, the same app sits in a centred max-width column (≈420px) so it never stretches into an ugly wide dashboard. Optionally a wider two-pane desktop layout later; not needed for the hackathon.
- **Respect the hardware.** Use `h-dvh` not `h-screen`, and `env(safe-area-inset-*)` padding for fixed top/bottom bars so nothing hides under notches or home indicators.

---

## 3. Design tokens

### Colour

Dominant neutral base, ink black structure, sharp functional accents. One accent carries meaning per view (green = good/money, coral = attention/shortfall, yellow = highlight). Never SaaS blue, never purple gradients.

| Token | Value | Use |
|---|---|---|
| `paper` | `#F1F2F2` | App background (cool off-white grey, never beige) |
| `ink` | `#111111` | Borders, text, shadows |
| `quid` (primary) | `#13C26B` | Money, positive state, primary CTA |
| `coral` (alert) | `#FF5A3C` | Shortfall warnings, attention |
| `sun` (highlight) | `#FFD23E` | Highlighted panels, the agent's "thinking" blocks |
| `sky` (info) | `#5B8DEF` | Neutral info / links (used sparingly) |
| `surface` | `#FFFFFF` | Card fills on the off-white background |
| `muted` | `#6B6B5E` | Secondary text |

Colour is functional, never decorative: same colour always means the same thing. Meet WCAG AA contrast (4.5:1 text, 3:1 large), and never rely on colour alone, pair every status colour with a label or icon.

### Typography

Characterful display, legible body, mono for figures. All on Google Fonts, none on the banned list.

- **Display:** `Unbounded` (700/800). Headlines, the wordmark, the big money number, the agent's voice. Bold, geometric, and distinctive (deliberately not the Bricolage/Space-Grotesk look that reads as AI-default). Runs wide, so size display text down a step versus a normal grotesque.
- **Body/UI:** `Hanken Grotesk` (400/500/600). Labels, paragraphs, buttons. Highly legible.
- **Numerals/meta:** `Space Mono` (400/700) for transaction rows, dates, and small system text, gives the agent a precise, machine-honest feel.

Rules: `text-balance` on headings, `text-pretty` on body, **`tabular-nums` on every money figure and any number that updates** (prevents layout shift). Don't touch letter-spacing. Apply `-webkit-font-smoothing: antialiased` at the root.

### Space, border, radius

- Spacing scale: 4px base → 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64. Use flex/grid `gap`, not ad-hoc margins.
- Borders: `3px solid ink` on cards, buttons, inputs, sheets.
- Shadow: solid offset, no blur. Resting `6px 6px 0 ink`; small controls `4px 4px 0 ink`.
- Radius: chunky and consistent, `16px` cards / `12px` buttons / `10px` inputs. Respect concentric radius (outer = inner + padding) on nested elements.
- Hit areas: every interactive element ≥ 44×44px (extend small controls with a pseudo-element).

---

## 4. Motion

Synthesised from the animation + baseline-ui skills, tuned for neobrutalism (motion is snappy and physical, never floaty).

- **Feedback ≤ 200ms.** Interaction feedback (press, toggle, tab change) completes within 200ms. Larger transitions ≤ 300ms.
- **Animate compositor props only:** `transform` and `opacity`. Never animate width/height/top/left/margin. Never `transition: all`, name the properties.
- **Enter `ease-out`, exit `ease-in`.** Enters arrive fast and settle; exits build momentum and leave. Exits are subtler than enters (small `translateY`, not full height).
- **Press = physical.** Buttons translate into their own shadow on press (`translate(2px,2px)` + shadow shrinks to `4px 4px`/`0 0`), the neobrutalist "push." Optionally pair with `scale(0.97)`.
- **Stagger ≤ 50ms** per item on list/section enters. One focal point at a time, only one element animates prominently.
- **Springs for the money moments.** When an advance lands or a balance ticks up, use a settle spring (`stiffness ~500, damping ~30`, bounce small) on the number, that's the one place delight is earned.
- **Respect `prefers-reduced-motion`:** drop to instant state changes / simple opacity. Pause any looping (e.g. the agent "thinking" pulse) when off-screen.
- **Dim the background** behind the advance sheet/modal to direct focus; maintain a fixed z-index scale.

---

## 5. Core screens & flows

The narrative spine is the agent noticing → asking → acting → settling. Eight screens.

1. **Onboarding (4 steps).** Welcome (value prop, one button), Login via CSPR.click social login (Apple/Google, a self-custodial Casper wallet is created silently, no seed phrase), Connect bank via Plaid Link (read-only, honest copy on what Quid reads and why), and Set expected borrowing (a slider where up to $50 is free and dragging above $50 surfaces the plan paywall at the point of intent).
2. **Home (Agent status).** The emotional core. A big status card in the agent's voice: when you're fine, calm green "You're covered till payday, the 28th." It shows your runway, next payday, and a quiet "Quid is watching" pulse. The big number is your projected balance at payday.
3. **The heads-up (the hero moment).** Arrives as a push and as a coral card: "Heads up, you'll be £180 short for rent on the 28th. I can advance it now and pay it back when your wages land on the 30th. Fee: £4." Two buttons: **Advance £180** / *See details*. This is the screen that wins the demo.
4. **Advance details / confirm.** Transparent breakdown: amount, fee, repay date, what it's secured against (your verified incoming wages), and the agent's reasoning. Confirm is the only irreversible action, so it gets an explicit confirm state.
5. **Agent working.** Short, honest progress while the agent acts: verifying income (x402 call), issuing the advance on Casper, releasing funds. Real on-chain status with a link to the Testnet transaction. The "machine-honest" Space Mono shines here.
6. **Advance active.** A card showing £180 advanced, repay on the 30th, fee £4, and your reputation. Calm, in-control.
7. **Settled / reputation up.** When wages land, the agent repays itself and the number settles with a spring. "Done, paid back £184. Your Quid score went up, your next advance is cheaper." Positive reinforcement loop.
8. **Activity + Rules.** Activity: a mono-styled feed of everything the agent did, fully auditable. Rules: set it once, max advance, the balance threshold that triggers a heads-up, and an autonomy toggle (ask me every time ↔ just handle it under £X). This is where trust is configured.

Navigation: a bottom tab bar (Home · Activity · Rules) with safe-area padding; the heads-up and advance flows are sheets over Home.

---

## 6. Key components

- **Agent status card**, the signature component. Big voice line, one status colour, the hero number. Three states: calm (green), heads-up (coral), working (sun/yellow with the thinking pulse).
- **Money figure**, display font, `tabular-nums`, currency in £. The spring-settle target.
- **Brutalist button**, 3px border, hard offset shadow, push-on-press. Primary (quid green fill), secondary (white fill), destructive uses an AlertDialog.
- **Advance sheet**, bottom sheet, dimmed background, the confirm surface.
- **Activity row**, Space Mono, date + action + on-chain link, scannable and auditable.
- **Rule control**, chunky toggles/sliders for thresholds and the autonomy dial.
- **Quid score chip**, reputation as a small, legible badge that visibly ticks up after settlement.

Empty states each get exactly one clear next action (per baseline-ui). Loading uses structural skeletons, not spinners, except the agent-working screen, which is intentionally narrated.

---

## 7. The agent's voice

Microcopy is half the product. Quid is plain-spoken, British, calm, and never salesy. It explains before it acts and takes responsibility.

- Good: "You'll be £180 short on the 28th. Want me to cover it?"
- Good: "Done. Paid myself back £184 when your wages landed."
- Avoid: jargon ("liquidity event"), hype ("🚀 instant cash!"), or anything that hides the fee. The fee is always visible. Trust is the whole moat.

---

## 8. Accessibility

WCAG 2.1 AA throughout. Keyboard-navigable, visible focus states (a bold ink outline suits the aesthetic), semantic HTML, `aria-label` on icon-only buttons, logical tab order, 44×44px targets, and never colour alone for meaning. Accessibility enables the bold look, it doesn't limit it.

---

## 9. Recommended stack

- **React + Tailwind** (Tailwind defaults; tokens above as CSS variables / `@theme`).
- **`motion/react`** for the few JS animations (spring on money moments); `tw-animate-css` for entrance micro-animations.
- **Base UI** (or Radix) for accessible primitives, sheets, dialogs, toggles. Never hand-roll focus/keyboard behaviour.
- **CSPR.click** for login/auth (Casper's recommended onboarding: social login, silent self-custodial wallet, no seed phrase). **Plaid** for bank connection. **Stripe Billing** for the subscription tiers.
- **`vite-plugin-pwa`** (or equivalent) for the manifest + service worker + Web Push.
- **Phosphor icons**, `sonner` for toasts, `cn` (clsx + tailwind-merge) for class logic.

---

## 10. Build order (frontend)

1. Tokens + the brutalist button and card primitives (the look in one sitting).
2. Home + the agent status card in all three states.
3. The heads-up → advance details → working → active → settled flow (the demo spine).
4. Activity feed + Rules.
5. PWA shell: manifest, service worker, install, one real push notification for the heads-up.
6. Motion polish pass against the checklist below.

### Motion/craft checklist (from the skills)

- [ ] Feedback ≤ 200ms; transitions ≤ 300ms
- [ ] Only `transform`/`opacity` animated; no `transition: all`
- [ ] Enter `ease-out`, exit `ease-in` and subtler
- [ ] Stagger ≤ 50ms; one focal point at a time
- [ ] Money moments use a settle spring (bounce minimal)
- [ ] `tabular-nums` on every dynamic number
- [ ] `text-balance` headings, `text-pretty` body
- [ ] Concentric radius on nested surfaces
- [ ] 44×44px minimum hit areas
- [ ] `prefers-reduced-motion` respected; off-screen loops paused
- [ ] `h-dvh` + safe-area insets on fixed bars
- [ ] Visible focus states; `aria-label` on icon buttons
- [ ] One accent colour of meaning per view

---

*Design skills referenced: [make-interfaces-feel-better](https://www.ui-skills.com/skills/jakubkrehel/make-interfaces-feel-better/), [12-principles-of-animation](https://www.ui-skills.com/skills/raphaelsalaja/12-principles-of-animation/), [impeccable](https://www.ui-skills.com/skills/pbakaus/impeccable/), [bencium-innovative-ux-designer](https://www.ui-skills.com/skills/bencium/bencium-innovative-ux-designer/), [baseline-ui](https://www.ui-skills.com/skills/ibelick/baseline-ui/).*
