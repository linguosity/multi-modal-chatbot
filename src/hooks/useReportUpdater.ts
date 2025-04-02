import { useState, useCallback } from 'react';

// Define the report sections interface
export interface ReportSections {
  [key: string]: string;
}

export const useReportUpdater = (initialSections: Record<string, string> = {}) => {
  // Clean empty strings from initial sections
  const cleanedInitialSections = Object.entries(initialSections)
    .filter(([_, value]) => value && value.trim().length > 0)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as ReportSections);

  const [sections, setSections] = useState<ReportSections>(cleanedInitialSections);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const updateReport = useCallback(async (input: string) => {
    if (!input.trim()) return;
    
    setIsUpdating(true);
    setError(null);
    setLastUpdated([]);
    
    try {
      console.log('🔄 Sending to API with sections:', sections);
      
      const response = await fetch('/api/update-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          sections,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update report');
      }

      const updatedSections = await response.json();
      
      console.log('🔄 Received updated sections from API:', updatedSections);
      
      // Don't filter here - trust the API to return only valid sections
      // Instead, merge with existing sections to preserve content
      const mergedSections = {
        ...sections,
        ...updatedSections
      };
      
      console.log('🔄 After merging with current sections:', mergedSections);
      
      // Track which sections were modified
      const updatedSectionNames = Object.keys(updatedSections).filter(key => 
        updatedSections[key] !== sections[key]
      );
      
      setSections(mergedSections);
      setLastUpdated(updatedSectionNames);
      
      return updatedSectionNames;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error updating report:', err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [sections]);

  const updateSectionManually = useCallback((sectionKey: string, content: string) => {
    setSections(prev => {
      const updated = { ...prev };
      
      // If content is empty, remove the key
      if (!content || content.trim() === '') {
        delete updated[sectionKey];
      } else {
        updated[sectionKey] = content;
      }
      
      return updated;
    });
  }, []);

  return {
    sections,
    isUpdating,
    lastUpdated,
    error,
    updateReport,
    updateSectionManually,
    setSections
  };
};