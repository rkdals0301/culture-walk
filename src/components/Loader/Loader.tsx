import { ClipLoader } from 'react-spinners';

interface LoaderProps {
  color?: string;
  size?: number;
  speedMultiplier?: number;
}

const Loader = ({ color = '#007bff', size = 50, speedMultiplier = 1 }: LoaderProps) => {
  return (
    <div className='flex size-full items-center justify-center'>
      <ClipLoader color={color} size={size} speedMultiplier={speedMultiplier} />
    </div>
  );
};

export default Loader;
