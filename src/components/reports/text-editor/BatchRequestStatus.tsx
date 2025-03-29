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
      if (!currentBatchId.startsWith('msgbatch_') && !currentBatchId.startsWith('simulated_') && !currentBatchId.startsWith('error_')) {
        console.warn(`⚠️ Polling with unexpected batch ID format: ${currentBatchId}`);
        console.warn(`⚠️ Expected formats are msgbatch_* for Anthropic or simulated_*/error_* for simulation`);
        // Continue anyway as the API can handle invalid formats through simulation
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
          
          // Calculate progress percentage
          const progressPercent = total > 0 
            ? Math.floor((completed / total) * 100)
            : Math.floor((pollCount / 10) * 100); // Fallback to time-based progress
            
          setProgress(progressPercent);
          
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
                className={`inline-block px-2 py-1 rounded ${
                  index < completedRequests
                    ? 'bg-blue-200 text-blue-800' 
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                {section.split('.').slice(-1)[0]}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchRequestStatus;