'use client';

import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useEffect, useState } from 'react';

import { useTheme } from 'next-themes';

// 기본 스타일 임포트

const CustomToastContainer = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ToastContainer
      position='top-right'
      transition={Slide}
      autoClose={3000}
      closeOnClick
      draggable
      theme={mounted && resolvedTheme === 'dark' ? 'dark' : 'light'}
    />
  );
};

export default CustomToastContainer;
