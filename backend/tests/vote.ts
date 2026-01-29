import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vote } from "../target/types/vote";
import { expect } from "chai";
import { PublicKey } from "@solana/web3.js";

describe("vote-tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vote as Program<Vote>;
  const admin = provider.wallet;
  const user = anchor.web3.Keypair.generate();

  // Data for our test
  const name = "Banana";

  // Derive the PDA for the vote account
  const [votePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vote"), admin.publicKey.toBuffer(), Buffer.from(name)],
    program.programId
  );

  before(async () => {
    const signature = await provider.connection.requestAirdrop(
      user.publicKey,
      1 * anchor.web3.LAMPORTS_PER_SOL
    );

    const latestBlockhash = await provider.connection.getLatestBlockhash();

    await provider.connection.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });
  });

  it("Creates a Vote", async () => {
    const tx = await program.methods
      .createVote(name)
      .accounts({
        vote: votePda,
        user: admin.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const account = await program.account.voteState.fetch(votePda);
    expect(account.name).to.equal(name);
    expect(account.count.toNumber()).to.equal(0);
    expect(account.owner.toString()).to.equal(admin.publicKey.toString());
    console.log("Create TX:", tx);
  });

  it("Reads all Votes for the current user", async () => {
    // Fetch all accounts of type 'voteState'
    const allVotes = await program.account.voteState.all([]);

    console.log(`Found ${allVotes.length} votes for user ${user.publicKey.toBase58()}`);

    allVotes.forEach((vote, index) => {
      console.log(`Vote ${index + 1}: ${vote.account.name}`);
    });

    expect(allVotes.length).to.be.greaterThan(0);
  });

  it("Reads a Vote (Read by ID)", async () => {
    const account = await program.account.voteState.fetch(votePda);
    console.log("Vote Candidate Name:", account.name);
    console.log("Created On:", account.createdOn.toString());
  });

  it("Updates a Vote - Name", async () => {
    const newName = "Updated Name!";

    await program.methods
      .updateVote(newName)
      .accounts({
        vote: votePda,
        owner: admin.publicKey,
      })
      .rpc();

    const account = await program.account.voteState.fetch(votePda);
    expect(account.name).to.equal(newName);
    expect(account.count.toNumber()).to.equal(0);
  });

it("Cast a Vote - Count", async () => {
    // 1. Derive the Receipt PDA
    const [receiptPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("receipt"),
        votePda.toBuffer(),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    // 2. Execute the vote
    await program.methods
      .castVote()
      .accounts({
        vote: votePda,
        voteReceipt: receiptPda, // New account required
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const account = await program.account.voteState.fetch(votePda);
    expect(account.count.toNumber()).to.equal(1);
  });

  it("Cast a Vote - Fails when voting a second time", async () => {
    const [receiptPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("receipt"),
        votePda.toBuffer(),
        user.publicKey.toBuffer(),
      ],
      program.programId
    );

    try {
      await program.methods
        .castVote()
        .accounts({
          vote: votePda,
          voteReceipt: receiptPda,
          user: user.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      
      expect.fail("Should have thrown an error for double voting");
    } catch (error: any) {
      expect(error.logs.toString()).to.contain("already in use");
      console.log("Success: Double vote prevented!");
    }
  });

  it("Deletes a Vote", async () => {
    const tx = await program.methods
      .deleteVote()
      .accounts({
        vote: votePda,
        owner: admin.publicKey,
      })
      .rpc();

    // Verify account is gone
    try {
      await program.account.voteState.fetch(votePda);
    } catch (e) {
      expect(e.message).to.contain("Account does not exist");
    }
    console.log("Delete TX (Rent reclaimed):", tx);
  });
});