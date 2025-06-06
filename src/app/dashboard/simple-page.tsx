'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PanelLeft, Home, ClipboardCheck, Users, MessageSquare, FileText, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// A simplified lockable card component directly in this file to avoid issues
const LockableCard = ({ 
  children, 
  title, 
  description, 
  background = '', 
  onRemove = () => {}, 
  index = 0 
}) => {
  const [isLocked, setIsLocked] = useState(true);

  const handleLockToggle = () => {
    if (isLocked) {
      setIsLocked(false);
    } else {
      onRemove(index);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`relative group ${background}`}>
        <CardHeader className="pb-2 pr-14">
          <CardTitle className="text-lg">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 opacity-70 group-hover:opacity-100 transition-opacity"
            onClick={handleLockToggle}
          >
            {isLocked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4 text-red-500" />
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function SimpleDashboard() {
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [visibleAssessments, setVisibleAssessments] = useState([true, true, true]);
  const [visibleDomains, setVisibleDomains] = useState([true, true, true, true, true]);
  
  // Sample assessment data
  const assessments = [
    { 
      id: 1, 
      title: "CELF-5", 
      description: "Clinical Evaluation of Language Fundamentals",
      score: 82, 
      percentile: 12, 
      status: "Below Average",
      background: "bg-amber-50/30"
    },
    { 
      id: 2, 
      title: "GFTA-3", 
      description: "Goldman-Fristoe Test of Articulation",
      score: 88, 
      percentile: 21, 
      status: "Below Average",
      background: "bg-rose-50/30" 
    },
    { 
      id: 3, 
      title: "TAPS-4", 
      description: "Test of Auditory Processing Skills",
      score: 90, 
      percentile: 25, 
      status: "Average",
      background: "bg-lime-50/30"
    }
  ];
  
  // Sample domain results data
  const domainResults = [
    { 
      id: 1,
      area: "Pragmatics & Prelinguistic Skills", 
      strengths: "Maintains eye contact, shows joint attention", 
      areasForGrowth: "Turn-taking, topic maintenance",
      testResults: "Below average (SS 84)",
      classroomImpact: "Difficulty with group work, limited peer interactions",
      background: "bg-amber-50/30"
    },
    { 
      id: 2,
      area: "Receptive Language", 
      strengths: "Basic vocabulary, simple directions", 
      areasForGrowth: "Complex directions, temporal concepts",
      testResults: "Below average (SS 82)",
      classroomImpact: "Misses key information in lessons, needs repetition",
      background: "bg-rose-50/30"
    },
    { 
      id: 3,
      area: "Expressive Language", 
      strengths: "Concrete vocabulary, simple sentences", 
      areasForGrowth: "Complex sentences, narrative structure",
      testResults: "Below average (SS 79)",
      classroomImpact: "Limited participation, simplified responses",
      background: "bg-lime-50/30"
    },
    { 
      id: 4,
      area: "Articulation & Oral Motor Skills", 
      strengths: "Most early-developing sounds", 
      areasForGrowth: "/r/, /l/, and consonant blends",
      testResults: "Below average (SS 85)",
      classroomImpact: "Reduced intelligibility affects participation",
      background: "bg-fuchsia-50/30"
    },
    { 
      id: 5,
      area: "Voice and Fluency", 
      strengths: "Appropriate pitch and volume", 
      areasForGrowth: "No concerns",
      testResults: "Within normal limits (WNL)",
      classroomImpact: "No impact observed",
      background: "bg-emerald-50/30"
    }
  ];
  
  // Handle removing assessment card
  const removeAssessment = (index) => {
    const newVisibleAssessments = [...visibleAssessments];
    newVisibleAssessments[index] = false;
    setVisibleAssessments(newVisibleAssessments);
  };
  
  // Handle removing domain card
  const removeDomain = (index) => {
    const newVisibleDomains = [...visibleDomains];
    newVisibleDomains[index] = false;
    setVisibleDomains(newVisibleDomains);
  };
  
  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        {/* Loading state */}
        <div className="flex-1 p-8 flex flex-col gap-8">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`bg-slate-50 border-r transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="p-4 flex items-center justify-between border-b">
          {!sidebarCollapsed && <h1 className="font-semibold text-xl">Linguosity</h1>}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="h-7 w-7"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="py-4">
          <nav className="space-y-1 px-2">
            <div className="flex items-center p-2 rounded-md hover:bg-slate-200 text-slate-800">
              <Home className="h-5 w-5" />
              {!sidebarCollapsed && <span className="ml-3">Overview</span>}
            </div>
            
            <div className="flex items-center p-2 rounded-md hover:bg-slate-200 text-slate-800">
              <FileText className="h-5 w-5" />
              {!sidebarCollapsed && <span className="ml-3">Reason for Referral</span>}
            </div>
            
            <div className="flex items-center p-2 rounded-md hover:bg-slate-200 text-slate-800">
              <Users className="h-5 w-5" />
              {!sidebarCollapsed && <span className="ml-3">Background</span>}
            </div>
            
            <div className="flex items-center p-2 rounded-md hover:bg-slate-200 text-slate-800">
              <MessageSquare className="h-5 w-5" />
              {!sidebarCollapsed && <span className="ml-3">Parent Report</span>}
            </div>
            
            <div className="flex items-center p-2 rounded-md bg-slate-200 font-medium text-slate-900">
              <ClipboardCheck className="h-5 w-5" />
              {!sidebarCollapsed && <span className="ml-3">Assessment</span>}
            </div>
          </nav>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="h-16 flex items-center px-6 border-b">
          <h1 className="text-2xl font-semibold">Assessment Dashboard</h1>
        </header>
        
        <main className="p-6">
          {/* Assessment Tools & Results */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Assessment Tools & Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <AnimatePresence>
                {assessments.map((assessment, index) => (
                  visibleAssessments[index] && (
                    <LockableCard
                      key={assessment.id}
                      title={assessment.title}
                      description={assessment.description}
                      index={index}
                      onRemove={removeAssessment}
                      background={assessment.background}
                    >
                      <div className="space-y-4">
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="description" className="border-b-0">
                            <AccordionTrigger className="py-2 text-sm font-medium">Description</AccordionTrigger>
                            <AccordionContent>
                              <p className="text-sm">
                                {assessment.description === "Clinical Evaluation of Language Fundamentals" 
                                  ? "Assesses receptive and expressive language skills across multiple domains."
                                  : assessment.description === "Goldman-Fristoe Test of Articulation"
                                    ? "Measures articulation of consonant sounds and speech sound errors."
                                    : "Evaluates auditory processing skills and comprehension."}
                              </p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                        
                        <div className="pt-2 border-t">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Standard Score:</span>
                            <span className={`${assessment.status === "Below Average" ? "text-orange-500" : "text-green-500"}`}>
                              {assessment.score}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="font-medium">Percentile:</span>
                            <span className={`${assessment.status === "Below Average" ? "text-orange-500" : "text-green-500"}`}>
                              {assessment.percentile}%ile
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="font-medium">Status:</span>
                            <span className={`${assessment.status === "Below Average" ? "text-orange-500" : "text-green-500"}`}>
                              {assessment.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </LockableCard>
                  )
                ))}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Domain Results */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Domain Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <AnimatePresence>
                {domainResults.map((domain, index) => (
                  visibleDomains[index] && (
                    <LockableCard
                      key={domain.id}
                      title={domain.area}
                      index={index}
                      onRemove={removeDomain}
                      background={domain.background}
                    >
                      <div className="space-y-3 text-sm">
                        <Accordion type="multiple" className="w-full">
                          <AccordionItem value="strengths" className="border-b-0">
                            <AccordionTrigger className="py-2">
                              <span className="font-medium">Strengths</span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <p>{domain.strengths}</p>
                            </AccordionContent>
                          </AccordionItem>
                        
                          <AccordionItem value="areas" className="border-b-0">
                            <AccordionTrigger className="py-2">
                              <span className="font-medium">Areas for Growth</span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <p>{domain.areasForGrowth}</p>
                            </AccordionContent>
                          </AccordionItem>
                        
                          <AccordionItem value="results" className="border-b-0">
                            <AccordionTrigger className="py-2">
                              <span className="font-medium">Test Results</span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <p>{domain.testResults}</p>
                            </AccordionContent>
                          </AccordionItem>
                        
                          <AccordionItem value="impact" className="border-b-0">
                            <AccordionTrigger className="py-2">
                              <span className="font-medium">Classroom Impact</span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <p>{domain.classroomImpact}</p>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                        
                        <div className="flex justify-end mt-4">
                          <Button size="sm" className="text-xs">
                            Generate Analysis
                          </Button>
                        </div>
                      </div>
                    </LockableCard>
                  )
                ))}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}