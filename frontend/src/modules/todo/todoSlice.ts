import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import type { Todo } from "../../../../backend/target/types/todo";

interface TodoState {
    items: any[];
    loading: boolean;
    error: string | null;
}

const initialState: TodoState = {
    items: [],
    loading: false,
    error: null,
};

// --- Thunks ---

export const fetchTodos = createAsyncThunk(
    'todos/fetchTodos',
    async ({ program, userPublicKey }: { program: Program<Todo>, userPublicKey: PublicKey }) => {
        const accounts = await program.account.todoState.all([
            { memcmp: { offset: 8, bytes: userPublicKey.toBase58() } }
        ]);
        return accounts;
    }
);

export const createTodo = createAsyncThunk(
    'todos/createTodo',
    async ({ program, userPublicKey, title, description }: { program: Program<Todo>, userPublicKey: PublicKey, title: string, description: string }, { dispatch }) => {
        const [todoPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("todo"), userPublicKey.toBuffer(), Buffer.from(title)],
            program.programId
        );
        await program.methods.createTodo(title, description).accounts({ todo: todoPda, user: userPublicKey } as any).rpc();
        dispatch(fetchTodos({ program, userPublicKey }));
    }
);

export const toggleTodo = createAsyncThunk(
    'todos/toggleTodo',
    async ({ program, userPublicKey, todoPda, currentStatus }: { program: Program<Todo>, userPublicKey: PublicKey, todoPda: PublicKey, currentStatus: boolean }, { dispatch }) => {
        await program.methods.updateTodo(null, null, !currentStatus).accounts({ todo: todoPda, owner: userPublicKey } as any).rpc();
        dispatch(fetchTodos({ program, userPublicKey }));
    }
);

export const deleteTodo = createAsyncThunk(
    'todos/deleteTodo',
    async ({ program, userPublicKey, todoPda }: { program: Program<Todo>, userPublicKey: PublicKey, todoPda: PublicKey }, { dispatch }) => {
        await program.methods.deleteTodo().accounts({ todo: todoPda, owner: userPublicKey } as any).rpc();
        dispatch(fetchTodos({ program, userPublicKey }));
    }
);

const todoSlice = createSlice({
    name: 'todos',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchTodos.pending, (state) => { state.loading = true; })
            .addCase(fetchTodos.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchTodos.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch";
            });
    },
});

export default todoSlice.reducer;