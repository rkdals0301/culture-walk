'use client';

import { useState } from 'react';
import BottomSheet from '@/components/Map/BottomSheet';
import Backdrop from '@/components/Map/BottomSheetBackdrop';
import { useRouter } from 'next/navigation';

const HomePage: React.FC = () => {
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(true);

  const handlerOnClose = () => {
    setIsSheetOpen(false);
    router.push('/map');
  };

  return (
    <div>
      <Backdrop isOpen={isSheetOpen} onClick={handlerOnClose} />
      <BottomSheet isOpen={isSheetOpen} onClose={handlerOnClose} />
    </div>
  );
};

export default HomePage;
