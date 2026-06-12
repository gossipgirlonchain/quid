import { useState } from "react";
import { ScreenShell } from "../components/Shell";
import { Button, Card, Divider, H2, Kicker, Money, Row, Toggle } from "../components/ui";
import { Slider } from "../components/Slider";
import { cn } from "../lib/cn";
import { useQuid } from "../state";

export function Home() {
  const { auto, toggleAuto, cap, setCap, openSheet, go, showPush, showInstall } = useQuid();
  const [info, setInfo] = useState(false);
  const overCap = cap >= 250;

  return (
    <ScreenShell>
      <Card className="mt-1.5 bg-quid">
        <Kicker className="text-ink">You're covered</Kicker>
        <Money className="my-2">$312.40</Money>
        <p className="font-mono text-[13px] font-bold">Projected balance · payday in 5 days</p>
      </Card>

      <Card>
        <Row>
          <div className="flex items-center gap-2">
            <H2>Auto-cover</H2>
            <button
              onClick={() => setInfo((v) => !v)}
              aria-label="About auto-cover"
              aria-expanded={info}
              className="grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-paper font-mono text-[13px] font-bold"
            >
              i
            </button>
          </div>
          <Toggle big on={auto} onToggle={toggleAuto} />
        </Row>
        {info && (
          <p className="pt-2.5 text-[13px] leading-[1.45] text-muted">
            If you'll go short, I cover it up to your cap and pay myself back on payday. No need to ask.
          </p>
        )}
        <Divider />
        <Row>
          <span className="text-[13px] text-muted">Cover up to</span>
          <Money className="text-[30px]">${cap}</Money>
        </Row>
        <Slider min={50} max={250} value={cap} onChange={setCap} ariaLabel="Auto-cover limit" />
        <Row>
          <span className="font-mono text-[11px] text-muted">$50</span>
          <span className={cn("font-mono text-[11px]", overCap ? "text-quid-deep" : "text-muted")}>
            {overCap ? "Upgrade to Pro to go higher" : "Plus plan, up to $250"}
          </span>
        </Row>
      </Card>

      <Button variant="coral" onClick={() => openSheet(180)}>
        Need it now
      </Button>

      <Kicker className="mt-2">DEMO: Try a scenario</Kicker>
      <div className="flex flex-col gap-2">
        <Button
          sm
          variant="ghost"
          onClick={() => showPush("Heads up, you'll be $180 short on the 28th. Tap to review.", "heads")}
        >
          🔔 Notify: heading short (ask first)
        </Button>
        <Button
          sm
          variant="ghost"
          onClick={() => showPush("I covered you. $120 sent, repays when you're paid.", "autocover")}
        >
          🔔 Notify: auto-covered (silent)
        </Button>
        <Button sm variant="ghost" onClick={() => go("declined")}>
          Agent declines an advance
        </Button>
        <Button sm variant="ghost" onClick={showInstall}>
          Add to home screen prompt
        </Button>
      </div>
    </ScreenShell>
  );
}
