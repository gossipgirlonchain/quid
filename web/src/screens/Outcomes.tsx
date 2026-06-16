import { ScreenShell } from "../components/Shell";
import { AgentLine, Button, Card, Divider, Row, Tag } from "../components/ui";
import { useQuid } from "../state";

export function AutoCovered() {
  const { go } = useQuid();
  return (
    <ScreenShell>
      <Tag tone="g" className="mt-1 self-start">
        <span className="inline-block h-[9px] w-[9px] rounded-full bg-ink align-middle animate-[blink-dot_1.6s_ease-in-out_infinite]" />
        AUTO-COVERED
      </Tag>
      <Card className="bg-quid">
        <AgentLine kicker="Handled">
          You were about to go short, so I covered it. You didn't have to do a thing.
        </AgentLine>
        <div className="tabular mb-0.5 mt-3.5 font-disp text-[42px] font-extrabold leading-none tracking-[-0.03em]">
          $120.00
        </div>
        <Row className="mt-1.5">
          <span>Repays</span>
          <span className="font-mono">30 Jun · auto</span>
        </Row>
        <Row className="pt-1.5">
          <span>Why</span>
          <span className="font-mono text-[12px]">under your $200 cap</span>
        </Row>
        <Row className="pt-1.5">
          <span>On-chain</span>
          <a
            href="https://testnet.cspr.live/contract-package/ccdd94c7cf3b559906616f97c0d6624d97969ff5ca5cad7c8e749159ccd4ce34"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[12px] underline"
          >
            QuidPool ↗
          </a>
        </Row>
      </Card>
      <Card flat className="border-dashed">
        <p className="text-[13px] text-muted">
          This is auto-cover working. Switch it off in Home to be asked first every time instead.
        </p>
      </Card>
      <Button onClick={() => go("home")}>Got it</Button>
    </ScreenShell>
  );
}

export function Declined() {
  const { openSheet, go } = useQuid();
  return (
    <ScreenShell>
      <Tag tone="c" className="mt-1 self-start">
        ● NOT THIS TIME
      </Tag>
      <Card>
        <AgentLine tone="coral" kicker="Quid">
          I won't cover $400 this time. Your verified income can't repay that comfortably by payday, and I'm not going
          to put you in a hole.
        </AgentLine>
        <Divider />
        <Row>
          <span className="text-muted">You asked for</span>
          <span className="tabular font-mono">$400</span>
        </Row>
        <Row className="pt-1.5">
          <span className="text-muted">Safe right now</span>
          <span className="tabular font-mono font-bold text-quid-deep">$150</span>
        </Row>
      </Card>
      <Button variant="primary" onClick={() => openSheet(150)}>
        Borrow $150 instead
      </Button>
      <Button variant="ghost" onClick={() => go("home")}>
        Not now
      </Button>
    </ScreenShell>
  );
}
