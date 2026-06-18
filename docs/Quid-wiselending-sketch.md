# Quid × WiseLending - liquidity & yield integration sketch

**Status: design sketch (post-MVP).** The MVP runs on a single seeded pool
(`fund_pool`, already implemented + tested). WiseLending is the yield/liquidity
layer that makes idle float productive. This doc is the integration plan, not yet
built - it needs WiseLending's Testnet contract address + entrypoint ABI to wire.

## The split: Quid = credit, WiseLending = yield

- **QuidPool keeps the credit risk.** The income-based advance is *uncollateralized*
  - secured only by verified pending wages. WiseLending is *collateralized* lending
  and cannot underwrite that. So the underwriting, the reputation, and the default
  risk stay entirely in QuidPool.
- **WiseLending earns on idle float.** Between advances, pooled stablecoin sits idle.
  Parking it in WiseLending earns variable APY; Quid withdraws on demand to fund a new
  advance. Per the economics in the brief, an advance is outstanding ~5 days, so most
  of the pool is idle most of the time - that's the float WiseLending should be earning on.

## Liquidity model

Split pool liquidity into two parts:

```
total liquidity = instant_buffer (in QuidPool)  +  yield_position (supplied to WiseLending)
```

- **instant_buffer**: enough stablecoin in QuidPool to cover expected near-term advances
  without a WiseLending round-trip (keeps `issue_advance` a single, fast tx).
- **yield_position**: the excess, supplied to WiseLending earning APY.

Rebalance rule (agent-driven, off-chain): keep `instant_buffer` between a low and high
watermark. When repayments push it above the high watermark, supply the excess to
WiseLending; when advances pull it below the low watermark, withdraw from WiseLending.

## On-chain surface (additions to QuidPool)

Add an external interface for the WiseLending market and two admin-only entrypoints:

```rust
// The WiseLending market contract (supply/withdraw the stablecoin). Confirm the
// real entrypoint names + args against WiseLending's deployed ABI.
#[odra::external_contract]
pub trait WiseMarket {
    fn supply(&mut self, amount: U256);
    fn withdraw(&mut self, amount: U256);
    fn balance_of_underlying(&self, account: &Address) -> U256;
}

// In QuidPool (admin-only):
pub fn deposit_to_yield(&mut self, amount: U256);   // buffer -> WiseLending
pub fn withdraw_from_yield(&mut self, amount: U256); // WiseLending -> buffer
pub fn total_liquidity(&self) -> U256;               // buffer + yield position
```

`deposit_to_yield` would `approve` the WiseLending market on the CEP-18 token, call
`supply`, and track the supplied amount; `withdraw_from_yield` calls `withdraw` and
returns funds to the buffer. `issue_advance` can optionally auto-withdraw from yield if
the buffer is short, so an advance never blocks on liquidity.

## Accounting

- `pool_balance` (existing) tracks the **buffer** held directly by QuidPool.
- Add `yield_supplied: Var<U256>` to track principal supplied to WiseLending.
- `total_liquidity()` = `pool_balance + yield_supplied` (interest accrues on top and is
  realized on withdraw; it's margin that funds the subscription/lender APY).

## What's needed to build it

1. WiseLending's **Testnet market contract address** for the chosen stablecoin (dUSDC / csprUSD).
2. Its **entrypoint ABI** (exact names/args for supply, withdraw, and the underlying-balance read).
3. Decide buffer watermarks (e.g. cover the 95th-percentile daily advance volume).
4. Wire the agent's rebalance loop (a periodic tick alongside the advance loop) to keep the
   buffer in band and sweep idle float into yield.

## MVP stance

For the buildathon, seed a single pool with `fund_pool` and demo the advance/repay loop.
Name WiseLending in the demo as the yield/liquidity backbone (per the script) and point to
this sketch as the integration path. Building the live WiseLending wiring is a strong
final-round addition once the market ABI is in hand.
