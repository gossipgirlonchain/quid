//! Deploy a test CEP-18 stablecoin (Odra's `Cep18`) to a live Casper network.
//!
//! Use this when you don't have an existing Testnet dUSDC/csprUSD to point the
//! pool at (DEPLOY.md "Deploy a test stablecoin"). The deployer receives the
//! entire initial supply, so the same key can immediately `approve` + `fund_pool`.
//!
//! Run:
//!   ODRA_CASPER_LIVENET_NODE_ADDRESS=https://node.testnet.casper.network \
//!   ODRA_CASPER_LIVENET_EVENTS_URL=https://node.testnet.casper.network/events \
//!   ODRA_CASPER_LIVENET_CHAIN_NAME=casper-test \
//!   ODRA_CASPER_LIVENET_SECRET_KEY_PATH=../agent/keys/secret_key.pem \
//!   cargo run --release --features livenet --bin quid_contracts_livenet_cep18
//!
//! Prints the token address — use it as QUID_STABLECOIN_ADDRESS for the QuidPool
//! deploy (bin/livenet.rs) and in agent/.env.

use odra::casper_types::U256;
use odra::host::Deployer;
use odra::prelude::*;
use odra_modules::cep18_token::{Cep18, Cep18InitArgs};

fn main() {
    let env = odra_casper_livenet_env::env();

    // 1,000,000 dUSDC with 6 decimals — plenty to seed the pool many times over.
    let decimals: u8 = 6;
    let initial_supply = U256::from(1_000_000u64) * U256::from(10u64).pow(U256::from(decimals));

    // CEP-18 install ceiling; raise if Testnet rejects for insufficient payment.
    env.set_gas(300_000_000_000u64);

    let token = Cep18::deploy(
        &env,
        Cep18InitArgs {
            symbol: "dUSDC".to_string(),
            name: "Demo USDC".to_string(),
            decimals,
            initial_supply,
        },
    );
    println!("Test stablecoin (CEP-18) deployed at: {}", token.address().to_string());
    println!("Deployer holds the initial supply: 1,000,000 dUSDC");
}
