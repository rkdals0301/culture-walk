import Button from '@/components/Common/Button';
import IconButton from '@/components/Common/IconButton';

import React, { useEffect, useRef, useState } from 'react';

import ArrowDropDownIcon from '../../../public/assets/images/arrow-drop-down-icon.svg';
import ArrowDropUpIcon from '../../../public/assets/images/arrow-drop-up-icon.svg';

interface DropdownProps {
  icon?: React.ReactNode; // 아이콘이 있을 경우
  buttonText?: string; // 텍스트가 있을 경우
  options: { label: string; onClick: () => void }[]; // 드롭다운 메뉴 항목
  iconClassName?: string; // 아이콘의 클래스 이름
  menuWidth?: string; // 드롭다운 메뉴 너비
  buttonVariant?: 'primary' | 'secondary' | 'success' | 'danger' | 'gradient'; // 버튼 스타일
}

export default function Dropdown({
  icon, // 아이콘이 있으면 아이콘 사용
  buttonText, // 텍스트가 있으면 텍스트 사용
  options,
  iconClassName = 'size-6', // 기본 아이콘 크기
  menuWidth = 'w-48', // 기본 드롭다운 너비
  buttonVariant = 'primary', // 기본 버튼 스타일
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className='relative inline-block text-left' ref={dropdownRef}>
      {icon ? (
        <IconButton
          icon={icon}
          ariaLabel='드롭다운 토글'
          onClick={handleClick}
          iconClassName={iconClassName}
          variant={buttonVariant} // 아이콘버튼에 스타일 적용
        />
      ) : (
        <Button
          ariaLabel='드롭다운 토글'
          onClick={handleClick}
          variant={buttonVariant} // 텍스트 버튼에 스타일 적용
        >
          {buttonText}{' '}
          {isOpen ? <ArrowDropUpIcon className='ml-2 size-6' /> : <ArrowDropDownIcon className='ml-2 size-6' />}
        </Button>
      )}

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-neutral-600 ${menuWidth}`}
        >
          <div className='py-1'>
            {options.map((option, index) => (
              <a
                key={index}
                href='#'
                className='block px-4 py-2 text-sm text-gray-900 hover:bg-gray-200 dark:text-gray-100 dark:hover:bg-neutral-700'
                onClick={event => {
                  event.preventDefault(); // 링크 기본 동작 방지
                  option.onClick(); // 사용자 정의 동작 수행
                  setIsOpen(false); // 드롭다운 닫기
                }}
              >
                {option.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
