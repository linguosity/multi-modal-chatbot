'use client';

import React, { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type AnimatedGridProps = {
  children: Array<React.ReactElement>;
  className?: string;
};

export function AnimatedGrid({ children, className = '' }: AnimatedGridProps) {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(
    Array(children.length).fill(true)
  );

  const handleRemoveItem = (index: number) => {
    setVisibleItems(prev => {
      const newItems = [...prev];
      newItems[index] = false;
      return newItems;
    });
  };

  const enhancedChildren = children.map((child, index) => {
    if (!React.isValidElement(child)) return null;
    
    // Only clone and enhance if it has onRemove prop capability
    if (child.props && 'onRemove' in child.props) {
      return React.cloneElement(child, {
        key: index,
        index,
        onRemove: handleRemoveItem,
      });
    }
    
    return React.cloneElement(child, { key: index });
  });

  return (
    <motion.div 
      className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}
      layout
    >
      <AnimatePresence>
        {enhancedChildren.map((child, index) => 
          visibleItems[index] ? <React.Fragment key={index}>{child}</React.Fragment> : null
        )}
      </AnimatePresence>
    </motion.div>
  );
}