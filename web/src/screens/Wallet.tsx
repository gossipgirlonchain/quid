import { ScreenShell } from "../components/Shell";
import { Button, Card, Divider, H1, Kicker, Money, Row } from "../components/ui";
import { useQuid } from "../state";
import { useLatestAdvance } from "../lib/integrations";

/** The user's Quid wallet: what they're holding (cashable) and what they owe Quid. */
export function Wallet() {
  const { go, chosen } = useQuid();
  const latest = useLatestAdvance();
  const outstanding = chosen; // the open advance, repaid automatically on payday

  return (
    <ScreenShell>
      <H1 className="mt-1.5">Wallet</H1>
      <p className="-mt-1 text-muted">What you're holding, and what you owe Quid.</p>

      {/* The debt - the thing the user wants to see */}
      <Card className="bg-sun text-white">
        <Kicker className="text-white">You owe Quid</Kicker>
        <Money className="my-1.5">-${outstanding.toFixed(2)}</Money>
        <Row>
          <span className="font-mono text-[12px]">Repays automatically</span>
          <span className="font-mono text-[12px] font-bold">30 Jun · auto</span>
        </Row>
        <Divider className="bg-white/30" />
        <p className="text-[13px] text-paper">
          When your wages land, Quid collects this back from your account. No action needed, no fee.
        </p>
      </Card>

      {/* What's actually in the wallet, ready to cash out */}
      <Card>
        <Kicker>Available to cash out</Kicker>
        <Money className="my-1.5">${outstanding.toFixed(2)}</Money>
        <p className="font-mono text-[12px] text-muted">dUSDC in your Casper wallet</p>
        <Divider />
        <Row className="py-1">
          <span className="text-muted">Casper wallet</span>
          <span className="font-mono text-[12px]">01dc…7edd</span>
        </Row>
        <Row className="py-1">
          <span className="text-muted">On-chain</span>
          {latest ? (
            <a href={latest.explorer} target="_blank" rel="noreferrer" className="font-mono text-[12px] underline">
              QuidPool ↗
            </a>
          ) : (
            <span className="font-mono text-[12px] text-muted">syncing…</span>
          )}
        </Row>
      </Card>

      <Button variant="primary" onClick={() => go("cashout")}>
        Cash out to bank →
      </Button>
      <Button variant="ghost" onClick={() => go("activity")}>
        View activity
      </Button>
    </ScreenShell>
  );
}
