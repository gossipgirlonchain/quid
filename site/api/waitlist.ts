// Captures early-access emails into Supabase (table: public.waitlist) via
// PostgREST. The service key is held server-side only and never reaches the
// browser. Mirrors ../../api/users.ts. Degrades to a mock OK when the Supabase
// env vars are absent, so the form still completes before config / in local dev.

export const config = { runtime: "nodejs" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let email = "";
  try {
    const body = (await req.json()) as { email?: unknown };
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: "invalid_email" }, 422);
  }

  const url = process.env.SUPABASE_URL;
  // Service-role key bypasses RLS (server-only). Falls back to the anon key so
  // the flow works before the service key is set. Never shipped to the browser.
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_ANON_KEY;
  // No backend wired yet (e.g. local `npm run dev`): accept so the UI still works.
  if (!url || !key) return json({ ok: true, mock: true });

  try {
    const r = await fetch(`${url}/rest/v1/waitlist?on_conflict=email`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        // merge-duplicates => re-submitting the same email is idempotent, not a 409.
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify([{ email, source: "landing" }]),
    });
    if (!r.ok) {
      console.error("[waitlist] supabase", r.status, await r.text());
      return json({ error: "server_error" }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    console.error("[waitlist]", err);
    return json({ error: "server_error" }, 502);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
