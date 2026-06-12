import type { VercelRequest, VercelResponse } from "@vercel/node";
import { havePlaid, plaidClient } from "../_lib.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!havePlaid()) return res.status(200).json({ ok: true, mock: true });
  try {
    const r = await plaidClient().itemPublicTokenExchange({
      public_token: String(req.body?.public_token ?? ""),
    });
    // Sandbox-only convenience: hand the token to the client so the Activity feed
    // can read this item. In production, persist server-side against the user instead.
    res.status(200).json({ ok: true, item_id: r.data.item_id, access_token: r.data.access_token });
  } catch (err) {
    console.error("[plaid/exchange]", err);
    res.status(500).json({ error: "server_error" });
  }
}
