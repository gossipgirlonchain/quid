import { currentUser, post } from "./api";

// Casper fiat ramps.
//
// ON-RAMP (buy CSPR with a card -> the user's Casper wallet): Ramp Network is an
// official Casper partner. Live when VITE_RAMP_HOST_API_KEY is set; otherwise the
// flow opens Ramp's demo widget so it stays clickable with no key.
//
// OFF-RAMP / cash-out (Casper advance -> the user's bank): there's no turnkey
// Casper->fiat provider, so cashOut() hits a backend scaffold that simulates an
// ACH payout until an off-ramp provider is wired (see api/offramp/payout.ts).

const RAMP_KEY = import.meta.env.VITE_RAMP_HOST_API_KEY as string | undefined;
// Ramp asset codes are NETWORK_TOKEN (e.g. ETH_USDC). Confirm Casper's code on
// Ramp's supported-assets list; override with VITE_RAMP_ASSET if it differs.
const RAMP_ASSET = (import.meta.env.VITE_RAMP_ASSET as string | undefined) ?? "CSPR_CSPR";

export const onRampLive = Boolean(RAMP_KEY);

/** Open the Casper fiat on-ramp in a new tab. Returns whether it's the live (keyed) flow. */
export function openOnRamp(opts?: { fiatValue?: number }): { live: boolean } {
  const live = Boolean(RAMP_KEY);
  const base = live ? "https://app.ramp.network" : "https://app.demo.ramp.network";
  const params = new URLSearchParams({ hostAppName: "Quid", fiatCurrency: "USD" });
  if (live) {
    params.set("hostApiKey", RAMP_KEY!);
    params.set("swapAsset", RAMP_ASSET);
    params.set("hostLogoUrl", `${window.location.origin}/quid-logo.png`);
    const wallet = currentUser()?.casper_public_key;
    if (wallet) params.set("userAddress", wallet);
  }
  if (opts?.fiatValue) params.set("fiatValue", String(opts.fiatValue));
  window.open(`${base}/?${params.toString()}`, "_blank", "noopener,noreferrer");
  return { live };
}

export interface PayoutResult {
  status: "processing" | "paid" | "failed";
  etaBusinessDays?: number;
  mock?: boolean;
}

/** Cash an advance out of the Casper wallet to the user's linked bank (off-ramp). */
export async function cashOut(amountUsd: number): Promise<PayoutResult> {
  return post<PayoutResult>("/offramp/payout", { amountUsd, userId: currentUser()?.id });
}
