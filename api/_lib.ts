// Shared bits for the Vercel functions (mirrors agent/src/server.ts, which serves
// the same endpoints in local dev). Every endpoint degrades to a MOCK response
// when its keys are absent, so the deployed app works with whatever env is set.

import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

export const havePlaid = (): boolean =>
  Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);

export const haveStripe = (): boolean => Boolean(process.env.STRIPE_SECRET_KEY);

export function plaidClient(): PlaidApi {
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
