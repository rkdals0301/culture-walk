'use client';

import { useSideMenu } from '@/context/SideMenuContext'; // 컨텍스트에서 가져오기
import ThemeSwitcher from '@/components/Theme/ThemeSwitcher';
import styles from './SideMenu.module.scss';
import AvatarDefaultIcon from '../../../public/assets/avatar-default.svg';
import CloseIcon from '../../../public/assets/close-icon.svg';

const SideMenu = () => {
  const { isOpen, closeSideMenu } = useSideMenu(); // 컨텍스트 값 사용

  return (
    <>
      {/* 오버레이 클릭 시 사이드 메뉴 닫기 */}
      <div className={`${styles['overlay']} ${isOpen ? styles['open'] : ''}`} onClick={closeSideMenu} />

      {/* 사이드 메뉴 */}
      <nav className={`${styles['side-menu']} ${isOpen ? styles['open'] : ''}`}>
        {/* 닫기 버튼 */}
        <button className={`button ${styles['close-button']}`} onClick={closeSideMenu}>
          <CloseIcon />
        </button>

        {/* 프로필 섹션 */}
        <div className={styles['profile']}>
          <div className={styles['avatar-wrapper']}>
            <AvatarDefaultIcon />
          </div>
          <div className={styles['content-wrapper']}>
            <p className={styles['name']}>산책자님</p>
            <p>회원가입 서비스 준비중</p>
          </div>
        </div>

        {/* 다크 모드 토글 섹션 */}
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
