import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

interface BatchJobStatusProps {
  batchId: string;
  onComplete: (reportData: any) => void;
  onError: (error: string) => void;
}

export default function BatchJobStatus({ batchId, onComplete, onError }: BatchJobStatusProps) {
  const [status, setStatus] = useState<'queued' | 'in_progress' | 'completed' | 'failed' | 'unknown'>('unknown');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  
  // Polling interval (in milliseconds)
  const POLLING_INTERVAL = 3000;
  
  // Maximum number of retries
  const MAX_RETRIES = 60; // 3 minutes at 3-second intervals
  
  // Current retry count
  const [retryCount, setRetryCount] = useState(0);
  
  // Poll for batch job status
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/batch/status?batchId=${batchId}`);
        const data = await response.json();
        
        if (response.ok) {
          setStatus(data.status);
          
          // Update progress if available
          if (data.progress && typeof data.progress.percent_complete === 'number') {
            setProgress(data.progress.percent_complete);
          }
          
          // Handle completion
          if (data.status === 'completed' && data.data) {
            setIsPolling(false);
            onComplete(data.data);
          }
        } else {
          setError(data.error || 'Failed to fetch batch status');
          
          // Stop polling on persistent errors
          setRetryCount(prev => {
            const newCount = prev + 1;
            if (newCount >= MAX_RETRIES) {
              setIsPolling(false);
              onError('Maximum retry attempts exceeded');
            }
            return newCount;
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        
        // Increment retry count
        setRetryCount(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_RETRIES) {
            setIsPolling(false);
            onError('Maximum retry attempts exceeded');
          }
          return newCount;
        });
      }
    };
    
    // Start polling immediately
    checkStatus();
    
    // Set up interval if polling is active
    if (isPolling) {
      intervalId = setInterval(checkStatus, POLLING_INTERVAL);
    }
    
    // Clean up
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [batchId, isPolling, onComplete, onError]);
  
  // Status display helpers
  const getStatusDisplay = () => {
    switch (status) {
      case 'queued':
        return 'Queued';
      case 'in_progress':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Initializing';
    }
  };
  
  const getStatusBadgeColor = () => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getStatusIcon = () => {
    switch (status) {
      case 'queued':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };
  
  // Handle manual retry
  const handleRetry = () => {
    setError(null);
    setIsPolling(true);
    setRetryCount(0);
  };
  
  return (
    <Card className="p-4 border border-gray-200 bg-white">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Report Generation</h3>
        <Badge className={`text-xs py-1 px-2 flex items-center gap-1.5 border ${getStatusBadgeColor()}`}>
          {getStatusIcon()}
          {getStatusDisplay()}
        </Badge>
      </div>
      
      <ProgressBar value={progress} className="h-2 mb-4" />
      
      <div className="text-sm text-gray-600">
        {status === 'queued' && (
          <p>Your report is in the queue and will be processed shortly...</p>
        )}
        
        {status === 'in_progress' && (
          <p>Processing your report data. This may take a few minutes...</p>
        )}
        
        {status === 'completed' && (
          <p className="text-green-600">Report generation complete!</p>
        )}
        
        {status === 'failed' && (
          <div className="text-red-600">
            <p className="mb-2">Error: {error || 'Failed to process report'}</p>
            <Button size="sm" variant="outline" onClick={handleRetry} className="mt-1">
              Retry
            </Button>
          </div>
        )}
        
        {status === 'unknown' && (
          <p className="flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Connecting to Claude...
          </p>
        )}
      </div>
      
      <div className="text-xs text-gray-400 mt-3">
        Batch ID: {batchId.slice(0, 8)}...
      </div>
    </Card>
  );
}