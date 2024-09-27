import { ClipLoader } from 'react-spinners';
import styles from './Loader.module.scss';

interface LoaderProps {
  color?: string;
  size?: number;
  speedMultiplier?: number;
}

const Loader = ({ color = '#007bff', size = 50, speedMultiplier = 1 }: LoaderProps) => {
  return (
    <div className={styles['loader-wrapper']}>
      <ClipLoader color={color} size={size} speedMultiplier={speedMultiplier} />
    </div>
  );
};

export default Loader;
