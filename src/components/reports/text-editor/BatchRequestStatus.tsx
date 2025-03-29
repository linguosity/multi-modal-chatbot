import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { SpeechLanguageReport } from '@/types/reportTypes';
import { Spinner } from "@/components/ui/spinner";

interface BatchRequestStatusProps {
  batchId: string;
  originalReport: SpeechLanguageReport;
  sections: string[];
  onComplete: (updatedReport: SpeechLanguageReport, commands: any[], affectedDomains: string[]) => void;
  onError: (error: string) => void;
}

/**
 * Component for displaying batch request status and polling for results
 */
export const BatchRequestStatus: React.FC<BatchRequestStatusProps> = ({
  batchId,
  originalReport,
  sections,
  onComplete,
  onError
}) => {
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed' | 'failed'>('pending');
  const [progress, setProgress] = useState(0);
  const [completedRequests, setCompletedRequests] = useState(0);
  const [totalRequests, setTotalRequests] = useState(sections.length);
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const MAX_POLLS = 60; // Maximum number of polls (10 minutes at 10s intervals)
  const POLL_INTERVAL = 10000; // Poll every 10 seconds

  // State for tracking the current batch ID (may change if we switch to simulation)
  const [currentBatchId, setCurrentBatchId] = useState(batchId);
  
  // Function to poll for batch status
  const pollBatchStatus = async () => {
    if (pollCount >= MAX_POLLS) {
      setError('Maximum polling time exceeded');
      onError('Batch processing timed out after 10 minutes');
      return;
    }

    try {
      // Log the batch ID being used for status polling
      console.log(`🔍 Polling batch status for ID: ${currentBatchId} (poll #${pollCount + 1})`);
      
      // Validate batch ID format before polling
      if (!currentBatchId.startsWith('msgbatch_') && !currentBatchId.startsWith('simulated_') && 
          !currentBatchId.startsWith('error_') && !currentBatchId.startsWith('pdf_batch_')) {
        console.warn(`⚠️ Polling with unexpected batch ID format: ${currentBatchId}`);
        console.warn(`⚠️ Expected formats are msgbatch_* for Anthropic, simulated_*/error_* for simulation, or pdf_batch_* for PDF processing`);
        // Continue anyway as the API can handle invalid formats through simulation
      }
      
      // Handle PDF batch (this is our own internal ID format)
      const isPdfBatch = currentBatchId.startsWith('pdf_batch_');
      if (isPdfBatch) {
        console.log(`📊 PDF batch detected: ${currentBatchId}`);
        // For PDF batches, we'll simulate progress based on poll count
        // until we get a proper batch ID from the API
        
        // Simulate some progress
        const progressPercent = Math.min(Math.floor((pollCount / 10) * 100), 90);
        setProgress(progressPercent);
        
        // After a few polls, assume we have a 25% completion rate
        if (pollCount > 2) {
          setCompletedRequests(Math.floor(sections.length * 0.25));
        }
        
        // After a few more polls, simulate 50% completion
        if (pollCount > 4) {
          setCompletedRequests(Math.floor(sections.length * 0.5));
        }
        
        // Keep polling
        setPollCount(pollCount + 1);
        setTimeout(pollBatchStatus, POLL_INTERVAL);
        return;
      }
      
      // Encode the original report as a URL parameter
      const reportParam = encodeURIComponent(JSON.stringify(originalReport));
      
      // Check if this is a simulated batch (currentBatchId starts with "simulated_")
      const isSimulated = currentBatchId.startsWith('simulated_') || currentBatchId.startsWith('error_');
      
      // For simulated batches, include polling data to help with simulation
      const sectionsList = Array.isArray(sections) ? sections.join(',') : '';
      const simulationParams = isSimulated ? 
        `&pollCount=${pollCount}&sections=${sectionsList}` : '';
        
      // Fetch the current status
      const response = await fetch(`/api/text-editor-test/status?batchId=${currentBatchId}&report=${reportParam}${simulationParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check batch status');
      }
      
      const data = await response.json();
      
      // Update the status and progress
      if (data.batchStatus) {
        // Set the batch status with fallbacks - Anthropic uses processing_status
        // Convert Anthropic's "in_progress" and "ended" to our internal statuses
        const processingStatus = data.batchStatus.processing_status || 'pending';
        const mappedStatus = 
          processingStatus === 'in_progress' ? 'in_progress' :
          processingStatus === 'ended' ? 'completed' : 
          processingStatus; // Use as-is for other values
        
        setStatus(mappedStatus);
        
        // Handle different batch status values
        if (processingStatus === 'failed' || processingStatus === 'error') {
          setError(`Batch processing failed: ${data.batchStatus.error || 'Unknown error'}`);
          onError(`Batch processing failed: ${data.batchStatus.error || 'Unknown error'}`);
          return; // Stop polling if batch failed
        }
        
        // Count completed requests using Anthropic's request_counts
        if (data.batchStatus.request_counts) {
          const requestCounts = data.batchStatus.request_counts;
          
          // Get counts from Anthropic's structure
          const completed = requestCounts.succeeded || 0;
          const total = (requestCounts.processing || 0) + 
                       (requestCounts.succeeded || 0) + 
                       (requestCounts.errored || 0) + 
                       (requestCounts.canceled || 0) + 
                       (requestCounts.expired || 0);
          
          setCompletedRequests(completed);
          setTotalRequests(total > 0 ? total : sections.length);
          
          // Calculate progress percentage based on tool response counts
          const progressPercent = total > 0 
            ? Math.floor((completed / total) * 100)
            : Math.min(Math.floor((pollCount / 10) * 100), 90); // Fallback to time-based progress capped at 90%
            
          // Make sure progress is actually updated and shows incremental changes
          setProgress(prev => {
            // Only increase progress, never decrease
            if (progressPercent > prev) {
              return progressPercent;
            }
            // If we have completed requests but progress hasn't changed, add a small increment
            else if (completed > 0 && prev < 95) {
              return Math.min(prev + 5, 95); // Add 5% but cap at 95% until complete
            }
            return prev;
          });
          
          // Check for errors in individual requests
          const failedRequests = requestCounts.errored || 0;
          if (failedRequests > 0) {
            console.warn(`${failedRequests} requests failed in batch ${currentBatchId}`);
            // Continue polling, as some requests may still succeed
          }
        } else {
          // If there's no requests array, estimate progress based on poll count
          const estimatedProgress = Math.min(Math.floor((pollCount / 10) * 100), 90);
          setProgress(estimatedProgress);
        }
        
        // If batch is complete, call onComplete with the updated report
        if (data.complete && data.report) {
          setStatus('completed');
          setProgress(100);
          onComplete(data.report, data.updateCommands || [], data.affectedDomains || []);
          return; // Stop polling
        }
      } else {
        // If no batch status, estimate progress based on poll count
        const estimatedProgress = Math.min(Math.floor((pollCount / 10) * 100), 90);
        setProgress(estimatedProgress);
      }
      
      // Continue polling if not complete
      if (!data.complete) {
        setPollCount(pollCount + 1);
        setTimeout(pollBatchStatus, POLL_INTERVAL);
      }
    } catch (error) {
      console.error(`❌ Error polling batch status for ID ${currentBatchId}:`, error);
      
      // Check if this is a batch ID format issue
      if (!currentBatchId.startsWith('msgbatch_') && !currentBatchId.startsWith('simulated_') && !currentBatchId.startsWith('error_')) {
        console.error(`❌ Likely batch ID format issue. Invalid batch ID: ${currentBatchId}`);
        console.error(`❌ Anthropic requires batch IDs to start with 'msgbatch_' prefix`);
        
        // Attempt to continue with simulation mode
        console.log(`⚠️ Falling back to simulation mode due to batch ID format error`);
        const simulatedBatchId = `simulated_fallback_${Date.now().toString(36)}`;
        
        // Update the batch ID to use simulation mode instead
        console.log(`⚠️ Replacing invalid batch ID with simulation ID: ${simulatedBatchId}`);
        setCurrentBatchId(simulatedBatchId);
        
        // Notify user of the issue without failing completely
        setStatus('in_progress');
        setProgress(25); // Show some progress
        
        // Don't call onError yet, allow simulation to continue
        setPollCount(pollCount + 1);
        setTimeout(pollBatchStatus, POLL_INTERVAL);
        return;
      }
      
      // For network or temporary errors, try a few more times before giving up
      if (pollCount < 3) {
        console.log(`⚠️ Retrying poll (attempt ${pollCount + 1})`);
        setPollCount(pollCount + 1);
        setTimeout(pollBatchStatus, POLL_INTERVAL);
        return;
      }
      
      setError(error instanceof Error ? error.message : 'Unknown error');
      onError(error instanceof Error ? error.message : 'Failed to process batch request');
    }
  };

  // Start polling when component mounts
  useEffect(() => {
    pollBatchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Starting batch processing...';
      case 'in_progress':
        return `Processing sections (${completedRequests}/${totalRequests})...`;
      case 'completed':
        return 'Processing complete!';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Checking status...';
    }
  };

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4 text-center">
          <div className="text-red-600 font-medium mb-2">Error Processing Report</div>
          <div className="text-sm text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-blue-700">
            {getStatusText()}
          </div>
          {status !== 'completed' && (
            <Spinner className="h-4 w-4 text-blue-600" />
          )}
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-blue-100 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Sections being processed */}
        <div className="mt-3 text-xs text-blue-600">
          <div className="mb-1 font-medium">Processing sections:</div>
          <div className="flex flex-wrap gap-1">
            {sections.map((section, index) => (
              <span 
                key={index}
                className={`inline-block px-2 py-1 rounded flex items-center ${
                  index < completedRequests
                    ? 'bg-blue-200 text-blue-800' 
                    : index === completedRequests 
                      ? 'bg-blue-300 text-blue-800 border border-blue-400' 
                      : 'bg-blue-100 text-blue-600'
                }`}
              >
                {index === completedRequests && status === 'in_progress' && (
                  <Spinner className="h-3 w-3 mr-1 text-blue-600" />
                )}
                {section.split('.').slice(-1)[0]}
                {index < completedRequests && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchRequestStatus;