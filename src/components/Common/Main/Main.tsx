import styles from '@/components/Common/Main/Main.module.scss';

const Main = ({ children }: { children: React.ReactNode }) => <main className={styles.main}>{children}</main>;

export default Main;
