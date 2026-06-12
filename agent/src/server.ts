// Consumer-app backend for Quid: Plaid Link token + exchange, Stripe Checkout + webhook.
// Zero-dependency Node http server — reuses the agent's plaid/stripe/dotenv deps. Every
// endpoint degrades to a safe MOCK response when the relevant keys are absent, so the web
// app's onboarding flow works end to end in demo mode with no credentials.
//
//   npm run server        # http://localhost:8787

import "dotenv/config";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const PORT = Number(process.env.SERVER_PORT) || 8787;
const WEB_ORIGIN = process.env.WEB_ORIGIN || "http://localhost:5173";
const havePlaid = Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
const haveStripe = Boolean(process.env.STRIPE_SECRET_KEY);

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": WEB_ORIGIN,
  "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  plus: process.env.STRIPE_PRICE_PLUS,
  pro: process.env.STRIPE_PRICE_PRO,
};

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json", ...CORS });
  res.end(JSON.stringify(body));
}

function readRaw(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const raw = await readRaw(req);
  if (raw.length === 0) return {};
  try {
    return JSON.parse(raw.toString()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function plaidClient() {
  const { PlaidApi, Configuration, PlaidEnvironments } = await import("plaid");
  const env = (process.env.PLAID_ENV ?? "sandbox") as keyof typeof PlaidEnvironments;
  return new PlaidApi(
    new Configuration({
      basePath: PlaidEnvironments[env],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID ?? "",
          "PLAID-SECRET": process.env.PLAID_SECRET ?? "",
        },
      },
    }),
  );
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const method = req.method ?? "GET";
  const url = (req.url ?? "").split("?")[0];

  if (method === "OPTIONS") {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  try {
    if (method === "GET" && url === "/api/health") {
      sendJson(res, 200, { ok: true, plaid: havePlaid ? "live" : "mock", stripe: haveStripe ? "live" : "mock" });
      return;
    }

    // --- Plaid: create a Link token, then exchange the public token ---
    if (method === "POST" && url === "/api/plaid/link-token") {
      if (!havePlaid) {
        sendJson(res, 200, { link_token: null, mock: true });
        return;
      }
      const body = await readJson(req);
      const { Products, CountryCode } = await import("plaid");
      const client = await plaidClient();
      const r = await client.linkTokenCreate({
        user: { client_user_id: String(body.userId ?? "demo-user") },
        client_name: "Quid",
        products: [Products.Transactions],
        country_codes: [CountryCode.Us],
        language: "en",
      });
      sendJson(res, 200, { link_token: r.data.link_token });
      return;
    }

    if (method === "POST" && url === "/api/plaid/exchange") {
      if (!havePlaid) {
        sendJson(res, 200, { ok: true, mock: true });
        return;
      }
      const body = await readJson(req);
      const client = await plaidClient();
      const r = await client.itemPublicTokenExchange({ public_token: String(body.public_token ?? "") });
      // Sandbox-only convenience: hand the token to the client so the Activity feed
      // can read this item. In production, persist server-side against the user instead.
      sendJson(res, 200, { ok: true, item_id: r.data.item_id, access_token: r.data.access_token });
      return;
    }

    // --- Plaid: real transactions for the Activity feed (/transactions/sync) ---
    if (method === "POST" && url === "/api/plaid/transactions") {
      const body = await readJson(req);
      const accessToken = String(body.access_token ?? "") || process.env.PLAID_ACCESS_TOKEN || "";
      if (!havePlaid || !accessToken) {
        sendJson(res, 200, { transactions: null, mock: true });
        return;
      }
      const client = await plaidClient();
      const added = [];
      let cursor: string | undefined;
      for (let page = 0; page < 8; page++) {
        const r = await client.transactionsSync({ access_token: accessToken, cursor, count: 250 });
        added.push(...(r.data.added ?? []));
        cursor = r.data.next_cursor;
        if (!r.data.has_more) break;
      }
      const transactions = added
        .map((t) => ({
          id: t.transaction_id,
          name: t.merchant_name || t.name || "Transaction",
          amountUsd: -t.amount, // Plaid: positive = debit; UI: debits negative, credits positive
          date: t.authorized_date || t.date,
          pending: Boolean(t.pending),
        }))
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
        .slice(0, 30);
      sendJson(res, 200, { transactions });
      return;
    }

    // --- Stripe: a Checkout session for the chosen tier (the $50 paywall) ---
    if (method === "POST" && url === "/api/stripe/checkout") {
      const body = await readJson(req);
      const tier = String(body.tier ?? "plus");
      const price = PRICE_IDS[tier];
      if (!haveStripe || !price) {
        sendJson(res, 200, { url: null, mock: true });
        return;
      }
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price, quantity: 1 }],
        success_url: `${WEB_ORIGIN}/?checkout=success`,
        cancel_url: `${WEB_ORIGIN}/?checkout=cancel`,
      });
      sendJson(res, 200, { url: session.url });
      return;
    }

    if (method === "POST" && url === "/api/stripe/webhook") {
      if (!haveStripe) {
        sendJson(res, 200, { received: true, mock: true });
        return;
      }
      const raw = await readRaw(req);
      const Stripe = (await import("stripe")).default;
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
        sendJson(res, 200, { received: true });
      } catch (err) {
        res.writeHead(400, CORS);
        res.end(`Webhook Error: ${(err as Error).message}`);
      }
      return;
    }

    sendJson(res, 404, { error: "not_found" });
  } catch (err) {
    console.error(`[server] ${method} ${url}`, err);
    sendJson(res, 500, { error: "server_error" });
  }
});

server.listen(PORT, () => {
  console.log(`Quid backend on :${PORT}  (plaid ${havePlaid ? "live" : "mock"}, stripe ${haveStripe ? "live" : "mock"})`);
});
