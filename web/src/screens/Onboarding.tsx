import { useState } from "react";
import { ScreenShell } from "../components/Shell";
import { Button, Card, Divider, H1, Hint, Kicker, Logo, Money, Row, Tag } from "../components/ui";
import { Slider } from "../components/Slider";
import { cn } from "../lib/cn";
import { useQuid, planForAmount, PLAN_CAP, PLAN_LABEL, PLAN_PRICE } from "../state";
import { useAuth, usePlaidConnect, startCheckout } from "../lib/integrations";
import { signUp } from "../lib/api";

export function Welcome() {
  const { go } = useQuid();
  return (
    <ScreenShell>
      <div className="flex flex-1 flex-col justify-center gap-[18px] text-center">
        <Logo size={64} className="mx-auto rounded-[18px]" />
        <H1>Money before payday, handled for you.</H1>
        <p className="text-pretty text-[16px] leading-[1.45]">
          Quid watches your cash flow and quietly covers you when you're short, then pays itself back the moment
          you're paid.
        </p>
      </div>
      <Button variant="primary" onClick={() => go("login")}>
        Get started
      </Button>
      <Button variant="ghost" onClick={() => go("login")}>
        I already have an account
      </Button>
    </ScreenShell>
  );
}

export function Login() {
  const { go } = useQuid();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const valid = /^[a-zA-Z0-9_]{3,20}$/.test(username);

  const onLogin = async (p: "apple" | "google" | "email") => {
    if (!valid || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await signUp(username); // creates / fetches the profile row in the users DB
      await login(p);
      go("connect");
    } catch {
      setErr("Couldn't claim that username — try another.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenShell>
      <div className="flex flex-1 flex-col justify-center gap-[14px] text-center">
        <Kicker>Step 1 of 3</Kicker>
        <H1 className="text-[23px]">Create your account</H1>
        <p className="text-pretty leading-[1.45]">
          No seed phrases, no wallet setup. Pick a username, sign in, and Quid creates a secure Casper wallet for you
          behind the scenes.
        </p>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value.trim())}
          onKeyDown={(e) => e.key === "Enter" && onLogin("apple")}
          placeholder="@username"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="min-h-12 rounded-xl border-[3px] border-ink bg-surface px-4 py-3 text-center font-mono text-[15px] font-bold shadow-brutal-sm outline-none placeholder:font-normal placeholder:text-muted focus-visible:ring-[3px] focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        />
        {err ? (
          <p className="font-mono text-[11px] text-coral">{err}</p>
        ) : !valid ? (
          <p className="font-mono text-[11px] text-muted">
            {username.length === 0 ? "Pick a username to continue" : "3–20 chars · letters, numbers, _"}
          </p>
        ) : null}
        <Button onClick={() => onLogin("apple")} disabled={!valid || busy}>
          {busy ? "Creating account…" : " Continue with Apple"}
        </Button>
        <Button onClick={() => onLogin("google")} disabled={!valid || busy}>
           Continue with Google
        </Button>
        <Button variant="ghost" onClick={() => onLogin("email")} disabled={!valid || busy}>
          Use email instead
        </Button>
      </div>
      <Hint>Secured by CSPR.click. Your wallet is self-custodial.</Hint>
    </ScreenShell>
  );
}

export function Connect() {
  const { go } = useQuid();
  const { connect } = usePlaidConnect(() => go("setborrow"));
  return (
    <ScreenShell>
      <div className="flex flex-1 flex-col justify-center gap-[14px] text-center">
        <Kicker>Step 2 of 3</Kicker>
        <H1 className="text-[23px]">Connect your bank</H1>
        <p className="text-pretty leading-[1.45]">
          So I can spot when you're heading short and verify the income I lend against. Read-only, I can't move money
          in your bank.
        </p>
        <Card flat className="border-dashed text-left">
          <Row>
            <span className="font-semibold">🔒 Bank-grade, read-only</span>
            <Tag>PLAID</Tag>
          </Row>
        </Card>
      </div>
      <Button variant="primary" onClick={connect}>
        Connect with Plaid
      </Button>
      <Hint>Powered by Plaid. Quid never sees your bank login.</Hint>
    </ScreenShell>
  );
}

const PLAN_ROWS = [
  { label: "Free", cap: "up to $50" },
  { label: "Starter · $5/mo", cap: "up to $100" },
  { label: "Plus · $9/mo", cap: "up to $250" },
  { label: "Pro · $15/mo", cap: "up to $500" },
];

export function SetBorrow() {
  const { borrow, setBorrow, go } = useQuid();
  const tier = planForAmount(borrow);
  const paywall = borrow > 50;
  const note = tier === "free" ? "Free plan" : `${PLAN_LABEL[tier]} · $${PLAN_PRICE[tier]}/mo`;
  const onContinue = async () => {
    if (paywall) await startCheckout(tier);
    go("home");
  };

  return (
    <ScreenShell className="text-center">
      <Kicker className="mt-1.5">Step 3 of 3</Kicker>
      <H1 className="text-[21px]">How much might you need before payday?</H1>
      <Money className="my-1.5">${borrow}</Money>
      <Slider min={0} max={500} value={borrow} onChange={setBorrow} ariaLabel="Expected borrowing" />
      <Row>
        <span className="font-mono text-[11px] text-muted">$0</span>
        <span className={cn("font-mono text-[11px]", paywall ? "text-ink" : "text-muted")}>{note}</span>
      </Row>

      {paywall && (
        <Card className="bg-sun text-left text-white">
          <Kicker className="text-white">Unlock higher limits</Kicker>
          <p className="mt-1 text-[15px] font-semibold">
            Borrow up to ${PLAN_CAP[tier]} with {PLAN_LABEL[tier]}, ${PLAN_PRICE[tier]}/mo.
          </p>
          <Divider className="bg-white/30" />
          {PLAN_ROWS.map((r) => (
            <Row key={r.label} className="py-[3px]">
              <span className="font-mono text-[12px]">{r.label}</span>
              <span className="font-mono text-[12px]">{r.cap}</span>
            </Row>
          ))}
        </Card>
      )}

      <Button variant="primary" onClick={onContinue}>
        {paywall ? "Subscribe & continue" : "Continue free"}
      </Button>
      <Hint>No fees per advance, ever. Just your plan.</Hint>
    </ScreenShell>
  );
}
