import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PdfUploader } from "@/components/reports/PdfUploader";
import { ExportDocxButton } from "@/components/reports/ExportDocxButton";
import { Edit3, Zap, ChevronDown, X, Check, FileText, Target, PenLine, Wand2 } from "lucide-react";
import { SpeechLanguageReport } from '@/types/reportTypes';
import { GlossaryDrawer } from '@/components/ui/glossary-drawer';
import BatchRequestStatus from './BatchRequestStatus';
import SummarizePanel from './SummarizePanel';
import { cn } from "@/lib/utils";

/**
 * Status alert component for showing success or error messages
 */
const StatusAlert = ({ 
  type, 
  message 
}: { 
  type: 'success' | 'error' | null;
  message: string | null;
}) => {
  if (!message) return null;
  
  return (
    <div className={cn(
      "mt-6 p-4 rounded-lg flex items-start gap-3 text-sm animate-fadeIn",
      type === 'success' ? "bg-[#EDF2EF] text-[#3C6E58] border border-[#C8DFD4]" : 
      type === 'error' ? "bg-[#F9EFED] text-[#9C4226] border border-[#EBCCC4]" : ""
    )}>
      {type === 'success' ? (
        <Check className="h-4 w-4 mt-0.5 stroke-[#3C6E58]" />
      ) : (
        <X className="h-4 w-4 mt-0.5 stroke-[#9C4226]" />
      )}
      <span className="leading-relaxed">{message}</span>
    </div>
  );
};

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
  const [activeTab, setActiveTab] = useState<'update' | 'summarize'>('update');
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

  // Handle summary generation
  const handleSummarize = (summary: string) => {
    // Update the report with the summary - this should make an API call
    // In this case, we'll set a section directly
    setSelectedSection('conclusion.conclusion.summary');
    setInputText(summary);
    
    // Now trigger the submit to update the report
    handleSubmitRequest(new Event('submit') as unknown as React.FormEvent);
  };

  // Determine if the user has had a successful result (for progressive disclosure)
  const hasSuccessfulResult = success !== null;

  return (
    <div className="sticky top-4 left-4 z-50 max-w-4xl px-6">
      <div className="flex justify-between items-center">
        {/* Dialog with Edit3 Trigger and Editor Panel Content */}
        <Dialog open={editorOpen} onOpenChange={setEditorOpen} modal={true}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full bg-[#F1EEE9]/80 shadow-sm p-2.5 hover:bg-[#E6E0D6] transition-all",
                "border border-[#E6E0D6] hover:border-[#D8CFC1]",
                batchStatus.active ? "invisible pointer-events-none" : ""
              )}
              aria-label="Open Report Editor"
            >
              <Edit3 className="h-4 w-4 text-[#6C8578]" />
            </Button>
          </DialogTrigger>
        
        <DialogContent className="max-w-4xl w-full p-0 rounded-xl border-0 animate-fadeIn">
          <DialogTitle className="sr-only">Update Report</DialogTitle>
          <Card className="rounded-xl px-8 py-8 border border-[#E6E0D6] bg-[#F8F7F4] shadow-sm">
            {/* Header with title and close button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-medium text-foreground tracking-tight">Update Report</h2>
              <DialogClose asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full hover:bg-[#E6E0D6]/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
            
            {/* Tab interface */}
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'update' | 'summarize')}
              className="mb-6"
            >
              <TabsList className="grid grid-cols-2 bg-[#F1EEE9] p-1 rounded-lg w-full max-w-md mx-auto">
                <TabsTrigger
                  value="update"
                  className={`rounded-md text-sm ${
                    activeTab === 'update'
                      ? 'bg-white text-[#3C6E58] shadow-sm border border-[#E6E0D6]'
                      : 'text-muted-foreground hover:text-[#5A7164]'
                  }`}
                >
                  <PenLine className="h-4 w-4 mr-2" />
                  Update Sections
                </TabsTrigger>
                <TabsTrigger
                  value="summarize"
                  className={`rounded-md text-sm ${
                    activeTab === 'summarize'
                      ? 'bg-white text-[#3C6E58] shadow-sm border border-[#E6E0D6]'
                      : 'text-muted-foreground hover:text-[#5A7164]'
                  }`}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Summary
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="update" className="mt-6">
                <form onSubmit={handleSubmitRequest} className="space-y-8">
              {/* Text input and PDF upload side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col space-y-3">
                  <Label className="font-display text-base font-medium text-foreground">Text Input</Label>
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter observation or assessment data..."
                    className="min-h-[180px] border border-[#E6E0D6] rounded-lg text-sm shadow-none focus-visible:ring-[#6C8578] bg-white focus-visible:border-transparent"
                    disabled={isUpdating}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {inputText.length} characters
                    </span>
                    {inputText.length > 0 && (
                      <span className={cn(
                        "text-xs",
                        inputText.length < 100 ? "text-[#9C4226]" : 
                        inputText.length > 500 ? "text-[#3C6E58]" : "text-[#A87C39]"
                      )}>
                        {inputText.length < 100 ? "Too short" : 
                         inputText.length > 500 ? "Good length" : "Acceptable length"}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3">
                  <Label className="font-display text-base font-medium text-foreground">PDF Upload</Label>
                  <div className="min-h-[180px] flex items-center justify-center rounded-lg border border-[#E6E0D6] bg-[#F1EEE9]/70">
                    <PdfUploader 
                      onUpload={handlePdfSubmit}
                      disabled={isUpdating}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Upload assessment reports or test protocols for batch processing
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mt-6">
              {/* Target section */}
                  <div>
                    <Label className="font-display text-base font-medium flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-[#6C8578]" />
                      <span>Target Section</span>
                      <span className={cn(
                        "text-xs font-sans ml-1.5 px-2 py-0.5 rounded-full", 
                        shouldUseBatchMode() 
                          ? "bg-[#F0DDC5] text-[#8A6534]" 
                          : "bg-[#D1E7DD] text-[#0F5132]"
                      )}>
                        {shouldUseBatchMode() ? 'Batch Processing' : 'Standard Processing'}
                      </span>
                    </Label>
                    
                    <div className="relative">
                      <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        disabled={isUpdating}
                        className="w-full h-11 rounded-lg border border-[#E6E0D6] bg-white px-4 py-2 text-sm appearance-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6C8578] focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="auto-detect">Auto-detect section (for batch processing)</option>
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
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="h-4 w-4 text-[#6C8578] opacity-70" />
                      </div>
                    </div>
                    
                  </div>
                  
                  {/* Submit button */}
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isUpdating || !inputText.trim()}
                      className={cn(
                        "h-11 px-6 text-white rounded-lg font-medium transition-all shadow-sm",
                        shouldUseBatchMode()
                          ? "bg-[#6C8578] hover:bg-[#5A7164] border border-[#5A7164]"
                          : "bg-[#785F73] hover:bg-[#654D60] border border-[#654D60]"
                      )}
                    >
                      {isUpdating ? (
                        <div className="flex items-center gap-2">
                          <Spinner className="h-4 w-4" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {shouldUseBatchMode() && <Zap className="h-4 w-4" />}
                          <span>{shouldUseBatchMode() ? 'Process in Batch' : 'Update Report'}</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              
              {/* Status alerts are rendered here */}
              {(error || success) && (
                <StatusAlert type={error ? 'error' : 'success'} message={error || success} />
              )}
                </form>
              </TabsContent>
              
              <TabsContent value="summarize" className="mt-6">
                <SummarizePanel 
                  report={report}
                  onSummarize={handleSummarize}
                />
              </TabsContent>
            </Tabs>
            
            {/* Action buttons - conditionally revealed with progressive disclosure */}
            {(hasSuccessfulResult || report.assessmentResults.domains.receptive.topicSentence) && (
              <div className="pt-6 mt-8 border-t border-[#E6E0D6]">
                <h3 className="text-base font-display font-medium mb-4">Report Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <ExportDocxButton 
                    reportData={report} 
                    className="text-xs h-9 bg-[#F1EEE9] border-[#E6E0D6] text-[#6C8578] hover:bg-[#E6E0D6] hover:text-[#5A7164] rounded-lg transition-colors"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-9 border-[#D1E7DD] bg-[#F8F9F8] text-[#0F5132] hover:bg-[#D1E7DD]/50 hover:text-[#0A3622] rounded-lg transition-colors"
                    onClick={onExportHtml}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Export HTML
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-9 border-[#F8D7DA] bg-[#FEF6F7] text-[#842029] hover:bg-[#F8D7DA]/50 hover:text-[#65191F] rounded-lg transition-colors"
                    onClick={onClearReport}
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Clear Report
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-9 border-[#CFE2FF] bg-[#F7FAFF] text-[#084298] hover:bg-[#CFE2FF]/50 hover:text-[#062C6B] rounded-lg transition-colors"
                    onClick={onViewJson}
                  >
                    View JSON
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </DialogContent>
      </Dialog>
      
      {/* Batch status component - shown outside the dialog when active */}
      {batchStatus.active && (
        <div className="mb-6 animate-fadeIn">
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

      {/* Glossary Drawer - placed at the right side */}
      <div className={cn(
        "absolute top-0 right-0 transition-opacity duration-300",
        batchStatus.active ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>
        <GlossaryDrawer 
          onSave={(terms) => {
            // Here you would implement saving the glossary terms to your data store
            console.log("Saving glossary terms:", terms);
          }} 
        />
      </div>
      </div>
    </div>
  );
};

export default EditorPanel;