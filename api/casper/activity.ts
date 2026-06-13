import type { VercelRequest, VercelResponse } from "@vercel/node";
import { contractExplorerUrl, fetchPoolEvents } from "../_casper.js";

/** The app's Activity feed: Quid's real lending events from the QuidPool contract. */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const events = await fetchPoolEvents();
    res.status(200).json({ events: [...events].reverse(), explorer: contractExplorerUrl });
  } catch (err) {
    console.error("[casper/activity]", err);
    res.status(500).json({ error: "server_error" });
  }
}
