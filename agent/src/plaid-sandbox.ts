// Bootstrap a Plaid Sandbox bank item for the live loop, no Link UI needed:
// create a sandbox public token (dynamic-transactions test user), exchange it,
// wait for recurring streams to compute, and write PLAID_ACCESS_TOKEN to .env.
//
//   npm run plaid:sandbox     # needs PLAID_CLIENT_ID + PLAID_SECRET in .env
//
// Then `npm run dev` watches this account like a real user's bank.

import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products, SandboxPublicTokenCreateRequestOptions } from "plaid";

const ENV_FILE = ".env";
// First Platypus Bank + the dynamic-transactions test user: fresh, evolving
// transaction history (incl. recurring payroll deposits) instead of a static fixture.
const INSTITUTION = "ins_109508";
const SANDBOX_USER = "user_transactions_dynamic";

function client(): PlaidApi {
  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    throw new Error("PLAID_CLIENT_ID / PLAID_SECRET missing - paste your Sandbox keys into agent/.env first");
  }
  return new PlaidApi(
    new Configuration({
      basePath: PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
          "PLAID-SECRET": process.env.PLAID_SECRET,
        },
      },
    }),
  );
}

/** Set KEY=value in .env, replacing the existing line if present. */
function upsertEnv(key: string, value: string): void {
  const env = readFileSync(ENV_FILE, "utf-8");
  const line = `${key}=${value}`;
  const next = new RegExp(`^${key}=.*$`, "m").test(env)
    ? env.replace(new RegExp(`^${key}=.*$`, "m"), line)
    : env.trimEnd() + `\n${line}\n`;
  writeFileSync(ENV_FILE, next);
}

async function main() {
  const p = client();

  console.log(`Creating Sandbox item (${INSTITUTION}, ${SANDBOX_USER})…`);
  const options: SandboxPublicTokenCreateRequestOptions = { override_username: SANDBOX_USER };
  const pub = await p.sandboxPublicTokenCreate({
    institution_id: INSTITUTION,
    initial_products: [Products.Transactions],
    options,
  });
  const exch = await p.itemPublicTokenExchange({ public_token: pub.data.public_token });
  const accessToken = exch.data.access_token;
  console.log(`  item: ${exch.data.item_id}`);

  // Recurring streams compute once the initial transaction pull finishes.
  process.stdout.write("  waiting for recurring transaction streams ");
  for (let i = 0; i < 12; i++) {
    try {
      const rec = await p.transactionsRecurringGet({ access_token: accessToken });
      const inflows = (rec.data.inflow_streams ?? []).filter((s) => s.is_active);
      if (inflows.length > 0) {
        console.log(`✓\n  ${inflows.length} active inflow stream(s), ${rec.data.outflow_streams?.length ?? 0} outflow stream(s)`);
        break;
      }
    } catch {
      /* PRODUCT_NOT_READY -> keep waiting */
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 10_000));
    if (i === 11) console.log("\n  streams not ready yet - the loop will still work once Plaid finishes the pull");
  }

  upsertEnv("PLAID_ACCESS_TOKEN", accessToken);
  console.log(`\nPLAID_ACCESS_TOKEN written to ${ENV_FILE}.`);
  console.log("Next: npm run dev  (the agent now watches this sandbox account)");
  console.log("Tip: set DEMO_EXTRA_OUTFLOW_USD=300 in .env to stage a pre-payday shortfall for the video.");
}

main().catch((e) => {
  console.error(e.response?.data ?? e);
  process.exit(1);
});
