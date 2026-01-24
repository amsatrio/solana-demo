import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Todo } from "../target/types/todo";
import { expect } from "chai";

describe("todo-tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Todo as Program<Todo>;
  const user = provider.wallet;

  // Data for our test
  const title = "Finish Solana Project";
  const description = "Complete the CRUD operations using Anchor.";

  // Derive the PDA for the todo account
  const [todoPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("todo"), user.publicKey.toBuffer(), Buffer.from(title)],
    program.programId
  );

  it("Creates a Todo", async () => {
    const tx = await program.methods
      .createTodo(title, description)
      .accounts({
        todo: todoPda,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const account = await program.account.todoState.fetch(todoPda);
    expect(account.title).to.equal(title);
    expect(account.isActive).to.be.true;
    console.log("Create TX:", tx);
  });

  it("Reads all Todos for the current user", async () => {
    // Fetch all accounts of type 'todoState'
    const allTodos = await program.account.todoState.all([
      {
        memcmp: {
          offset: 8, // Skip the 8-byte Anchor discriminator
          bytes: user.publicKey.toBase58(), // Search for our public key
        },
      },
    ]);

    console.log(`Found ${allTodos.length} todos for user ${user.publicKey.toBase58()}`);

    allTodos.forEach((todo, index) => {
      console.log(`Todo ${index + 1}: ${todo.account.title}`);
      console.log(`Status: ${todo.account.isActive ? "Active" : "Completed"}`);
    });

    expect(allTodos.length).to.be.greaterThan(0);
  });

  it("Reads a Todo (Read by ID)", async () => {
    const account = await program.account.todoState.fetch(todoPda);
    console.log("Todo Title:", account.title);
    console.log("Created On:", account.createdOn.toString());
  });

  it("Updates a Todo", async () => {
    const newDescription = "Updated description!";

    await program.methods
      .updateTodo(null, newDescription, false) // Update desc and set inactive
      .accounts({
        todo: todoPda,
        owner: user.publicKey,
      })
      .rpc();

    const account = await program.account.todoState.fetch(todoPda);
    expect(account.description).to.equal(newDescription);
    expect(account.isActive).to.be.false;
  });

  it("Deletes a Todo", async () => {
    const tx = await program.methods
      .deleteTodo()
      .accounts({
        todo: todoPda,
        owner: user.publicKey,
      })
      .rpc();

    // Verify account is gone
    try {
      await program.account.todoState.fetch(todoPda);
    } catch (e) {
      expect(e.message).to.contain("Account does not exist");
    }
    console.log("Delete TX (Rent reclaimed):", tx);
  });
});