'use client'

import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, children }: DrawerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50"
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }} // Disable pointer events when closed
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: isOpen ? "0%" : "100%" }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 right-0 h-full w-96 bg-white shadow-xl z-50 p-6"
      >
        <button onClick={onClose} className="absolute top-4 right-4">
          <X className="h-6 w-6" />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}