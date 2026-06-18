import { useCallback, useEffect, useState } from "react";
import { ScreenShell } from "../components/Shell";
import { Button, Card, H1, Row, Tag } from "../components/ui";
import { fetchPoolActivity, type PoolEvent } from "../lib/api";

const REFRESH_MS = 30_000;

const usd = (n?: number) => (n === undefined ? "" : `$${n.toFixed(2)}`);

function EventRow({ e }: { e: PoolEvent }) {
  const issued = e.kind === "issued";
  return (
    <Row className="px-4 py-3.5">
      <div className="min-w-0">
        <b className="block">{issued ? `Advance #${e.id} issued` : `Advance #${e.id} repaid`}</b>
        <div className="font-mono text-[11px] text-muted">
          {issued ? "QuidPool → your wallet · Casper Testnet" : `auto-repaid · Quid score → ${e.newReputation}`}
        </div>
      </div>
      <span className={`tabular font-mono font-bold ${issued ? "" : "text-quid-deep"}`}>
        {issued ? `+${usd(e.amountUsd)}` : `−${usd(e.amountUsd)}`}
      </span>
    </Row>
  );
}

export function Activity() {
  const [events, setEvents] = useState<PoolEvent[] | undefined>(undefined); // undefined = loading
  const [explorer, setExplorer] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const refresh = useCallback(() => {
    fetchPoolActivity()
      .then((r) => {
        setEvents(r.events);
        setExplorer(r.explorer);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  // Live chain data: load on mount, then poll so fresh advances appear on their own.
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <ScreenShell>
      <Row className="mt-1.5">
        <H1>Activity</H1>
        <Button sm className="w-auto px-3" onClick={refresh} aria-label="Refresh activity">
          ↻
        </Button>
      </Row>
      <p className="-mt-1 text-muted">Everything Quid did for you, recorded on-chain.</p>

      {error && (
        <Card flat className="border-dashed text-center text-[14px]">
          Couldn't reach the chain. <button className="font-bold underline" onClick={refresh}>Retry</button>
        </Card>
      )}

      {events === undefined && !error && (
        <Card flat className="border-dashed text-center font-mono text-[12px] text-muted">
          Reading the QuidPool contract…
        </Card>
      )}

      {events?.length === 0 && !error && (
        <Card flat className="border-dashed text-center">
          <p className="font-semibold">No advances yet</p>
          <p className="mt-1 text-[13px] text-muted">
            When Quid covers you, every issue and repayment lands here with its on-chain receipt.
          </p>
        </Card>
      )}

      {!!events?.length && (
        <Card className="overflow-hidden p-0">
          {events.map((e, i) => (
            <div key={e.index}>
              {i > 0 && <div className="h-[2px] bg-ink/15" />}
              <EventRow e={e} />
            </div>
          ))}
        </Card>
      )}

      {explorer && (
        <a
          href={explorer}
          target="_blank"
          rel="noreferrer"
          className="text-center font-mono text-[11px] text-muted underline"
        >
          Verify on cspr.live <Tag className="ml-1 px-1.5 py-0 text-[9px]">TESTNET</Tag>
        </a>
      )}
    </ScreenShell>
  );
}
