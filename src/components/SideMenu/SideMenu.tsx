'use client';

import IconButton from '@/components/Common/IconButton';
import { useSideMenu } from '@/context/SideMenuContext';

import clsx from 'clsx';

// clsx 추가
import AvatarDefaultIcon from '../../../public/assets/avatar-default.svg';
import CloseIcon from '../../../public/assets/close-icon.svg';

const SideMenu = () => {
  const { isOpen, closeSideMenu } = useSideMenu(); // 컨텍스트 값 사용

  return (
    <>
      {/* 오버레이 클릭 시 사이드 메뉴 닫기 */}
      <div className={clsx('fixed inset-0 z-10 size-full bg-black/50', { hidden: !isOpen })} onClick={closeSideMenu} />

      {/* 사이드 메뉴 */}
      <nav
        className={clsx(
          'fixed z-20 size-full bg-white p-6 shadow-lg transition-transform dark:bg-neutral-900 md:w-72',
          {
            '-translate-x-full': !isOpen,
            'translate-x-0': isOpen,
          }
        )}
      >
        <div className='absolute right-5 top-5'>
          <IconButton
            icon={<CloseIcon />} // 아이콘 전달
            ariaLabel='사이드메뉴 닫기' // 접근성 라벨
            onClick={closeSideMenu}
          />
        </div>

        {/* 프로필 섹션 */}
        <div className='flex gap-2'>
          <div className='flex items-center justify-center'>
            <AvatarDefaultIcon className='size-12' />
          </div>
          <div className='flex flex-col justify-center'>
            <p className='text-base font-bold'>산책자님</p>
            <p className='text-sm text-gray-600 dark:text-gray-400'>회원가입 서비스 준비중</p>
          </div>
        </div>
      </nav>
    </>
  );
};

export default SideMenu;
