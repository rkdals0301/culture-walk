import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { FormattedCulture, Culture } from '@/types/culture'; // RawCulture 사용 예시
import { fetchCultures } from '@/utils/api/culture';
import { formatCultureData } from '@/utils/cultureUtils';

interface CultureState {
  cultures: FormattedCulture[];
  filteredCultures: FormattedCulture[];
  searchQuery: string;
  loading: boolean;
  error: string | null;
  isLoaded: boolean; // 데이터가 로드되었는지 확인하는 상태
}

const initialState: CultureState = {
  cultures: [],
  filteredCultures: [],
  searchQuery: '',
  loading: false,
  error: null,
  isLoaded: false, // 초기 상태에서는 데이터가 로드되지 않았다고 가정
};

// 비동기 액션 생성자
export const loadCultures = createAsyncThunk('cultures/loadCultures', async () => {
  try {
    const data: Culture[] = await fetchCultures();
    const formattedData = formatCultureData(data);
    return formattedData;
  } catch (error) {
    console.error('Failed to load cultures', error);
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
        state.isLoaded = false; // 로딩 중에는 false
      })
      .addCase(loadCultures.fulfilled, (state, action) => {
        state.loading = false;
        state.cultures = action.payload;
        state.filteredCultures = action.payload; // 초기에는 전체 목록을 표시
        state.isLoaded = true; // 데이터 로드 완료
      })
      .addCase(loadCultures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch data';
        state.isLoaded = false; // 로딩 중에는 false
      });
  },
});

export const { setSearchQuery } = cultureSlice.actions;

export default cultureSlice.reducer;
