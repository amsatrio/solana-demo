import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { isRejected } from '@reduxjs/toolkit'
import type { Vote } from "../../../../backend/target/types/vote";

interface VoteState {
    items: any[];
    loading: boolean;
    error: string | null;
}

const initialState: VoteState = {
    items: [],
    loading: false,
    error: null,
};

// --- Thunks ---

export const fetchVotes = createAsyncThunk(
    'votes/fetchVotes',
    async ({ program, userPublicKey }: { program: Program<Vote>, userPublicKey: PublicKey }, { rejectWithValue }) => {
        try {
            const accounts = await program.account.voteState.all([
                { memcmp: { offset: 8, bytes: userPublicKey.toBase58() } }
            ]);
            return accounts;
        } catch (error: any) {
            console.error("Transaction failed:", error);
            if (error.message?.includes("insufficient funds") || error.logs?.some((l: string) => l.includes("insufficient lamports"))) {
                return rejectWithValue("Insufficient SOL for transaction fees or rent.");
            }

            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const fetchAllVotes = createAsyncThunk(
    'votes/fetchAllVotes',
    async ({ program }: { program: Program<Vote> }, { rejectWithValue }) => {
        try {
            const accounts = await program.account.voteState.all();
            return accounts;
        } catch (error: any) {
            console.error("Transaction failed:", error);
            if (error.message?.includes("insufficient funds") || error.logs?.some((l: string) => l.includes("insufficient lamports"))) {
                return rejectWithValue("Insufficient SOL for transaction fees or rent.");
            }

            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const createVote = createAsyncThunk(
    'votes/createVote',
    async ({ program, userPublicKey, name }: { program: Program<Vote>, userPublicKey: PublicKey, name: string }, { dispatch, rejectWithValue }) => {
        try {
            const [votePda] = PublicKey.findProgramAddressSync(
                [Buffer.from("vote"), userPublicKey.toBuffer(), Buffer.from(name)],
                program.programId
            );
            console.log(name)
            await program.methods.createVote(name).accounts({ vote: votePda, user: userPublicKey } as any).rpc();
            dispatch(fetchAllVotes({ program }));
        } catch (error: any) {
            console.error("Transaction failed:", error);
            if (error.message?.includes("insufficient funds") || error.logs?.some((l: string) => l.includes("insufficient lamports"))) {
                return rejectWithValue("Insufficient SOL for transaction fees or rent.");
            }

            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const updateVote = createAsyncThunk(
    'votes/updateVote',
    async ({ program, userPublicKey, votePda, name }: { program: Program<Vote>, userPublicKey: PublicKey, votePda: PublicKey, name: string | null }, { dispatch, rejectWithValue }) => {
        try {
            await program.methods.updateVote(name).accounts({ vote: votePda, owner: userPublicKey } as any).rpc();
            dispatch(fetchAllVotes({ program }));
        } catch (error: any) {
            console.error("Transaction failed:", error);
            if (error.message?.includes("insufficient funds") || error.logs?.some((l: string) => l.includes("insufficient lamports"))) {
                return rejectWithValue("Insufficient SOL for transaction fees or rent.");
            }

            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const castVote = createAsyncThunk(
    'votes/castVote',
    async ({ program, userPublicKey, votePda }: { program: Program<Vote>, userPublicKey: PublicKey, votePda: PublicKey }, { dispatch, rejectWithValue }) => {
        try {
            const [receiptPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("receipt"), votePda.toBuffer(), userPublicKey.toBuffer()],
                program.programId
            );
            await program.methods.castVote().accounts({ vote: votePda, voteReceipt: receiptPda, owner: userPublicKey } as any).rpc();
            dispatch(fetchAllVotes({ program }));
        } catch (error: any) {
            console.error("Transaction failed:", error);
            if (error.message?.includes("insufficient funds") || error.logs?.some((l: string) => l.includes("insufficient lamports"))) {
                return rejectWithValue("Insufficient SOL for transaction fees or rent.");
            }

            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const deleteVote = createAsyncThunk(
    'votes/deleteVote',
    async ({ program, userPublicKey, votePda }: { program: Program<Vote>, userPublicKey: PublicKey, votePda: PublicKey }, { dispatch, rejectWithValue }) => {
        try {
            await program.methods.deleteVote().accounts({ vote: votePda, owner: userPublicKey } as any).rpc();
            dispatch(fetchAllVotes({ program }));
        } catch (error: any) {
            console.error("Transaction failed:", error);
            if (error.message?.includes("insufficient funds") || error.logs?.some((l: string) => l.includes("insufficient lamports"))) {
                return rejectWithValue("Insufficient SOL for transaction fees or rent.");
            }

            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

const voteSlice = createSlice({
    name: 'votes',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            /* --- Fetch Vote --- */
            .addCase(fetchVotes.pending, (state) => { state.loading = true; })
            .addCase(fetchVotes.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchAllVotes.pending, (state) => { state.loading = true; })
            .addCase(fetchAllVotes.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })

            /* --- Create Vote --- */
            .addCase(createVote.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createVote.fulfilled, (state) => {
                state.loading = false;
            })

            /* --- Update Vote --- */
            .addCase(updateVote.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateVote.fulfilled, (state) => {
                state.loading = false;
            })

            /* --- Delete Vote --- */
            .addCase(deleteVote.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteVote.fulfilled, (state) => {
                state.loading = false;
            })

            .addMatcher(isRejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Something went wrong';
            });
    },
});

export default voteSlice.reducer;