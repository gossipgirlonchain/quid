import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { currentUser, fetchPoolActivity, post, storePlaidToken } from "./api";

/** The most recent real advance issued by the QuidPool contract (for receipts in the UI). */
export function useLatestAdvance() {
  const [latest, setLatest] = useState<{ id: number; amountUsd?: number; explorer: string } | null>(null);
  useEffect(() => {
    fetchPoolActivity()
      .then((r) => {
        const issued = r.events.find((e) => e.kind === "issued");
        if (issued) setLatest({ id: issued.id, amountUsd: issued.amountUsd, explorer: r.explorer });
      })
      .catch(() => {
        /* chain unreachable -> the UI shows pending */
      });
  }, []);
  return latest;
}

/**
 * Auth via CSPR.click (social login + silent self-custodial Casper wallet).
 *
 * LIVE: set VITE_CSPRCLICK_APP_ID (from console.cspr.build) and wire the real
 * ClickProvider - see web/INTEGRATIONS.md. login() then opens CSPR.click, which
 * provisions a wallet with no seed phrase.
 * MOCK (default): login() is a no-op and onboarding proceeds with a demo wallet,
 * so the flow is fully clickable with no credentials.
 */
export function useAuth() {
  const live = Boolean(import.meta.env.VITE_CSPRCLICK_APP_ID);
  const login = async (_provider: "apple" | "google" | "email"): Promise<void> => {
    // Real CSPR.click sign-in goes here when `live` (see INTEGRATIONS.md).
  };
  return { login, live };
}

// The dUSDC CEP-18 token and the QuidPool spender, deployed on Casper Testnet.
const DUSDC_TOKEN = "hash-8665867ccff5f10ebcec71750f45a02599d467ea8a6371fbc8e828ccd2461e89";
const QUID_POOL = "hash-ccdd94c7cf3b559906616f97c0d6624d97969ff5ca5cad7c8e749159ccd4ce34";
const MAX_ALLOWANCE = "100000000000"; // 100,000 dUSDC at 6 decimals (a sane standing ceiling)

/**
 * The one user signature in the whole flow: a CEP-18 `approve` on dUSDC granting
 * the QuidPool a standing allowance, so the agent's `repay_advance` can pull each
 * advance back when wages land (the contract repays via `transfer_from`). Signed
 * once, at onboarding, by the user's CSPR.click wallet.
 *
 * LIVE (VITE_CSPRCLICK_APP_ID set): build the approve deploy and hand it to
 * CSPR.click to sign. Mirror the agent's working call in agent/src/casper.ts
 * `approveStablecoin` exactly:
 *   ContractCallBuilder().byPackageHash(DUSDC_TOKEN).entryPoint("approve")
 *     .runtimeArgs(Args.fromMap({
 *       spender: CLValue.newCLKey(Key.newKey(QUID_POOL)),   // the pool is the spender
 *       amount:  CLValue.newCLUInt256(MAX_ALLOWANCE),
 *     }))
 *     .chainName("casper-test").payment(2_500_000_000).build()
 * MOCK (default): no CSPR.click wallet to sign with, so resolve as authorized and
 * let onboarding proceed (the demo borrower already holds a real on-chain allowance).
 */
export async function authorizeRepayments(): Promise<{ ok: boolean; mock: boolean }> {
  const live = Boolean(import.meta.env.VITE_CSPRCLICK_APP_ID);
  void [DUSDC_TOKEN, QUID_POOL, MAX_ALLOWANCE]; // used by the live signer documented above
  if (!live) return { ok: true, mock: true };
  // Real CSPR.click approve-deploy signature lands here when live (see INTEGRATIONS.md).
  return { ok: true, mock: false };
}

/**
 * Bank connect via Plaid Link. Fetches a link token from the backend; if Plaid is
 * configured the real Link flow opens and we exchange the public token, otherwise
 * connect() just advances (demo). onDone fires when the step is complete either way.
 */
export function usePlaidConnect(onDone: () => void) {
  const [token, setToken] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    post<{ link_token: string | null }>("/plaid/link-token", { userId: "demo" })
      .then((r) => {
        if (cancelled) return;
        if (r.link_token) {
          setToken(r.link_token);
          setLive(true);
        }
      })
      .catch(() => {
        /* backend down / no keys -> stay in mock mode */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { open, ready } = usePlaidLink({
    token,
    onSuccess: (publicToken: string) => {
      post<{ access_token?: string }>("/plaid/exchange", {
        public_token: publicToken,
        userId: currentUser()?.id, // persists the bank item on the user's profile
      })
        .then((r) => {
          if (r.access_token) storePlaidToken(r.access_token);
        })
        .catch(() => {})
        .finally(onDone);
    },
  });

  const connect = () => {
    if (live && ready) open();
    else onDone();
  };

  return { connect, live };
}

/**
 * Stripe Checkout for the chosen tier (the $50 paywall). In live mode the backend
 * returns a Checkout URL and we redirect; in mock mode it returns null and the
 * caller simply proceeds.
 */
export async function startCheckout(tier: string): Promise<void> {
  try {
    const r = await post<{ url: string | null }>("/stripe/checkout", { tier });
    if (r.url) {
      window.location.href = r.url; // returns to /?checkout=success on completion
    }
  } catch {
    /* Stripe not configured -> stay in-app and let the caller continue */
  }
}
