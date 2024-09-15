// src/components/BottomSheet.tsx
import { motion } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose }) => {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: isOpen ? '350px' : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        zIndex: 1000,
        overflow: 'hidden',
        pointerEvents: isOpen ? 'auto' : 'none',
        transform: `translateY(${isOpen ? '0' : '100%'})`,
      }}
    >
      <div style={{ padding: '20px' }}></div>
    </motion.div>
  );
};

export default BottomSheet;
