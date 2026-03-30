import { ClipLoader } from 'react-spinners';

interface LoaderProps {
  color?: string;
  size?: number;
  isFullscreen?: boolean; // 전체화면 여부
}

const Loader = ({ color = '#1F765F', size = 42, isFullscreen = false }: LoaderProps) => {
  return (
    <div
      className={`flex size-full items-center justify-center ${
        isFullscreen ? 'fixed inset-0 z-50 bg-[#081311]/60 backdrop-blur-sm' : ''
      }`}
    >
      <ClipLoader color={color} size={size} />
    </div>
  );
};

export default Loader;
