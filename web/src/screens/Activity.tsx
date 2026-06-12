import { type ReactNode } from "react";
import { ScreenShell } from "../components/Shell";
import { Card, H1, Row, Tag } from "../components/ui";

const ROWS: { t: string; s: string; right: ReactNode }[] = [
  { t: "Repaid advance", s: "30 Jun 09:02 · 0x7a3f…c91", right: <span className="tabular font-mono font-bold text-quid-deep">−$184</span> },
  { t: "Issued advance", s: "28 Jun 08:40 · Casper Testnet", right: <span className="tabular font-mono font-bold">+$180</span> },
  { t: "Verified wages", s: "28 Jun 08:39 · x402 · $0.01", right: <Tag>x402</Tag> },
  { t: "Spotted shortfall", s: "28 Jun 08:39 · −$180 projected", right: <Tag tone="c">ALERT</Tag> },
];

export function Activity() {
  return (
    <ScreenShell>
      <H1 className="mt-1.5">Activity</H1>
      <p className="-mt-1 text-muted">Everything Quid did, on the record.</p>
      <Card className="overflow-hidden p-0">
        {ROWS.map((r, i) => (
          <div key={r.t}>
            {i > 0 && <div className="h-[2px] bg-ink/15" />}
            <Row className="px-4 py-3.5">
              <div>
                <b>{r.t}</b>
                <div className="font-mono text-[11px] text-muted">{r.s}</div>
              </div>
              {r.right}
            </Row>
          </div>
        ))}
      </Card>
    </ScreenShell>
  );
}
