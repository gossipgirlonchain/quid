import type { VercelRequest, VercelResponse } from "@vercel/node";
import { havePlaid, plaidClient } from "../_lib.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!havePlaid()) return res.status(200).json({ ok: true, mock: true });
  try {
    const r = await plaidClient().itemPublicTokenExchange({
      public_token: String(req.body?.public_token ?? ""),
    });
    // TODO: persist r.data.access_token against the user; the agent reads it for cashflow/income.
    res.status(200).json({ ok: true, item_id: r.data.item_id });
  } catch (err) {
    console.error("[plaid/exchange]", err);
    res.status(500).json({ error: "server_error" });
  }
}
