'use client';

import React, { useEffect, useState } from 'react';
import { useProgress } from './progress-provider';

export function LoadingBar() {
  const { isLoading } = useProgress();
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (isLoading) {
      // Reset progress
      setProgress(10);
      
      // Simulate progress
      const timer1 = setTimeout(() => setProgress(30), 100);
      const timer2 = setTimeout(() => setProgress(60), 200);
      const timer3 = setTimeout(() => setProgress(90), 300);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      // Quickly complete the progress bar
      setProgress(100);
      
      // Reset after completion animation finishes
      const resetTimer = setTimeout(() => {
        setProgress(0);
      }, 200);
      
      return () => clearTimeout(resetTimer);
    }
  }, [isLoading]);
  
  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
      style={{ height: '3px' }}
    >
      <div 
        className="h-full transition-all ease-out duration-300"
        style={{ 
          width: `${progress}%`,
          backgroundColor: '#A87C39', // Warm gold color matching the Linguosity theme
          boxShadow: '0 0 10px rgba(168, 124, 57, 0.4)' // Subtle glow
        }}
      />
    </div>
  );
}