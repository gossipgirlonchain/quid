import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { haveStripe } from "../_lib.js";

const PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  plus: process.env.STRIPE_PRICE_PLUS,
  pro: process.env.STRIPE_PRICE_PRO,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const tier = String(req.body?.tier ?? "plus");
  const price = PRICE_IDS[tier];
  if (!haveStripe() || !price) return res.status(200).json({ url: null, mock: true });
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const origin = `https://${req.headers.host}`;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancel`,
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    res.status(500).json({ error: "server_error" });
  }
}
