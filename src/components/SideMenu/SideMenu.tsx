'use client';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { closeSideMenu } from '@/slices/sideMenuSlice';
import ThemeSwitcher from '@/components/Theme/ThemeSwitcher';
import styles from './SideMenu.module.scss';
import AvatarDefaultIcon from '../../../public/assets/avatar-default.svg';
import CloseIcon from '../../../public/assets/close-icon.svg';

const SideMenu = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.sideMenu.isOpen); // 타입을 명시해주면 좋습니다.

  const handlerCloseSideMenu = () => {
    dispatch(closeSideMenu());
  };

  return (
    <>
      <div className={`${styles['overlay']} ${isOpen ? styles['open'] : ''}`} onClick={handlerCloseSideMenu} />
      <nav className={`${styles['side-menu']} ${isOpen ? styles['open'] : ''}`}>
        <button className={styles['close-button']} onClick={handlerCloseSideMenu}>
          <CloseIcon />
        </button>
        <div className={styles['profile']}>
          <div className={styles['avatar-wrapper']}>
            <AvatarDefaultIcon />
          </div>
          <div className={styles['content-wrapper']}>
            <p className={styles['name']}>산책자님</p>
            <p>회원가입 서비스 준비중</p>
          </div>
        </div>
        <div className={styles['theme-toggle-wrapper']}>
          <div className={styles['title']}>다크모드</div>
          <div className={styles['value']}>
            <ThemeSwitcher />
          </div>
        </div>
      </nav>
    </>
  );
};

export default SideMenu;
