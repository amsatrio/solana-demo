import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vote } from "../target/types/vote";
import { expect } from "chai";

describe("vote-tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vote as Program<Vote>;
  const user = provider.wallet;

  // Data for our test
  const name = "Banana";

  // Derive the PDA for the vote account
  const [votePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vote"), user.publicKey.toBuffer(), Buffer.from(name)],
    program.programId
  );

  it("Creates a Vote", async () => {
    const tx = await program.methods
      .createVote(name)
      .accounts({
        vote: votePda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const account = await program.account.voteState.fetch(votePda);
    expect(account.name).to.equal(name);
    console.log("Create TX:", tx);
  });

  it("Reads all Votes for the current user", async () => {
    // Fetch all accounts of type 'voteState'
    const allVotes = await program.account.voteState.all([
      {
        memcmp: {
          offset: 8, // Skip the 8-byte Anchor discriminator
          bytes: user.publicKey.toBase58(), // Search for our public key
        },
      },
    ]);

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
      .updateVote(newName, false)
      .accounts({
        vote: votePda,
        owner: user.publicKey,
      })
      .rpc();

    const account = await program.account.voteState.fetch(votePda);
    expect(account.name).to.equal(newName);
    expect(account.count.toNumber()).to.equal(0);
  });

  it("Updates a Vote - Count", async () => {
    await program.methods
      .updateVote(null, true)
      .accounts({
        vote: votePda,
        owner: user.publicKey,
      })
      .rpc();

    const account = await program.account.voteState.fetch(votePda);
    expect(account.count.toNumber()).to.equal(1);
  });

  it("Deletes a Vote", async () => {
    const tx = await program.methods
      .deleteVote()
      .accounts({
        vote: votePda,
        owner: user.publicKey,
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