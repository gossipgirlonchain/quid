import { useState } from "react";
import { ScreenShell } from "../components/Shell";
import { AgentLine, Button, Card, Divider, H1, Hint, Kicker, Money, Row, Tag } from "../components/ui";
import { useQuid } from "../state";
import { cashOut, type PayoutResult } from "../lib/ramps";

/** Off-ramp: move a Casper advance from the user's Quid wallet to their bank. */
export function CashOut() {
  const { go, chosen } = useQuid();
  const amount = chosen;
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<PayoutResult | null>(null);

  const onCashOut = async () => {
    if (busy) return;
    setBusy(true);
    try {
      setDone(await cashOut(amount));
    } catch {
      setDone({ status: "failed" });
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const ok = done.status !== "failed";
    return (
      <ScreenShell>
        <Tag tone={ok ? "g" : "c"} className="mt-0.5 self-start">
          {ok ? "● ON ITS WAY" : "● COULDN'T SEND"}
        </Tag>
        {ok ? (
          <div className="relative shrink-0">
            <span className="pointer-events-none absolute -inset-[3px] rounded-[20px] border-[3px] border-ink opacity-0 animate-[pulse-ring_1.8s_ease-out_infinite]" />
            <Card className="bg-quid">
              <AgentLine kicker="Cashing out">
                ${amount.toFixed(2)} is on its way to your bank. Arrives in 1-{done.etaBusinessDays ?? 2} business days.
              </AgentLine>
            </Card>
          </div>
        ) : (
          <Card className="bg-coral text-white">
            <AgentLine light kicker="Try again">
              That didn't go through. Your advance is safe in your Quid wallet. Try cashing out again.
            </AgentLine>
          </Card>
        )}
        {ok && done.mock && (
          <Card flat className="border-dashed">
            <p className="text-[13px] text-muted">
              Demo payout. With an off-ramp provider connected, this converts your Casper dUSDC and sends real fiat to
              your linked bank.
            </p>
          </Card>
        )}
        <Button variant="primary" onClick={() => go("wallet")}>
          View wallet
        </Button>
        <Button variant="ghost" onClick={() => go("home")}>
          Back to home
        </Button>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <H1 className="mt-1.5">Cash out to bank</H1>
      <p className="-mt-1 text-muted">Move your advance from your Quid wallet to your bank account.</p>
      <Card>
        <Kicker>In your Quid wallet</Kicker>
        <Money className="my-1.5 text-quid-deep">${amount.toFixed(2)}</Money>
        <p className="font-mono text-[12px] text-muted">dUSDC on Casper</p>
        <Divider />
        <Row className="py-1">
          <span className="text-muted">To</span>
          <span className="font-mono">Monzo · current account</span>
        </Row>
        <Row className="py-1">
          <span className="text-muted">Arrives</span>
          <span className="font-mono">1-2 business days</span>
        </Row>
        <Row className="py-1">
          <span className="text-muted">Fee</span>
          <span className="font-mono text-quid-deep">$0</span>
        </Row>
      </Card>
      <Button variant="primary" onClick={onCashOut} disabled={busy}>
        {busy ? "Sending…" : `Cash out $${amount.toFixed(2)}`}
      </Button>
      <Button variant="ghost" onClick={() => go("wallet")}>
        View wallet
      </Button>
      <Hint>Sent to your linked bank. No fee to cash out an advance.</Hint>
    </ScreenShell>
  );
}
