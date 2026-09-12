'use client';

import {
  CategoryChips,
  FreeOnlyToggle,
  RegionSelect,
  SortControl,
  type SortControlProps,
} from '@/components/Common/FilterControls';
import { CultureCategoryKey } from '@/utils/cultureCategory';
import type { MapSortMode } from '@/utils/exploreState';

export type { MapSortMode };

interface MapFilterControlsProps {
  category: CultureCategoryKey;
  freeOnly: boolean;
  region: string;
  regionOptions: string[];
  onCategoryChange: (category: CultureCategoryKey) => void;
  onFreeOnlyChange: (freeOnly: boolean) => void;
  onRegionChange: (region: string) => void;
}

export const MapFilterControls = ({
  category,
  freeOnly,
  region,
  regionOptions,
  onCategoryChange,
  onFreeOnlyChange,
  onRegionChange,
}: MapFilterControlsProps) => (
  <div className='grid gap-2.5'>
    <CategoryChips
      selected={category}
      onSelect={onCategoryChange}
      layout='scroll'
      size='sm'
    />
    <div className='flex items-center gap-2'>
      <div className='min-w-0 flex-1'>
        <RegionSelect
          region={region}
          regionOptions={regionOptions}
          onChange={onRegionChange}
          size='sm'
          className='w-full'
        />
      </div>
      <FreeOnlyToggle
        isFreeOnly={freeOnly}
        onToggle={() => onFreeOnlyChange(!freeOnly)}
        size='sm'
      />
    </div>
  </div>
);

export type MapSortControlProps = SortControlProps;

export const MapSortControl = (props: MapSortControlProps) => (
  <SortControl {...props} size={props.size ?? 'sm'} />
);
