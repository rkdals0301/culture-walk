import React from 'react';
import { FormattedCulture } from '@/types/culture';
import styles from './CultureList.module.scss';
import CultureItem from './CultureItem';

interface CultureListProps {
  cultures: FormattedCulture[];
  onItemClick: (culture: FormattedCulture) => void;
}

const CultureList = ({ cultures, onItemClick }: CultureListProps) => {
  return (
    <ul className={styles['culture-list-wrapper']}>
      {cultures.map(culture => (
        <CultureItem key={culture.id} culture={culture} onClick={() => onItemClick(culture)} />
      ))}
    </ul>
  );
};

export default CultureList;
