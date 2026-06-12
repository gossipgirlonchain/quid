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
