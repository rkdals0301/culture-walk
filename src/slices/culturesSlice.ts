import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { FormattedCulture, Culture } from '@/types/culture'; // RawCulture 사용 예시
import { fetchCultures, fetchCultureById } from '@/utils/api/culture';
import { formatCultureData } from '@/utils/cultureUtils';

interface CultureState {
  cultures: FormattedCulture[];
  filteredCultures: FormattedCulture[];
  selectedCulture: FormattedCulture | null; // 추가된 상태
  searchQuery: string;
  loading: boolean; // 전체 로딩 상태
  selectedCultureLoading: boolean; // 추가된 상태
  error: string | null;
  isLoaded: boolean; // 데이터가 로드되었는지 확인하는 상태
}

const initialState: CultureState = {
  cultures: [],
  filteredCultures: [],
  selectedCulture: null,
  searchQuery: '',
  loading: false,
  selectedCultureLoading: false, // 추가된 상태
  error: null,
  isLoaded: false,
};

// 비동기 액션 생성자
export const loadCultures = createAsyncThunk('cultures/loadCultures', async () => {
  try {
    const data: Culture[] = await fetchCultures();
    return formatCultureData(data);
  } catch (error) {
    console.error('Failed to load cultures', error);
    throw new Error('Failed to load cultures');
  }
});

export const loadCultureById = createAsyncThunk('cultures/loadCultureById', async (id: number) => {
  try {
    const data: Culture = await fetchCultureById(id);
    return formatCultureData([data])[0]; // 데이터 포맷팅 후 반환
  } catch (error) {
    console.error('Failed to load culture by ID', error);
    throw new Error('Failed to load culture by ID');
  }
});

const cultureSlice = createSlice({
  name: 'cultures',
  initialState,
  reducers: {
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
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
        state.isLoaded = false;
      })
      .addCase(loadCultures.fulfilled, (state, action) => {
        state.loading = false;
        state.cultures = action.payload;
        state.filteredCultures = action.payload;
        state.isLoaded = true;
      })
      .addCase(loadCultures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch cultures';
        state.isLoaded = false;
      })
      .addCase(loadCultureById.pending, state => {
        state.selectedCultureLoading = true; // 로딩 시작
        state.error = null;
      })
      .addCase(loadCultureById.fulfilled, (state, action) => {
        state.selectedCultureLoading = false; // 로딩 종료
        state.selectedCulture = action.payload;
      })
      .addCase(loadCultureById.rejected, (state, action) => {
        state.selectedCultureLoading = false; // 로딩 종료
        state.error = action.error.message || 'Failed to fetch culture details';
      });
  },
});

export const { setSearchQuery } = cultureSlice.actions;

export default cultureSlice.reducer;
