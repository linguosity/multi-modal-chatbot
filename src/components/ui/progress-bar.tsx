'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface ProgressBarProps {
  color?: string;
  height?: number;
  duration?: number;
}

export function ProgressBar({
  color = '#A87C39', // Warm gold color matching the Linguosity theme
  height = 3,
  duration = 300,
}: ProgressBarProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // This runs on mount - no need to show progress bar
    return;
  }, []);

  // Watch for URL changes
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Start the progress bar
    setLoading(true);
    setProgress(10);
    
    // Simulate progress
    timer = setTimeout(() => {
      setProgress(100);
      
      // Once progress is complete, hide the progress bar
      const completeTimer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200); // Small delay to allow transition to complete
      
      return () => clearTimeout(completeTimer);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [pathname, searchParams, duration]);

  if (!loading) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
      style={{ height: `${height}px` }}
    >
      <div 
        className="h-full transition-all ease-out duration-300"
        style={{ 
          width: `${progress}%`,
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}40`
        }}
      />
    </div>
  );
}

export default ProgressBar;