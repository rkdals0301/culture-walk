import { createSlice } from '@reduxjs/toolkit';
import { FormattedCulture } from '@/types/culture';

interface CultureState {
  culture: FormattedCulture | null;
  cultures: FormattedCulture[];
  filteredCultures: FormattedCulture[];
  searchQuery: string;
}

const initialState: CultureState = {
  culture: null,
  cultures: [],
  filteredCultures: [],
  searchQuery: '',
};

const cultureSlice = createSlice({
  name: 'cultures',
  initialState,
  reducers: {
    setCultures(state, action) {
      state.cultures = action.payload;
      state.filteredCultures = action.payload;
    },
    setCulture(state, action) {
      state.culture = action.payload;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
      const query = state.searchQuery.toLowerCase();
      state.filteredCultures = state.cultures.filter(culture => culture.title.toLowerCase().includes(query));
    },
  },
});

export const { setCultures, setCulture, setSearchQuery } = cultureSlice.actions;

export default cultureSlice.reducer;
