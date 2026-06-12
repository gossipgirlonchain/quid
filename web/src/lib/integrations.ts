import { useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { post, storePlaidToken } from "./api";

/**
 * Auth via CSPR.click (social login + silent self-custodial Casper wallet).
 *
 * LIVE: set VITE_CSPRCLICK_APP_ID (from console.cspr.build) and wire the real
 * ClickProvider — see web/INTEGRATIONS.md. login() then opens CSPR.click, which
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
      post<{ access_token?: string }>("/plaid/exchange", { public_token: publicToken })
        .then((r) => {
          if (r.access_token) storePlaidToken(r.access_token); // feeds the Activity screen
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
