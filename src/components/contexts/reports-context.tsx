'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ComponentType, SVGProps } from 'react';

// Handle potential SSL errors at startup in a safer way
console.log('Reports context loading');

// We need to be careful accessing global.process in the browser
// as it might be undefined in client components
try {
  // Client-side safety check
  if (typeof window !== 'undefined') {
    // Client-side environment check
    if (process?.env?.NODE_ENV === 'development') {
      console.log('Reports context in development environment');
    }
  } else {
    // Server-side environment
    if (process?.env?.NODE_ENV === 'development') {
      console.log('Reports context in server environment');
    }
  }
} catch (e) {
  console.error('Environment check failed:', e);
}

// Define types for report sections and related data
interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
  isGenerated?: boolean;
  cards?: any[]; // Type can be expanded as needed
}


interface SectionNavItem {
  title: string;
  url: string;
  id?: string;
  isActive?: boolean;
  /** The full‑size icon shown when sidebar is expanded */
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** The compact icon shown when sidebar is collapsed */
  collapsedIcon: ComponentType<SVGProps<SVGSVGElement>>;
}

interface ReportSectionGroup {
  title: string;
  url?: string;
  items?: SectionNavItem[];
}

interface ReportsContextType {
  // For ReportSidebar
  reportSections: ReportSection[];
  setReportSections: (sections: ReportSection[]) => void;
  
  // New collapsible section groups
  sectionGroups: ReportSectionGroup[];
  setSectionGroups: (groups: ReportSectionGroup[]) => void;
  
  // For ReportEditSidebar
  currentSectionId: string;
  setCurrentSectionId: (id: string) => void;
  
  // Handler for section change (shared)
  handleSectionChange: (sectionId: string) => void;
}

const ReportsContext = createContext<ReportsContextType | null>(null);

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [sectionGroups, setSectionGroups] = useState<ReportSectionGroup[]>([]);
  const [currentSectionId, setCurrentSectionId] = useState<string>('');

  const handleSectionChange = React.useCallback((sectionId: string) => {
    setCurrentSectionId(sectionId);
  }, []);

  const contextValue = React.useMemo(() => ({
    reportSections,
    setReportSections,
    sectionGroups,
    setSectionGroups,
    currentSectionId,
    setCurrentSectionId,
    handleSectionChange
  }), [reportSections, sectionGroups, currentSectionId, handleSectionChange]);

  return (
    <ReportsContext.Provider value={contextValue}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  try {
    const context = useContext(ReportsContext);
    
    if (!context) {
      console.error('ReportsContext not found - falling back to default values');
      // Return a fallback object instead of throwing
      return {
        reportSections: [],
        setReportSections: () => console.warn('setReportSections called outside provider'),
        sectionGroups: [],
        setSectionGroups: () => console.warn('setSectionGroups called outside provider'),
        currentSectionId: '',
        setCurrentSectionId: () => console.warn('setCurrentSectionId called outside provider'),
        handleSectionChange: () => console.warn('handleSectionChange called outside provider')
      };
    }
    
    return context;
  } catch (e) {
    console.error('Error in useReports hook:', e);
    // Return fallback values
    return {
      reportSections: [],
      setReportSections: () => {},
      sectionGroups: [],
      setSectionGroups: () => {},
      currentSectionId: '',
      setCurrentSectionId: () => {},
      handleSectionChange: () => {}
    };
  }
}