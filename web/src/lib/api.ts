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

/** A row in the Activity feed: a real QuidPool lending event on Casper Testnet. */
export interface PoolEvent {
  /** Position in the contract's event log (chronological). */
  index: number;
  kind: "issued" | "repaid";
  /** Advance id. */
  id: number;
  amountUsd?: number;
  newReputation?: number;
}

/** Quid's on-chain lending activity, newest first, plus the cspr.live explorer link. */
export async function fetchPoolActivity(): Promise<{ events: PoolEvent[]; explorer: string }> {
  return post<{ events: PoolEvent[]; explorer: string }>("/casper/activity");
}

const PLAID_TOKEN_KEY = "quid.plaid_token";
const USER_KEY = "quid.user";

export interface QuidUser {
  id: string;
  username: string;
  tier?: string;
  casper_public_key?: string | null;
}

/** Create or fetch the profile for a username (Supabase-backed). */
export async function signUp(username: string, email?: string): Promise<QuidUser> {
  const r = await post<{ user: QuidUser }>("/users", { username, email });
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(r.user));
  } catch {
    /* ignore */
  }
  return r.user;
}

export function currentUser(): QuidUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as QuidUser) : null;
  } catch {
    return null;
  }
}

/** Remember the user's connected bank item (sandbox-only convenience). */
export function storePlaidToken(token: string): void {
  try {
    localStorage.setItem(PLAID_TOKEN_KEY, token);
  } catch {
    /* private mode etc. — the env-token fallback still works */
  }
}
