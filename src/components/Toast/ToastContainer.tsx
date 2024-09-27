'use client';

import { useTheme } from 'next-themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // 기본 스타일 임포트

const CustomToastContainer = () => {
  const { resolvedTheme } = useTheme();

  return (
    <ToastContainer
      position='top-right'
      autoClose={3010}
      limit={1}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss={false}
      draggable
      pauseOnHover={false}
      theme={resolvedTheme}
    />
  );
};

export default CustomToastContainer;
