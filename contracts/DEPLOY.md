# Deploying QuidPool to Casper Testnet

The contract builds, tests, and produces a wasm locally with **no credentials**. The
only step that needs your keys is the actual on-chain deploy. This is that step.

## What you need first

1. **A funded Casper Testnet account.** The repo's funded agent keypair lives at
   `agent/keys/`:
   - `agent/keys/secret_key.pem` — the signer (pool admin = the agent's wallet)
   - public key `019884e5b44325f7a75468129ccc4adbbdf1171ace5a64c2cd82fa99b69209aced`
     (funded with 1000 CSPR from the Testnet faucet)
2. **A CEP-18 stablecoin address on Testnet** (the `hash-…` of the token the pool
   lends in). Use an existing dUSDC / csprUSD token, or deploy your own test CEP-18
   with the included bin — see "Deploy a test stablecoin" below.

## 1. Build the wasm

```bash
cd contracts
cargo odra build          # -> wasm/QuidPool.wasm
```

## 2. Deploy

The deploy uses Odra's livenet env, which packages the install args (including the
constructor's `token` address) correctly. It's behind the `livenet` feature so it
never touches the normal wasm build.

```bash
cd contracts
ODRA_CASPER_LIVENET_NODE_ADDRESS=https://node.testnet.casper.network \
ODRA_CASPER_LIVENET_EVENTS_URL=https://node.testnet.casper.network/events \
ODRA_CASPER_LIVENET_CHAIN_NAME=casper-test \
ODRA_CASPER_LIVENET_SECRET_KEY_PATH=../agent/keys/secret_key.pem \
QUID_STABLECOIN_ADDRESS=hash-<your-cep18-token> \
cargo run --release --features livenet --bin quid_contracts_livenet
```

It prints:

```
QuidPool deployed at: hash-xxxxxxxx…
```

## 3. Wire the agent

Put the printed hash into `agent/.env`:

```
QUID_CONTRACT_HASH=hash-xxxxxxxx…
QUID_STABLECOIN_ADDRESS=hash-yyyyyyyy…        # from the cep18 deploy below
CASPER_NODE_URL=https://node.testnet.casper.network/rpc
AGENT_SECRET_KEY_PATH=./keys/secret_key.pem   # same key = the admin/agent
```

Setting `QUID_CONTRACT_HASH` flips the agent out of SIM into live mode.

## 4. Seed the pool

The pool starts empty. Fund it with the stablecoin (team-seeded for the MVP):

```bash
cd ../agent
npm run seed            # approve + fund_pool, $10,000 (or: npm run seed -- 25000)
```

It approves QuidPool as a spender on the CEP-18 token, waits for finality, then calls
`fund_pool` and prints the cspr.live link. After this, `pool_balance()` reflects the
seeded liquidity and the agent can issue advances.

## Notes

- **Admin = deployer.** Whoever deploys becomes the only caller allowed to issue/repay.
  Use the agent's own keypair so the agent can act autonomously.
- **Gas.** `bin/livenet.rs` sets a 300 CSPR install ceiling. If a deploy is rejected for
  insufficient payment, raise `env.set_gas(...)` to the current network cost.
- **Verify on-chain.** Every `issue_advance` / `repay_advance` is a real deploy; confirm
  the deploy hashes on cspr.live Testnet (this is the buildathon's transaction-producing
  requirement).

### Deploy a test stablecoin (optional)

If you don't have a Testnet CEP-18 to point at, deploy Odra's `Cep18` with the included
bin (`bin/livenet_cep18.rs` — 1,000,000 dUSDC, 6 decimals, supply minted to the deployer):

```bash
cd contracts
ODRA_CASPER_LIVENET_NODE_ADDRESS=https://node.testnet.casper.network \
ODRA_CASPER_LIVENET_EVENTS_URL=https://node.testnet.casper.network/events \
ODRA_CASPER_LIVENET_CHAIN_NAME=casper-test \
ODRA_CASPER_LIVENET_SECRET_KEY_PATH=../agent/keys/secret_key.pem \
cargo run --release --features livenet --bin quid_contracts_livenet_cep18
```

Use the printed address as `QUID_STABLECOIN_ADDRESS` (deploy step above and agent/.env).
The deployer holds the initial supply, so it can immediately `approve` + `fund_pool`
(`npm run seed` does both).
