'use client';

import IconButton from '@/components/Common/IconButton';
import { useSideMenu } from '@/context/SideMenuContext';

import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';

import CloseIcon from '../../../public/assets/images/close-icon.svg';

const SideMenu = () => {
  const { isOpen, closeSideMenu } = useSideMenu();

  return (
    <>
      <div
        className={clsx('fixed inset-0 z-30 size-full bg-[#081311]/50 backdrop-blur-sm', { hidden: !isOpen })}
        onClick={closeSideMenu}
      />

      <nav
        className={clsx(
          'surface-panel fixed left-0 top-0 z-40 flex h-dvh w-[92vw] max-w-sm flex-col gap-8 rounded-r-[32px] p-5 transition-transform duration-300 sm:p-6',
          {
            '-translate-x-full': !isOpen,
            'translate-x-0': isOpen,
          }
        )}
      >
        <div className='flex items-start justify-between gap-4'>
          <Link href='/map' className='flex items-center gap-4' onClick={closeSideMenu}>
            <Image
              src='/assets/images/logo-128.png'
              alt='CultureWalk'
              width={52}
              height={52}
              className='rounded-3xl shadow-[0_22px_44px_-28px_rgba(31,118,95,0.95)]'
            />
            <div>
              <p className='text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-[#1f765f] dark:text-[#8dc5b5]'>
                Seoul Culture Map
              </p>
              <h2 className='text-xl font-semibold tracking-[-0.03em]'>CultureWalk</h2>
            </div>
          </Link>
          <IconButton
            icon={<CloseIcon />}
            ariaLabel='사이드메뉴 닫기'
            onClick={closeSideMenu}
            variant='secondary'
          />
        </div>

        <div className='space-y-3'>
          <p className='text-sm leading-6 text-[var(--app-muted)]'>
            서울 곳곳에서 열리는 전시, 공연, 축제를 지도 위에서 빠르게 훑고 바로 이동하는 문화 탐색 앱입니다.
          </p>
          <div className='grid gap-3'>
            <div className='surface-card rounded-[24px] p-4'>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[#1f765f] dark:text-[#8dc5b5]'>
                Explore
              </p>
              <p className='mt-2 text-lg font-semibold tracking-[-0.03em]'>지도 중심 탐색</p>
              <p className='mt-1 text-sm text-[var(--app-muted)]'>행사 위치와 거리감을 한 번에 비교할 수 있습니다.</p>
            </div>
            <div className='surface-card rounded-[24px] p-4'>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[#1f765f] dark:text-[#8dc5b5]'>
                Search
              </p>
              <p className='mt-2 text-lg font-semibold tracking-[-0.03em]'>빠른 검색과 비교</p>
              <p className='mt-1 text-sm text-[var(--app-muted)]'>
                상단 검색에서 공연명, 전시명, 축제명을 바로 찾아 결과를 비교할 수 있습니다.
              </p>
            </div>
            <div className='surface-card rounded-[24px] p-4'>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[#1f765f] dark:text-[#8dc5b5]'>
                Follow
              </p>
              <p className='mt-2 text-lg font-semibold tracking-[-0.03em]'>행사 상세로 바로 이동</p>
              <p className='mt-1 text-sm text-[var(--app-muted)]'>바텀시트에서 포털과 상세 링크를 바로 열 수 있습니다.</p>
            </div>
          </div>
        </div>

        <div className='surface-card mt-auto rounded-[24px] p-4'>
          <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]'>Current mode</p>
          <p className='mt-2 text-base font-semibold'>Route-centered visual system</p>
          <p className='mt-1 text-sm text-[var(--app-muted)]'>브랜드 아이콘과 UI를 하나의 경로 중심 언어로 통일했습니다.</p>
        </div>
      </nav>
    </>
  );
};

export default SideMenu;
