import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
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
    async ({ program, userPublicKey }: { program: Program<Vote>, userPublicKey: PublicKey }) => {
        const accounts = await program.account.voteState.all([
            { memcmp: { offset: 8, bytes: userPublicKey.toBase58() } }
        ]);
        return accounts;
    }
);

export const fetchAllVotes = createAsyncThunk(
    'votes/fetchAllVotes',
    async ({ program }: { program: Program<Vote> }) => {
        const accounts = await program.account.voteState.all();
        return accounts;
    }
);

export const createVote = createAsyncThunk(
    'votes/createVote',
    async ({ program, userPublicKey, name }: { program: Program<Vote>, userPublicKey: PublicKey, name: string }, { dispatch }) => {
        const [votePda] = PublicKey.findProgramAddressSync(
            [Buffer.from("vote"), userPublicKey.toBuffer(), Buffer.from(name)],
            program.programId
        );
        await program.methods.createVote(name).accounts({ vote: votePda, user: userPublicKey } as any).rpc();
        dispatch(fetchVotes({ program, userPublicKey }));
    }
);

export const updateVote = createAsyncThunk(
    'votes/updateVote',
    async ({ program, userPublicKey, votePda, name }: { program: Program<Vote>, userPublicKey: PublicKey, votePda: PublicKey, name: string | null }, { dispatch }) => {
        await program.methods.updateVote(name).accounts({ vote: votePda, owner: userPublicKey } as any).rpc();
        dispatch(fetchVotes({ program, userPublicKey }));
    }
);

export const castVote = createAsyncThunk(
    'votes/castVote',
    async ({ program, userPublicKey, votePda }: { program: Program<Vote>, userPublicKey: PublicKey, votePda: PublicKey }, { dispatch }) => {
        await program.methods.castVote().accounts({ vote: votePda, owner: userPublicKey } as any).rpc();
        dispatch(fetchVotes({ program, userPublicKey }));
    }
);

export const deleteVote = createAsyncThunk(
    'votes/deleteVote',
    async ({ program, userPublicKey, votePda }: { program: Program<Vote>, userPublicKey: PublicKey, votePda: PublicKey }, { dispatch }) => {
        await program.methods.deleteVote().accounts({ vote: votePda, owner: userPublicKey } as any).rpc();
        dispatch(fetchVotes({ program, userPublicKey }));
    }
);

const voteSlice = createSlice({
    name: 'votes',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchVotes.pending, (state) => { state.loading = true; })
            .addCase(fetchVotes.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchVotes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch";
            });
    },
});

export default voteSlice.reducer;