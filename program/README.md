# QuidPool on Solana (Anchor)

The Solana port of Quid's on-chain credit layer: a 1:1 translation of the Odra
`QuidPool` contract in [`../contracts/src/lib.rs`](../contracts/src/lib.rs).
The agent decides *whether* and *how much* to advance off-chain; this program
holds the pool, moves the stablecoin, and keeps each borrower's Quid score.

| Odra (Casper) | Anchor (Solana) |
|---|---|
| `init(token)` | `initialize_pool` (mint account) |
| `fund_pool(amount)` | `fund_pool(amount)` |
| `issue_advance(borrower, amount, due_date)` | `issue_advance(borrower, amount, due_date)` |
| `repay_advance(id)` | `repay_advance(advance_id)` |
| `reputation_of(borrower)` | read the `Reputation` PDA (`["reputation", borrower]`, absent = 0) |
| `admin`, `token`, `pool_balance`, `next_id` | `Pool` PDA (`["pool"]`) |
| `advances: Mapping<u64, Advance>` | `Advance` PDA per id (`["advance", id as u64 LE]`) |
| contract's CEP-18 balance | `vault` token account (`["vault"]`, authority = pool PDA) |
| CEP-18 `approve` + `transfer_from` | SPL `approve` (pool PDA as delegate) + delegated `transfer_checked` |
| CES events | Anchor events `AdvanceIssued`, `AdvanceRepaid` |
| `NotAdmin`, `InsufficientPool`, `AlreadyRepaid` | same names (`QuidError`) |

## Build and test

Needs the Solana CLI (Agave) and Anchor CLI 1.2.

```bash
npm install
anchor build
npm test        # anchor test --validator legacy: local validator, deploy, 9 tests
```

The tests cover fund -> issue -> repay -> score bump (and a second advance to
score 2), event payloads, and the guard paths: an advance over the pool's
liquidity is declined (`InsufficientPool`), non-agent signers are rejected
(`NotAdmin`), repayment can't be pulled before the borrower approves, and an
advance can't be settled twice (`AlreadyRepaid`).

## Deploy to devnet

```bash
solana-keygen new -o keys/agent.json          # the agent: upgrade authority + pool admin
solana config set --url devnet --keypair keys/agent.json
# fund it with ~3 SOL (https://faucet.solana.com), then:
anchor build
npm run deploy:devnet
npm run idl:sync                              # copy the IDL + types into agent/src/idl
```

`target/deploy/quid_pool-keypair.json` is the program's address; it must match
`declare_id!` in `programs/quid_pool/src/lib.rs` and `Anchor.toml` (`anchor keys sync`).
`keys/` and `target/` are gitignored.

## Seed + run the lifecycle

From `agent/`, with `QUID_SOLANA_PROGRAM_ID` set in `.env`:

```bash
npm run demo:solana
```

First run: creates a mock dUSDC mint (agent is mint authority), calls
`initialize_pool`, and seeds the pool to $10,000. Every run: `issue_advance`
($180 to a borrower wallet), borrower `approve`, `repay_advance`, and checks the
Quid score went up by one. Each transaction is printed with a Solana Explorer link.
