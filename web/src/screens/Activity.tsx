import { useCallback, useEffect, useState } from "react";
import { ScreenShell } from "../components/Shell";
import { Button, Card, H1, Row, Tag } from "../components/ui";
import { fetchTransactions, type Txn } from "../lib/api";

const REFRESH_MS = 30_000;

/** "2026-06-12" -> "12 Jun" */
function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function Amount({ usd }: { usd: number }) {
  const credit = usd > 0;
  const txt = `${credit ? "+" : "−"}$${Math.abs(usd).toFixed(2)}`;
  return <span className={`tabular font-mono font-bold ${credit ? "text-quid-deep" : ""}`}>{txt}</span>;
}

export function Activity() {
  const [txns, setTxns] = useState<Txn[] | null | undefined>(undefined); // undefined = loading
  const [error, setError] = useState(false);

  const refresh = useCallback(() => {
    fetchTransactions()
      .then((t) => {
        setTxns(t);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  // Live data: load on mount, then poll so freshly-synced transactions appear
  // without an app restart.
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <ScreenShell>
      <Row className="mt-1.5">
        <H1>Activity</H1>
        <Button sm className="w-auto px-3" onClick={refresh} aria-label="Refresh transactions">
          ↻
        </Button>
      </Row>
      <p className="-mt-1 text-muted">Your real transactions, straight from your bank.</p>

      {error && (
        <Card flat className="border-dashed text-center text-[14px]">
          Couldn't reach the bank feed. <button className="font-bold underline" onClick={refresh}>Retry</button>
        </Card>
      )}

      {txns === undefined && !error && (
        <Card flat className="border-dashed text-center font-mono text-[12px] text-muted">
          Loading transactions…
        </Card>
      )}

      {(txns === null || txns?.length === 0) && !error && (
        <Card flat className="border-dashed text-center">
          <p className="font-semibold">No transactions yet</p>
          <p className="mt-1 text-[13px] text-muted">
            Connect your bank in onboarding and your activity shows up here as it syncs.
          </p>
        </Card>
      )}

      {!!txns?.length && (
        <Card className="overflow-hidden p-0">
          {txns.map((t, i) => (
            <div key={t.id}>
              {i > 0 && <div className="h-[2px] bg-ink/15" />}
              <Row className="px-4 py-3.5">
                <div className="min-w-0">
                  <b className="block truncate">{t.name}</b>
                  <div className="font-mono text-[11px] text-muted">
                    {shortDate(t.date)}
                    {t.pending && (
                      <Tag tone="s" className="ml-2 px-1.5 py-0 text-[9px]">
                        PENDING
                      </Tag>
                    )}
                  </div>
                </div>
                <Amount usd={t.amountUsd} />
              </Row>
            </div>
          ))}
        </Card>
      )}
    </ScreenShell>
  );
}
