import SearchCancelIcon from '../../../public/assets/images/search-cancel-icon.svg';
import SearchIcon from '../../../public/assets/images/search-icon.svg';

interface MapSearchFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

const MapSearchField = ({ id, value, onChange, compact = false }: MapSearchFieldProps) => (
  <form
    role='search'
    className={`shadow-2xs focus-within:ring-[var(--color-brand-primary)]/20 flex items-center rounded-xl border border-[var(--color-input-border)] bg-[var(--color-input-bg)] transition-all focus-within:border-[var(--color-brand-primary)] focus-within:ring-2 ${
      compact ? 'h-10 gap-2 px-3' : 'h-11 gap-2.5 px-3.5'
    }`}
    onSubmit={event => {
      event.preventDefault();
      (event.currentTarget.querySelector('input') as HTMLInputElement | null)?.blur();
    }}
  >
    <SearchIcon className={`${compact ? 'size-4' : 'size-[18px]'} shrink-0 text-[var(--color-brand-primary)]`} />
    <input
      id={id}
      type='text'
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder='행사명 또는 장소 검색'
      aria-label='문화행사 검색'
      autoComplete='off'
      spellCheck={false}
      enterKeyHint='search'
      className={`min-w-0 flex-1 bg-transparent font-medium placeholder:text-[var(--color-text-secondary)] ${
        compact ? 'text-base sm:text-xs' : 'text-base sm:text-sm'
      }`}
    />
    {value && (
      <button
        type='button'
        onClick={() => onChange('')}
        className={`flex shrink-0 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition hover:bg-[var(--color-interactive-hover)] hover:text-[var(--color-text-primary)] ${
          compact ? 'size-7' : 'size-8'
        }`}
        aria-label='검색어 초기화'
      >
        <SearchCancelIcon className={compact ? 'size-3.5' : 'size-4'} />
      </button>
    )}
  </form>
);

export default MapSearchField;
