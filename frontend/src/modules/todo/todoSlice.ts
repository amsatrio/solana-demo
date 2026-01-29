import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { isRejected } from '@reduxjs/toolkit'
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
    async ({ program, userPublicKey }: { program: Program<Todo>, userPublicKey: PublicKey }, { rejectWithValue }) => {
        try {
            const accounts = await program.account.todoState.all([
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

export const createTodo = createAsyncThunk(
    'todos/createTodo',
    async ({ program, userPublicKey, title, description }: { program: Program<Todo>, userPublicKey: PublicKey, title: string, description: string }, { dispatch, rejectWithValue }) => {
        try {
            const [todoPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("todo"), userPublicKey.toBuffer(), Buffer.from(title)],
                program.programId
            );
            console.log(title)
            await program.methods.createTodo(title, description).accounts({ todo: todoPda, user: userPublicKey } as any).rpc();
            dispatch(fetchTodos({ program, userPublicKey }));
        } catch (error: any) {
            console.error("Transaction failed:", error);
            if (error.message?.includes("insufficient funds") || error.logs?.some((l: string) => l.includes("insufficient lamports"))) {
                return rejectWithValue("Insufficient SOL for transaction fees or rent.");
            }

            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const updateTodo = createAsyncThunk(
    'todos/updateTodo',
    async ({ program, userPublicKey, todoPda, title, description, currentStatus }: { program: Program<Todo>, userPublicKey: PublicKey, todoPda: PublicKey, title: string | null, description: string | null, currentStatus: boolean }, { dispatch, rejectWithValue }) => {
        try {
            await program.methods.updateTodo(title, description, !currentStatus).accounts({ todo: todoPda, owner: userPublicKey } as any).rpc();
            dispatch(fetchTodos({ program, userPublicKey }));
        } catch (error: any) {
            console.error("Transaction failed:", error);
            if (error.message?.includes("insufficient funds") || error.logs?.some((l: string) => l.includes("insufficient lamports"))) {
                return rejectWithValue("Insufficient SOL for transaction fees or rent.");
            }

            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

export const deleteTodo = createAsyncThunk(
    'todos/deleteTodo',
    async ({ program, userPublicKey, todoPda }: { program: Program<Todo>, userPublicKey: PublicKey, todoPda: PublicKey }, { dispatch, rejectWithValue }) => {
        try {
            await program.methods.deleteTodo().accounts({ todo: todoPda, owner: userPublicKey } as any).rpc();
            dispatch(fetchTodos({ program, userPublicKey }));
        } catch (error: any) {
            console.error("Transaction failed:", error);
            if (error.message?.includes("insufficient funds") || error.logs?.some((l: string) => l.includes("insufficient lamports"))) {
                return rejectWithValue("Insufficient SOL for transaction fees or rent.");
            }

            return rejectWithValue(error.message || "Something went wrong");
        }
    }
);

const todoSlice = createSlice({
    name: 'todos',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            /* --- Fetch Todo --- */
            .addCase(fetchTodos.pending, (state) => { state.loading = true; })
            .addCase(fetchTodos.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })

            /* --- Create Todo --- */
            .addCase(createTodo.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createTodo.fulfilled, (state) => {
                state.loading = false;
            })

            /* --- Update Todo --- */
            .addCase(updateTodo.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateTodo.fulfilled, (state) => {
                state.loading = false;
            })

            /* --- Delete Todo --- */
            .addCase(deleteTodo.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteTodo.fulfilled, (state) => {
                state.loading = false;
            })

            .addMatcher(isRejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Something went wrong';
            });
    },
});

export default todoSlice.reducer;