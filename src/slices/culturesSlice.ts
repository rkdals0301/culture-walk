import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { FormattedCulture, Culture } from '@/types/culture'; // RawCulture 사용 예시
import { fetchCultures, fetchCultureById } from '@/utils/api/culture';
import { formatCultureData } from '@/utils/cultureUtils';

interface CultureState {
  cultures: FormattedCulture[];
  filteredCultures: FormattedCulture[];
  searchQuery: string;
  isLoading: boolean; // 전체 로딩 상태
  error: string | null;
  selectedCulture: FormattedCulture | null; // 추가된 상태
  isSelectedCultureLoading: boolean; // 선택된 문화 로딩 상태
  selectedCultureError: string | null;
}

const initialState: CultureState = {
  cultures: [],
  filteredCultures: [],
  searchQuery: '',
  isLoading: false,
  error: null,
  selectedCulture: null,
  isSelectedCultureLoading: false,
  selectedCultureError: null,
};

// 비동기 액션 생성자
export const loadCultures = createAsyncThunk('cultures/loadCultures', async () => {
  const data: Culture[] = await fetchCultures();
  return formatCultureData(data);
});

export const loadCultureById = createAsyncThunk('cultures/loadCultureById', async (id: number) => {
  const data: Culture = await fetchCultureById(id);
  return formatCultureData([data])[0]; // 데이터 포맷팅 후 반환
});

const cultureSlice = createSlice({
  name: 'cultures',
  initialState,
  reducers: {
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
      const query = state.searchQuery.toLowerCase();
      state.filteredCultures = state.cultures.filter(culture => culture.title.toLowerCase().includes(query));
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadCultures.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadCultures.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cultures = action.payload;
        state.filteredCultures = action.payload;
      })
      .addCase(loadCultures.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch cultures';
      })
      .addCase(loadCultureById.pending, state => {
        state.isSelectedCultureLoading = true; // 로딩 시작
        state.selectedCultureError = null;
      })
      .addCase(loadCultureById.fulfilled, (state, action) => {
        state.isSelectedCultureLoading = false; // 로딩 종료
        state.selectedCulture = action.payload;
      })
      .addCase(loadCultureById.rejected, (state, action) => {
        state.isSelectedCultureLoading = false; // 로딩 종료
        state.selectedCultureError = action.error.message || 'Failed to fetch culture details';
      });
  },
});

export const { setSearchQuery } = cultureSlice.actions;

export default cultureSlice.reducer;
