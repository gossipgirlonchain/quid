// Plaid integration: the agent's "eyes".
// Two jobs: (1) detect an upcoming shortfall, (2) verify incoming income.
// Use the Sandbox environment for development.
//
// SIM mode returns mock data so the loop runs with no Plaid credentials.

import {
  PlaidApi,
  Configuration,
  PlaidEnvironments,
  type AccountBase,
  type TransactionStream,
  type Transaction,
} from "plaid";
import { SIM } from "./config.js";
import type { CashflowSnapshot } from "./types.js";

let plaidClient: PlaidApi | undefined;

/** Lazily build a Plaid client from env (live mode only). */
function client(): PlaidApi {
  if (plaidClient) return plaidClient;
  const env = (process.env.PLAID_ENV ?? "sandbox") as keyof typeof PlaidEnvironments;
  plaidClient = new PlaidApi(
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
  return plaidClient;
}

/** Days between recurrences, by Plaid frequency (no predicted date is returned). */
const FREQ_DAYS: Record<string, number> = {
  WEEKLY: 7,
  BIWEEKLY: 14,
  SEMI_MONTHLY: 15,
  MONTHLY: 30,
  ANNUALLY: 365,
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Magnitude of a recurring stream's amount in USD. */
function streamAmount(s: TransactionStream): number {
  return Math.abs(s.average_amount?.amount ?? s.last_amount?.amount ?? 0);
}

/** Next predicted occurrence (unix seconds) = last_date + one frequency interval. */
function nextDateTs(s: TransactionStream): number {
  const last = s.last_date ? new Date(s.last_date).getTime() : 0;
  if (!last) return 0;
  const days = FREQ_DAYS[String(s.frequency)] ?? 30;
  return Math.floor((last + days * 86_400_000) / 1000);
}

/**
 * Build a cashflow snapshot for a user from Plaid:
 *   - available balance across depository accounts,
 *   - next payday + verified income from the primary recurring inflow,
 *   - projected balance at payday = balance minus outflows due before then.
 */
export async function getCashflow(accessToken: string): Promise<CashflowSnapshot> {
  if (SIM) {
    return {
      balanceUsd: 1152.4,
      projectedAtPaydayUsd: -180, // short by $180 before payday
      paydayTs: 1_900_000_000,
      verifiedIncomeUsd: 1980,
    };
  }

  const p = client();

  // 1) Available balance across depository (checking/savings) accounts.
  const balResp = await p.accountsBalanceGet({ access_token: accessToken });
  const balanceUsd = balResp.data.accounts
    .filter((a: AccountBase) => String(a.type) === "depository")
    .reduce((sum, a) => sum + (a.balances.available ?? a.balances.current ?? 0), 0);

  // 2) Recurring streams → primary income + upcoming outflows.
  const recResp = await p.transactionsRecurringGet({ access_token: accessToken });
  const inflows = (recResp.data.inflow_streams ?? []).filter((s) => s.is_active);
  const outflows = (recResp.data.outflow_streams ?? []).filter((s) => s.is_active);

  // Primary income = the largest active inflow stream.
  const income = [...inflows].sort((a, b) => streamAmount(b) - streamAmount(a))[0];
  const verifiedIncomeUsd = income ? streamAmount(income) : 0;
  const paydayTs = income ? nextDateTs(income) : 0;

  // Outflows expected to hit on/before the next payday.
  const upcomingOutflows = outflows
    .map((o) => ({ amount: streamAmount(o), ts: nextDateTs(o) }))
    .filter((o) => o.ts > 0 && (paydayTs === 0 || o.ts <= paydayTs))
    .reduce((sum, o) => sum + o.amount, 0);

  // Demo lever: stage an extra pre-payday bill (USD) so a healthy sandbox
  // account shows a shortfall on camera. Unset = honest data.
  const demoOutflow = Number(process.env.DEMO_EXTRA_OUTFLOW_USD ?? 0) || 0;

  return {
    balanceUsd: round2(balanceUsd),
    projectedAtPaydayUsd: round2(balanceUsd - upcomingOutflows - demoOutflow),
    paydayTs,
    verifiedIncomeUsd: round2(verifiedIncomeUsd),
  };
}

/** Has the expected income actually landed yet? Drives auto-repayment. */
export async function incomeHasLanded(accessToken: string): Promise<boolean> {
  if (SIM) return true; // in the demo, the paycheck has arrived by the next tick

  const p = client();
  // Plaid credits (money in) are negative amounts. Look for a recent payroll credit.
  const sync = await p.transactionsSync({ access_token: accessToken });
  const PAYROLL = /payroll|salary|direct dep|paycheck|wages/i;
  return (sync.data.added ?? []).some(
    (t: Transaction) => t.amount < 0 && PAYROLL.test(`${t.name ?? ""} ${t.merchant_name ?? ""}`),
  );
}
