import type { VercelRequest, VercelResponse } from "@vercel/node";

// Signup / login-by-username against Supabase (PostgREST, plain fetch).
// POST {username, email?} -> upserts a profile row and returns it. The key is
// held server-side only. Falls back to a mock user when Supabase isn't configured.

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const username = String(req.body?.username ?? "").trim();
  const email = String(req.body?.email ?? "").trim() || null;
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: "invalid_username", hint: "3-20 chars, letters/numbers/_" });
  }

  const url = process.env.SUPABASE_URL;
  // Prefer the service-role key (server-only; bypasses RLS). Falls back to the
  // anon key so the flow works before the key is set. Never shipped to the browser.
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return res.status(200).json({ user: { id: "demo", username, tier: "plus" }, mock: true });

  try {
    const r = await fetch(`${url}/rest/v1/profiles?on_conflict=username&select=id,username,tier,casper_public_key,created_at`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify([{ username, email }]),
    });
    if (!r.ok) {
      console.error("[users] supabase", r.status, await r.text());
      return res.status(500).json({ error: "server_error" });
    }
    const rows = (await r.json()) as unknown[];
    res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error("[users]", err);
    res.status(500).json({ error: "server_error" });
  }
}
