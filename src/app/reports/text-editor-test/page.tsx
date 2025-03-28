'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PdfUploader } from "@/components/reports/PdfUploader";
import { ExportDocxButton } from "@/components/reports/ExportDocxButton";
import { useReports } from "@/components/contexts/reports-context";
import { Pencil } from "lucide-react";

/**
 * Create a default report skeleton
 */
function createReportSkeleton() {
  return {
    header: {
      studentInformation: {
        firstName: "",
        lastName: "",
        DOB: "",
        reportDate: "",
        evaluationDate: "",
        parents: [],
        homeLanguage: ""
      },
      reasonForReferral: "",
      confidentialityStatement: ""
    },
    background: {
      studentDemographicsAndBackground: {
        educationalHistory: ""
      },
      healthReport: {
        medicalHistory: "",
        visionAndHearingScreening: "",
        medicationsAndAllergies: ""
      },
      earlyInterventionHistory: "",
      familyHistory: {
        familyStructure: "",
        languageAndCulturalBackground: "",
        socioeconomicFactors: ""
      },
      parentGuardianConcerns: ""
    },
    assessmentResults: {
      observations: {
        classroomObservations: "",
        playBasedInformalObservations: "",
        socialInteractionObservations: ""
      },
      assessmentProceduresAndTools: {
        overviewOfAssessmentMethods: "",
        assessmentToolsUsed: [] // IDs of assessment tools
      },
      domains: {
        receptive: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: []
        },
        expressive: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: []
        },
        pragmatic: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: []
        },
        articulation: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: []
        },
        voice: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: []
        },
        fluency: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: []
        }
      }
    },
    conclusion: {
      eligibility: {
        domains: {
          receptive: false,
          expressive: false,
          pragmatic: false,
          articulation: false,
          voice: false,
          fluency: false
        },
        californiaEdCode: ""
      },
      conclusion: {
        summary: ""
      },
      recommendations: {
        services: {
          typeOfService: "",
          frequency: "",
          setting: ""
        },
        accommodations: [],
        facilitationStrategies: []
      },
      parentFriendlyGlossary: {
        terms: {}
      }
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      version: 1
    }
  };
}

// Helper function to truncate text with ellipsis
function truncateText(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str || '';
  return str.slice(0, maxLength - 3) + '...';
}

// Define domain section structure
interface DomainSection {
  isConcern: boolean;
  topicSentence: string;
  strengths: string[];
  needs: string[];
  impactStatement: string;
  lastUpdated?: string;
  assessmentTools?: string[]; // Domain-specific assessment tools list
}

// Define assessment tool structure
interface AssessmentTool {
  id?: string;
  name: string;
  year: string;
  authors: string[];
  targetPopulation: string;
  targetAgeRange?: string;
  type: "quantitative" | "qualitative" | "mixed";
  domains: string[];
  description?: string;
  subtests?: {
    name: string;
    description: string;
    domain?: string;
    scores?: {
      raw?: number;
      scaled?: number;
      standardScore?: number;
      percentile?: number;
      ageEquivalent?: string;
      interpretation?: string;
    }[];
  }[];
  results?: {
    summary: string;
    scores?: any;
  };
  caveats?: string[];
  references?: string[];
}

interface SpeechLanguageReport {
  header: {
    studentInformation: {
      firstName: string;
      lastName: string;
      DOB: string;
      reportDate: string;
      evaluationDate: string;
      parents: string[];
      homeLanguage: string;
    };
    reasonForReferral: string;
    confidentialityStatement: string;
  };
  background: {
    studentDemographicsAndBackground: {
      educationalHistory: string;
    };
    healthReport: {
      medicalHistory: string;
      visionAndHearingScreening: string;
      medicationsAndAllergies: string;
    };
    earlyInterventionHistory: string;
    familyHistory: {
      familyStructure: string;
      languageAndCulturalBackground: string;
      socioeconomicFactors: string;
    };
    parentGuardianConcerns: string;
  };
  assessmentResults: {
    observations: {
      classroomObservations?: string;
      playBasedInformalObservations?: string;
      socialInteractionObservations?: string;
      [key: string]: string | undefined;
    };
    assessmentProceduresAndTools: {
      overviewOfAssessmentMethods: string;
      assessmentToolsUsed: string[]; // Store only the IDs of assessment tools
    };
    domains: {
      receptive: DomainSection;
      expressive: DomainSection;
      pragmatic: DomainSection;
      articulation: DomainSection;
      voice: DomainSection;
      fluency: DomainSection;
      [key: string]: DomainSection;
    };
  };
  conclusion: {
    eligibility: {
      domains: {
        receptive: boolean;
        expressive: boolean;
        pragmatic: boolean;
        articulation: boolean;
        voice: boolean;
        fluency: boolean;
        [key: string]: boolean;
      };
      californiaEdCode: string;
    };
    conclusion: {
      summary: string;
    };
    recommendations: {
      services: {
        typeOfService: string;
        frequency: string;
        setting: string;
      };
      accommodations: string[];
      facilitationStrategies: string[];
    };
    parentFriendlyGlossary?: {
      terms: {
        [key: string]: string;
      };
    };
  };
  metadata: {
    lastUpdated: string;
    version: number;
    createdBy?: string;
  };
}

// Component to render a text section
const TextSectionCard = ({ content, title }: { content: string, title: string }) => {
  if (!content) return null;
  
  return (
    <Card className="mb-4 shadow-sm border-0">
      <CardHeader className="bg-white border-b">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-gray-800">{content}</p>
      </CardContent>
    </Card>
  );
};

/**
 * Test component for Claude's JSON-based text editor tool
 */
export default function TextEditorTestPage() {
  // Get context for sidebar integration
  const { setSectionGroups } = useReports();
  
  // Input form state
  const [inputText, setInputText] = useState('');
  const [selectedSection, setSelectedSection] = useState('auto-detect');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<'text' | 'pdf'>('text');
  
  // Popover state for the editor toolbar
  const [editorOpen, setEditorOpen] = useState(false);
  
  // Debug logging for popover state
  useEffect(() => {
    console.log("[Editor] editorOpen changed:", editorOpen);
  }, [editorOpen]);
  
  // Report state
  const [report, setReport] = useState<SpeechLanguageReport>({
    header: {
      studentInformation: {
        firstName: "Sample",
        lastName: "Student",
        DOB: "2018-05-15",
        reportDate: "2024-03-15",
        evaluationDate: "2024-03-10",
        parents: ["Parent Name"],
        homeLanguage: "English"
      },
      reasonForReferral: "Teacher referral due to concerns about articulation and language skills",
      confidentialityStatement: "This report contains confidential information..."
    },
    background: {
      studentDemographicsAndBackground: {
        educationalHistory: "Currently enrolled in 1st grade at Sample Elementary"
      },
      healthReport: {
        medicalHistory: "No significant medical history reported",
        visionAndHearingScreening: "Passed school screening on 2023-09-15",
        medicationsAndAllergies: "None reported"
      },
      earlyInterventionHistory: "No previous speech services",
      familyHistory: {
        familyStructure: "Lives with both parents and younger sibling",
        languageAndCulturalBackground: "English is the primary language spoken at home",
        socioeconomicFactors: ""
      },
      parentGuardianConcerns: "Parents report difficulty understanding child's speech at times"
    },
    assessmentResults: {
      observations: {
        classroomObservations: "Student needs repetition of directions in large group setting",
        playBasedInformalObservations: "Engages well in structured play activities",
        socialInteractionObservations: "Initiates interactions with peers appropriately"
      },
      assessmentProceduresAndTools: {
        overviewOfAssessmentMethods: "A combination of standardized tests, language samples, and observations were used",
        assessmentToolsUsed: ["gfta3", "celf5"]
      },
      domains: {
        receptive: {
          isConcern: false,
          topicSentence: 'Student demonstrates age-appropriate receptive language skills.',
          strengths: ['Follows 2-step directions consistently'],
          needs: [],
          impactStatement: "",
          assessmentTools: ["Clinical Evaluation of Language Fundamentals-5 (CELF-5)"]
        },
        expressive: {
          isConcern: true,
          topicSentence: 'Student shows mild deficits in expressive language.',
          strengths: ['Uses simple sentences to communicate needs'],
          needs: ['Difficulty with complex sentence structures', 'Limited vocabulary for academic concepts'],
          impactStatement: "Expressive language difficulties impact the student's ability to fully participate in classroom discussions",
          assessmentTools: ["Clinical Evaluation of Language Fundamentals-5 (CELF-5)"]
        },
        pragmatic: {
          isConcern: false,
          topicSentence: '',
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: []
        },
        articulation: {
          isConcern: true,
          topicSentence: 'Student presents with multiple articulation errors affecting intelligibility.',
          strengths: [],
          needs: ['Produces /s/ and /z/ with lateral distortion', 'Fronting of velar sounds /k/ and /g/'],
          impactStatement: 'These errors significantly impact intelligibility in the classroom.',
          assessmentTools: ["Goldman-Fristoe Test of Articulation-3 (GFTA-3)"]
        },
        voice: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: []
        },
        fluency: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: []
        }
      }
    },
    conclusion: {
      eligibility: {
        domains: {
          receptive: false,
          expressive: true,
          pragmatic: false,
          articulation: true,
          voice: false,
          fluency: false
        },
        californiaEdCode: "Student meets eligibility criteria for speech or language impairment under California Ed Code Section 56333"
      },
      conclusion: {
        summary: "Based on assessment results and clinical observations, student demonstrates significant speech sound production errors and expressive language deficits that adversely affect educational performance."
      },
      recommendations: {
        services: {
          typeOfService: "Direct speech-language therapy",
          frequency: "2x weekly for 30 minutes",
          setting: "Pull-out and classroom-based"
        },
        accommodations: ["Preferential seating", "Visual supports for instruction"],
        facilitationStrategies: ["Allow extended time for verbal responses", "Provide language models"]
      },
      parentFriendlyGlossary: {
        terms: {
          "Articulation": "The physical production of speech sounds",
          "Phonological Process": "Error patterns in speech sound production"
        }
      }
    },
    metadata: {
      lastUpdated: "2024-03-16T00:00:00.000Z", // Static timestamp to avoid hydration errors
      version: 1
    }
  });
  
  // UI state
  const [commandDetails, setCommandDetails] = useState<any>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  
  // Get active domains for display
  const activeDomains = Object.keys(report.assessmentResults.domains || {}).filter(
    domain => report.assessmentResults.domains[domain] && (
      report.assessmentResults.domains[domain].topicSentence || 
      (report.assessmentResults.domains[domain].strengths && report.assessmentResults.domains[domain].strengths.length > 0) ||
      (report.assessmentResults.domains[domain].needs && report.assessmentResults.domains[domain].needs.length > 0)
    )
  );
  
  // Create a stable dependency for active domains
  const activeDomainsKey = React.useMemo(() => {
    return activeDomains.join(',');
  }, [activeDomains]);
  
  // Create a stable dependency for domain concerns
  const domainConcernsKey = React.useMemo(() => {
    return activeDomains
      .map(domain => `${domain}:${report.assessmentResults.domains[domain].isConcern}`)
      .join(',');
  }, [activeDomains, report.assessmentResults.domains]);
  
  // Initialize sidebar section groups based on report structure
  useEffect(() => {
    // Create section groups for the sidebar
    const sectionGroups = [
      {
        title: "Student Information",
        items: [
          { title: "Demographics", url: "#demographics" },
          { title: "Referral Reason", url: "#referral" }
        ]
      },
      {
        title: "Background",
        items: [
          { title: "Educational History", url: "#educational-history" },
          { title: "Health Information", url: "#health-info" },
          { title: "Family Information", url: "#family-info" },
          { title: "Parent Concerns", url: "#parent-concerns" }
        ]
      },
      {
        title: "Assessment Results",
        items: [
          ...activeDomains.map(domain => ({
            title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Language`,
            url: `#domain-${domain}`,
            isActive: report.assessmentResults.domains[domain].isConcern
          })),
          { title: "Observations", url: "#observations" },
          { title: "Assessment Tools", url: "#assessment-tools" }
        ]
      },
      {
        title: "Conclusions",
        items: [
          { title: "Eligibility", url: "#eligibility" },
          { title: "Summary", url: "#summary" },
          { title: "Recommendations", url: "#recommendations" }
        ]
      }
    ];
    
    // Update the context with our section groups
    setSectionGroups(sectionGroups);
  }, [setSectionGroups, activeDomainsKey, domainConcernsKey]);
  
  /**
   * Handle form submission to update report using Claude's text editor
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isUpdating) return;
    
    setIsUpdating(true);
    setError(null);
    setSuccess(null);
    setCommandDetails(null);
    
    const clientRequestId = `client_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    console.log(`[${clientRequestId}] 🚀 Starting report update request`);
    console.log(`[${clientRequestId}] 📝 Input: "${inputText.substring(0, 50)}${inputText.length > 50 ? '...' : ''}"`);
    console.log(`[${clientRequestId}] 🎯 Target section: ${selectedSection}`);
    
    try {
      console.log(`[${clientRequestId}] 📤 Sending API request...`);
      // Call API endpoint that will use Claude's text editor tool
      const response = await fetch('/api/text-editor-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: inputText,
          report: report,
          updateSection: selectedSection === 'auto-detect' ? undefined : selectedSection
        }),
      });
      
      console.log(`[${clientRequestId}] 📥 Received API response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[${clientRequestId}] ❌ API error:`, errorData);
        throw new Error(errorData.error || 'Failed to update report');
      }
      
      const data = await response.json();
      console.log(`[${clientRequestId}] 📦 Response data:`, {
        hasReport: !!data.report,
        hasCommand: !!data.command,
        commandType: data.command?.command,
        affectedDomain: data.affectedDomain,
        simulated: data.simulated,
        error: data.error
      });
      
      // Update the report state with the result from Claude's text editor
      if (data.report) {
        console.log(`[${clientRequestId}] 🔄 Updating report state with new data`);
        console.log(`[${clientRequestId}] 📊 Updated domains:`, 
          Object.keys(data.report.assessmentResults.domains).filter(domain => 
            JSON.stringify(data.report.assessmentResults.domains[domain]) !== 
            JSON.stringify(report.assessmentResults.domains[domain])
          )
        );
        
        setReport(data.report);
        setInputText(''); // Clear the input field
        
        // Set command details and success message
        if (data.command) {
          console.log(`[${clientRequestId}] 📋 Setting command details`);
          setCommandDetails(data.command);
          
          if (data.affectedDomain) {
            console.log(`[${clientRequestId}] ✅ Success: Updated ${data.affectedDomain} domain`);
            setSuccess(`Report updated successfully in the "${data.affectedDomain}" domain using Claude's ${data.command.command} command.`);
          } else {
            console.log(`[${clientRequestId}] ✅ Success: Report updated`);
            setSuccess(`Report updated successfully using Claude's ${data.command.command} command.`);
          }
        } else if (data.simulated) {
          console.log(`[${clientRequestId}] ⚠️ Using simulated response`);
          setSuccess(`Report updated with simulated changes (API fallback mode) in the "${data.affectedDomain}" domain.`);
        } else {
          console.log(`[${clientRequestId}] ✅ Success: Generic update`);
          setSuccess('Report updated successfully');
        }
      } else if (data.error) {
        console.error(`[${clientRequestId}] ❌ Error from API:`, data.error);
        setError(data.error);
      }
    } catch (err) {
      console.error(`[${clientRequestId}] ❌ Exception:`, err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      console.log(`[${clientRequestId}] 🏁 Request complete`);
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="w-full">
      {/* Report card with scrollable content */}
      <Card className="relative border-0 shadow-sm overflow-auto" style={{ height: "calc(100vh - 180px)" }}>
        
        {/* Fixed position controls that stay in place during scrolling */}
        <div className="sticky top-4 left-4 z-50 ml-4 mr-4">
          {/* Pencil icon - always rendered but visibility toggled with CSS */}
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full bg-white border border-gray-200 shadow p-2 hover:bg-gray-100 ${
              editorOpen ? "invisible pointer-events-none" : ""
            }`}
            aria-label="Claude JSON Report Editor"
            onClick={() => {
              console.log("[Pencil Button] clicked!");
              setEditorOpen(true);
            }}
          >
            <Pencil className="h-4 w-4 text-gray-500" />
          </Button>
          
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
              {/* Input form */}
       <div className="mb-6">
         <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as 'text' | 'pdf')} className="w-full">
           <TabsList className="w-full mb-4">
             <TabsTrigger value="text" className="flex-1">Text Input</TabsTrigger>
             <TabsTrigger value="pdf" className="flex-1">PDF Upload</TabsTrigger>
           </TabsList>
 
           <TabsContent value="text">
             <form onSubmit={handleSubmit} className="w-full">
               <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4">
                 <div>
                   <Input
                     value={inputText}
                     onChange={(e) => setInputText(e.target.value)}
                     placeholder="Enter observation or assessment data..."
                     className="w-full mb-2"
                     disabled={isUpdating}
                   />
 
                   {/* Section selector */}
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
                   className="bg-purple-600 hover:bg-purple-700 text-white h-10"
                 >
                   {isUpdating ? (
                     <>
                       <Spinner className="h-4 w-4 mr-2" />
                       Updating...
                     </>
                   ) : (
                     'Update Report'
                   )}
                 </Button>
               </div>
             </form>
           </TabsContent>
 
           <TabsContent value="pdf">
             <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4">
               <div>
                 <PdfUploader 
                   onUpload={async (pdfData: string) => {
                     setIsUpdating(true);
                     setError(null);
                     setSuccess(null);
                     setCommandDetails(null);
 
                     try {
                       const response = await fetch('/api/text-editor-test', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({
                           pdfData: pdfData,
                           report: report,
                           updateSection: selectedSection === 'auto-detect' ? undefined : selectedSection
                         }),
                       });
 
                       if (!response.ok) {
                         const errorData = await response.json();
                         throw new Error(errorData.error || 'Failed to process PDF');
                       }
 
                       const data = await response.json();
 
                       // Update the report state with the result from Claude's processing
                       if (data.report) {
                         setReport(data.report);
 
                         // Set command details and success message
                         if (data.command) {
                           setCommandDetails(data.command);
 
                           if (data.affectedDomain) {
                             setSuccess(`Report updated successfully in the "${data.affectedDomain}" domain from PDF.`);
                           } else {
                             setSuccess(`Report updated successfully from PDF using ${data.command.command} command.`);
                           }
                         } else {
                           setSuccess('Report updated successfully from PDF');
                         }
                       } else if (data.error) {
                         setError(data.error);
                       }
                     } catch (err) {
                       setError(err instanceof Error ? err.message : 'An unexpected error occurred processing the PDF');
                     } finally {
                       setIsUpdating(false);
                     }
                   }}
                   disabled={isUpdating}
                 />
 
                 {/* Section selector */}
                 <div className="relative w-full mt-3">
                   <label className="text-sm font-medium text-gray-700 mb-1 block">
                     Target Section (Optional)
                   </label>
                   <select
                     value={selectedSection}
                     onChange={(e) => setSelectedSection(e.target.value)}
                     disabled={isUpdating}
                     className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                   >
                     <option value="auto-detect">Auto-detect section</option>
                     <optgroup label="Assessment Results">
                       <option value="assessmentResults.domains.receptive">Receptive Language</option>
                       <option value="assessmentResults.domains.expressive">Expressive Language</option>
                       <option value="assessmentResults.domains.pragmatic">Pragmatic Language</option>
                       <option value="assessmentResults.domains.articulation">Articulation</option>
                       <option value="assessmentResults.domains.voice">Voice</option>
                       <option value="assessmentResults.domains.fluency">Fluency</option>
                     </optgroup>
                   </select>
                   <div className="absolute right-3 top-[calc(50%+0.5rem)] -translate-y-1/2 pointer-events-none">
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
             </div>
           </TabsContent>
         </Tabs>
 
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
               onClick={() => {
                 // Import and use on demand to avoid potential import issues
                 import('@/lib/las-report-generator').then(module => {
                   module.exportLASReport(report);
                   setSuccess("Generated HTML report as a temporary solution");
                 }).catch(error => {
                   console.error('Error loading LAS report generator:', error);
                   setError('Failed to load LAS report generator. Please try again.');
                 });
               }}
             >
               Export as HTML
             </Button>
             <Button
               variant="outline"
               className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
               onClick={() => {
                 if (window.confirm("Are you sure you want to clear the report? This cannot be undone.")) {
                   // Reset report to initial empty state
                   setReport(createReportSkeleton());
                   setSuccess("Report has been cleared successfully");
                   setError(null);
                   setCommandDetails(null);
                 }
               }}
             >
               Clear Report
             </Button>
             <Button
               variant="outline"
               className="text-xs h-8"
               onClick={() => setShowJsonPreview(true)}
             >
               View JSON
             </Button>
           </div>
            </div>


          </div>
        </div>
       
        <CardContent className="p-6">
          {/* Empty state */}
          {activeDomains.length === 0 && 
           Object.keys(report.assessmentResults.observations || {}).length === 0 && 
           !report.conclusion.conclusion.summary && 
           report.conclusion.recommendations.accommodations.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-2">No report sections available yet</p>
              <p className="text-gray-400 text-sm">Enter observations above to start building your report</p>
            </div>
          )}

          {/* Report sections */}
          <div className="space-y-4">
            {/* Header Section */}
            <div className="mb-8">
              <h3 className="text-base font-semibold text-purple-700 mb-3 pb-1 border-b border-purple-200">Student Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card id="demographics" className="border border-purple-100 shadow-sm bg-purple-50/30">
                  <CardHeader className="py-2 px-3 bg-purple-50">
                    <CardTitle className="text-sm font-medium text-purple-800">Demographics</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 text-xs">
                    <p><strong>Name:</strong> {report.header.studentInformation.firstName} {report.header.studentInformation.lastName}</p>
                    <p><strong>DOB:</strong> {report.header.studentInformation.DOB}</p>
                    <p><strong>Evaluation Date:</strong> {report.header.studentInformation.evaluationDate}</p>
                    <p><strong>Home Language:</strong> {report.header.studentInformation.homeLanguage}</p>
                  </CardContent>
                </Card>
                
                <Card id="referral" className="border border-purple-100 shadow-sm bg-purple-50/30">
                  <CardHeader className="py-2 px-3 bg-purple-50">
                    <CardTitle className="text-sm font-medium text-purple-800">Referral Reason</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 text-xs">
                    <p>{report.header.reasonForReferral}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Background Section */}
            <div className="mb-8">
              <h3 className="text-base font-semibold text-blue-700 mb-3 pb-1 border-b border-blue-200">Background Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card id="educational-history" className="border border-blue-100 shadow-sm bg-blue-50/30">
                  <CardHeader className="py-2 px-3 bg-blue-50">
                    <CardTitle className="text-sm font-medium text-blue-800">Educational History</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 text-xs">
                    <p>{report.background.studentDemographicsAndBackground.educationalHistory}</p>
                  </CardContent>
                </Card>
                
                <Card id="health-info" className="border border-blue-100 shadow-sm bg-blue-50/30">
                  <CardHeader className="py-2 px-3 bg-blue-50">
                    <CardTitle className="text-sm font-medium text-blue-800">Health Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 text-xs">
                    <p><strong>Medical History:</strong> {report.background.healthReport.medicalHistory}</p>
                    <p><strong>Vision/Hearing:</strong> {report.background.healthReport.visionAndHearingScreening}</p>
                  </CardContent>
                </Card>
                
                <Card id="family-info" className="border border-blue-100 shadow-sm bg-blue-50/30">
                  <CardHeader className="py-2 px-3 bg-blue-50">
                    <CardTitle className="text-sm font-medium text-blue-800">Family Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 text-xs">
                    <p><strong>Structure:</strong> {report.background.familyHistory.familyStructure}</p>
                    <p><strong>Language Background:</strong> {report.background.familyHistory.languageAndCulturalBackground}</p>
                  </CardContent>
                </Card>
                
                <Card id="parent-concerns" className="border border-blue-100 shadow-sm bg-blue-50/30">
                  <CardHeader className="py-2 px-3 bg-blue-50">
                    <CardTitle className="text-sm font-medium text-blue-800">Parent/Guardian Concerns</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 text-xs">
                    <p>{report.background.parentGuardianConcerns}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Assessment Results Section */}
            <div className="mb-8">
              <h3 className="text-base font-semibold text-green-700 mb-3 pb-1 border-b border-green-200">Assessment Results</h3>
              
              {/* Domain subsection */}
              {activeDomains.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Language Domains</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeDomains.map(domain => {
                      const domainData = report.assessmentResults.domains[domain];
                      const hasConcern = domainData.isConcern;
                      
                      return (
                        <Card 
                          id={`domain-${domain}`}
                          key={domain} 
                          className={`border shadow-sm ${hasConcern 
                            ? 'border-amber-200 bg-amber-50/30' 
                            : 'border-green-100 bg-green-50/30'
                          }`}
                        >
                          <CardHeader className={`py-2 px-3 flex flex-row justify-between items-center ${hasConcern 
                              ? 'bg-amber-50' 
                              : 'bg-green-50'
                            }`}
                          >
                            <CardTitle className={`text-sm font-medium ${hasConcern 
                                ? 'text-amber-800' 
                                : 'text-green-800'
                              }`}
                            >
                              {domain.charAt(0).toUpperCase() + domain.slice(1)} Language
                            </CardTitle>
                            {domainData.isConcern !== undefined && (
                              <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                domainData.isConcern
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {domainData.isConcern ? 'Area of Concern' : 'No Concern'}
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="p-3 text-xs">
                            {domainData.topicSentence && (
                              <div className="mb-2">
                                <p className="font-medium">{domainData.topicSentence}</p>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 gap-2">
                              {domainData.strengths && domainData.strengths.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold mb-1 text-gray-600">Strengths</h5>
                                  <ul className="list-disc pl-4 space-y-0.5">
                                    {domainData.strengths.map((item, index) => (
                                      <li key={index} className="text-gray-800">{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {domainData.needs && domainData.needs.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold mb-1 text-gray-600">Needs</h5>
                                  <ul className="list-disc pl-4 space-y-0.5">
                                    {domainData.needs.map((item, index) => (
                                      <li key={index} className="text-gray-800">{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {domainData.impactStatement && (
                                <div>
                                  <h5 className="text-xs font-semibold mb-1 text-gray-600">Educational Impact</h5>
                                  <p className="text-gray-800">{domainData.impactStatement}</p>
                                </div>
                              )}
                              
                              {/* Domain-specific assessment tools */}
                              {domainData.assessmentTools && domainData.assessmentTools.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <h5 className="text-xs font-semibold mb-1 text-gray-600">Assessment Tools</h5>
                                  <ul className="list-disc pl-4 space-y-2">
                                    {domainData.assessmentTools.map((tool, index) => {
                                      // Extract additional information if available (assuming format like "Tool Name (SST-4)")
                                      const nameMatch = tool.match(/(.*?)\s*(?:\(([^)]+)\))?$/);
                                      const fullName = nameMatch ? nameMatch[1].trim() : tool;
                                      const shortName = nameMatch && nameMatch[2] ? nameMatch[2].trim() : '';
                                      
                                      // Basic tool info extraction
                                      let toolInfo = '';
                                      if (tool.toLowerCase().includes('sst-4') || tool.toLowerCase().includes('stuttering severity instrument')) {
                                        toolInfo = 'Assesses stuttering severity on a standardized scale. Appropriate for children and adults.';
                                      } else if (tool.toLowerCase().includes('celf-5') || tool.toLowerCase().includes('clinical evaluation of language fundamentals')) {
                                        toolInfo = 'Assesses language skills across multiple domains. Ages 5-21 years.';
                                      } else if (tool.toLowerCase().includes('gfta-3') || tool.toLowerCase().includes('goldman-fristoe')) {
                                        toolInfo = 'Measures articulation of consonant sounds. Ages 2-21 years.';
                                      }
                                      
                                      return (
                                        <li key={index} className="text-gray-800">
                                          <div className="font-medium">{fullName}</div>
                                          {shortName && <div className="text-xs text-gray-500 mt-0.5">({shortName})</div>}
                                          {toolInfo && <div className="text-xs text-gray-600 mt-1 italic">{toolInfo}</div>}
                                          <button 
                                            className="mt-1 text-xs text-blue-600 hover:text-blue-800" 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Add to global assessment tools if not already included
                                              if (!report.assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed.includes(tool)) {
                                                const updatedReport = { ...report };
                                                updatedReport.assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed.push(tool);
                                                setReport(updatedReport);
                                                setSuccess(`Added ${fullName} to global assessment tools list`);
                                              }
                                            }}
                                          >
                                            {report.assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed.includes(tool) 
                                              ? "✓ In global list" 
                                              : "+ Add to global list"
                                            }
                                          </button>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            
              {/* Observations subsection */}
              {Object.keys(report.assessmentResults.observations || {}).length > 0 && (
                <div id="observations" className="mb-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Observations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(report.assessmentResults.observations).map(([obsKey, content]) => (
                      content && (
                        <Card key={obsKey} className="border border-green-100 shadow-sm bg-green-50/30">
                          <CardHeader className="py-2 px-3 bg-green-50">
                            <CardTitle className="text-sm font-medium text-green-800">
                              {obsKey.charAt(0).toUpperCase() + obsKey.slice(1).replace(/([A-Z])/g, ' $1')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 text-xs">
                            <p>{content}</p>
                          </CardContent>
                        </Card>
                      )
                    ))}
                  </div>
                </div>
              )}
              
              {/* Assessment Tools subsection */}
              {report.assessmentResults.assessmentProceduresAndTools?.assessmentToolsUsed?.length > 0 && (
                <div id="assessment-tools" className="mb-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Assessment Tools</h4>
                  <Card className="border border-green-100 shadow-sm bg-green-50/30 mb-3">
                    <CardHeader className="py-2 px-3 bg-green-50">
                      <CardTitle className="text-sm font-medium text-green-800">Methods Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 text-xs">
                      <p>{report.assessmentResults.assessmentProceduresAndTools.overviewOfAssessmentMethods}</p>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {report.assessmentResults.assessmentProceduresAndTools.assessmentToolsUsed.map(toolId => (
                      <Card key={toolId} className="border border-green-100 shadow-sm bg-green-50/30">
                        <CardHeader className="py-2 px-3 bg-green-50">
                          <CardTitle className="text-sm font-medium text-green-800">{toolId.toUpperCase()}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 text-xs">
                          <p className="text-green-800">Tool ID: {toolId}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Conclusion Section */}
            {report.conclusion && (
              <div className="mb-8">
                <h3 className="text-base font-semibold text-amber-700 mb-3 pb-1 border-b border-amber-200">Conclusion & Recommendations</h3>
                <div className="grid grid-cols-1 gap-3">
                  {/* Eligibility subsection */}
                  {report.conclusion.eligibility && (
                    <Card id="eligibility" className="border border-amber-100 shadow-sm bg-amber-50/30">
                      <CardHeader className="py-2 px-3 bg-amber-50">
                        <CardTitle className="text-sm font-medium text-amber-800">Eligibility Determination</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 text-xs">
                        <p className="mb-2 font-medium">{report.conclusion.eligibility.californiaEdCode}</p>
                        
                        <h5 className="text-xs font-semibold mb-1 text-gray-600">Domain Eligibility</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(report.conclusion.eligibility.domains).map(([domain, isEligible]) => (
                            <div key={domain} className="flex items-center gap-1 p-1 border rounded bg-white">
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                isEligible ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              <div className="flex-1 font-medium text-[10px]">{domain.charAt(0).toUpperCase() + domain.slice(1)}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Conclusion summary */}
                  {report.conclusion.conclusion && report.conclusion.conclusion.summary && (
                    <Card id="summary" className="border border-amber-100 shadow-sm bg-amber-50/30">
                      <CardHeader className="py-2 px-3 bg-amber-50">
                        <CardTitle className="text-sm font-medium text-amber-800">Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 text-xs">
                        <p>{report.conclusion.conclusion.summary}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Recommendations */}
                  {report.conclusion.recommendations && (
                    <div id="recommendations" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Services */}
                      <Card className="border border-amber-100 shadow-sm bg-amber-50/30">
                        <CardHeader className="py-2 px-3 bg-amber-50">
                          <CardTitle className="text-sm font-medium text-amber-800">Services</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 text-xs">
                          <table className="w-full">
                            <tbody>
                              <tr>
                                <td className="font-medium pr-2">Type:</td>
                                <td>{report.conclusion.recommendations.services.typeOfService}</td>
                              </tr>
                              <tr>
                                <td className="font-medium pr-2">Frequency:</td>
                                <td>{report.conclusion.recommendations.services.frequency}</td>
                              </tr>
                              <tr>
                                <td className="font-medium pr-2">Setting:</td>
                                <td>{report.conclusion.recommendations.services.setting}</td>
                              </tr>
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                      
                      {/* Accommodations & Strategies */}
                      <Card className="border border-amber-100 shadow-sm bg-amber-50/30">
                        <CardHeader className="py-2 px-3 bg-amber-50">
                          <CardTitle className="text-sm font-medium text-amber-800">Accommodations & Strategies</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 text-xs">
                          {report.conclusion.recommendations.accommodations.length > 0 && (
                            <div className="mb-2">
                              <h5 className="text-xs font-semibold mb-1 text-gray-600">Accommodations</h5>
                              <ul className="list-disc pl-4 space-y-0.5">
                                {report.conclusion.recommendations.accommodations.map((rec, index) => (
                                  <li key={index} className="text-gray-800">{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {report.conclusion.recommendations.facilitationStrategies.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold mb-1 text-gray-600">Facilitation Strategies</h5>
                              <ul className="list-disc pl-4 space-y-0.5">
                                {report.conclusion.recommendations.facilitationStrategies.map((strat, index) => (
                                  <li key={index} className="text-gray-800">{strat}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* JSON Preview Card (shown/hidden with state instead of dialog) */}
      {showJsonPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowJsonPreview(false)}>
          <div className="max-w-3xl w-full m-4" onClick={(e) => e.stopPropagation()}>
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-white border-b flex flex-row justify-between items-center">
                <CardTitle className="text-lg font-medium">JSON Report Structure</CardTitle>
                <button 
                  onClick={() => setShowJsonPreview(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </CardHeader>
              <CardContent className="p-4">
                <pre className="bg-gray-50 p-4 rounded text-sm font-mono overflow-auto max-h-[600px]">
                  {JSON.stringify(report, null, 2)}
                </pre>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t py-2 flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowJsonPreview(false)}
                >
                  Close
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
      
      {/* Tool Command Details */}
      {commandDetails && (
        <Card className="shadow-sm border-0 mt-6">
          <CardHeader className="bg-white border-b">
            <CardTitle className="text-lg font-medium">Tool Command Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
              <dt className="font-semibold">Command:</dt>
              <dd>{commandDetails.command}</dd>
              
              {commandDetails.command === 'update_key' && (
                <>
                  <dt className="font-semibold">Path:</dt>
                  <dd className="font-mono text-blue-600">{commandDetails.path}</dd>
                  
                  <dt className="font-semibold">Action:</dt>
                  <dd className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-medium">
                    {commandDetails.action}
                  </dd>
                  
                  <dt className="font-semibold">Value:</dt>
                  <dd className="bg-gray-100 p-2 rounded text-sm font-mono overflow-auto whitespace-pre-wrap max-h-[200px]">
                    {JSON.stringify(commandDetails.value, null, 2)}
                  </dd>
                </>
              )}
              
              {commandDetails.command === 'str_replace' && (
                <>
                  <dt className="font-semibold">Old JSON:</dt>
                  <dd className="bg-gray-100 p-1 rounded text-sm font-mono overflow-auto whitespace-pre-wrap max-h-[200px]">
                    {truncateText(commandDetails.old_str, 500)}
                  </dd>
                  
                  <dt className="font-semibold">New JSON:</dt>
                  <dd className="bg-gray-100 p-1 rounded text-sm font-mono overflow-auto whitespace-pre-wrap max-h-[200px]">
                    {truncateText(commandDetails.new_str, 500)}
                  </dd>
                </>
              )}
              
              {commandDetails.command === 'insert' && (
                <>
                  <dt className="font-semibold">Position:</dt>
                  <dd>{commandDetails.position || 'end'}</dd>
                  
                  <dt className="font-semibold">Text:</dt>
                  <dd className="bg-gray-100 p-1 rounded text-sm font-mono overflow-auto whitespace-pre-wrap max-h-[200px]">
                    {truncateText(commandDetails.text, 500)}
                  </dd>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}