import { ClipLoader } from 'react-spinners';

interface LoaderProps {
  color?: string;
  size?: number;
  isFullscreen?: boolean; // 전체화면 여부
}

const Loader = ({ color = '#007bff', size = 50, isFullscreen = false }: LoaderProps) => {
  return (
    <div className={`flex size-full items-center justify-center ${isFullscreen ? 'fixed inset-0 bg-black/80' : ''}`}>
      <ClipLoader color={color} size={size} />
    </div>
  );
};

export default Loader;
