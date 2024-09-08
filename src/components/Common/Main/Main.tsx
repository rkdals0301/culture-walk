import styles from './Main.module.scss';

const Main = ({ children }: { children: React.ReactNode }) => <main className={styles.main}>{children}</main>;

export default Main;
