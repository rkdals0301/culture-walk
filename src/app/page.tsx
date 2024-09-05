import styles from '@/app/page.module.scss';
import ThemeToggle from '@/components/Common/Theme/ThemeToggle';

const Home = () => (
  <div className={styles.home}>
    <ThemeToggle />
  </div>
);

export default Home;
