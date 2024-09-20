import { configureStore } from '@reduxjs/toolkit';
import cultureReducer from '@/slices/culturesSlice';
import sideMenuReducer from '@/slices/sideMenuSlice';

export const store = configureStore({
  reducer: {
    culture: cultureReducer,
    sideMenu: sideMenuReducer,
  },
  devTools: process.env.NODE_ENV !== 'production', // 개발 환경에서만 DevTools 활성화
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
