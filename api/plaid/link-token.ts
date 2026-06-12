import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CountryCode, Products } from "plaid";
import { havePlaid, plaidClient } from "../_lib.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!havePlaid()) return res.status(200).json({ link_token: null, mock: true });
  try {
    const r = await plaidClient().linkTokenCreate({
      user: { client_user_id: String(req.body?.userId ?? "demo-user") },
      client_name: "Quid",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });
    res.status(200).json({ link_token: r.data.link_token });
  } catch (err) {
    console.error("[plaid/link-token]", err);
    res.status(500).json({ error: "server_error" });
  }
}
