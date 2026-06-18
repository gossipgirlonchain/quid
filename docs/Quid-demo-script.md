# Quid - Demo Walkthrough Script

**Target length: ~2 minutes. Casper Agentic Buildathon 2026.**

## How to record

- Screen-record the **live app at https://app.quid.fund** in a phone-width viewport (≈390px). It's a real PWA, not a mockup.
- Keep the **Casper Testnet explorer** (testnet.cspr.live) open in a second tab for the on-chain beat. Easiest real tx to show: the [advance lifecycle](https://testnet.cspr.live/transaction/5c0293673c6aca3b5b0cfca8d1d48c4441c21c6de5dc2cd02d4f74408aaac9b6) or open Activity in-app and click "Verify on cspr.live".
- Narrate over the top. Calm, plain-spoken - the way Quid talks.
- Deep-links help during recording: append `?screen=home`, `?screen=activity`, etc. to jump screens cleanly.

---

## Scene 1 - Hook (0:00–0:12)

**Screen:** Welcome.

**Voiceover:** "Millions of people run out of money a few days before payday. Quid is a personal money agent that fixes that for you - autonomously, on Casper."

**On screen:** Land on Welcome. Tap **Get started**.

**Proving:** Clear consumer problem; the agent framing.

## Scene 2 - Onboarding (0:12–0:30)

**Screen:** Login → Connect bank → Set borrowing.

**Voiceover:** "You pick a username and sign in - no seed phrase. Quid quietly creates a Casper wallet for you. Connect your bank through Plaid, then set how much you might need. Free up to fifty dollars; past that, you pick a plan."

**On screen:** Type a username → **Continue with Apple** → **Connect with Plaid** → drag the slider past $50 so the paywall appears → **Subscribe & continue**.

**Proving:** Frictionless onboarding (CSPR.click + Plaid), the freemium model, real signup (writes to the users DB).

## Scene 3 - The watch and the heads-up (0:30–0:44)

**Screen:** Home → push notification.

**Voiceover:** "Now Quid watches your cash flow. When it sees rent will leave you short before your wages land, it pings you."

**On screen:** On Home, tap **"Notify: heading short."** The push banner slides down. Tap it.

**Proving:** Autonomous monitoring; the push-notification hero moment.

## Scene 4 - The advance, on-chain (0:44–1:10)

**Screen:** Heads-up → confirm sheet → working → active.

**Voiceover:** "It already knows the gap and the safe amount. You confirm, and the agent does the rest - it verifies your income, issues the advance on Casper, and releases stablecoin to your wallet. No per-advance fee."

**On screen:** Tap **Advance $180** → **Hold to confirm** → watch the three steps (verify, issue on Casper, release). **Cut to the Testnet explorer** and show a real transaction.

**Proving:** The agentic loop and a **real transaction-producing on-chain component** - the qualification requirement. (The contract is deployed and seeded; the agent has issued and repaid real advances.)

## Scene 5 - Cash out to your bank (1:10–1:24)

**Screen:** Active → Cash out.

**Voiceover:** "The advance lands in your Quid wallet on Casper. Cash it out to your bank whenever you need it - no fee."

**On screen:** On Active, tap **Cash out to bank** → **Cash out $180** → the "on its way to your bank" confirmation.

**Proving:** The last mile - value reaches a real bank account. (Off-ramp is scaffolded for a payout provider; on-ramp via Ramp is live.)

## Scene 6 - Settle and reputation (1:24–1:38)

**Screen:** Active → settled.

**Voiceover:** "When your wages land, it repays itself automatically - and your on-chain Quid score goes up. So next time is cheaper, and you can borrow more."

**On screen:** Tap **"Simulate: wages land."** Watch the score spring up.

**Proving:** The full repay loop; reputation as the trust layer (the long-term impact story).

## Scene 7 - Judgment + why Casper (1:38–1:54)

**Screen:** declined → Activity feed.

**Voiceover:** "It knows when to say no - if your income can't repay it, it won't put you in a hole. And every advance, repayment, and score update is a real transaction on Casper. The app's activity feed is reading straight from the contract."

**On screen:** From Home, tap **"Agent declines an advance."** Then open **Activity** - the on-chain log - and tap **Verify on cspr.live**.

**Proving:** Real autonomy with a safety boundary; on-chain depth; the app is backed by the chain, not a database.

## Scene 8 - Close (1:54–2:00)

**Screen:** Home.

**Voiceover:** "Quid. Your money, handled - before payday. Built on Casper."

**On screen:** Return to Home, end on the calm "You're covered" card.

---

## One-line pitch (for the submission text)

Quid is a personal money agent on Casper that watches your cash flow, advances you stablecoin against verified income before payday, and repays itself when you're paid - building an on-chain reputation that makes every advance cheaper.

## Checklist before you publish

- [ ] Shows a **real Casper Testnet transaction** on screen (in-app "Verify on cspr.live" or the explorer tab)
- [ ] Records the **live app** (app.quid.fund), not the old mockup
- [ ] Names x402, CSPR.click, Plaid out loud
- [ ] Under ~2 minutes, public link, captions optional
- [ ] Ends on the product, not the tech
