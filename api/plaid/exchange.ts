import type { VercelRequest, VercelResponse } from "@vercel/node";
import { havePlaid, plaidClient } from "../_lib.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!havePlaid()) return res.status(200).json({ ok: true, mock: true });
  try {
    const r = await plaidClient().itemPublicTokenExchange({
      public_token: String(req.body?.public_token ?? ""),
    });
    // Persist the token against the user's profile when Supabase is configured.
    const userId = String(req.body?.userId ?? "");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (userId && userId !== "demo" && url && key) {
      await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ plaid_access_token: r.data.access_token }),
      }).catch(() => {});
    }
    res.status(200).json({ ok: true, item_id: r.data.item_id, access_token: r.data.access_token });
  } catch (err) {
    console.error("[plaid/exchange]", err);
    res.status(500).json({ error: "server_error" });
  }
}
