// src/slices/sideMenuSlice.ts
import { createSlice } from '@reduxjs/toolkit';

interface SideMenuState {
  isOpen: boolean;
}

const initialState: SideMenuState = {
  isOpen: false,
};

const sideMenuSlice = createSlice({
  name: 'sideMenu',
  initialState,
  reducers: {
    openSideMenu(state) {
      state.isOpen = true;
    },
    closeSideMenu(state) {
      state.isOpen = false;
    },
    toggleSideMenu(state) {
      state.isOpen = !state.isOpen;
    },
  },
});

export const { openSideMenu, closeSideMenu, toggleSideMenu } = sideMenuSlice.actions;
export default sideMenuSlice.reducer;
