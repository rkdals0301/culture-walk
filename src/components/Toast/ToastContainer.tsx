'use client';

import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useTheme } from 'next-themes';

// 기본 스타일 임포트

const CustomToastContainer = () => {
  const { resolvedTheme } = useTheme();

  return (
    <ToastContainer
      position='top-right'
      transition={Slide}
      autoClose={3000}
      closeOnClick
      draggable
      theme={resolvedTheme}
    />
  );
};

export default CustomToastContainer;
