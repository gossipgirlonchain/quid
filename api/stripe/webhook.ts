import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { haveStripe } from "../_lib.js";

// Stripe signature verification needs the raw request bytes.
export const config = { api: { bodyParser: false } };

function readRaw(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on("data", (c: Uint8Array) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!haveStripe()) return res.status(200).json({ received: true, mock: true });
  const raw = await readRaw(req);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers["stripe-signature"];
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  try {
    const event =
      whSecret && typeof sig === "string"
        ? stripe.webhooks.constructEvent(raw, sig, whSecret)
        : (JSON.parse(raw.toString()) as { type: string });
    // TODO: on checkout.session.completed / customer.subscription.* -> set the user's plan tier.
    console.log(`[stripe] webhook ${event.type}`);
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }
}
