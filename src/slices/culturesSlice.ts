import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { FormattedCulture, RawCulture } from '@/types/culture'; // RawCulture 사용 예시
import { fetchCultures } from '@/utils/api/culture';
import { formatCultureData } from '@/utils/cultureUtils';

interface CultureState {
  cultures: FormattedCulture[];
  filteredCultures: FormattedCulture[];
  searchQuery: string;
  loading: boolean;
  error: string | null;
}

const initialState: CultureState = {
  cultures: [],
  filteredCultures: [],
  searchQuery: '',
  loading: false,
  error: null,
};

// 비동기 액션 생성자
export const loadCultures = createAsyncThunk('cultures/loadCultures', async () => {
  try {
    const data: RawCulture[] = await fetchCultures();
    const formattedData = formatCultureData(data);
    return formattedData;
  } catch (error) {
    throw new Error('Failed to load cultures');
  }
});

const cultureSlice = createSlice({
  name: 'cultures',
  initialState,
  reducers: {
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
      // 검색 쿼리를 사용하여 필터링
      state.filteredCultures = state.cultures.filter(culture =>
        culture.title.toLowerCase().includes(state.searchQuery.toLowerCase())
      );
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadCultures.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCultures.fulfilled, (state, action) => {
        state.loading = false;
        state.cultures = action.payload;
        state.filteredCultures = action.payload; // 초기에는 전체 목록을 표시
      })
      .addCase(loadCultures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch data';
      });
  },
});

export const { setSearchQuery } = cultureSlice.actions;

export default cultureSlice.reducer;
