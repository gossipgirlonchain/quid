const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";

/** POST JSON to the Quid backend (proxied to the agent server in dev). */
export async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

/** A row in the Activity feed: real bank transaction via Plaid /transactions/sync. */
export interface Txn {
  id: string;
  name: string;
  /** Debits negative, credits positive. */
  amountUsd: number;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  pending: boolean;
}

const PLAID_TOKEN_KEY = "quid.plaid_token";

/** Remember the user's connected bank item (sandbox-only convenience). */
export function storePlaidToken(token: string): void {
  try {
    localStorage.setItem(PLAID_TOKEN_KEY, token);
  } catch {
    /* private mode etc. — the env-token fallback still works */
  }
}

/**
 * Fetch real transactions, newest first. Uses the bank the user connected via
 * Link when available; the backend falls back to its demo sandbox item.
 * Returns null when Plaid isn't configured anywhere (true empty state).
 */
export async function fetchTransactions(): Promise<Txn[] | null> {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(PLAID_TOKEN_KEY);
  } catch {
    /* ignore */
  }
  const r = await post<{ transactions: Txn[] | null }>(
    "/plaid/transactions",
    stored ? { access_token: stored } : {},
  );
  return r.transactions;
}
