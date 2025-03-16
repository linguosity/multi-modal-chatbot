'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { processReportInput } from "@/app/actions";
import { DEFAULT_SECTIONS } from '@/lib/schemas/report';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ReportSidebar } from "@/components/report-sidebar";
import { ToggleEditCard } from "@/components/reports/ToggleEditCard";
import { Toggle } from "@/components/ui/toggle";
import { Pencil, Save, PlusCircle } from 'lucide-react';
import { getSectionIcon, getAssessmentSubsectionIcon } from '@/components/reports/report-section-icons';

export default function ReportView({ params }: { params: { id: string } }) {
  // Use the id from params directly, no need to await
  const reportId = params.id;
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [reportSections, setReportSections] = useState<{[key: string]: {content: string}}>({}); 
  
  // Function to handle the "Add to Report" action
  const handleAddToReport = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    try {
      const categorizedData = await processReportInput(inputText);
      setProcessingResult(categorizedData);
      
      // Update the appropriate sections in the reportData
      const updatedSections = {...reportSections};
      
      Object.entries(categorizedData).forEach(([category, content]) => {
        // Map the API response categories to report section IDs
        const sectionIdMap: {[key: string]: string} = {
          parentConcern: "parent_concern",
          pragmaticLanguage: "assessment_results",
          receptiveLanguage: "assessment_results",
          expressiveLanguage: "assessment_results",
          articulation: "assessment_results",
          fluency: "assessment_results",
          voice: "assessment_results",
          healthHistory: "health_developmental_history",
          educationalImpact: "conclusion",
          assessmentData: "assessment_results", 
          recommendations: "recommendations",
          otherInfo: "conclusion"
        };
        
        const sectionId = sectionIdMap[category] || "conclusion";
        
        if (!updatedSections[sectionId]) {
          updatedSections[sectionId] = { content: String(content) };
        } else {
          updatedSections[sectionId] = { 
            content: updatedSections[sectionId].content + "\n\n" + String(content)
          };
        }
      });
      
      setReportSections(updatedSections);
      // Clear the input after processing
      setInputText("");
    } catch (error) {
      console.error("Error processing report input:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // In a real app, this would fetch the report data from an API
  const reportData = {
    id: reportId,
    title: "Alex Smith Initial Speech-Language Evaluation",
    type: "initial",
    status: "draft",
    createdAt: "2025-03-01",
    updatedAt: "2025-03-07",
    studentName: "Alex Smith",
    sections: Object.values(DEFAULT_SECTIONS)
      .sort((a, b) => a.order - b.order)
      .map(section => ({
      id: section.id,
      title: section.title,
      order: section.order,
      // Simulate multiple cards per section
      cards: [
        {
          id: `${section.id}-card-1`,
          title: section.title,
          // Simulate personalized content
          content: section.content
            .replace(/\[Student\]/g, "Alex Smith")
            .replace(/\[Student Name\]/g, "Alex Smith")
            .replace(/\[his\/her\/their\]/g, "his")
            .replace(/\[Evaluation Date\]/g, "March 1, 2025")
            .replace(/\[Evaluator Name\]/g, "Brandon Brewer")
            .replace(/\[Credentials\]/g, "MS, CCC-SLP")
            .replace(/\[School Name\]/g, "Lincoln Elementary School"),
          type: section.id === 'assessment_tools' || section.id === 'assessment_results' 
            ? 'assessment' 
            : section.id === 'eligibility_checklist' 
              ? 'checklist'
              : section.id === 'recommendations' || section.id === 'accommodations'
                ? 'recommendation'
                : 'text'
        },
        // Add additional cards for some sections
        ...(
          section.id === 'assessment_tools'
            ? [
                {
                  id: `${section.id}-card-2`,
                  title: "Formal Assessment Instruments",
                  content: "The following standardized assessment tools were used:\n\n1. Clinical Evaluation of Language Fundamentals-5 (CELF-5) - Comprehensive assessment of receptive and expressive language skills\n\n2. Goldman-Fristoe Test of Articulation-3 (GFTA-3) - Assessment of articulation skills and phonological processes\n\n3. Peabody Picture Vocabulary Test-5 (PPVT-5) - Assessment of receptive vocabulary knowledge",
                  type: 'assessment'
                },
                {
                  id: `${section.id}-card-3`,
                  title: "Informal Assessment Methods",
                  content: "In addition to standardized testing, the following informal assessment methods were used:\n\n1. Language Sample Analysis - A 15-minute conversational sample was collected during play-based interaction and analyzed using Systematic Analysis of Language Transcripts (SALT)\n\n2. Classroom Observation - Two 30-minute observations in the classroom setting\n\n3. Teacher Interview - Structured interview with classroom teacher regarding academic performance and classroom behavior",
                  type: 'assessment'
                }
              ]
            : section.id === 'assessment_results' 
            ? [
                {
                  id: `${section.id}-card-2`,
                  title: "Clinical Evaluation of Language Fundamentals-5 (CELF-5)",
                  content: "The Clinical Evaluation of Language Fundamentals-5 (CELF-5) was administered to assess Alex's receptive and expressive language skills. Alex received a Core Language Score of 82 (12th percentile), which is within the low average range. This score indicates that Alex's overall language abilities are significantly below expectations for his age.\n\nSubtest Scores:\n- Sentence Comprehension: Standard Score 7 (16th percentile)\n- Word Structure: Standard Score 6 (9th percentile)\n- Formulated Sentences: Standard Score 5 (5th percentile)\n- Recalling Sentences: Standard Score 7 (16th percentile)\n\nAlex demonstrated particular difficulty with formulating grammatically correct sentences and recalling sentences verbatim. His strengths were noted in basic sentence comprehension, though still below age expectations.",
                  type: 'assessment'
                },
                {
                  id: `${section.id}-card-3`,
                  title: "Goldman-Fristoe Test of Articulation-3 (GFTA-3)",
                  content: "The Goldman-Fristoe Test of Articulation-3 (GFTA-3) was administered to assess Alex's articulation skills. Alex received a Standard Score of 75 (5th percentile), which is significantly below average for his age.\n\nSpeech sound errors included:\n- Substitution of /w/ for /r/ in all positions\n- Substitution of /f/ for /θ/ (th) in all positions\n- Deletion of final consonants in consonant clusters\n- Fronting of /k/ and /g/ to /t/ and /d/ respectively\n\nAlex's intelligibility was judged to be approximately 70% intelligible to unfamiliar listeners in connected speech.",
                  type: 'assessment'
                }
              ]
            : section.id === 'language_sample'
            ? [
                {
                  id: `${section.id}-card-2`,
                  title: "Language Sample Information",
                  content: "Date: March 3, 2025\nSetting: Quiet classroom during free play\nContext: Conversation about favorite toys and activities\nMaterials: Building blocks, action figures, picture books\nDuration: 15 minutes\nSample Size: 55 complete utterances",
                  type: 'assessment'
                },
                {
                  id: `${section.id}-card-3`,
                  title: "Language Sample Metrics",
                  content: "A conversational language sample was analyzed using Systematic Analysis of Language Transcripts (SALT) to evaluate expressive language skills in a naturalistic context.\n\nSummary of SALT analysis results:\n- MLU: 3.2 morphemes (expected: 4.5-5.5 for age)\n- TTR: 0.38 (expected: 0.45-0.50 for age)\n- Number of different words: 52 (below age expectations)\n- Grammatical errors: 38% of utterances contained errors\n- Intelligibility: 75% of utterances fully intelligible\n\nQualitative observations showed difficulty with verb tense markers, pronouns, and complex sentence structures. Alex demonstrated relative strengths in vocabulary related to preferred topics.",
                  type: 'assessment'
                },
                {
                  id: `${section.id}-card-4`,
                  title: "Language Sample Transcription (Excerpt)",
                  content: "C = Child (Alex), E = Examiner\n\nE: What are we going to build today?\nC: I making a tower.\nE: That's a tall tower! What else can you build?\nC: Him need more block.\nE: Who needs more blocks?\nC: The man. Him need more.\nE: Oh, the action figure needs more blocks?\nC: Yeah. Him want make house.\nE: He wants to make a house? What kind of house?\nC: Big house with lot room.\nE: A big house with lots of rooms? Who will live there?\nC: Him and other guys. Bad guy can't come in.",
                  type: 'assessment'
                }
              ]
            : section.id === 'recommendations' 
              ? [
                  {
                    id: `${section.id}-card-2`,
                    title: "Speech Therapy Services",
                    content: "Alex should receive direct speech and language therapy services 3 times per week for 30-minute sessions to address his articulation and expressive language needs.",
                    type: 'recommendation'
                  },
                  {
                    id: `${section.id}-card-3`,
                    title: "Classroom Support",
                    content: "Allow extended time for verbal responses in the classroom setting. Provide visual supports to accompany verbal instructions.",
                    type: 'recommendation'
                  }
                ]
              : section.id === 'accommodations'
                ? [
                    {
                      id: `${section.id}-card-2`,
                      title: "Instructional Accommodations",
                      content: "- Pre-teach new vocabulary\n- Use visual aids and demonstrations to support verbal instruction\n- Allow extra time for processing verbal information\n- Provide step-by-step instructions, one at a time\n- Check for understanding by asking Alex to repeat directions in his own words",
                      type: 'recommendation'
                    },
                    {
                      id: `${section.id}-card-3`,
                      title: "Testing Accommodations",
                      content: "- Extended time for verbal responses\n- Option for oral responses instead of written when appropriate\n- Allow for alternate forms of demonstrating knowledge when significant writing is required",
                      type: 'recommendation'
                    }
                  ]
                : []
        )
      ]
    }))
  };
  
  // Sort sections by order
  const sortedSections = [...reportData.sections].sort((a, b) => a.order - b.order);
  
  // Format section content for header section
  const formatHeaderSection = (section: any) => {
    const headerCard = section.cards[0];
    const headerLines = headerCard.content.trim().split('\n');
    
    return (
      <div className="my-4">
        <table className="w-full border-collapse mb-6">
          <tbody>
            {headerLines.map((line: string, index: number) => (
              <tr key={index} className={index % 2 === 0 ? "bg-muted/5" : ""}>
                <td className="border px-4 py-2 text-[11pt] text-center font-medium">{line}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Format section content for standard sections (non-grid)
  const formatStandardSection = (section: any) => {
    let combinedContent = "";
    
    // First add the original content from cards
    section.cards.forEach((card: any, index: number) => {
      if (index === 0) {
        // First card content (often contains the main content)
        combinedContent += card.content;
      } else {
        // Add subsection headers and content with center-aligned headings
        combinedContent += `\n\n<h2 class="text-center">${card.title}</h2>\n${card.content}`;
      }
    });
    
    // Then add any dynamically generated content
    const dynamicContent = reportSections[section.id]?.content;
    if (dynamicContent) {
      // Add a divider if there's existing content
      if (combinedContent) {
        combinedContent += '\n\n<hr class="my-4" />\n\n';
      }
      
      // Add the dynamically generated content with a label
      if (section.id === "parent_concern") {
        combinedContent += `<h3 class="text-center mb-2">Additional Parent Concerns</h3>\n${dynamicContent}`;
      } else {
        combinedContent += `<h3 class="text-center mb-2">Additional Information</h3>\n${dynamicContent}`;
      }
    }
    
    const handleSaveContent = (newContent: string) => {
      // In a real app, you would save the content to the database
      console.log(`Saving content for section ${section.id}:`, newContent);
    };
    
    return (
      <ToggleEditCard
        title={section.title}
        initialContent={combinedContent}
        onSave={handleSaveContent}
        renderViewMode={({ content }) => (
          <div className="whitespace-pre-line text-[11pt]" dangerouslySetInnerHTML={{ __html: content }} />
        )}
        className="border-gray-200"
        icon={getSectionIcon(section.id)}
      />
    );
  };
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div>
              <h1 className="text-3xl font-bold">{reportData.title}</h1>
              <p className="text-muted-foreground">
                Last updated: {reportData.updatedAt} • Status: {reportData.status.charAt(0).toUpperCase() + reportData.status.slice(1)}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href={`/reports/${reportId}/edit`}>
              <Button variant="outline">Edit Report</Button>
            </Link>
            <Button>Generate PDF</Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Shadcn Sidebar */}
          <div className="lg:col-span-1">
            <ReportSidebar sections={sortedSections} />
          </div>
        
        {/* Report Actions */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="mb-6">
            <CardHeader className="border-b">
              <CardTitle className="text-2xl">Smart Report Input</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  Enter any observation or information and AI will categorize it into the appropriate sections of the report.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="E.g., Per parent report, Alex has difficulty maintaining eye contact during conversations..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddToReport();
                      }
                    }}
                    disabled={isProcessing}
                    className="flex-1 text-[11pt]"
                  />
                  <Button 
                    onClick={handleAddToReport} 
                    disabled={isProcessing || !inputText.trim()}
                  >
                    {isProcessing ? 'Processing...' : 'Add to Report'}
                  </Button>
                </div>
              </div>
            </CardContent>
            {processingResult && (
              <CardFooter className="border-t bg-muted/5 block">
                <div className="pt-2">
                  <h3 className="text-sm font-medium mb-2">Processing Result:</h3>
                  <div className="bg-muted/10 p-3 rounded-md text-xs">
                    {Object.entries(processingResult).map(([category, content]) => (
                      <div key={category} className="mb-2">
                        <span className="font-medium">{category}:</span> {String(content)}
                      </div>
                    ))}
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
          
          {/* Report Sections */}
          {sortedSections.map((section, index) => {
            // Check if this section should be rendered side by side with the next one
            const isHeaderOrReferral = section.id === "heading" || section.id === "reason_for_referral";
            const isFamilyOrParentConcern = section.id === "family_background" || section.id === "parent_concern";
            const isHealthOrParentConcern = section.id === "health_developmental_history" || section.id === "parent_concern";
            
            // If this is header, check if next section is reason_for_referral
            const nextSection = sortedSections[index + 1];
            const shouldRenderSideBySide = 
              (section.id === "heading" && nextSection?.id === "reason_for_referral") || 
              (section.id === "family_background" && nextSection?.id === "parent_concern") ||
              (section.id === "health_developmental_history" && nextSection?.id === "parent_concern");
            
            // Skip this section if it will be rendered with previous section
            if ((section.id === "reason_for_referral" && sortedSections[index - 1]?.id === "heading") ||
                (section.id === "parent_concern" && (sortedSections[index - 1]?.id === "family_background" || 
                                                    sortedSections[index - 1]?.id === "health_developmental_history"))) {
              return null;
            }
            
            return (
            <div key={section.id} className="mb-12" id={section.id}>
              {/* Section title above horizontal line */}
              <h2 className="text-[14pt] font-medium text-center mb-2">{section.title}</h2>
              <hr className="mb-6 border-gray-300" />
              
              {/* Different handling for different section types */}
              {shouldRenderSideBySide ? (
                // Side by side layout for header + reason for referral or family + parent concern
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First section (header or family background) */}
                  {section.id === "heading" ? (
                    <Card>
                      <CardHeader className="py-3 border-b">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-center text-sm">{section.title}</CardTitle>
                          <Toggle 
                            variant="outline"
                            size="sm"
                            className="edit-toggle h-8 w-8 p-0 rounded-full hover:bg-blue-50/80 hover:text-blue-500"
                            aria-label="Edit header"
                          >
                            <Pencil className="h-4 w-4" />
                          </Toggle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {formatHeaderSection(section)}
                      </CardContent>
                    </Card>
                  ) : (
                    <ToggleEditCard
                      title={section.title}
                      initialContent={section.cards[0].content}
                      onSave={(newContent) => {
                        console.log(`Saving content for section ${section.id}:`, newContent);
                      }}
                      compact={true}
                      className="m-0 aspect-square flex flex-col"
                      icon={getSectionIcon(section.id)}
                      renderViewMode={({ content }) => (
                        <div className="whitespace-pre-line text-[11pt] overflow-hidden line-clamp-6 group-hover:line-clamp-none group-hover:overflow-auto transition-all duration-300 flex-grow">{content}</div>
                      )}
                    />
                  )}
                  
                  {/* Second section (reason for referral or parent concern) */}
                  <ToggleEditCard
                    title={nextSection.title}
                    initialContent={nextSection.cards[0].content}
                    onSave={(newContent) => {
                      console.log(`Saving content for section ${nextSection.id}:`, newContent);
                    }}
                    compact={true}
                    className="m-0 aspect-square flex flex-col"
                    icon={getSectionIcon(nextSection.id)}
                    renderViewMode={({ content }) => (
                      <div className="whitespace-pre-line text-[11pt] overflow-hidden line-clamp-6 group-hover:line-clamp-none group-hover:overflow-auto transition-all duration-300 flex-grow">{content}</div>
                    )}
                  />
                </div>
              ) : section.id === "heading" ? (
                <Card>
                  <CardContent className="p-6">
                    {formatHeaderSection(section)}
                  </CardContent>
                </Card>
              ) : ['assessment_tools', 'assessment_results', 'language_sample', 'recommendations', 'accommodations'].includes(section.id) ? (
                <div className="space-y-6">
                  {/* Grid layout for sections with multiple cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {section.cards.map((card: any, index: number) => {
                      const handleSaveCard = (newContent: string) => {
                        // In a real app, you would save the content to the database
                        console.log(`Saving content for card ${card.id}:`, newContent);
                      };
                      
                      // Determine appropriate icon based on card title/content
                      const getCardIcon = () => {
                        const title = card.title.toLowerCase();
                        
                        // Language sample specific icons
                        if (section.id === 'language_sample') {
                          if (title.includes('information')) {
                            return getAssessmentSubsectionIcon('sampleInfo');
                          } else if (title.includes('metrics')) {
                            return getAssessmentSubsectionIcon('metrics');
                          } else if (title.includes('transcription')) {
                            return getAssessmentSubsectionIcon('transcription');
                          }
                        }
                        
                        // Assessment icons
                        if (title.includes('articulation') || title.includes('gfta')) {
                          return getAssessmentSubsectionIcon('articulation');
                        } else if (title.includes('language') || title.includes('celf')) {
                          return getAssessmentSubsectionIcon('language');
                        } else if (title.includes('cognitive') || title.includes('achievement')) {
                          return getAssessmentSubsectionIcon('academic');
                        } else if (title.includes('classroom') || title.includes('accommodations')) {
                          return getAssessmentSubsectionIcon('education');
                        }
                        
                        // Default to section icon
                        return getSectionIcon(section.id);
                      };
                      
                      return (
                        <ToggleEditCard
                          key={card.id}
                          title={card.title}
                          initialContent={card.content}
                          onSave={handleSaveCard}
                          compact={true}
                          className="h-full m-0 aspect-square flex flex-col"
                          icon={getCardIcon()}
                          renderViewMode={({ content }) => (
                            <div className="whitespace-pre-line text-[11pt] overflow-hidden line-clamp-6 group-hover:line-clamp-none group-hover:overflow-auto transition-all duration-300 flex-grow">{content}</div>
                          )}
                        />
                      );
                    })}
                    
                    {/* Ghost card with plus button */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center aspect-square">
                      <Button variant="ghost" className="h-16 w-16 rounded-full">
                        <PlusCircle className="w-8 h-8" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Dynamic content added through the input bar */}
                  {reportSections[section.id]?.content && (
                    <div>
                      <h3 className="text-center text-[12pt] font-medium mb-3">Additional Observations</h3>
                      <ToggleEditCard
                        title="Additional Observations"
                        initialContent={reportSections[section.id].content}
                        onSave={(newContent) => {
                          console.log(`Saving additional content for section ${section.id}:`, newContent);
                          // Update the reportSections state
                          const updatedSections = {...reportSections};
                          updatedSections[section.id] = { content: newContent };
                          setReportSections(updatedSections);
                        }}
                        compact={true}
                        className="m-0 aspect-square flex flex-col"
                        icon={getSectionIcon(section.id)}
                        renderViewMode={({ content }) => (
                          <div className="whitespace-pre-line text-[11pt] overflow-hidden line-clamp-6 group-hover:line-clamp-none group-hover:overflow-auto transition-all duration-300 flex-grow">{content}</div>
                        )}
                      />
                    </div>
                  )}
                </div>
              ) : (
                formatStandardSection(section)
              )}
            </div>
            );
          })}
        </div>
      </div>
    </div>
    </SidebarProvider>
  );
}