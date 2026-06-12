# Quid, Demo Walkthrough Script

**Target length: ~2 minutes. Casper Agentic Buildathon 2026.**

## How to record

- Screen-record `quid-mockup.html` in a phone-width viewport (≈390px) for the app.
- Have the Casper Testnet explorer (cspr.live testnet) open in a second tab to show the real transaction at the on-chain beat.
- Narrate over the top. Keep it calm and plain-spoken, the way Quid talks.
- Each scene below lists the screen, what to say, what to click, and the technical point you're proving.

---

## Scene 1 — Hook (0:00–0:12)

**Screen:** Welcome.

**Voiceover:** "Millions of people run out of money a few days before payday. Quid is a personal money agent that fixes that for you, autonomously, on Casper."

**On screen:** Land on the Welcome screen. Tap Get started.

**Proving:** Clear consumer problem, the agent framing.

## Scene 2 — Onboarding (0:12–0:28)

**Screen:** Login → Connect bank → Set borrowing.

**Voiceover:** "You sign in with Apple or Google, no seed phrase. Quid quietly creates a Casper wallet for you with CSPR.click. Connect your bank through Plaid, then set how much you might need. It's free up to fifty dollars, and the moment you want more, you pick a plan."

**On screen:** Tap Continue with Apple → Connect with Plaid → drag the borrowing slider past $50 so the paywall appears → Subscribe & continue.

**Proving:** Frictionless onboarding (CSPR.click + Plaid), the freemium subscription model.

## Scene 3 — The watch and the heads-up (0:28–0:42)

**Screen:** Home → push notification.

**Voiceover:** "Now Quid watches your cash flow. When it sees rent will leave you short before your wages land, it pings you."

**On screen:** On Home, tap "Notify: heading short." The push banner slides down. Tap it.

**Proving:** Autonomous monitoring, the push-notification hero moment.

## Scene 4 — The advance (0:42–1:08)

**Screen:** Heads-up → confirm sheet → working → active.

**Voiceover:** "It already knows the gap and the safe amount. You confirm, and the agent does the rest. It pays per call over x402 to verify your income, issues the advance on Casper, and releases stablecoin to your wallet. No per-advance fee, it's covered by your plan."

**On screen:** Tap Advance $180 → on the sheet, Hold to confirm → watch the three working steps (verify via x402, issue on Casper, release). **Cut to the Testnet explorer** and show the transaction.

**Proving:** The agentic loop, real x402 usage, and a real transaction-producing on-chain component (the qualification requirement).

## Scene 5 — Settle and reputation (1:08–1:24)

**Screen:** Active → settled.

**Voiceover:** "When your wages land, it repays itself automatically, and your on-chain Quid score goes up. So next time is cheaper and you can borrow more."

**On screen:** Tap "Simulate: wages land." Watch the score spring up.

**Proving:** The full repay loop, reputation as the trust layer (the "long-term impact" story).

## Scene 6 — Autonomy and judgment (1:24–1:40)

**Screen:** Auto-covered (silent) → declined.

**Voiceover:** "Switch on auto-cover and it handles small shortfalls without even asking. And it knows when to say no. If your income can't repay it, it won't put you in a hole."

**On screen:** From Home, tap "Notify: auto-covered," tap through. Then back Home, tap "Agent declines an advance."

**Proving:** True autonomy plus a safety boundary, the agent has judgment.

## Scene 7 — Why Casper, and the model (1:40–1:54)

**Screen:** Activity feed → Profile (Quid score).

**Voiceover:** "Every advance, repayment, and reputation update is a real transaction on Casper. The agent holds its own wallet, sources liquidity through WiseLending, and can even earn by selling its reputation data to other agents over x402."

**On screen:** Open Activity (the on-chain log), then Profile (score + plan).

**Proving:** On-chain depth, the dual revenue model, ecosystem fit.

## Scene 8 — Close (1:54–2:00)

**Screen:** Home.

**Voiceover:** "Quid. Your money, handled, before payday. Built on Casper."

**On screen:** Return to Home, end on the calm "You're covered" card.

---

## One-line pitch (for the submission text)

Quid is a personal money agent on Casper that watches your cash flow, advances you stablecoin against verified income before payday, and repays itself when you're paid, building an on-chain reputation that makes every advance cheaper.

## Checklist before you publish

- [ ] Shows a real Casper Testnet transaction on screen
- [ ] Names x402, CSPR.click, Plaid, WiseLending out loud
- [ ] Under ~2 minutes, public link, captions optional
- [ ] Ends on the product, not the tech
