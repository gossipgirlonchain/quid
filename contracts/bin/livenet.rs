//! Deploy QuidPool to a live Casper network (e.g. Testnet) via Odra's livenet env.
//!
//! Built only with the `livenet` feature (host-only; never part of the wasm).
//!
//! Prereqs: a funded Casper account + its secret key (.pem), and the address of
//! the CEP-18 stablecoin the pool lends in (dUSDC / csprUSD, or your own test
//! token). See DEPLOY.md for the full walkthrough.
//!
//! Run:
//!   ODRA_CASPER_LIVENET_NODE_ADDRESS=https://node.testnet.casper.network \
//!   ODRA_CASPER_LIVENET_EVENTS_URL=https://node.testnet.casper.network/events \
//!   ODRA_CASPER_LIVENET_CHAIN_NAME=casper-test \
//!   ODRA_CASPER_LIVENET_SECRET_KEY_PATH=../agent/keys/secret_key.pem \
//!   QUID_STABLECOIN_ADDRESS=hash-... \
//!   cargo run --release --features livenet --bin quid_contracts_livenet
//!
//! On success it prints the deployed QuidPool address — put it in agent/.env as
//! QUID_CONTRACT_HASH. The deploying key becomes the pool admin (the agent wallet).

use odra::host::Deployer;
use odra::prelude::*;
use quid_contracts::{QuidPool, QuidPoolInitArgs};

fn main() {
    let env = odra_casper_livenet_env::env();

    let token_str = std::env::var("QUID_STABLECOIN_ADDRESS")
        .expect("set QUID_STABLECOIN_ADDRESS to the CEP-18 token address (hash-...)");
    let token: Address = token_str
        .parse()
        .expect("QUID_STABLECOIN_ADDRESS must be a valid Casper address (hash-...)");

    // Install cost. 300 CSPR is a safe ceiling for a contract this size on Testnet;
    // tune to the current network cost if a deploy is rejected for insufficient payment.
    env.set_gas(300_000_000_000u64);

    let pool = QuidPool::deploy(&env, QuidPoolInitArgs { token });
    println!("QuidPool deployed at: {}", pool.address().to_string());
}
