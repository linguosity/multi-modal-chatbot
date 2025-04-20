import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, FileText, PlusCircle, AlertCircle, CheckCircle } from "lucide-react";
import BatchJobStatus from './BatchJobStatus';
import { SpeechLanguageReport } from '@/types/reportSchemas';
import { useBatchReportUpdater } from '@/hooks/useBatchReportUpdater';
import { createReportSkeleton } from '@/lib/reportUtils';

interface BatchRequestDemoProps {
  initialReport?: SpeechLanguageReport;
}

export function BatchRequestDemo({ initialReport = createReportSkeleton() }: BatchRequestDemoProps) {
  // Use our custom hook for batch processing
  const {
    report,
    isUpdating,
    batchId,
    batchStatus,
    error,
    processText,
    processPdf,
    handleBatchComplete,
    handleBatchError
  } = useBatchReportUpdater(initialReport);

  // Local state for form inputs
  const [inputText, setInputText] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'text' | 'pdf'>('text');
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Handle text input submission
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isUpdating) return;

    try {
      await processText(inputText);
      // Clear input after submission
      setInputText('');
    } catch (error) {
      console.error('Error processing text:', error);
    }
  };

  // Handle PDF file upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile(file);

    try {
      // Convert PDF to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        // Remove data URL prefix
        const base64Content = base64Data.split(',')[1];
        
        // Process the PDF
        await processPdf(base64Content);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading PDF:', error);
    }
  };

  // Render different UI based on batch status
  const renderContent = () => {
    // If we have an active batch job
    if (batchId && batchStatus === 'processing') {
      return (
        <div className="my-6">
          <BatchJobStatus 
            batchId={batchId}
            onComplete={handleBatchComplete}
            onError={handleBatchError}
          />
        </div>
      );
    }

    // If we had an error
    if (error) {
      return (
        <Alert variant="destructive" className="my-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    // If we successfully completed a batch job
    if (batchStatus === 'completed') {
      return (
        <Alert variant="success" className="my-6 bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Report updated successfully!</AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Report Generation</CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'text' | 'pdf')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Text Input
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              PDF Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text">
            <form onSubmit={handleTextSubmit}>
              <div className="space-y-4">
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter observation notes, assessment data, or other information..."
                  className="min-h-32 text-sm"
                  disabled={isUpdating}
                />
                
                <Button 
                  type="submit" 
                  disabled={!inputText.trim() || isUpdating}
                  className="w-full"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Process Text Input'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="pdf">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="pdf-upload"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                  disabled={isUpdating}
                />
                <label 
                  htmlFor="pdf-upload" 
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <PlusCircle className="h-8 w-8 text-gray-400 mb-3" />
                  <span className="text-sm font-medium">
                    {pdfFile ? pdfFile.name : 'Click to upload PDF'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    Upload assessment reports or other documents
                  </span>
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {renderContent()}
        
        {/* JSON Preview Button */}
        <div className="mt-8 text-right">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowJsonPreview(!showJsonPreview)}
          >
            {showJsonPreview ? 'Hide JSON' : 'View Report JSON'}
          </Button>
        </div>
        
        {/* JSON Preview */}
        {showJsonPreview && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md overflow-auto max-h-96">
            <pre className="text-xs">{JSON.stringify(report, null, 2)}</pre>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between text-xs text-gray-500">
        <div>
          Using Claude 3.5 Sonnet for batch processing
        </div>
        <div>
          {report.metadata?.lastUpdated ? `Last updated: ${new Date(report.metadata.lastUpdated).toLocaleString()}` : ''}
        </div>
      </CardFooter>
    </Card>
  );
}