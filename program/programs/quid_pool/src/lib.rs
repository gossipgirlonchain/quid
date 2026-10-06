//! Quid advance pool + reputation program (Anchor / Solana).
//!
//! A 1:1 port of the Odra `QuidPool` contract in `contracts/src/lib.rs`
//! (the Casper version). Same responsibilities, the on-chain "credit layer":
//!   - hold the lender pool balance (an SPL stablecoin, mock dUSDC on devnet)
//!   - issue an advance to a borrower (called by the agent)
//!   - record repayment and bump the borrower's reputation (the Quid score)
//!   - expose reputation for off-chain pricing
//!
//! Off-chain (the agent) owns: income verification, risk scoring, rules, and
//! the decision of *whether* and *how much* to advance. This program trusts the
//! agent (admin) to call `issue_advance` with a vetted amount.
//!
//! Odra -> Anchor mapping:
//!   `admin`, `token`, `pool_balance`, `next_id` vars -> the `Pool` PDA
//!   `advances: Mapping<u64, Advance>`              -> one `Advance` PDA per id
//!   `reputation: Mapping<Address, u32>`            -> one `Reputation` PDA per borrower
//!   contract's CEP-18 balance                      -> the `vault` token account (owned by the pool PDA)
//!   CEP-18 `approve` + `transfer_from`             -> SPL `approve` (pool PDA as delegate) + delegated transfer
//!   CES events                                     -> Anchor events (`AdvanceIssued`, `AdvanceRepaid`)

use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

declare_id!("FGDjtQursqioxXpNRnUweoMKeGmFgpVNk1oUjK1RgqHP");

pub const POOL_SEED: &[u8] = b"pool";
pub const VAULT_SEED: &[u8] = b"vault";
pub const ADVANCE_SEED: &[u8] = b"advance";
pub const REPUTATION_SEED: &[u8] = b"reputation";

#[program]
pub mod quid_pool {
    use super::*;

    /// Odra `init`. Caller becomes admin (set this to the agent's wallet).
    /// `mint` is the SPL stablecoin the pool lends in.
    pub fn initialize_pool(ctx: Context<InitializePool>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.admin = ctx.accounts.admin.key();
        pool.mint = ctx.accounts.mint.key();
        pool.vault = ctx.accounts.vault.key();
        pool.pool_balance = 0;
        pool.next_id = 0;
        pool.bump = ctx.bumps.pool;
        Ok(())
    }

    /// Supply liquidity to the pool. Anyone may fund; the funder signs the
    /// transfer directly (Solana's equivalent of approve + transfer_from).
    pub fn fund_pool(ctx: Context<FundPool>, amount: u64) -> Result<()> {
        let accts = &ctx.accounts;
        token::transfer_checked(
            CpiContext::new(
                accts.token_program.key(),
                TransferChecked {
                    from: accts.funder_token.to_account_info(),
                    mint: accts.mint.to_account_info(),
                    to: accts.vault.to_account_info(),
                    authority: accts.funder.to_account_info(),
                },
            ),
            amount,
            accts.mint.decimals,
        )?;

        let pool = &mut ctx.accounts.pool;
        pool.pool_balance = pool
            .pool_balance
            .checked_add(amount)
            .ok_or(QuidError::Overflow)?;
        Ok(())
    }

    /// Issue an advance. Agent-only. `amount` has already been risk-checked
    /// off-chain against verified income and the borrower's plan tier.
    pub fn issue_advance(
        ctx: Context<IssueAdvance>,
        borrower: Pubkey,
        amount: u64,
        due_date: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require!(pool.pool_balance >= amount, QuidError::InsufficientPool);

        let id = pool.next_id;
        pool.next_id = id.checked_add(1).ok_or(QuidError::Overflow)?;
        pool.pool_balance -= amount;

        ctx.accounts.advance.set_inner(Advance {
            id,
            borrower,
            amount,
            due_date,
            repaid: false,
            bump: ctx.bumps.advance,
        });

        // Push stablecoin from the pool vault to the borrower.
        let accts = &ctx.accounts;
        let signer: &[&[&[u8]]] = &[&[POOL_SEED, &[accts.pool.bump]]];
        token::transfer_checked(
            CpiContext::new_with_signer(
                accts.token_program.key(),
                TransferChecked {
                    from: accts.vault.to_account_info(),
                    mint: accts.mint.to_account_info(),
                    to: accts.borrower_token.to_account_info(),
                    authority: accts.pool.to_account_info(),
                },
                signer,
            ),
            amount,
            accts.mint.decimals,
        )?;

        emit!(AdvanceIssued { id, borrower, amount });
        Ok(())
    }

    /// Settle an advance when income lands. Agent-only. Pulls the stablecoin
    /// back from the borrower (who approved the pool PDA as delegate), returns
    /// it to the pool, and bumps the borrower's reputation (no fee).
    pub fn repay_advance(ctx: Context<RepayAdvance>, advance_id: u64) -> Result<()> {
        let adv = &ctx.accounts.advance;
        require!(!adv.repaid, QuidError::AlreadyRepaid);
        let (borrower, amount) = (adv.borrower, adv.amount);

        // Pull the stablecoin back from the borrower into the pool.
        let accts = &ctx.accounts;
        let signer: &[&[&[u8]]] = &[&[POOL_SEED, &[accts.pool.bump]]];
        token::transfer_checked(
            CpiContext::new_with_signer(
                accts.token_program.key(),
                TransferChecked {
                    from: accts.borrower_token.to_account_info(),
                    mint: accts.mint.to_account_info(),
                    to: accts.vault.to_account_info(),
                    authority: accts.pool.to_account_info(),
                },
                signer,
            ),
            amount,
            accts.mint.decimals,
        )?;

        let pool = &mut ctx.accounts.pool;
        pool.pool_balance = pool
            .pool_balance
            .checked_add(amount)
            .ok_or(QuidError::Overflow)?;

        ctx.accounts.advance.repaid = true;

        let rep = &mut ctx.accounts.reputation;
        rep.borrower = borrower;
        rep.score = rep.score.checked_add(1).ok_or(QuidError::Overflow)?;
        rep.bump = ctx.bumps.reputation;

        emit!(AdvanceRepaid {
            id: advance_id,
            borrower,
            new_reputation: rep.score,
        });
        Ok(())
    }
}

// ---------------------------------------------------------------- state

#[account]
#[derive(InitSpace)]
pub struct Pool {
    /// The agent's wallet. Only it may issue/settle advances.
    pub admin: Pubkey,
    /// The SPL stablecoin the pool lends in.
    pub mint: Pubkey,
    /// Token account holding the pooled stablecoin (authority: this PDA).
    pub vault: Pubkey,
    /// Internal accounting of pooled liquidity (mirror of the vault balance).
    pub pool_balance: u64,
    pub next_id: u64,
    pub bump: u8,
}

/// One advance against a borrower's verified future income.
#[account]
#[derive(InitSpace)]
pub struct Advance {
    pub id: u64,
    pub borrower: Pubkey,
    pub amount: u64,
    /// Expected income date (unix seconds).
    pub due_date: u64,
    pub repaid: bool,
    pub bump: u8,
}

/// Borrower reputation (the Quid score): count of repaid advances. A borrower
/// with no account yet reads as 0, like Odra's `unwrap_or(0)`.
#[account]
#[derive(InitSpace)]
pub struct Reputation {
    pub borrower: Pubkey,
    pub score: u32,
    pub bump: u8,
}

// ---------------------------------------------------------------- accounts

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = admin,
        space = 8 + Pool::INIT_SPACE,
        seeds = [POOL_SEED],
        bump,
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        init,
        payer = admin,
        seeds = [VAULT_SEED],
        bump,
        token::mint = mint,
        token::authority = pool,
    )]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundPool<'info> {
    pub funder: Signer<'info>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = funder,
    )]
    pub funder_token: Account<'info, TokenAccount>,
    #[account(mut, seeds = [POOL_SEED], bump = pool.bump, has_one = mint, has_one = vault)]
    pub pool: Account<'info, Pool>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(borrower: Pubkey)]
pub struct IssueAdvance<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [POOL_SEED],
        bump = pool.bump,
        has_one = admin @ QuidError::NotAdmin,
        has_one = mint,
        has_one = vault,
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        init,
        payer = admin,
        space = 8 + Advance::INIT_SPACE,
        seeds = [ADVANCE_SEED, &pool.next_id.to_le_bytes()],
        bump,
    )]
    pub advance: Account<'info, Advance>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    /// CHECK: only used as the owner of the borrower's token account; its key is
    /// pinned to the `borrower` instruction argument.
    #[account(address = borrower)]
    pub borrower_wallet: UncheckedAccount<'info>,
    /// The borrower's stablecoin account; created on their first advance.
    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = borrower_wallet,
    )]
    pub borrower_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(advance_id: u64)]
pub struct RepayAdvance<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [POOL_SEED],
        bump = pool.bump,
        has_one = admin @ QuidError::NotAdmin,
        has_one = mint,
        has_one = vault,
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        mut,
        seeds = [ADVANCE_SEED, &advance_id.to_le_bytes()],
        bump = advance.bump,
    )]
    pub advance: Account<'info, Advance>,
    #[account(
        init_if_needed,
        payer = admin,
        space = 8 + Reputation::INIT_SPACE,
        seeds = [REPUTATION_SEED, advance.borrower.as_ref()],
        bump,
    )]
    pub reputation: Account<'info, Reputation>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    /// The borrower's stablecoin account, which has approved the pool PDA as delegate.
    #[account(
        mut,
        token::mint = mint,
        token::authority = advance.borrower,
    )]
    pub borrower_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// ---------------------------------------------------------------- events + errors

#[event]
pub struct AdvanceIssued {
    pub id: u64,
    pub borrower: Pubkey,
    pub amount: u64,
}

#[event]
pub struct AdvanceRepaid {
    pub id: u64,
    pub borrower: Pubkey,
    pub new_reputation: u32,
}

/// Odra's `UnknownAdvance` and `TokenNotSet` have no variant here: a missing
/// advance PDA fails account validation, and the mint is fixed at init.
#[error_code]
pub enum QuidError {
    #[msg("Only the pool admin (the agent) may do this")]
    NotAdmin,
    #[msg("Pool has insufficient liquidity for this advance")]
    InsufficientPool,
    #[msg("Advance is already repaid")]
    AlreadyRepaid,
    #[msg("Arithmetic overflow")]
    Overflow,
}
