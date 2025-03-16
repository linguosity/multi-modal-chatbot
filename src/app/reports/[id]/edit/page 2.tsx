'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { DEFAULT_SECTIONS } from '@/lib/schemas/report';
import { PlusCircle, Trash2, ArrowUpRight, MoveVertical, AlertCircle } from 'lucide-react';
import { processSmartPrompt } from '@/app/actions';
import { useReports } from "@/components/contexts/reports-context";

interface SectionCard {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'assessment' | 'checklist' | 'recommendation';
}

export default function EditReport({ params }: { params: { id: string } }) {
  // For this example, we'd normally fetch the report data from an API
  // using the params.id. Here we're just using mock data.
  
  // Initialize student info
  const [studentInfo, setStudentInfo] = useState({
    name: "Alex Smith",
    dob: "2018-05-12",
    grade: "1st Grade",
    school: "Lincoln Elementary",
    evaluator: "Brandon Brewer",
    evaluationDate: "March 1, 2025",
    diagnosis: ""
  });
  
  // Initialize report data with section cards
  const [reportData, setReportData] = useState({
    id: params.id,
    title: "Alex Smith Initial Speech-Language Evaluation",
    type: "initial",
    status: "draft",
    createdAt: "2025-03-01",
    updatedAt: "2025-03-07",
    studentName: "Alex Smith",
    sections: Object.values(DEFAULT_SECTIONS).map(section => ({
      id: section.id,
      title: section.title,
      content: section.content,
      order: section.order,
      isGenerated: section.isGenerated,
      // Initialize each section with at least one content card
      cards: [
        {
          id: `${section.id}-card-1`,
          title: section.title,
          content: section.content,
          type: section.id === 'assessment_tools' || section.id === 'assessment_results' 
            ? 'assessment' 
            : section.id === 'eligibility_checklist' 
              ? 'checklist'
              : section.id === 'recommendations' || section.id === 'accommodations'
                ? 'recommendation'
                : 'text'
        }
      ]
    }))
  });
  
  const [currentSection, setCurrentSection] = useState(reportData.sections[0]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Import the context hook
  const { setReportSections, setCurrentSectionId } = useReports();
  
  // Update the ReportEditSidebar in the parent layout
  React.useEffect(() => {
    // Update sections in the context
    setReportSections(reportData.sections);
    // Set the current section ID in the context
    setCurrentSectionId(currentSection.id);
  }, [reportData.sections, currentSection.id, setReportSections, setCurrentSectionId]);
  
  // Save current section
  const handleSaveSection = () => {
    setIsSaving(true);
    
    // Update the report data (in a real app, this would call an API)
    setReportData({
      ...reportData,
      updatedAt: new Date().toISOString().split('T')[0]
    });
    
    // Simulate API delay
    setTimeout(() => {
      setIsSaving(false);
    }, 500);
  };
  
  // Generate content for current card
  const handleGenerateContent = (sectionId: string, cardIndex: number) => {
    setIsGenerating(true);
    
    // Find the section and card
    const sectionIndex = reportData.sections.findIndex(s => s.id === sectionId);
    
    if (sectionIndex !== -1) {
      // In a real app, this would call the OpenAI API to generate content
      // For now, we'll just simulate a delay and update with placeholder content
      setTimeout(() => {
        const sectionObj = Object.values(DEFAULT_SECTIONS).find(s => s.id === sectionId);
        const generatedContent = sectionObj?.content.replace(
          /\[Student\]/g, 'Alex Smith'
        ).replace(
          /\[his\/her\/their\]/g, 'his'
        ).replace(
          /\[Evaluator Name\]/g, 'Brandon Brewer'
        ).replace(
          /\[School Name\]/g, 'Lincoln Elementary'
        );
        
        // Update the card content
        const updatedSections = [...reportData.sections];
        if (updatedSections[sectionIndex].cards[cardIndex]) {
          updatedSections[sectionIndex].cards[cardIndex].content = generatedContent || '';
          
          // Update the report data
          setReportData({
            ...reportData,
            sections: updatedSections
          });
          
          // If this is the current section, update current section state too
          if (currentSection.id === sectionId) {
            setCurrentSection(updatedSections[sectionIndex]);
          }
        }
        
        setIsGenerating(false);
      }, 1500);
    }
  };
  
  // Change the current section
  const handleSectionChange = (sectionId: string) => {
    // Find the new section
    const newSection = reportData.sections.find(section => section.id === sectionId);
    if (newSection) {
      setCurrentSection(newSection);
      setCurrentCardIndex(0); // Reset to first card in new section
      // Update the current section ID in the context
      setCurrentSectionId(sectionId);
    }
  };
  
  // Override the handleSectionChange in the context
  React.useEffect(() => {
    // This custom hook redefines handleSectionChange in the context to use our local function
    const { setHandleSectionChange } = { 
      setHandleSectionChange: (fn: any) => {
        // This is just a placeholder. In a real implementation, we would use a context setter.
      } 
    };
    
    // In a real implementation with proper context:
    // setHandleSectionChange(handleSectionChange);
  }, []);
  
  // Add a new card to a section
  const addCardToSection = (sectionId: string, type: 'text' | 'assessment' | 'checklist' | 'recommendation' = 'text') => {
    const sectionIndex = reportData.sections.findIndex(s => s.id === sectionId);
    
    if (sectionIndex !== -1) {
      const newCard: SectionCard = {
        id: `${sectionId}-card-${reportData.sections[sectionIndex].cards.length + 1}`,
        title: type === 'assessment' 
          ? 'New Assessment' 
          : type === 'checklist' 
            ? 'New Checklist Item' 
            : type === 'recommendation'
              ? 'New Recommendation'
              : 'Additional Information',
        content: '',
        type
      };
      
      const updatedSections = [...reportData.sections];
      updatedSections[sectionIndex].cards.push(newCard);
      
      setReportData({
        ...reportData,
        sections: updatedSections
      });
      
      // If this is the current section, update it
      if (currentSection.id === sectionId) {
        setCurrentSection(updatedSections[sectionIndex]);
        setCurrentCardIndex(updatedSections[sectionIndex].cards.length - 1); // Focus on the new card
      }
    }
  };
  
  // Remove a card from a section
  const removeCardFromSection = (sectionId: string, cardId: string) => {
    const sectionIndex = reportData.sections.findIndex(s => s.id === sectionId);
    
    if (sectionIndex !== -1) {
      // Don't remove the last card
      if (reportData.sections[sectionIndex].cards.length <= 1) {
        return;
      }
      
      const cardIndex = reportData.sections[sectionIndex].cards.findIndex(c => c.id === cardId);
      
      if (cardIndex !== -1) {
        const updatedSections = [...reportData.sections];
        updatedSections[sectionIndex].cards.splice(cardIndex, 1);
        
        setReportData({
          ...reportData,
          sections: updatedSections
        });
        
        // If this is the current section, update it
        if (currentSection.id === sectionId) {
          setCurrentSection(updatedSections[sectionIndex]);
          // Adjust current card index if needed
          if (currentCardIndex >= updatedSections[sectionIndex].cards.length) {
            setCurrentCardIndex(Math.max(0, updatedSections[sectionIndex].cards.length - 1));
          }
        }
      }
    }
  };
  
  // Update card content
  const updateCardContent = (sectionId: string, cardId: string, content: string) => {
    const sectionIndex = reportData.sections.findIndex(s => s.id === sectionId);
    
    if (sectionIndex !== -1) {
      const cardIndex = reportData.sections[sectionIndex].cards.findIndex(c => c.id === cardId);
      
      if (cardIndex !== -1) {
        const updatedSections = [...reportData.sections];
        updatedSections[sectionIndex].cards[cardIndex].content = content;
        
        setReportData({
          ...reportData,
          sections: updatedSections
        });
        
        // If this is the current section, update it
        if (currentSection.id === sectionId) {
          setCurrentSection(updatedSections[sectionIndex]);
        }
      }
    }
  };
  
  // Get appropriate icon for card type
  const getCardIcon = (type: string) => {
    switch (type) {
      case 'assessment':
        return <ArrowUpRight className="h-4 w-4" />;
      case 'checklist':
        return <AlertCircle className="h-4 w-4" />;
      case 'recommendation':
        return <MoveVertical className="h-4 w-4" />;
      default:
        return null;
    }
  };
  
  // Get appropriate button label for adding cards based on section type
  const getAddCardLabel = (sectionId: string) => {
    switch (sectionId) {
      case 'assessment_tools':
      case 'assessment_results':
        return 'Add Assessment';
      case 'eligibility_checklist':
        return 'Add Checklist Item';
      case 'recommendations':
      case 'accommodations':
        return 'Add Recommendation';
      default:
        return 'Add Text Block';
    }
  };
  
  // Get appropriate card type for section
  const getCardType = (sectionId: string): 'text' | 'assessment' | 'checklist' | 'recommendation' => {
    switch (sectionId) {
      case 'assessment_tools':
      case 'assessment_results':
        return 'assessment';
      case 'eligibility_checklist':
        return 'checklist';
      case 'recommendations':
      case 'accommodations':
        return 'recommendation';
      default:
        return 'text';
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{reportData.title}</h1>
          <p className="text-muted-foreground">
            Last updated: {reportData.updatedAt} • Status: {reportData.status.charAt(0).toUpperCase() + reportData.status.slice(1)}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/reports/${params.id}`}>
            <Button variant="outline">Preview</Button>
          </Link>
          <Button onClick={handleSaveSection} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Report"}
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">{/* Content Editor */}
          {/* Editor for paired sections (Header + Reason for Referral or Family Background + Parent Concerns) */}
          {(currentSection.id === "heading" || currentSection.id === "reason_for_referral" ||
            currentSection.id === "family_background" || currentSection.id === "parent_concern") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First section */}
              <Card>
                <CardHeader className="border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {currentSection.id === "reason_for_referral" ? "Reason for Referral" : 
                       currentSection.id === "parent_concern" ? "Parent/Guardian Concerns" :
                       currentSection.id === "heading" ? "Header" : "Family Background"}
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addCardToSection(
                        currentSection.id === "reason_for_referral" ? "reason_for_referral" :
                        currentSection.id === "parent_concern" ? "parent_concern" :
                        currentSection.id === "heading" ? "heading" : "family_background", 
                        getCardType(currentSection.id)
                      )}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {getAddCardLabel(currentSection.id)}
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="space-y-8">
                    {currentSection.cards.map((card, index) => (
                      <Card key={card.id} className="border-2 hover:border-primary/20 transition-colors">
                        <CardHeader className="bg-muted/40 flex flex-row justify-between items-center pb-2">
                          <div className="flex items-center gap-2">
                            {getCardIcon(card.type)}
                            <Input 
                              value={card.title} 
                              className="max-w-[300px] bg-transparent border-0 p-0 text-base font-medium focus-visible:ring-0"
                              onChange={(e) => {
                                const updatedSections = [...reportData.sections];
                                const sectionIndex = updatedSections.findIndex(s => s.id === currentSection.id);
                                if (sectionIndex !== -1) {
                                  updatedSections[sectionIndex].cards[index].title = e.target.value;
                                  setReportData({...reportData, sections: updatedSections});
                                  setCurrentSection(updatedSections[sectionIndex]);
                                }
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            {currentSection.isGenerated && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleGenerateContent(currentSection.id, index)}
                                disabled={isGenerating}
                              >
                                {isGenerating && currentCardIndex === index ? "Generating..." : "Generate"}
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                              onClick={() => removeCardFromSection(currentSection.id, card.id)}
                              disabled={currentSection.cards.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <textarea
                            className="w-full min-h-[200px] p-4 border rounded-md font-sans text-base leading-relaxed"
                            value={card.content}
                            onChange={(e) => updateCardContent(currentSection.id, card.id, e.target.value)}
                            placeholder="Enter content here..."
                          />
                        </CardContent>
                        <CardFooter className="text-xs text-muted-foreground border-t bg-muted/30 py-2">
                          {card.type === 'assessment' && 'Assessment data will be formatted professionally in the final report.'}
                          {card.type === 'checklist' && 'Checklist items will be formatted with appropriate indicators in the final report.'}
                          {card.type === 'recommendation' && 'Recommendations will be numbered automatically in the final report.'}
                          {card.type === 'text' && 'This text block supports markdown formatting.'}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Paired section */}
              <Card>
                <CardHeader className="border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {currentSection.id === "heading" ? "Reason for Referral" : 
                       currentSection.id === "reason_for_referral" ? "Header" :
                       currentSection.id === "family_background" ? "Parent/Guardian Concerns" : "Family Background"}
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addCardToSection(
                        currentSection.id === "heading" ? "reason_for_referral" :
                        currentSection.id === "reason_for_referral" ? "heading" :
                        currentSection.id === "family_background" ? "parent_concern" : "family_background", 
                        getCardType(
                          currentSection.id === "heading" ? "reason_for_referral" :
                          currentSection.id === "reason_for_referral" ? "heading" :
                          currentSection.id === "family_background" ? "parent_concern" : "family_background"
                        )
                      )}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {getAddCardLabel(
                        currentSection.id === "heading" ? "reason_for_referral" :
                        currentSection.id === "reason_for_referral" ? "heading" :
                        currentSection.id === "family_background" ? "parent_concern" : "family_background"
                      )}
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="space-y-8">
                    {(() => {
                      // Get paired section data
                      const pairedSectionId = 
                        currentSection.id === "heading" ? "reason_for_referral" :
                        currentSection.id === "reason_for_referral" ? "heading" :
                        currentSection.id === "family_background" ? "parent_concern" : "family_background";
                      
                      const pairedSection = reportData.sections.find(s => s.id === pairedSectionId);
                      
                      return pairedSection?.cards.map((card, index) => (
                        <Card key={card.id} className="border-2 hover:border-primary/20 transition-colors">
                          <CardHeader className="bg-muted/40 flex flex-row justify-between items-center pb-2">
                            <div className="flex items-center gap-2">
                              {getCardIcon(card.type)}
                              <Input 
                                value={card.title} 
                                className="max-w-[300px] bg-transparent border-0 p-0 text-base font-medium focus-visible:ring-0"
                                onChange={(e) => {
                                  const updatedSections = [...reportData.sections];
                                  const sectionIndex = updatedSections.findIndex(s => s.id === pairedSectionId);
                                  if (sectionIndex !== -1) {
                                    updatedSections[sectionIndex].cards[index].title = e.target.value;
                                    setReportData({...reportData, sections: updatedSections});
                                  }
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              {pairedSection.isGenerated && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleGenerateContent(pairedSectionId, index)}
                                  disabled={isGenerating}
                                >
                                  {isGenerating ? "Generating..." : "Generate"}
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                onClick={() => removeCardFromSection(pairedSectionId, card.id)}
                                disabled={pairedSection.cards.length <= 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <textarea
                              className="w-full min-h-[200px] p-4 border rounded-md font-sans text-base leading-relaxed"
                              value={card.content}
                              onChange={(e) => updateCardContent(pairedSectionId, card.id, e.target.value)}
                              placeholder="Enter content here..."
                            />
                          </CardContent>
                          <CardFooter className="text-xs text-muted-foreground border-t bg-muted/30 py-2">
                            {card.type === 'assessment' && 'Assessment data will be formatted professionally in the final report.'}
                            {card.type === 'checklist' && 'Checklist items will be formatted with appropriate indicators in the final report.'}
                            {card.type === 'recommendation' && 'Recommendations will be numbered automatically in the final report.'}
                            {card.type === 'text' && 'This text block supports markdown formatting.'}
                          </CardFooter>
                        </Card>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Regular section editor for non-paired sections */}
          {!(currentSection.id === "heading" || currentSection.id === "reason_for_referral" ||
             currentSection.id === "family_background" || currentSection.id === "parent_concern") && (
            <Card>
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <CardTitle>{currentSection.title}</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addCardToSection(currentSection.id, getCardType(currentSection.id))}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {getAddCardLabel(currentSection.id)}
                  </Button>
                </div>
                <CardDescription>
                  This section contains {currentSection.cards.length} card{currentSection.cards.length !== 1 ? 's' : ''}. 
                  Each card represents a separate component of this section.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="space-y-8">
                  {currentSection.cards.map((card, index) => (
                    <Card key={card.id} className="border-2 hover:border-primary/20 transition-colors">
                      <CardHeader className="bg-muted/40 flex flex-row justify-between items-center pb-2">
                        <div className="flex items-center gap-2">
                          {getCardIcon(card.type)}
                          <Input 
                            value={card.title} 
                            className="max-w-[300px] bg-transparent border-0 p-0 text-base font-medium focus-visible:ring-0"
                            onChange={(e) => {
                              const updatedSections = [...reportData.sections];
                              const sectionIndex = updatedSections.findIndex(s => s.id === currentSection.id);
                              if (sectionIndex !== -1) {
                                updatedSections[sectionIndex].cards[index].title = e.target.value;
                                setReportData({...reportData, sections: updatedSections});
                                setCurrentSection(updatedSections[sectionIndex]);
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          {currentSection.isGenerated && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleGenerateContent(currentSection.id, index)}
                              disabled={isGenerating}
                            >
                              {isGenerating && currentCardIndex === index ? "Generating..." : "Generate"}
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                            onClick={() => removeCardFromSection(currentSection.id, card.id)}
                            disabled={currentSection.cards.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <textarea
                          className="w-full min-h-[200px] p-4 border rounded-md font-sans text-base leading-relaxed"
                          value={card.content}
                          onChange={(e) => updateCardContent(currentSection.id, card.id, e.target.value)}
                          placeholder="Enter content here..."
                        />
                      </CardContent>
                      <CardFooter className="text-xs text-muted-foreground border-t bg-muted/30 py-2">
                        {card.type === 'assessment' && 'Assessment data will be formatted professionally in the final report.'}
                        {card.type === 'checklist' && 'Checklist items will be formatted with appropriate indicators in the final report.'}
                        {card.type === 'recommendation' && 'Recommendations will be numbered automatically in the final report.'}
                        {card.type === 'text' && 'This text block supports markdown formatting.'}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Smart Prompt */}
          <Card>
            <CardHeader>
              <CardTitle>Smart Prompt</CardTitle>
              <CardDescription>
                Quickly add information that will be populated throughout the report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const promptValue = formData.get('smartPrompt') as string;
                
                if (!promptValue) return;
                
                // Show loading state
                const smartPromptInput = e.currentTarget.elements.namedItem('smartPrompt') as HTMLInputElement;
                const submitButton = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement;
                const originalPlaceholder = smartPromptInput.placeholder;
                const originalButtonText = submitButton.innerText;
                
                smartPromptInput.placeholder = "Processing...";
                smartPromptInput.disabled = true;
                submitButton.disabled = true;
                submitButton.innerText = "Processing...";
                
                // Display loading animation
                const progressElement = document.getElementById('smart-prompt-progress');
                if (progressElement) {
                  progressElement.style.width = '0%';
                  progressElement.style.display = 'block';
                  
                  // Animate progress
                  let width = 0;
                  const interval = setInterval(() => {
                    if (width >= 90) {
                      clearInterval(interval);
                    } else {
                      width += 5;
                      progressElement.style.width = width + '%';
                    }
                  }, 100);
                }
                
                try {
                  // Process the prompt using the AI-powered function
                  const extractedData = await processSmartPrompt(promptValue);
                  
                  if (!extractedData) {
                    throw new Error("Failed to extract data");
                  }
                  
                  // Complete the progress bar
                  if (progressElement) {
                    progressElement.style.width = '100%';
                    setTimeout(() => {
                      progressElement.style.display = 'none';
                    }, 500);
                  }
                  
                  console.log("Extracted data:", extractedData);
                  
                  // Show preview of extracted data
                  const previewElement = document.getElementById('extracted-data-preview');
                  if (previewElement) {
                    const dataPoints = Object.entries(extractedData)
                      .filter(([_, value]) => value && typeof value === 'string' && value.trim() !== '')
                      .map(([key, value]) => `<span class="font-semibold">${key}:</span> ${value}`)
                      .join(' • ');
                    
                    previewElement.innerHTML = dataPoints;
                    previewElement.style.display = 'block';
                    
                    // Hide preview after 8 seconds
                    setTimeout(() => {
                      previewElement.style.display = 'none';
                    }, 8000);
                  }
                  
                  // Update all sections with the extracted information
                  const updatedSections = [...reportData.sections];
                  
                  // Track which placeholders were replaced to provide feedback
                  const replacedPlaceholders = new Set<string>();
                  
                  updatedSections.forEach((section, sectionIndex) => {
                    const updatedCards = [...section.cards];
                    
                    updatedCards.forEach((card, cardIndex) => {
                      let content = card.content;
                      
                      // Replace placeholders with actual values
                      if (extractedData.name) {
                        if (content.match(/\[Student(?:\s+Name)?\]/g)) {
                          replacedPlaceholders.add('Student Name');
                          content = content.replace(/\[Student(?:\s+Name)?\]/g, extractedData.name);
                        }
                      }
                      
                      if (extractedData.evaluator) {
                        if (content.match(/\[Evaluator Name\]/g)) {
                          replacedPlaceholders.add('Evaluator Name');
                          content = content.replace(/\[Evaluator Name\]/g, extractedData.evaluator);
                        }
                      }
                      
                      if (extractedData.evaluationDate) {
                        if (content.match(/\[Evaluation Date\]/g)) {
                          replacedPlaceholders.add('Evaluation Date');
                          content = content.replace(/\[Evaluation Date\]/g, extractedData.evaluationDate);
                        }
                      }
                      
                      if (extractedData.school) {
                        if (content.match(/\[School Name\]/g)) {
                          replacedPlaceholders.add('School Name');
                          content = content.replace(/\[School Name\]/g, extractedData.school);
                        }
                      }
                      
                      // Update credentials if provided
                      if (extractedData.credentials) {
                        if (content.match(/\[Credentials\]/g)) {
                          replacedPlaceholders.add('Credentials');
                          content = content.replace(/\[Credentials\]/g, extractedData.credentials);
                        }
                      }
                      
                      // Update gender pronouns based on extracted gender
                      if (extractedData.gender) {
                        if (content.match(/\[his\/her\/their\]/g)) {
                          replacedPlaceholders.add('Pronouns');
                          if (extractedData.gender === 'male') {
                            content = content.replace(/\[his\/her\/their\]/g, 'his');
                          } else if (extractedData.gender === 'female') {
                            content = content.replace(/\[his\/her\/their\]/g, 'her');
                          } else {
                            content = content.replace(/\[his\/her\/their\]/g, 'their');
                          }
                        }
                      }
                      
                      // Add referral information if available (to reason for referral section)
                      if (extractedData.referralInfo && section.id === 'reason_for_referral') {
                        if (content.match(/\[Referral Source\]/g)) {
                          replacedPlaceholders.add('Referral Source');
                          content = content.replace(/\[Referral Source\]/g, extractedData.referralInfo);
                        }
                        
                        if (content.match(/\[Brief Description of Concerns\]/g)) {
                          replacedPlaceholders.add('Concerns');
                          content = content.replace(/\[Brief Description of Concerns\]/g, 
                            extractedData.referralInfo.includes('concerns') 
                              ? extractedData.referralInfo 
                              : `concerns regarding speech and language development`);
                        }
                      }
                      
                      // Add parent information if available (to family background section)
                      if (extractedData.parentInfo && section.id === 'family_background') {
                        if (content.match(/\[family members\]/g)) {
                          replacedPlaceholders.add('Family Members');
                          content = content.replace(/\[family members\]/g, extractedData.parentInfo);
                        }
                      }
                      
                      // Add assessment information if available (to assessment tools section)
                      if (extractedData.assessmentInfo && 
                          (section.id === 'assessment_tools' || section.id === 'assessment_results')) {
                        replacedPlaceholders.add('Assessment Info');
                        // Only add if not already present to avoid duplication
                        if (!content.includes(extractedData.assessmentInfo)) {
                          content += `\n\n${extractedData.assessmentInfo}`;
                        }
                      }
                      
                      // Add diagnosis information if available (to relevant sections)
                      if (extractedData.diagnosis && 
                         (section.id === 'health_developmental_history' || 
                          section.id === 'conclusion')) {
                        replacedPlaceholders.add('Diagnosis');
                        // Only add if not already present
                        if (!content.includes(extractedData.diagnosis)) {
                          if (section.id === 'health_developmental_history') {
                            content = content.replace(/\[Relevant developmental milestones, health conditions, previous diagnoses, etc\.\]/g, 
                              `diagnosis of ${extractedData.diagnosis} and relevant developmental history`);
                          } else if (section.id === 'conclusion' && !content.includes(extractedData.diagnosis)) {
                            // Add to conclusion if appropriate
                            const diagnosisInfo = `${extractedData.name} has been diagnosed with ${extractedData.diagnosis}, which`;
                            if (!content.includes(diagnosisInfo)) {
                              content = content.replace(/\[Student\] demonstrates/g, diagnosisInfo + " affects");
                            }
                          }
                        }
                      }
                      
                      updatedCards[cardIndex] = {
                        ...card,
                        content
                      };
                    });
                    
                    updatedSections[sectionIndex] = {
                      ...section,
                      cards: updatedCards
                    };
                  });
                  
                  // Update student info with all extracted data
                  const updatedStudentInfo = {...studentInfo};
                  Object.entries(extractedData).forEach(([key, value]) => {
                    if (value && typeof value === 'string') {
                      updatedStudentInfo[key] = value;
                    }
                  });
                  
                  // Update report title if student name was provided
                  let updatedTitle = reportData.title;
                  if (extractedData.name) {
                    updatedTitle = `${extractedData.name} ${reportData.type.charAt(0).toUpperCase() + reportData.type.slice(1)} Speech-Language Evaluation`;
                  }
                  
                  // Update state
                  setStudentInfo(updatedStudentInfo);
                  setReportData({
                    ...reportData,
                    title: updatedTitle,
                    sections: updatedSections
                  });
                  
                  // Update current section if it's in the updated sections
                  const currentSectionIndex = updatedSections.findIndex(s => s.id === currentSection.id);
                  if (currentSectionIndex !== -1) {
                    setCurrentSection(updatedSections[currentSectionIndex]);
                  }
                  
                  // Show success message with replaced fields
                  const replacedFieldsText = replacedPlaceholders.size > 0 
                    ? `✓ Updated: ${Array.from(replacedPlaceholders).join(', ')}`
                    : "✓ Information applied successfully!";
                    
                  smartPromptInput.placeholder = replacedFieldsText;
                  setTimeout(() => {
                    smartPromptInput.placeholder = originalPlaceholder;
                  }, 3000);
                  
                } catch (error) {
                  console.error("Error processing smart prompt:", error);
                  smartPromptInput.placeholder = "❌ Error processing input. Try again.";
                  
                  // Hide progress bar on error
                  if (progressElement) {
                    progressElement.style.display = 'none';
                  }
                  
                  setTimeout(() => {
                    smartPromptInput.placeholder = originalPlaceholder;
                  }, 2000);
                } finally {
                  // Clear the input and restore button
                  smartPromptInput.value = '';
                  smartPromptInput.disabled = false;
                  submitButton.disabled = false;
                  submitButton.innerText = originalButtonText;
                }
              }}>
                <div className="flex flex-col space-y-2">
                  <div className="relative">
                    <Input
                      name="smartPrompt"
                      placeholder="Example: Student: John Smith, DOB: 5/12/2018, Grade: 1st, School: Lincoln Elementary"
                      className="w-full"
                    />
                    <div id="smart-prompt-progress" className="absolute bottom-0 left-0 h-1 bg-primary transition-all" style={{width: '0%', display: 'none'}}></div>
                  </div>
                  
                  <div id="extracted-data-preview" className="text-xs p-2 bg-muted/50 rounded text-muted-foreground leading-normal" style={{display: 'none'}}></div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      Enter student details in natural language and press Enter
                    </p>
                    <Button type="submit" size="sm">Process</Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Student Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Student Name</label>
                  <p className="font-medium">{studentInfo.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Date of Birth</label>
                  <p className="font-medium">{studentInfo.dob}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Grade</label>
                  <p className="font-medium">{studentInfo.grade}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">School</label>
                  <p className="font-medium">{studentInfo.school}</p>
                </div>
                {studentInfo.evaluator && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Evaluator</label>
                    <p className="font-medium">{studentInfo.evaluator}</p>
                  </div>
                )}
                {studentInfo.evaluationDate && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Evaluation Date</label>
                    <p className="font-medium">{studentInfo.evaluationDate}</p>
                  </div>
                )}
                {studentInfo.diagnosis && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Diagnosis</label>
                    <p className="font-medium">{studentInfo.diagnosis}</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Button variant="link" className="p-0">
                  View Full Student Profile
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Writing Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Report Writing Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <p><strong>Placeholders:</strong> Use square brackets [like this] to mark text that needs to be filled in.</p>
                <p><strong>Professional Language:</strong> Use objective, clear language focused on observations rather than interpretations.</p>
                <p><strong>Educational Focus:</strong> Connect assessment findings to educational impact and needs.</p>
                <p><strong>Format:</strong> This editor supports basic markdown including # headings, *italics*, **bold**, lists, and more.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}