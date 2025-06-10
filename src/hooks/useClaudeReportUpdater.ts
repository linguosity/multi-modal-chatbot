import { useState, useCallback } from 'react';

// Define the report sections interface
export interface ReportSections {
  [key: string]: string;
}

interface UpdateOptions {
  useClaudeAPI?: boolean;
}

/**
 * Custom hook for report updating with Claude integration
 */
export const useClaudeReportUpdater = (initialSections: Record<string, string> = {}) => {
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
  const [updateMethod, setUpdateMethod] = useState<'text' | 'pdf' | null>(null);

  /**
   * Updates report sections based on text input
   */
  const updateReportWithText = useCallback(async (input: string, options: UpdateOptions = {}) => {
    if (!input.trim()) return;
    
    setIsUpdating(true);
    setError(null);
    setLastUpdated([]);
    setUpdateMethod('text');
    
    try {
      console.log('🔄 Sending to API with sections:', sections);
      
      // Choose which API endpoint to use
      const endpoint = options.useClaudeAPI ? '/api/update-report-claude' : '/api/update-report';
      
      const response = await fetch(endpoint, {
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

      const data = await response.json();
      const updatedSections = data.sections || {};
      
      console.log('🔄 Received updated sections from API:', updatedSections);
      
      // Merge with existing sections to preserve content
      const mergedSections = {
        ...sections,
        ...updatedSections
      };
      
      console.log('🔄 After merging with current sections:', mergedSections);
      
      // Track which sections were modified
      const updatedSectionNames = Object.keys(updatedSections);
      
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

  /**
   * Updates report sections based on PDF upload
   */
  const updateReportWithPDF = useCallback(async (pdfData: string) => {
    if (!pdfData) return;
    
    setIsUpdating(true);
    setError(null);
    setLastUpdated([]);
    setUpdateMethod('pdf');
    
    try {
      console.log('🔄 Sending PDF to Claude API with sections');
      
      const response = await fetch('/api/update-report-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfData,
          sections,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process PDF');
      }

      const data = await response.json();
      const updatedSections = data.sections || {};
      
      console.log('🔄 Received updated sections from Claude API:', Object.keys(updatedSections));
      
      // Merge with existing sections to preserve content
      const mergedSections = {
        ...sections,
        ...updatedSections
      };
      
      // Track which sections were modified
      const updatedSectionNames = Object.keys(updatedSections);
      
      setSections(mergedSections);
      setLastUpdated(updatedSectionNames);
      
      return updatedSectionNames;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while processing the PDF';
      setError(errorMessage);
      console.error('Error updating report with PDF:', err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [sections]);

  /**
   * Manually updates a specific section
   */
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
    updateMethod,
    updateReportWithText,
    updateReportWithPDF,
    updateSectionManually,
    setSections
  };
};