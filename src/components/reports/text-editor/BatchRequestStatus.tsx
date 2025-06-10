import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { SpeechLanguageReport } from '@/types/reportSchemas';
import { Spinner } from "@/components/ui/spinner";
import { Check } from 'lucide-react';

interface BatchRequestStatusProps {
  batchId: string;
  originalReport: SpeechLanguageReport;
  sections: string[];
  onComplete: (updatedReport: SpeechLanguageReport) => void;
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
  const [totalRequests, setTotalRequests] = useState(1); // Default to 1 for batch API
  const [pollCount, setPollCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const MAX_POLLS = 60; // Maximum number of polls (10 minutes at 10s intervals)
  const POLL_INTERVAL = 10000; // Poll every 10 seconds

  // Function to poll for batch status
  const pollBatchStatus = async () => {
    if (pollCount >= MAX_POLLS) {
      setError('Maximum polling time exceeded');
      onError('Batch processing timed out after 10 minutes');
      return;
    }

    try {
      // Log the batch ID being used for status polling
      console.log(`🔍 Polling batch status for ID: ${batchId} (poll #${pollCount + 1})`);
      
      // Check if batch ID has correct format (Claude Batch API uses msgbatch_ prefix)
      if (!batchId.startsWith('msgbatch_')) {
        console.warn(`⚠️ Polling with unexpected batch ID format: ${batchId}`);
        console.warn(`⚠️ Expected format is msgbatch_* for Anthropic Batch API`);
      }
      
      // Fetch the current status
      const response = await fetch(`/api/batch/status?batchId=${batchId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check batch status');
      }
      
      const data = await response.json();
      
      // Update the status and progress
      if (data.status) {
        // Map status to our internal status values
        const mappedStatus = 
          data.status === 'in_progress' ? 'in_progress' :
          data.status === 'completed' ? 'completed' : 
          data.status === 'pending' ? 'pending' :
          data.status === 'error' ? 'failed' :
          'in_progress'; // Default to in_progress for other values
        
        setStatus(mappedStatus);
        
        // Handle error status
        if (data.status === 'error') {
          setError(`Batch processing failed: ${data.error || 'Unknown error'}`);
          onError(`Batch processing failed: ${data.error || 'Unknown error'}`);
          return; // Stop polling if batch failed
        }
        
        // Calculate progress based on status
        if (data.status === 'completed') {
          setProgress(100);
          setCompletedRequests(1);
          setTotalRequests(1);
        } else if (data.progress) {
          // If we have progress data, use it
          setProgress(data.progress.percent_complete || Math.min(Math.floor((pollCount / 10) * 100), 90));
          
          // Update completed requests counter if available
          if (data.progress.completed_requests !== undefined) {
            setCompletedRequests(data.progress.completed_requests);
            setTotalRequests(data.progress.total_requests || 1);
          }
        } else {
          // Estimate progress based on poll count
          const estimatedProgress = Math.min(Math.floor((pollCount / 10) * 100), 90);
          setProgress(estimatedProgress);
        }
        
        // If batch is complete and data is available, call onComplete
        if (data.status === 'completed' && data.data) {
          setStatus('completed');
          setProgress(100);
          onComplete(data.data);
          return; // Stop polling
        }
      } else {
        // If no status, estimate progress based on poll count
        const estimatedProgress = Math.min(Math.floor((pollCount / 10) * 100), 90);
        setProgress(estimatedProgress);
      }
      
      // Continue polling if not complete
      if (data.status !== 'completed') {
        setPollCount(prevCount => prevCount + 1);
        setTimeout(pollBatchStatus, POLL_INTERVAL);
      }
    } catch (error) {
      console.error(`❌ Error polling batch status for ID ${batchId}:`, error);
      
      // For network or temporary errors, try a few more times before giving up
      if (pollCount < 3) {
        console.log(`⚠️ Retrying poll (attempt ${pollCount + 1})`);
        setPollCount(prevCount => prevCount + 1);
        setTimeout(pollBatchStatus, POLL_INTERVAL);
        return;
      }
      
      setError(error instanceof Error ? error.message : 'Unknown error');
      onError(error instanceof Error ? error.message : 'Failed to process batch request');
    }
  };

  // Start polling when component mounts
  useEffect(() => {
    if (batchId) {
      pollBatchStatus();
    }
  }, [batchId]); // Depend on batchId instead of empty array

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Starting batch processing...';
      case 'in_progress':
        return `Processing report...`;
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
      <Card className="border-[#EBCCC4] bg-[#F9EFED] rounded-lg shadow-sm">
        <CardContent className="p-5 text-center">
          <div className="text-[#9C4226] font-medium font-display mb-2">Error Processing Report</div>
          <div className="text-sm text-[#AF5334] leading-relaxed">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#DCE4DF] bg-[#F6F8F7] rounded-lg shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-[#3C6E58] font-display">
            {getStatusText()}
          </div>
          {status !== 'completed' && (
            <Spinner className="h-4 w-4 text-[#6C8578]" />
          )}
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-[#DCE4DF] rounded-full h-3">
          <div 
            className="bg-[#6C8578] h-3 rounded-full transition-all duration-500 ease-in-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Sections being processed */}
        <div className="mt-4 text-xs text-[#3C6E58]">
          <div className="mb-2 font-medium font-display">Processing report:</div>
          <div className="flex items-center gap-2">
            <span 
              className={`inline-block px-3 py-1.5 rounded-lg ${
                status === 'completed' 
                  ? 'bg-[#DCE4DF] text-[#3C6E58]' 
                  : 'bg-[#6C8578] text-white'
              }`}
            >
              {status === 'in_progress' && (
                <Spinner className="h-3 w-3 mr-1.5 inline text-white" />
              )}
              Batch Processing
              {status === 'completed' && (
                <Check className="h-3 w-3 ml-1.5 inline" />
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BatchRequestStatus;