import type { VercelRequest, VercelResponse } from "@vercel/node";
import { havePlaid, plaidClient } from "../_lib.js";

/**
 * Real transactions for the Activity feed via Plaid /transactions/sync.
 * Token precedence: the caller's connected item (body.access_token, stored
 * client-side after Link) -> PLAID_ACCESS_TOKEN env (the demo sandbox item).
 * Sign convention for the UI: debits negative, credits positive (Plaid is inverse).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const accessToken = String(req.body?.access_token ?? "") || process.env.PLAID_ACCESS_TOKEN || "";
  if (!havePlaid() || !accessToken) return res.status(200).json({ transactions: null, mock: true });
  try {
    const p = plaidClient();
    const added = [];
    let cursor: string | undefined;
    for (let page = 0; page < 8; page++) {
      const r = await p.transactionsSync({ access_token: accessToken, cursor, count: 250 });
      added.push(...(r.data.added ?? []));
      cursor = r.data.next_cursor;
      if (!r.data.has_more) break;
    }
    const transactions = added
      .map((t) => ({
        id: t.transaction_id,
        name: t.merchant_name || t.name || "Transaction",
        amountUsd: -t.amount,
        date: t.authorized_date || t.date,
        pending: Boolean(t.pending),
      }))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, 30);
    res.status(200).json({ transactions });
  } catch (err) {
    console.error("[plaid/transactions]", err);
    res.status(500).json({ error: "server_error" });
  }
}
