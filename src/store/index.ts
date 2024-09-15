import { configureStore } from '@reduxjs/toolkit';
import cultureReducer from '@/slices/culturesSlice';

export const store = configureStore({
  reducer: {
    culture: cultureReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
