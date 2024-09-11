import styles from './SideMenu.module.scss';

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
      </div>
    </>
  );
};

export default SideMenu;
