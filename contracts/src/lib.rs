#![cfg_attr(not(test), no_std)]
#![cfg_attr(not(test), no_main)]

//! Quid advance pool + reputation contract (Odra / Casper).
//!
//! Responsibilities (the on-chain "credit layer"):
//!   - hold the lender pool balance (an external CEP-18 stablecoin)
//!   - issue an advance to a borrower (called by the agent)
//!   - record repayment and bump the borrower's reputation
//!   - expose reputation for off-chain pricing
//!
//! Off-chain (the agent) owns: income verification, risk scoring, rules,
//! and the decision of *whether* and *how much* to advance. This contract
//! trusts the agent (admin) to call issue_advance with a vetted amount.
//!
//! Stablecoin: the pool holds an external CEP-18 token (dUSDC / csprUSD), whose
//! address is set at init. `fund_pool` / `repay_advance` pull tokens via
//! `transfer_from` (the funder / borrower pre-approve the pool as spender);
//! `issue_advance` pushes via `transfer`. `pool_balance` mirrors the contract's
//! token holdings so on-chain liquidity checks stay cheap.

extern crate alloc;

use odra::casper_types::U256;
use odra::prelude::*;
use odra::ContractRef;
use odra_modules::cep18_token::Cep18ContractRef;

/// One advance against a borrower's verified future income.
#[odra::odra_type]
pub struct Advance {
    pub borrower: Address,
    pub amount: U256,
    pub due_date: u64, // expected income date (unix seconds)
    pub repaid: bool,
}

#[odra::odra_error]
pub enum Error {
    NotAdmin = 1,
    InsufficientPool = 2,
    UnknownAdvance = 3,
    AlreadyRepaid = 4,
    TokenNotSet = 5,
}

#[odra::event]
pub struct AdvanceIssued {
    pub id: u64,
    pub borrower: Address,
    pub amount: U256,
}

#[odra::event]
pub struct AdvanceRepaid {
    pub id: u64,
    pub borrower: Address,
    pub new_reputation: u32,
}

#[odra::module]
pub struct QuidPool {
    /// The agent's address. Only it may issue/settle advances.
    admin: Var<Address>,
    /// The CEP-18 stablecoin the pool lends in.
    token: Var<Address>,
    /// Internal accounting of pooled liquidity (mirror of the stablecoin held).
    pool_balance: Var<U256>,
    next_id: Var<u64>,
    advances: Mapping<u64, Advance>,
    /// Borrower reputation. Starts implicit at 0, climbs with on-time repayments.
    reputation: Mapping<Address, u32>,
}

#[odra::module]
impl QuidPool {
    /// Deploy. Caller becomes admin (set this to the agent's wallet).
    /// `token` is the CEP-18 stablecoin address the pool lends in.
    pub fn init(&mut self, token: Address) {
        self.admin.set(self.env().caller());
        self.token.set(token);
        self.pool_balance.set(U256::zero());
        self.next_id.set(0);
    }

    /// Supply liquidity to the pool. The funder must first `approve` this
    /// contract as a spender on the stablecoin for at least `amount`.
    pub fn fund_pool(&mut self, amount: U256) {
        let funder = self.env().caller();
        let this = self.env().self_address();
        {
            let mut token = Cep18ContractRef::new(self.env(), self.token_addr());
            token.transfer_from(&funder, &this, &amount);
        }
        let bal = self.pool_balance.get_or_default();
        self.pool_balance.set(bal + amount);
    }

    /// Issue an advance. Agent-only. `amount` has already been risk-checked
    /// off-chain against verified income and the borrower's plan tier.
    pub fn issue_advance(&mut self, borrower: Address, amount: U256, due_date: u64) -> u64 {
        self.only_admin();
        let pool = self.pool_balance.get_or_default();
        if pool < amount {
            self.env().revert(Error::InsufficientPool);
        }

        let id = self.next_id.get_or_default();
        self.next_id.set(id + 1);
        self.pool_balance.set(pool - amount);
        self.advances.set(&id, Advance { borrower, amount, due_date, repaid: false });

        // Push stablecoin from the pool to the borrower.
        {
            let mut token = Cep18ContractRef::new(self.env(), self.token_addr());
            token.transfer(&borrower, &amount);
        }

        self.env().emit_event(AdvanceIssued { id, borrower, amount });
        id
    }

    /// Settle an advance when income lands. Agent-only. Pulls the stablecoin
    /// back from the borrower (who pre-approved the pool), returns it to the
    /// pool, and bumps the borrower's reputation (subscription model: no fee).
    pub fn repay_advance(&mut self, id: u64) {
        self.only_admin();
        let mut adv = self
            .advances
            .get(&id)
            .unwrap_or_revert_with(self, Error::UnknownAdvance);
        if adv.repaid {
            self.env().revert(Error::AlreadyRepaid);
        }

        // Pull the stablecoin back from the borrower into the pool.
        let this = self.env().self_address();
        {
            let mut token = Cep18ContractRef::new(self.env(), self.token_addr());
            token.transfer_from(&adv.borrower, &this, &adv.amount);
        }

        let pool = self.pool_balance.get_or_default();
        self.pool_balance.set(pool + adv.amount);

        adv.repaid = true;
        self.advances.set(&id, adv.clone());

        let rep = self.reputation.get(&adv.borrower).unwrap_or(0) + 1;
        self.reputation.set(&adv.borrower, rep);

        self.env().emit_event(AdvanceRepaid {
            id,
            borrower: adv.borrower,
            new_reputation: rep,
        });
    }

    /// Read a borrower's reputation (count of on-time repayments). Used by the
    /// agent to price the next advance and lift the safe ceiling.
    pub fn reputation_of(&self, borrower: Address) -> u32 {
        self.reputation.get(&borrower).unwrap_or(0)
    }

    pub fn pool_balance(&self) -> U256 {
        self.pool_balance.get_or_default()
    }

    /// The CEP-18 stablecoin address this pool lends in.
    pub fn token(&self) -> Address {
        self.token_addr()
    }

    fn token_addr(&self) -> Address {
        self.token.get().unwrap_or_revert_with(self, Error::TokenNotSet)
    }

    fn only_admin(&self) {
        if self.env().caller() != self.admin.get().unwrap() {
            self.env().revert(Error::NotAdmin);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use odra::host::Deployer;
    use odra_modules::cep18_token::{Cep18, Cep18InitArgs};

    #[test]
    fn issue_and_repay_moves_tokens_and_builds_reputation() {
        let env = odra_test::env();
        let admin = env.get_account(0); // default caller; becomes pool admin
        let borrower = env.get_account(1);

        // A stablecoin whose initial supply mints to the deployer (admin).
        let mut token = Cep18::deploy(
            &env,
            Cep18InitArgs {
                symbol: "dUSDC".to_string(),
                name: "Demo USDC".to_string(),
                decimals: 6,
                initial_supply: U256::from(1_000_000),
            },
        );
        let mut pool = QuidPool::deploy(
            &env,
            QuidPoolInitArgs {
                token: token.address(),
            },
        );
        let pool_addr = pool.address();

        // Fund the pool with 1000: admin approves the pool, then funds.
        token.approve(&pool_addr, &U256::from(1000));
        pool.fund_pool(U256::from(1000));
        assert_eq!(pool.pool_balance(), U256::from(1000));
        assert_eq!(token.balance_of(&pool_addr), U256::from(1000));

        // Issue a 180 advance to the borrower; tokens land in their wallet.
        let id = pool.issue_advance(borrower, U256::from(180), 1_900_000_000);
        assert_eq!(pool.pool_balance(), U256::from(820));
        assert_eq!(token.balance_of(&borrower), U256::from(180));
        assert_eq!(pool.reputation_of(borrower), 0);

        // Repay: borrower approves the pool to pull 180, agent (admin) settles.
        env.set_caller(borrower);
        token.approve(&pool_addr, &U256::from(180));
        env.set_caller(admin);
        pool.repay_advance(id);

        assert_eq!(pool.pool_balance(), U256::from(1000));
        assert_eq!(token.balance_of(&borrower), U256::zero());
        assert_eq!(pool.reputation_of(borrower), 1);
    }
}
