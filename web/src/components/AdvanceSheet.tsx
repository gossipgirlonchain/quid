import { useEffect, useRef } from "react";
import { Button, Card, Divider, H2, Money, Row } from "./ui";
import { Slider } from "./Slider";
import { cn } from "../lib/cn";
import { useQuid } from "../state";

/** Bottom-sheet advance confirm — the one irreversible, money-moving step. */
export function AdvanceSheet() {
  const { sheetOpen, closeSheet, chosen, setChosen, go } = useQuid();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sheetOpen) return;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen, closeSheet]);

  if (!sheetOpen) return null;
  const overCap = chosen >= 250;
  const amount = `$${chosen.toFixed(2)}`;

  return (
    <div
      className="absolute inset-0 z-50 flex items-end bg-ink/45 animate-[screen-in_0.2s_ease-out]"
      onClick={closeSheet}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full flex-col gap-[14px] rounded-t-[24px] border-t-4 border-ink bg-paper px-[18px] pb-[calc(22px+env(safe-area-inset-bottom))] pt-[22px] outline-none animate-[sheet-up_0.28s_ease-out]"
      >
        <div className="mx-auto mb-1 h-[5px] w-12 rounded-[3px] bg-ink/25" />
        <H2 id="sheet-title">How much do you need?</H2>
        <Money className="my-0.5 text-[46px]">${chosen}</Money>
        <Slider min={50} max={250} value={chosen} onChange={setChosen} ariaLabel="Advance amount" />
        <Row>
          <span className="font-mono text-[11px] text-muted">$50</span>
          <span className={cn("font-mono text-[11px]", overCap ? "text-quid-deep" : "text-muted")}>
            {overCap ? "Upgrade to Pro to borrow more" : "Plus plan, up to $250"}
          </span>
        </Row>
        <Card flat className="rounded-xl">
          <Row className="py-[5px]">
            <span className="text-muted">Amount</span>
            <span className="tabular font-mono font-bold">{amount}</span>
          </Row>
          <Row className="py-[5px]">
            <span className="text-muted">Fee</span>
            <span className="font-mono font-bold text-quid-deep">$0 · Plus plan</span>
          </Row>
          <Row className="py-[5px]">
            <span className="text-muted">Repay 30 Jun</span>
            <span className="tabular font-mono font-bold">{amount}</span>
          </Row>
          <Divider />
          <Row className="py-[5px]">
            <span className="text-muted">Secured against</span>
            <span className="font-mono">wages · verified</span>
          </Row>
        </Card>
        <p className="font-mono text-[11px] text-muted">
          Repaid automatically the moment your wages land. This is the only step that moves money.
        </p>
        <Button
          variant="coral"
          onClick={() => {
            closeSheet();
            go("work");
          }}
        >
          Hold to confirm · Advance ${chosen}
        </Button>
        <Button variant="ghost" onClick={closeSheet}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
