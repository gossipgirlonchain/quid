// On-chain activity for the app: reads the QuidPool's CES events straight from
// a Casper node over raw JSON-RPC (no SDK, works in serverless + the dev server).
// Layout verified against the deployed Testnet contract: each __events dictionary
// item is a CLValue List<U8> = [u32 len][u32 nameLen]["event_…"][fields LE].

const NODE = (process.env.CASPER_NODE_URL ?? "https://node.testnet.casper.network/rpc").replace(/\/$/, "");
const PKG = process.env.QUID_CONTRACT_HASH ?? "hash-ccdd94c7cf3b559906616f97c0d6624d97969ff5ca5cad7c8e749159ccd4ce34";
const DECIMALS = 1e6;
const MAX_EVENTS = 40;

export interface PoolEvent {
  /** Position in the contract's event log (chronological). */
  index: number;
  kind: "issued" | "repaid";
  /** Advance id. */
  id: number;
  amountUsd?: number;
  newReputation?: number;
}

export const contractPackageHex = PKG.replace(/^hash-/, "");
export const contractExplorerUrl = `https://testnet.cspr.live/contract-package/${contractPackageHex}`;

async function rpc<T>(method: string, params: unknown): Promise<T> {
  const res = await fetch(NODE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = (await res.json()) as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(`${method}: ${json.error.message}`);
  return json.result as T;
}

interface NamedKey { name: string; key: string }

let urefs: { at: number; seed: string; len: string } | null = null;

/** Package -> current contract -> __events / __events_length urefs (cached 5 min). */
async function eventUrefs(): Promise<{ seed: string; len: string }> {
  if (urefs && Date.now() - urefs.at < 300_000) return urefs;
  const pkg = await rpc<{ stored_value: { ContractPackage: { versions: { contract_hash: string }[] } } }>(
    "query_global_state",
    { key: PKG },
  );
  const versions = pkg.stored_value.ContractPackage.versions;
  const contractHash = versions[versions.length - 1].contract_hash.replace(/^contract-/, "hash-");
  const c = await rpc<{ stored_value: { Contract: { named_keys: NamedKey[] } } }>("query_global_state", {
    key: contractHash,
  });
  const nk = c.stored_value.Contract.named_keys;
  const seed = nk.find((k) => k.name === "__events")?.key;
  const len = nk.find((k) => k.name === "__events_length")?.key;
  if (!seed || !len) throw new Error("CES named keys not found on contract");
  urefs = { at: Date.now(), seed, len };
  return urefs;
}

function decodeEvent(hex: string, index: number): PoolEvent | null {
  const b = Buffer.from(hex, "hex");
  let o = 4; // skip List<U8> length prefix
  const nameLen = b.readUInt32LE(o);
  o += 4;
  const name = b.toString("utf8", o, o + nameLen);
  o += nameLen;
  const id = Number(b.readBigUInt64LE(o));
  o += 8;
  o += 33; // borrower Key (tag + account hash)
  if (name === "event_AdvanceIssued") {
    const amtLen = b[o];
    o += 1;
    let amt = 0n;
    for (let i = amtLen - 1; i >= 0; i--) amt = (amt << 8n) | BigInt(b[o + i]);
    return { index, kind: "issued", id, amountUsd: Number(amt) / DECIMALS };
  }
  if (name === "event_AdvanceRepaid") {
    return { index, kind: "repaid", id, newReputation: b.readUInt32LE(o) };
  }
  return null;
}

let cache: { at: number; events: PoolEvent[] } | null = null;

/** All pool events, oldest first; repaid rows enriched with the issued amount. Cached 15s. */
export async function fetchPoolEvents(): Promise<PoolEvent[]> {
  if (cache && Date.now() - cache.at < 15_000) return cache.events;
  const { seed, len } = await eventUrefs();
  const lenRes = await rpc<{ stored_value: { CLValue: { parsed: number } } }>("query_global_state", { key: len });
  const total = lenRes.stored_value.CLValue.parsed;
  const srh = (await rpc<{ state_root_hash: string }>("chain_get_state_root_hash", {})).state_root_hash;

  const from = Math.max(0, total - MAX_EVENTS);
  const items = await Promise.all(
    Array.from({ length: total - from }, (_, i) =>
      rpc<{ stored_value: { CLValue: { bytes: string } } }>("state_get_dictionary_item", {
        state_root_hash: srh,
        dictionary_identifier: { URef: { seed_uref: seed, dictionary_item_key: String(from + i) } },
      }).then((r) => decodeEvent(r.stored_value.CLValue.bytes, from + i)),
    ),
  );

  const events = items.filter((e): e is PoolEvent => e !== null);
  const issuedAmounts = new Map(events.filter((e) => e.kind === "issued").map((e) => [e.id, e.amountUsd]));
  for (const e of events) {
    if (e.kind === "repaid" && e.amountUsd === undefined) e.amountUsd = issuedAmounts.get(e.id);
  }
  cache = { at: Date.now(), events };
  return events;
}
