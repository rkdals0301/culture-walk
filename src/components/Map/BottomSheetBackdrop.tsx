// src/components/Backdrop.tsx
import { motion } from 'framer-motion';

interface BackdropProps {
  isOpen: boolean;
  onClick: () => void;
}

const Backdrop: React.FC<BackdropProps> = ({ isOpen, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 999,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
    />
  );
};

export default Backdrop;
