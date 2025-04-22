'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    // Server-side environment - safer to modify TLS settings
    if (process?.env?.NODE_ENV === 'development' && global?.process?.env) {
      global.process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      console.log('TLS certificate verification disabled for development');
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

// New type for collapsible section groups
interface ReportSectionGroup {
  title: string;
  url?: string;
  items?: { 
    title: string;
    url: string; 
    id?: string;
    isActive?: boolean;
  }[];
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
  console.log('ReportsProvider component rendering');
  useEffect(() => {
    console.log("ReportsProvider mounted");
  }, []);
  
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [sectionGroups, setSectionGroups] = useState<ReportSectionGroup[]>([]);
  const [currentSectionId, setCurrentSectionId] = useState<string>('');

  console.log('ReportsProvider: state initialized');

  const handleSectionChange = (sectionId: string) => {
    console.log('ReportsProvider: handleSectionChange called with', sectionId);
    setCurrentSectionId(sectionId);
    // This function would be overridden by the report page when needed
  };

  return (
    <ReportsContext.Provider
      value={{
        reportSections,
        setReportSections,
        sectionGroups,
        setSectionGroups,
        currentSectionId,
        setCurrentSectionId,
        handleSectionChange
      }}
    >
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