import { configureStore } from '@reduxjs/toolkit';
import todoReducer from './modules/todo/todoSlice';
import voteReducer from './modules/vote/voteSlice';

export const store = configureStore({
  reducer: {
    todos: todoReducer,
    votes: voteReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;