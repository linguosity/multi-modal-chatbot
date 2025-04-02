'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Unlock } from 'lucide-react';

type LockableCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  index: number;
  onRemove: (index: number) => void;
  background?: string;
};

export function LockableCard({
  title,
  description,
  children,
  className = '',
  index,
  onRemove,
  background = ''
}: LockableCardProps) {
  const [isLocked, setIsLocked] = useState(true);

  const handleLockToggle = () => {
    if (isLocked) {
      // If currently locked, toggle to unlocked
      setIsLocked(false);
    } else {
      // If unlocked, call the onRemove function
      onRemove(index);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className={`relative group ${background}`}>
        <CardHeader className="pb-2 pr-14">
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 opacity-70 group-hover:opacity-100 transition-opacity"
            onClick={handleLockToggle}
            aria-label={isLocked ? "Unlock to remove" : "Remove card"}
          >
            {isLocked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4 text-red-500" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}