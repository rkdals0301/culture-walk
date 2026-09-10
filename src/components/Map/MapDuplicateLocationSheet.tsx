import type { FormattedCulture } from '@/types/culture';
import type { CoordinateGroup } from '@/utils/mapMarkers';

interface MapDuplicateLocationSheetProps {
  group: CoordinateGroup<FormattedCulture>;
  onSelectCulture: (id: number) => void;
}

const MapDuplicateLocationSheet = ({ group, onSelectCulture }: MapDuplicateLocationSheetProps) => (
  <div className='flex flex-col gap-4'>
    <div>
      <p className='text-[0.68rem] font-semibold text-[var(--color-brand-primary)]'>같은 장소의 행사</p>
      <h3 className='mt-2 text-xl font-semibold'>같은 위치에서 여러 행사가 열리고 있습니다.</h3>
      <p className='mt-2 text-sm leading-6 text-[var(--color-text-secondary)]'>
        아래 목록에서 원하는 행사를 선택하면 상세 화면으로 이동합니다.
      </p>
    </div>
    <ul className='grid gap-2'>
      {group.duplicateItems.map(culture => (
        <li key={culture.id}>
          <button
            type='button'
            onClick={() => onSelectCulture(culture.id)}
            className='surface-card w-full rounded-2xl p-4 text-left font-semibold transition duration-200 hover:border-[var(--color-border-brand)] hover:bg-[var(--color-interactive-hover)] hover:shadow-[var(--color-shadow-brand)] active:bg-[var(--color-interactive-active)]'
          >
            <p>{culture.title}</p>
            <p className='mt-1 text-sm font-medium text-[var(--color-text-secondary)]'>{culture.displayDate}</p>
          </button>
        </li>
      ))}
    </ul>
  </div>
);

export default MapDuplicateLocationSheet;
