import type { VercelRequest, VercelResponse } from "@vercel/node";
import { havePlaid, haveStripe } from "./_lib.js";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    plaid: havePlaid() ? "live" : "mock",
    stripe: haveStripe() ? "live" : "mock",
  });
}
