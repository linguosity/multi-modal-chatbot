'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Add debugging
console.log('Reports context module loading');

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
  console.log('useReports hook called');
  const context = useContext(ReportsContext);
  if (!context) {
    console.error('useReports hook error: ReportsContext is null');
    throw new Error('useReports must be used within a ReportsProvider');
  }
  console.log('useReports hook: context successfully retrieved');
  return context;
}