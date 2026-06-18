import { useEffect, useState } from "react";
import { animate } from "motion/react";
import { ScreenShell } from "../components/Shell";
import { AgentLine, Button, Card, Divider, Hint, Money, Row, Tag } from "../components/ui";
import { cn } from "../lib/cn";
import { useLatestAdvance } from "../lib/integrations";
import { useQuid } from "../state";

export function Heads() {
  const { openSheet, go } = useQuid();
  return (
    <ScreenShell>
      <Tag tone="c" className="mt-0.5 self-start">
        ● HEADS-UP · PUSH NOTIFICATION
      </Tag>
      <Card className="border-ink bg-coral text-white">
        <AgentLine light kicker="Quid · just now">
          Heads up. Your landlord pulls rent on the <b>28th</b>, two days before your wages land.
        </AgentLine>
      </Card>
      <Card>
        <p className="text-[15px]">You'll be short by</p>
        <Money className="my-1.5 text-quid">$180.00</Money>
        <p>I can advance it now and repay myself the moment your wages arrive on the 30th.</p>
        <Divider />
        <Row className="py-1">
          <span className="text-muted">Fee</span>
          <span className="font-mono font-bold text-quid-deep">$0 · Plus plan</span>
        </Row>
        <Row className="py-1">
          <span className="text-muted">Secured against</span>
          <span className="font-mono">verified wages</span>
        </Row>
      </Card>
      <Button variant="coral" onClick={() => openSheet(180)}>
        Advance $180 →
      </Button>
      <Button variant="ghost" onClick={() => go("home")}>
        Not now
      </Button>
      <Hint>First one's on approval. Switch on auto-cover and I'll handle the next without asking.</Hint>
    </ScreenShell>
  );
}

export function Work() {
  const { go, chosen } = useQuid();
  const latest = useLatestAdvance();
  const steps = [
    { t: "Verifying your wages", s: "x402 · paid API call" },
    { t: "Issuing advance on Casper", s: "Odra contract · Testnet" },
    { t: `Releasing $${chosen} to you`, s: "CSPR → your wallet" },
  ];
  const [step, setStep] = useState(-1); // index of the in-progress step; > 2 = all done
  const [tx, setTx] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(0), 150),
      setTimeout(() => setStep(1), 1300),
      setTimeout(() => setTx(true), 1900),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 3500),
      setTimeout(() => go("active"), 4200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [go]);

  return (
    <ScreenShell>
      <Tag tone="s" className="mt-0.5 self-start">
        ● QUID IS WORKING
      </Tag>
      <Card className="bg-sun text-white">
        <AgentLine light kicker="On it">
          Sorting your advance. This takes a few seconds.
        </AgentLine>
      </Card>
      <Card>
        {steps.map((w, i) => {
          const done = step > i;
          const now = step === i;
          return (
            <div
              key={w.t}
              className={cn("flex items-center gap-[11px] py-2.5 transition-opacity duration-300", done || now ? "opacity-100" : "opacity-40")}
            >
              <div
                className={cn(
                  "grid h-[26px] w-[26px] flex-none place-items-center rounded-lg border-[3px] border-ink font-mono text-[13px] font-bold",
                  done && "bg-quid",
                  now && "bg-sun text-white animate-[step-blink_1s_steps(1)_infinite]",
                )}
              >
                {i + 1}
              </div>
              <div>
                <b>{w.t}</b>
                <div className="font-mono text-[11px] text-muted">{w.s}</div>
              </div>
            </div>
          );
        })}
        <Divider />
        <div className="font-mono text-[11px]">
          on-chain:{" "}
          {tx && latest ? (
            <a href={latest.explorer} target="_blank" rel="noreferrer" className="underline">
              advance #{latest.id} · QuidPool ↗
            </a>
          ) : (
            <span className="text-muted">pending…</span>
          )}
        </div>
      </Card>
    </ScreenShell>
  );
}

export function Active() {
  const { go, chosen } = useQuid();
  const latest = useLatestAdvance();
  return (
    <ScreenShell>
      <Tag tone="g" className="mt-0.5 self-start">
        ● ADVANCE ACTIVE
      </Tag>
      <Card>
        <AgentLine kicker="Done">
          Your advance is ready in your Quid wallet. Cash it out to your bank whenever. I'll repay myself on the 30th.
        </AgentLine>
        <Money className="mb-0.5 mt-3.5">${chosen.toFixed(2)}</Money>
        <Row className="mt-2">
          <span className="text-muted">Repay</span>
          <span className="font-mono">30 Jun · auto</span>
        </Row>
        <Row className="pt-1.5">
          <span className="text-muted">Fee</span>
          <span className="font-mono text-quid-deep">$0 · Plus</span>
        </Row>
        <Row className="pt-1.5">
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
      <Button variant="ghost" onClick={() => go("settled")}>
        ▶ Simulate: wages land
      </Button>
      <Hint>Cash out to your bank, or fast-forward to repayment.</Hint>
    </ScreenShell>
  );
}

export function Settled() {
  const { go, score, setScore } = useQuid();
  const [display, setDisplay] = useState(score);

  useEffect(() => {
    const target = score + 18;
    const controls = animate(score, target, {
      type: "spring",
      stiffness: 500,
      damping: 30,
      onUpdate: (v) => setDisplay(Math.round(v)),
      onComplete: () => setScore(target),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScreenShell>
      <Tag tone="g" className="mt-0.5 self-start">
        ● SETTLED
      </Tag>
      <Card className="bg-quid">
        <AgentLine kicker="All square">
          Your wages landed. I paid back $184 automatically. Nothing for you to do.
        </AgentLine>
        <Money className="mb-0.5 mt-3.5 text-[30px]">Quid score {display}</Money>
        <Row className="mt-1.5">
          <span className="font-semibold">▲ Up 18 points</span>
          <span className="font-mono">next advance: cheaper</span>
        </Row>
      </Card>
      <Card flat className="border-dashed">
        <p className="text-[14px] text-muted">
          Every advance you repay builds your on-chain Quid score, so the agent trusts you more and your fees fall
          over time.
        </p>
      </Card>
      <Button onClick={() => go("home")}>Back to home</Button>
    </ScreenShell>
  );
}
