import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PdfUploader } from "@/components/reports/PdfUploader";
import { ExportDocxButton } from "@/components/reports/ExportDocxButton";
import { Pencil, Zap } from "lucide-react";
import { SpeechLanguageReport } from '@/types/reportTypes';
import BatchRequestStatus from './BatchRequestStatus';

interface EditorPanelProps {
  inputText: string;
  setInputText: (text: string) => void;
  selectedSection: string;
  setSelectedSection: (section: string) => void;
  isUpdating: boolean;
  error: string | null;
  success: string | null;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  onExportHtml: () => void;
  onClearReport: () => void;
  onViewJson: () => void;
  report: SpeechLanguageReport;
  onPdfUpload: (pdfData: string) => Promise<void>;
  onBatchComplete: (updatedReport: SpeechLanguageReport, commands: any[], affectedDomains: string[]) => void;
  onBatchError: (error: string) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ 
  inputText, 
  setInputText, 
  selectedSection, 
  setSelectedSection, 
  isUpdating, 
  error, 
  success, 
  handleSubmit,
  onExportHtml,
  onClearReport,
  onViewJson,
  report,
  onPdfUpload,
  onBatchComplete,
  onBatchError
}) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [batchStatus, setBatchStatus] = useState<{
    active: boolean;
    batchId: string;
    sections: string[];
  }>({
    active: false,
    batchId: '',
    sections: []
  });

  // Determine if we should use batch mode based on section selection
  const shouldUseBatchMode = () => {
    // Use standard mode if a specific section is selected, otherwise use batch mode
    return selectedSection === 'auto-detect';
  };
  
  // Handle PDF upload - trigger batch processing
  const handlePdfSubmit = async (pdfData: string) => {
    if (isUpdating) return;
    
    try {
      // Close editor panel first
      setEditorOpen(false);
      
      // Forward to parent's PDF upload handler and get the response
      const data = await onPdfUpload(pdfData);
      
      // Check if we got a batch response
      if (data && data.batch && data.batch.id) {
        console.log(`🔄 Setting batch status with ID: ${data.batch.id}`);
        console.log(`🔄 Sections to update: ${data.batch.sections?.join(', ') || 'all'}`);
        
        // Set the batch status with the actual batch ID
        setBatchStatus({
          active: true,
          batchId: data.batch.id,
          sections: data.batch.sections || ['header', 'background', 'assessmentResults', 'conclusion']
        });
      }
      // If using batch mode but no batch ID was returned, set a temporary one
      else if (shouldUseBatchMode()) {
        console.log('⚠️ No batch ID received, using temporary ID');
        setBatchStatus({
          active: true,
          batchId: `pdf_batch_${Date.now()}`, // Create a temporary ID
          sections: ['header', 'background', 'assessmentResults', 'conclusion']
        });
      }
    } catch (err) {
      console.error('❌ PDF processing error in Editor Panel:', err);
      onBatchError(err instanceof Error ? err.message : 'Failed to process PDF');
    }
  };

  // Handle submit - now unified for both standard and batch
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isUpdating) return;
    
    // Determine processing mode based on section selection
    const useBatchMode = shouldUseBatchMode();
    
    try {
      // Prepare the same payload for both modes
      const payload = {
        input: inputText,
        report: report,
        updateSection: selectedSection === 'auto-detect' ? undefined : selectedSection
      };
      
      // Call the API endpoint
      const response = await fetch('/api/text-editor-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process request');
      }
      
      const data = await response.json();
      
      // If we have a batch ID and are in batch mode, start the polling component
      if (useBatchMode && data.batch && data.batch.id) {
        // Validate the batch ID format - for debugging
        if (!data.batch.id.startsWith('msgbatch_') && !data.batch.id.startsWith('simulated_')) {
          console.warn(`⚠️ Unexpected batch ID format from API: ${data.batch.id}`);
          console.warn(`⚠️ Expected formats are msgbatch_* for Anthropic or simulated_* for simulation`);
          // Continue anyway as the status endpoint can handle invalid formats
        }
        
        setBatchStatus({
          active: true,
          batchId: data.batch.id,
          sections: data.batch.sections || []
        });
        
        // Clear input text and hide editor
        setInputText('');
        setEditorOpen(false);
      } else if (!useBatchMode) {
        // For standard mode, let the parent component handle the response
        // This should be handled by the original handleSubmit prop
      } else {
        throw new Error('No batch ID received from API');
      }
    } catch (err) {
      if (useBatchMode) {
        onBatchError(err instanceof Error ? err.message : 'Failed to process request');
      } else {
        // Handle standard mode error through the parent
        console.error("Error in standard mode:", err);
      }
    }
  };

  return (
    <div className="sticky top-4 left-4 z-50 ml-4 mr-4">
      {/* Pencil icon - always rendered but visibility toggled with CSS */}
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-full bg-white border border-gray-200 shadow p-2 hover:bg-gray-100 ${
          editorOpen || batchStatus.active ? "invisible pointer-events-none" : ""
        }`}
        aria-label="Claude JSON Report Editor"
        onClick={() => {
          console.log("[Pencil Button] clicked!");
          setEditorOpen(true);
        }}
      >
        <Pencil className="h-4 w-4 text-gray-500" />
      </Button>
      
      {/* Batch status component */}
      {batchStatus.active && (
        <div className="mb-4">
          <BatchRequestStatus
            batchId={batchStatus.batchId}
            originalReport={report}
            sections={batchStatus.sections}
            onComplete={(updatedReport, commands, affectedDomains) => {
              setBatchStatus({ active: false, batchId: '', sections: [] });
              onBatchComplete(updatedReport, commands, affectedDomains);
            }}
            onError={(error) => {
              setBatchStatus({ active: false, batchId: '', sections: [] });
              onBatchError(error);
            }}
          />
        </div>
      )}
      
      {/* Editor panel - always rendered but visibility toggled with CSS */}
      <div className={`bg-white border shadow-lg rounded-md p-4 w-full absolute 
          top-0 
          left-0 
          right-0 
          p-4 
          bg-white 
          shadow 
          z-[9999] ${
            editorOpen ? "" : "invisible pointer-events-none"
          }`}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">Update Report</div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                console.log("[Editor panel] Close button clicked");
                setEditorOpen(false);
              }}
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>
          
          {/* Processing mode explainer based on section selection */}
          <div className={`${shouldUseBatchMode() ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'} border rounded-md p-2 text-xs ${shouldUseBatchMode() ? 'text-blue-700' : 'text-purple-700'}`}>
            <strong>{shouldUseBatchMode() ? 'Batch Mode:' : 'Standard Mode:'}</strong> {
              shouldUseBatchMode() 
                ? 'Processes multiple sections in parallel for faster results. The editor will close and show a progress tracker while your report is being updated.' 
                : 'Updates a specific section of the report. Select a target section for standard processing.'
            }
          </div>
          
          {/* Input form */}
          <div className="mb-6">
            <form onSubmit={handleSubmitRequest} className="w-full">
              <div className="flex flex-col gap-4">
                {/* Layout for both inputs side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Text input column */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Text Input
                    </label>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Enter observation or assessment data..."
                      className="w-full mb-2 min-h-[150px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isUpdating}
                    />
                  </div>
                  
                  {/* PDF upload column */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      PDF Upload
                    </label>
                    <div className="min-h-[150px] flex items-center">
                      <PdfUploader 
                        onUpload={handlePdfSubmit}
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Section selector and submit button */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4 mt-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Target Section {shouldUseBatchMode() ? '(Auto-detect for batch processing)' : '(Required for standard processing)'}
                    </label>
                    <div className="relative w-full">
                      <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        disabled={isUpdating}
                        className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="auto-detect">Auto-detect section</option>
                        <optgroup label="Header">
                          <option value="header.reasonForReferral">Reason For Referral</option>
                          <option value="header.confidentialityStatement">Confidentiality Statement</option>
                        </optgroup>
                        <optgroup label="Background">
                          <option value="background.studentDemographicsAndBackground.educationalHistory">Educational History</option>
                          <option value="background.healthReport.medicalHistory">Medical History</option>
                          <option value="background.parentGuardianConcerns">Parent/Guardian Concerns</option>
                        </optgroup>
                        <optgroup label="Assessment Results">
                          <option value="assessmentResults.domains.receptive">Receptive Language</option>
                          <option value="assessmentResults.domains.expressive">Expressive Language</option>
                          <option value="assessmentResults.domains.pragmatic">Pragmatic Language</option>
                          <option value="assessmentResults.domains.articulation">Articulation</option>
                          <option value="assessmentResults.domains.voice">Voice</option>
                          <option value="assessmentResults.domains.fluency">Fluency</option>
                          <option value="assessmentResults.observations.classroomObservations">Classroom Observations</option>
                          <option value="assessmentResults.observations.playBasedInformalObservations">Play-Based Observations</option>
                        </optgroup>
                        <optgroup label="Conclusion">
                          <option value="conclusion.conclusion.summary">Conclusion Summary</option>
                          <option value="conclusion.recommendations.services">Service Recommendations</option>
                          <option value="conclusion.eligibility.californiaEdCode">Eligibility Determination</option>
                        </optgroup>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-50"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isUpdating || !inputText.trim()}
                    className={`${shouldUseBatchMode() 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-purple-600 hover:bg-purple-700'} text-white h-10 self-end`}
                  >
                    {isUpdating ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {shouldUseBatchMode() && <Zap className="h-4 w-4 mr-1" />}
                        {shouldUseBatchMode() ? 'Process in Batch' : 'Update Report'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-2 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-2 bg-green-50 text-green-700 rounded-md text-sm">
                {success}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <ExportDocxButton 
              reportData={report} 
              className="text-xs h-8"
            />
            <Button
              variant="outline"
              className="text-xs h-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
              onClick={onExportHtml}
            >
              Export as HTML
            </Button>
            <Button
              variant="outline"
              className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={onClearReport}
            >
              Clear Report
            </Button>
            <Button
              variant="outline"
              className="text-xs h-8"
              onClick={onViewJson}
            >
              View JSON
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;