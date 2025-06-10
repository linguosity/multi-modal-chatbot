'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

type ProgressContextType = {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
};

const ProgressContext = createContext<ProgressContextType | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);
  
  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);
  
  // Track route changes to show/hide the loading bar
  useEffect(() => {
    startLoading();
    
    // Create a timeout to stop loading after route changes complete
    const timeoutId = setTimeout(() => {
      stopLoading();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [pathname, searchParams, startLoading, stopLoading]);
  
  return (
    <ProgressContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
    </ProgressContext.Provider>
  );
}

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};