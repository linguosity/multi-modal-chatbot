import { useState, useCallback } from 'react';
import { SpeechLanguageReport } from '@/types/reportSchemas';

/**
 * Custom hook for managing report updates using the Claude Batch API
 */
export const useBatchReportUpdater = (initialReport: SpeechLanguageReport) => {
  // State
  const [report, setReport] = useState<SpeechLanguageReport>(initialReport);
  const [isUpdating, setIsUpdating] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<'idle' | 'submitted' | 'processing' | 'completed' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  /**
   * Process a text input using the batch API
   */
  const processText = useCallback(async (input: string) => {
    if (!input.trim()) return;
    
    setIsUpdating(true);
    setError(null);
    setBatchStatus('submitted');
    setProgress(0);
    
    try {
      // Call the batch submission API
      const response = await fetch('/api/batch/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          currentReport: report
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit batch job');
      }

      const { batchId, requestId } = await response.json();
      
      console.log(`Batch job submitted: ${batchId}, Request ID: ${requestId}`);
      
      // Store the batch ID for future status checks
      setBatchId(batchId);
      setBatchStatus('processing');
      
      return batchId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setBatchStatus('failed');
      console.error('Error submitting batch job:', err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [report]);

  /**
   * Process a PDF file using the batch API
   */
  const processPdf = useCallback(async (pdfData: string) => {
    if (!pdfData) return;
    
    setIsUpdating(true);
    setError(null);
    setBatchStatus('submitted');
    setProgress(0);
    
    try {
      // Call the batch submission API with PDF data
      const response = await fetch('/api/batch/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfData,
          currentReport: report
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit PDF for processing');
      }

      const { batchId, requestId } = await response.json();
      
      console.log(`PDF batch job submitted: ${batchId}, Request ID: ${requestId}`);
      
      // Store the batch ID for future status checks
      setBatchId(batchId);
      setBatchStatus('processing');
      
      return batchId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setBatchStatus('failed');
      console.error('Error submitting PDF batch job:', err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [report]);

  /**
   * Merge batch results with current report
   */
  const mergeResults = useCallback(async (batchId: string) => {
    if (!batchId) return;
    
    try {
      const response = await fetch('/api/batch/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          currentReport: report
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to merge batch results');
      }
      
      const { report: mergedReport } = await response.json();
      
      // Update report with merged data
      setReport(mergedReport);
      setBatchStatus('completed');
      setProgress(100);
      
      return mergedReport;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setBatchStatus('failed');
      console.error('Error merging batch results:', err);
      throw err;
    }
  }, [report]);

  /**
   * Handle successful completion of a batch job
   * This is called by the BatchRequestStatus component when the job is complete
   */
  const handleBatchComplete = useCallback((validatedReport: SpeechLanguageReport) => {
    console.log('Batch job completed with validated report data');
    
    // Update our report state with the validated report from Claude
    setReport(validatedReport);
    setBatchStatus('completed');
    setProgress(100);
    
    // Clear batch ID after successful completion
    setBatchId(null);
  }, []);

  /**
   * Handle batch job error
   * This is called by the BatchRequestStatus component when an error occurs
   */
  const handleBatchError = useCallback((errorMessage: string) => {
    console.error('Batch job failed:', errorMessage);
    
    setError(errorMessage);
    setBatchStatus('failed');
    
    // Don't clear batch ID so user can retry if needed
  }, []);

  /**
   * Update a specific section manually (for user edits)
   */
  const updateSection = useCallback((sectionPath: string[], content: any) => {
    setReport(prev => {
      // Create a deep copy of the report
      const updated = JSON.parse(JSON.stringify(prev));
      
      // Navigate to the target object
      let current = updated;
      for (let i = 0; i < sectionPath.length - 1; i++) {
        const key = sectionPath[i];
        
        // Create path if it doesn't exist
        if (current[key] === undefined) {
          current[key] = {};
        }
        
        current = current[key];
      }
      
      // Set the value at the final path segment
      const lastKey = sectionPath[sectionPath.length - 1];
      
      if (content === null || content === undefined) {
        // Remove the property if content is null/undefined
        delete current[lastKey];
      } else {
        // Update the property
        current[lastKey] = content;
      }
      
      // Update metadata
      updated.metadata = {
        ...updated.metadata,
        lastUpdated: new Date().toISOString(),
        version: (updated.metadata?.version || 0) + 1
      };
      
      return updated;
    });
  }, []);

  return {
    report,
    setReport,
    isUpdating,
    batchId,
    batchStatus,
    error,
    progress,
    processText,
    processPdf,
    mergeResults,
    handleBatchComplete,
    handleBatchError,
    updateSection
  };
};