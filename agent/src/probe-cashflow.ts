// Dev probe: print the live cashflow snapshot the agent sees (npx tsx src/probe-cashflow.ts).
import "dotenv/config";
import { getCashflow } from "./plaid.js";

const c = await getCashflow(process.env.PLAID_ACCESS_TOKEN!);
console.log(JSON.stringify(c, null, 1));
