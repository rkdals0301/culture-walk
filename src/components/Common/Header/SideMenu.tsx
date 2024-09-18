import Image from 'next/image';
import styles from './SideMenu.module.scss';
import ThemeToggle from '@/components/Common/Theme/ThemeToggle';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SideMenu = ({ isOpen, onClose }: SideMenuProps) => {
  return (
    <>
      {isOpen && <div className={`${styles['overlay']} ${isOpen ? styles.open : ''}`} onClick={onClose}></div>}
      <div className={`${styles['side-menu']} ${isOpen ? styles.open : ''}`}>
        <button className={styles['close-button']} onClick={onClose}>
          &times;
        </button>
        <div className={styles['profile']}>
          <div className={styles['image-wrapper']}>
            <Image src='/assets/logo.svg' alt='Profile Image' width={50} height={50} priority />
          </div>
          <div className={styles['content-wrapper']}>
            <p className={styles['name']}>산책자님</p>
            <p>회원가입 서비스 준비중</p>
          </div>
        </div>
        <div className={styles['theme-toggle-wrapper']}>
          <div className={styles['title']}>다크모드</div>
          <div className={styles['value']}>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  );
};

export default SideMenu;
