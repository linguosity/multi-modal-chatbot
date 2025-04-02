import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Wand2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpeechLanguageReport } from '@/types/reportTypes';

interface SummarizePanelProps {
  report: SpeechLanguageReport;
  onSummarize: (summary: string) => void;
}

const SummarizePanel: React.FC<SummarizePanelProps> = ({ 
  report,
  onSummarize
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Options for the summary
  const [includeStrengths, setIncludeStrengths] = useState(true);
  const [includeNeeds, setIncludeNeeds] = useState(true);
  const [includeImpact, setIncludeImpact] = useState(true);
  const [isParentFriendly, setIsParentFriendly] = useState(true);
  
  // Extract the student info and domains that have content
  const studentName = report.header?.studentInformation?.name || 'Student';
  const studentAge = report.header?.studentInformation?.age || '';
  const referredBy = report.header?.reasonForReferral?.referralSource || 'school';
  const concerns = report.header?.reasonForReferral?.concerns || 'speech and language concerns';
  
  // Find populated domains
  const populatedDomains = Object.entries(report.assessmentResults?.domains || {})
    .filter(([_, domain]) => domain && (domain.topicSentence || domain.strengths || domain.needs))
    .map(([key]) => key);

  // Get assessment tools used
  const assessmentTools = report.assessmentResults?.tools || [];
  const toolNames = assessmentTools.map(tool => tool.name).join(', ');
  
  const generateSummary = async () => {
    setIsGenerating(true);
    setStatus('loading');
    
    try {
      // Create the prompt for the API
      const prompt = `
        Generate a concise, ${isParentFriendly ? 'parent-friendly' : 'professional'} summary for a speech and language report with the following information:
        
        Student: ${studentName} (${studentAge})
        Referred by: ${referredBy}
        Concerns: ${concerns}
        
        Assessment tools: ${toolNames || 'Various assessment tools'}
        
        Domains with findings:
        ${populatedDomains.join(', ')}
        
        Please format the summary using this template, expanding as needed:
        "${studentName} is a ${studentAge}-year-old referred by ${referredBy} due to ${concerns}. Results from various assessment tools including but not limited to [TOOLS] indicate [ELIGIBILITY]. ${includeStrengths ? '[STRENGTHS]. ' : ''}${includeNeeds ? '[NEEDS]. ' : ''}${includeImpact ? '[IMPACT STATEMENT(S)].' : ''}"
        
        Make this summary concise (150-200 words), objective, and focus on the assessment findings. Use plain, ${isParentFriendly ? 'jargon-free language accessible to parents' : 'professional clinical language'}.
      `;
      
      // API call would go here - simulating for now
      // const response = await fetch('/api/generate-summary', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     prompt,
      //     report
      //   }),
      // });
      
      // Simulated response - in a real implementation, use the commented API call above
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a sample response
      const sampleSummary = `${studentName} is a ${studentAge}-year-old referred by ${referredBy} due to ${concerns}. Results from various assessment tools including but not limited to standardized testing and classroom observations indicate that ${studentName} qualifies for speech and language services.${includeStrengths ? ' Strengths include good attention to tasks and eagerness to participate in activities.' : ''}${includeNeeds ? ' Needs include support with expressive language, vocabulary development, and grammatical structures.' : ''}${includeImpact ? ' These language difficulties impact ${studentName}\'s ability to effectively participate in classroom discussions and fully access the curriculum.' : ''}`;
      
      setGeneratedSummary(sampleSummary);
      setShowPreview(true);
      setStatus('success');
    } catch (error) {
      console.error('Error generating summary:', error);
      setErrorMessage('Failed to generate summary. Please try again.');
      setStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSave = () => {
    onSummarize(generatedSummary);
    setStatus('idle');
    setShowPreview(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-[#F0F3F2] rounded-lg p-5 border border-[#DCE4DF]">
        <h3 className="text-base font-display font-medium text-[#3C6E58] mb-3">Generate Report Summary</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Generate a concise summary of the report findings. This will be inserted into the conclusion summary section.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-white rounded-md border border-[#E6E0D6]">
            <Label className="text-sm flex items-center justify-between mb-2">
              <span>Content Options</span>
            </Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-strengths" className="text-xs">Include Strengths</Label>
                <input
                  type="checkbox"
                  id="include-strengths"
                  checked={includeStrengths}
                  onChange={(e) => setIncludeStrengths(e.target.checked)}
                  className="h-4 w-4 rounded border-[#E6E0D6] text-[#6C8578] focus:ring-[#6C8578]"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="include-needs" className="text-xs">Include Needs</Label>
                <input
                  type="checkbox"
                  id="include-needs"
                  checked={includeNeeds}
                  onChange={(e) => setIncludeNeeds(e.target.checked)}
                  className="h-4 w-4 rounded border-[#E6E0D6] text-[#6C8578] focus:ring-[#6C8578]"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="include-impact" className="text-xs">Include Impact Statement</Label>
                <input
                  type="checkbox"
                  id="include-impact"
                  checked={includeImpact}
                  onChange={(e) => setIncludeImpact(e.target.checked)}
                  className="h-4 w-4 rounded border-[#E6E0D6] text-[#6C8578] focus:ring-[#6C8578]"
                />
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-white rounded-md border border-[#E6E0D6]">
            <Label className="text-sm flex items-center justify-between mb-2">
              <span>Style Options</span>
            </Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="parent-friendly" className="text-xs">Parent-Friendly Language</Label>
                <input
                  type="checkbox"
                  id="parent-friendly"
                  checked={isParentFriendly}
                  onChange={(e) => setIsParentFriendly(e.target.checked)}
                  className="h-4 w-4 rounded border-[#E6E0D6] text-[#6C8578] focus:ring-[#6C8578]"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button
            onClick={generateSummary}
            disabled={isGenerating}
            className="bg-[#6C8578] hover:bg-[#5A7164] text-white border border-[#5A7164]"
          >
            {isGenerating ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Summary
              </>
            )}
          </Button>
        </div>
      </div>
      
      {showPreview && (
        <div className="animate-fadeIn">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-display font-medium">Generated Summary</h3>
            <div className="flex items-center">
              {status === 'success' && (
                <span className="text-xs text-[#3C6E58] flex items-center mr-4">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Successfully generated
                </span>
              )}
              {status === 'error' && (
                <span className="text-xs text-red-600 flex items-center mr-4">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  Error generating summary
                </span>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <Textarea
              value={generatedSummary}
              onChange={(e) => setGeneratedSummary(e.target.value)}
              placeholder="Generated summary will appear here"
              className="min-h-[180px] border-[#E6E0D6] rounded-lg focus:border-[#6C8578] focus:ring-[#6C8578]"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {generatedSummary.length} characters
            </p>
          </div>
          
          <div className="flex justify-end">
            <div className="space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPreview(false);
                  setStatus('idle');
                }}
                className="border-[#E6E0D6] text-muted-foreground hover:bg-[#F1EEE9]"
              >
                Discard
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#3C6E58] hover:bg-[#2A5B45] text-white border border-[#2A5B45]"
              >
                Save to Report
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {status === 'error' && !showPreview && (
        <div className="bg-[#F9EFED] border border-[#EBCCC4] text-[#9C4226] p-4 rounded-lg animate-fadeIn">
          <p className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {errorMessage}
          </p>
        </div>
      )}
    </div>
  );
};

export default SummarizePanel;