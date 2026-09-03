'use client';

import { useEffect, useState } from 'react';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
      autoClose={3600}
      closeOnClick
      draggable
      newestOnTop
      limit={3}
      pauseOnFocusLoss
      pauseOnHover
      theme={mounted && resolvedTheme === 'dark' ? 'dark' : 'light'}
      className='culture-toast-container'
      toastClassName='culture-toast'
      bodyClassName='culture-toast-body'
      progressClassName='culture-toast-progress'
    />
  );
};

export default CustomToastContainer;
