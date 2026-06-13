import { useState, type ReactNode } from "react";
import { ScreenShell } from "../components/Shell";
import { Avatar, Card, Divider, H1, Kicker, Money, Row, Tag, Toggle } from "../components/ui";
import { cn } from "../lib/cn";
import { useQuid } from "../state";
import { openOnRamp } from "../lib/ramps";

function SetRow({
  label,
  sub,
  right,
  onClick,
  danger,
}: {
  label: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn("flex items-center justify-between gap-3 px-4 py-3.5", onClick && "cursor-pointer")}
    >
      <div>
        <div className={cn("font-semibold", danger && "text-quid-deep")}>{label}</div>
        {sub && <div className="mt-0.5 font-mono text-[12px] text-muted">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

const chev = <span className="text-[22px] leading-none text-muted">›</span>;

export function Profile() {
  const { go, score, auto, cap } = useQuid();
  const [scoreInfo, setScoreInfo] = useState(false);
  const [alerts, setAlerts] = useState(true);
  const [receipts, setReceipts] = useState(true);
  const [faceId, setFaceId] = useState(true);

  return (
    <ScreenShell>
      <div className="mt-2 flex items-center gap-3.5">
        <Avatar size={56} className="rounded-[16px]">
          W
        </Avatar>
        <div>
          <H1 className="text-[24px]">Winny</H1>
          <div className="font-mono text-[12px] text-muted">@winny · since Apr 2026</div>
        </div>
      </div>

      <Card className="bg-sun text-white">
        <Row>
          <Kicker className="text-white">Quid score</Kicker>
          <Tag className="bg-paper">TRUSTED</Tag>
        </Row>
        <Money className="my-1.5 mb-3">{score}</Money>
        <div className="h-4 overflow-hidden rounded-full border-[3px] border-ink bg-surface">
          <div className="h-full border-r-[3px] border-ink bg-quid" style={{ width: "46%" }} />
        </div>
        <Row className="mt-2">
          <span className="font-mono text-[11px] font-bold">TRUSTED</span>
          <span className="font-mono text-[11px]">108 pts to PRIME</span>
        </Row>
        <Divider className="bg-white/30" />
        <p className="text-[13px]">
          Reach <b>Prime</b> to unlock lower fees (1.5%) and a higher ceiling ($600).
          <button
            onClick={() => setScoreInfo((v) => !v)}
            aria-label="How the score works"
            className="ml-1.5 inline-grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-paper align-middle font-mono text-[13px] font-bold text-ink"
          >
            i
          </button>
        </p>
        {scoreInfo && (
          <p className="pt-2.5 text-[13px] text-paper">
            Your score rises every time you repay an advance on time, recorded on-chain. Higher score means cheaper
            fees and a bigger safe ceiling.
          </p>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <SetRow label="On-time repayments" right={<span className="tabular font-mono font-bold text-quid-deep">7 / 7</span>} />
        <Divider className="my-0" />
        <SetRow label="Advanced lifetime" right={<span className="tabular font-mono font-bold">$1,420</span>} />
      </Card>

      <Kicker className="mt-2">Plan</Kicker>
      <Card className="overflow-hidden p-0">
        <SetRow label="Plus" sub="$9/mo · borrow up to $250" right={<Tag tone="g" className="text-[10px]">CURRENT</Tag>} />
        <Divider className="my-0" />
        <SetRow label="Pro" sub="$15/mo · up to $500" right={chev} onClick={() => {}} />
        <Divider className="my-0" />
        <SetRow label={<span className="text-muted">Starter</span>} sub="$5/mo · up to $100" right={chev} onClick={() => {}} />
        <Divider className="my-0" />
        <SetRow label={<span className="text-muted">Free</span>} sub="$0 · up to $50" right={chev} onClick={() => {}} />
      </Card>

      <Kicker className="mt-2">Settings</Kicker>
      <Card className="overflow-hidden p-0">
        <SetRow label="Auto-cover" sub={`${auto ? "On" : "Off"} · up to $${cap}`} right={chev} onClick={() => go("home")} />
      </Card>

      <Card className="overflow-hidden p-0">
        <SetRow
          label="Shortfall alerts"
          sub="Heads-up before you go short"
          right={<Toggle on={alerts} onToggle={() => setAlerts((v) => !v)} />}
        />
        <Divider className="my-0" />
        <SetRow
          label="Repayment receipts"
          sub="When I pay myself back"
          right={<Toggle on={receipts} onToggle={() => setReceipts((v) => !v)} />}
        />
      </Card>

      <Card className="overflow-hidden p-0">
        <SetRow label="Bank" sub="Monzo · current account" right={<Tag tone="g" className="text-[10px]">CONNECTED</Tag>} />
        <Divider className="my-0" />
        <SetRow label="Casper wallet" sub="01dc…7edd" right={chev} onClick={() => {}} />
        <Divider className="my-0" />
        <SetRow label="Add funds" sub="Buy CSPR with a card · Ramp" right={chev} onClick={() => openOnRamp()} />
      </Card>

      <Card className="overflow-hidden p-0">
        <SetRow
          label="Face ID"
          sub="Required to confirm advances"
          right={<Toggle on={faceId} onToggle={() => setFaceId((v) => !v)} />}
        />
        <Divider className="my-0" />
        <SetRow label="Help & support" right={chev} onClick={() => {}} />
        <Divider className="my-0" />
        <SetRow label="Log out" danger right={<span className="text-[22px] leading-none text-quid-deep">›</span>} onClick={() => {}} />
      </Card>
    </ScreenShell>
  );
}
