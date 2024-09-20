'use client';

import { useTheme } from 'next-themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // 기본 스타일 임포트

const CustomToastContainer = () => {
  const { resolvedTheme } = useTheme();

  return (
    <ToastContainer
      position='top-right'
      autoClose={3000}
      hideProgressBar={false}
      closeOnClick={true}
      draggable={true}
      theme={resolvedTheme}
    />
  );
};

export default CustomToastContainer;
