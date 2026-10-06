// QuidPool (Solana) tests. Mirrors the Odra test in contracts/src/lib.rs
// (fund -> issue -> repay -> reputation) and adds the decline / guard paths.
//
//   anchor test      # spins a local validator, deploys, runs this file

import * as anchor from "@anchor-lang/core";
import { BN, Program, AnchorError, EventParser } from "@anchor-lang/core";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  approve,
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { expect } from "chai";
import type { QuidPool } from "../target/types/quid_pool";

const DECIMALS = 6;
const usd = (n: number) => new BN(n * 10 ** DECIMALS);

describe("quid_pool", () => {
  // `confirmed` rather than the default `processed`: avoids blockhash races on a fresh validator.
  const env = anchor.AnchorProvider.env();
  const provider = new anchor.AnchorProvider(new Connection(env.connection.rpcEndpoint, "confirmed"), env.wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  anchor.setProvider(provider);
  const program = anchor.workspace.QuidPool as Program<QuidPool>;
  const conn = provider.connection;
  const admin = (provider.wallet as anchor.Wallet).payer; // the agent
  const borrower = Keypair.generate();

  const [pool] = PublicKey.findProgramAddressSync([Buffer.from("pool")], program.programId);
  const [vault] = PublicKey.findProgramAddressSync([Buffer.from("vault")], program.programId);
  const advancePda = (id: number) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("advance"), new BN(id).toArrayLike(Buffer, "le", 8)],
      program.programId,
    )[0];
  const reputationPda = (who: PublicKey) =>
    PublicKey.findProgramAddressSync([Buffer.from("reputation"), who.toBuffer()], program.programId)[0];

  let mint: PublicKey;
  let borrowerToken: PublicKey;
  const dueDate = new BN(1_900_000_000);

  async function reputationOf(who: PublicKey): Promise<number> {
    const acct = await program.account.reputation.fetchNullable(reputationPda(who));
    return acct ? acct.score : 0;
  }
  async function tokenBalance(addr: PublicKey): Promise<bigint> {
    return (await getAccount(conn, addr)).amount;
  }
  async function events(sig: string) {
    const tx = await conn.getTransaction(sig, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
    const parser = new EventParser(program.programId, program.coder);
    return [...parser.parseLogs(tx?.meta?.logMessages ?? [])];
  }
  async function expectAnchorError(p: Promise<unknown>, code: string) {
    try {
      await p;
    } catch (e) {
      expect(e).to.be.instanceOf(AnchorError);
      expect((e as AnchorError).error.errorCode.code).to.equal(code);
      return;
    }
    expect.fail(`expected ${code}`);
  }
  async function airdrop(to: PublicKey, sol: number) {
    const sig = await conn.requestAirdrop(to, sol * LAMPORTS_PER_SOL);
    await conn.confirmTransaction({ signature: sig, ...(await conn.getLatestBlockhash()) });
  }

  before(async () => {
    // A mock dUSDC; supply mints to the admin (like the Odra test's Cep18 deploy).
    mint = await createMint(conn, admin, admin.publicKey, null, DECIMALS);
    const adminAta = await getOrCreateAssociatedTokenAccount(conn, admin, mint, admin.publicKey);
    await mintTo(conn, admin, mint, adminAta.address, admin, BigInt(usd(1_000_000).toString()));
    borrowerToken = getAssociatedTokenAddressSync(mint, borrower.publicKey);
  });

  it("initializes the pool with the agent as admin", async () => {
    await program.methods.initializePool().accountsPartial({ admin: admin.publicKey, mint }).rpc();
    const p = await program.account.pool.fetch(pool);
    expect(p.admin.toBase58()).to.equal(admin.publicKey.toBase58());
    expect(p.mint.toBase58()).to.equal(mint.toBase58());
    expect(p.vault.toBase58()).to.equal(vault.toBase58());
    expect(p.poolBalance.toNumber()).to.equal(0);
    expect(p.nextId.toNumber()).to.equal(0);
  });

  it("funds the pool", async () => {
    const funderToken = getAssociatedTokenAddressSync(mint, admin.publicKey);
    await program.methods.fundPool(usd(1000)).accountsPartial({ funder: admin.publicKey, funderToken, mint }).rpc();
    expect((await program.account.pool.fetch(pool)).poolBalance.toString()).to.equal(usd(1000).toString());
    expect((await tokenBalance(vault)).toString()).to.equal(usd(1000).toString());
  });

  it("issues an advance: stablecoin lands with the borrower, AdvanceIssued is emitted", async () => {
    const sig = await program.methods
      .issueAdvance(borrower.publicKey, usd(180), dueDate)
      .accountsPartial({ advance: advancePda(0), borrowerWallet: borrower.publicKey, mint })
      .rpc({ commitment: "confirmed" });

    expect((await program.account.pool.fetch(pool)).poolBalance.toString()).to.equal(usd(820).toString());
    expect((await tokenBalance(borrowerToken)).toString()).to.equal(usd(180).toString());
    expect(await reputationOf(borrower.publicKey)).to.equal(0);

    const adv = await program.account.advance.fetch(advancePda(0));
    expect(adv.id.toNumber()).to.equal(0);
    expect(adv.borrower.toBase58()).to.equal(borrower.publicKey.toBase58());
    expect(adv.amount.toString()).to.equal(usd(180).toString());
    expect(adv.dueDate.toString()).to.equal(dueDate.toString());
    expect(adv.repaid).to.equal(false);

    const [ev] = await events(sig);
    expect(ev.name).to.equal("advanceIssued");
    expect(ev.data.id.toString()).to.equal("0");
    expect((ev.data.borrower as PublicKey).toBase58()).to.equal(borrower.publicKey.toBase58());
    expect(ev.data.amount.toString()).to.equal(usd(180).toString());
  });

  it("declines an advance that exceeds the pool's liquidity (InsufficientPool)", async () => {
    await expectAnchorError(
      program.methods
        .issueAdvance(borrower.publicKey, usd(10_000), dueDate)
        .accountsPartial({ advance: advancePda(1), borrowerWallet: borrower.publicKey, mint })
        .rpc(),
      "InsufficientPool",
    );
    const p = await program.account.pool.fetch(pool);
    expect(p.poolBalance.toString()).to.equal(usd(820).toString());
    expect(p.nextId.toNumber()).to.equal(1); // no id consumed
    expect(await program.account.advance.fetchNullable(advancePda(1))).to.equal(null);
  });

  it("rejects issue / repay from anyone but the agent (NotAdmin)", async () => {
    const mallory = Keypair.generate();
    await airdrop(mallory.publicKey, 1);
    await expectAnchorError(
      program.methods
        .issueAdvance(mallory.publicKey, usd(10), dueDate)
        .accountsPartial({ admin: mallory.publicKey, advance: advancePda(1), borrowerWallet: mallory.publicKey, mint })
        .signers([mallory])
        .rpc(),
      "NotAdmin",
    );
    await expectAnchorError(
      program.methods
        .repayAdvance(new BN(0))
        .accountsPartial({ admin: mallory.publicKey, advance: advancePda(0), borrowerToken, mint })
        .signers([mallory])
        .rpc(),
      "NotAdmin",
    );
  });

  it("cannot pull repayment before the borrower approves the pool", async () => {
    let failed = false;
    try {
      await program.methods.repayAdvance(new BN(0)).accountsPartial({ advance: advancePda(0), borrowerToken, mint }).rpc();
    } catch {
      failed = true; // SPL token rejects: the pool PDA is not the delegate yet
    }
    expect(failed).to.equal(true);
    expect((await program.account.advance.fetch(advancePda(0))).repaid).to.equal(false);
  });

  it("repays: pool made whole, Quid score bumps to 1, AdvanceRepaid is emitted", async () => {
    // Borrower approves the pool PDA as delegate (the CEP-18 approve analog).
    await airdrop(borrower.publicKey, 1);
    await approve(conn, borrower, borrowerToken, pool, borrower, BigInt(usd(180).toString()));

    const sig = await program.methods
      .repayAdvance(new BN(0))
      .accountsPartial({ advance: advancePda(0), borrowerToken, mint })
      .rpc({ commitment: "confirmed" });

    expect((await program.account.pool.fetch(pool)).poolBalance.toString()).to.equal(usd(1000).toString());
    expect((await tokenBalance(vault)).toString()).to.equal(usd(1000).toString());
    expect((await tokenBalance(borrowerToken)).toString()).to.equal("0");
    expect((await program.account.advance.fetch(advancePda(0))).repaid).to.equal(true);
    expect(await reputationOf(borrower.publicKey)).to.equal(1);

    const [ev] = await events(sig);
    expect(ev.name).to.equal("advanceRepaid");
    expect(ev.data.id.toString()).to.equal("0");
    expect(ev.data.newReputation).to.equal(1);
  });

  it("refuses to settle the same advance twice (AlreadyRepaid)", async () => {
    await expectAnchorError(
      program.methods.repayAdvance(new BN(0)).accountsPartial({ advance: advancePda(0), borrowerToken, mint }).rpc(),
      "AlreadyRepaid",
    );
  });

  it("a second on-time advance lifts the score to 2", async () => {
    await program.methods
      .issueAdvance(borrower.publicKey, usd(250), dueDate)
      .accountsPartial({ advance: advancePda(1), borrowerWallet: borrower.publicKey, mint })
      .rpc();
    await approve(conn, borrower, borrowerToken, pool, borrower, BigInt(usd(250).toString()));
    await program.methods.repayAdvance(new BN(1)).accountsPartial({ advance: advancePda(1), borrowerToken, mint }).rpc();

    expect(await reputationOf(borrower.publicKey)).to.equal(2);
    const p = await program.account.pool.fetch(pool);
    expect(p.poolBalance.toString()).to.equal(usd(1000).toString());
    expect(p.nextId.toNumber()).to.equal(2);
  });
});
