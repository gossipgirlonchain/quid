// x402: the agent pays per request to verify income / pull a risk signal.
// Flow: call a paid endpoint, get HTTP 402 + price, sign an authorization,
// retry with the payment header, get the data back.
//
// This is also where Quid can EARN: expose its own x402-gated endpoints
// (reputation oracle, risk score) that other agents pay to call.

import axios from "axios";

/**
 * Call an x402-protected endpoint, paying if challenged.
 * TODO: wire the real x402 client / Casper facilitator. The shape below
 * mirrors the standard 402 handshake. See https://www.casper.network/ai
 */
export async function payAndFetch<T>(url: string, body: unknown): Promise<T> {
  try {
    const res = await axios.post<T>(url, body);
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 402) {
      const { price, payTo, nonce } = err.response.data ?? {};
      const paymentHeader = await signX402Payment({ price, payTo, nonce });
      const paid = await axios.post<T>(url, body, {
        headers: { "X-PAYMENT": paymentHeader },
      });
      return paid.data;
    }
    throw err;
  }
}

/**
 * Verify a user's pending income via a paid endpoint.
 * Returns a confidence/verification result the decision layer can use.
 */
export async function verifyIncome(userId: string): Promise<{ verified: boolean; confidence: number }> {
  const url = process.env.VERIFY_ENDPOINT_URL;
  if (!url) return { verified: true, confidence: 0.9 }; // stub for local dev
  return payAndFetch(url, { userId });
}

async function signX402Payment(_challenge: unknown): Promise<string> {
  // TODO: sign the payment authorization with the agent's Casper key and
  // submit through the x402 facilitator. Return the X-PAYMENT header value.
  return "stub-payment-authorization";
}
