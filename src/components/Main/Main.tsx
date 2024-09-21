import styles from './Main.module.scss';

interface MainProps {
  children: React.ReactNode;
}

const Main = ({ children }: MainProps) => {
  return <main className={styles['main']}>{children}</main>;
};

export default Main;
