import React from 'react';

import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ToggleProps {
  id: string;
  ariaLabel: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Toggle = ({ id, ariaLabel, checked, onChange }: ToggleProps) => {
  return (
    <div className='flex items-center'>
      <input className='hidden' aria-label={ariaLabel} id={id} type='checkbox' checked={checked} onChange={onChange} />
      <label
        htmlFor={id}
        className={twMerge(
          'relative h-7 w-12 cursor-pointer rounded-full transition-colors duration-200',
          clsx({
            'bg-blue-500': checked,
            'bg-gray-300': !checked,
          })
        )}
      >
        <span
          className={twMerge(
            'absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform duration-200',
            clsx({
              'translate-x-5': checked,
              'translate-x-0': !checked,
            })
          )}
        ></span>
      </label>
    </div>
  );
};

export default Toggle;
