interface LoaderProps {
  color?: string;
  size?: number;
  isFullscreen?: boolean; // 전체화면 여부
}

const Loader = ({ color = 'var(--color-brand-primary)', size = 42, isFullscreen = false }: LoaderProps) => {
  return (
    <div
      className={`flex size-full items-center justify-center ${
        isFullscreen ? 'fixed inset-0 z-50 bg-[var(--color-overlay)] backdrop-blur-sm' : ''
      }`}
    >
      <span
        role='status'
        aria-label='불러오는 중'
        className='inline-block animate-spin rounded-full border-[3px]'
        style={{
          width: size,
          height: size,
          borderColor: color,
          borderRightColor: 'transparent',
        }}
      />
    </div>
  );
};

export default Loader;
