'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

// Sample detailed assessment tool data
const toolsData = {
  'celf-5': {
    id: 'celf-5',
    name: 'CELF-5',
    fullName: 'Clinical Evaluation of Language Fundamentals, 5th Edition',
    description: 'Assesses receptive and expressive language skills across multiple domains including semantics, syntax, morphology, and pragmatics.',
    domains: [
      'Core Language', 
      'Receptive Language', 
      'Expressive Language', 
      'Language Content', 
      'Language Structure'
    ],
    ageRange: { min: 5, max: 21 },
    version: '5th Edition',
    publisher: 'Pearson',
    year: 2013,
    standardization: 'Standardized on a sample of 3,000 individuals aged 5-21 years',
    administrationTime: '30-45 minutes (core subtests)',
    scoreTypes: ['Standard Scores', 'Percentile Ranks', 'Age Equivalents'],
  },
  'gfta-3': {
    id: 'gfta-3',
    name: 'GFTA-3',
    fullName: 'Goldman-Fristoe Test of Articulation, 3rd Edition',
    description: 'Measures articulation of consonant sounds and assesses a child\'s production of speech sounds in words and sentences.',
    domains: ['Sound Production', 'Articulation', 'Phonological Development'],
    ageRange: { min: 2, max: 21 },
    version: '3rd Edition',
    publisher: 'Pearson',
    year: 2015,
    standardization: 'Standardized on a sample of over 2,350 individuals',
    administrationTime: '5-15 minutes',
    scoreTypes: ['Standard Scores', 'Percentile Ranks', 'Test-Age Equivalents'],
  },
  'taps-4': {
    id: 'taps-4',
    name: 'TAPS-4',
    fullName: 'Test of Auditory Processing Skills, 4th Edition',
    description: 'Assesses auditory processing abilities, including phonological processing, auditory memory, and auditory comprehension.',
    domains: ['Phonological Processing', 'Auditory Memory', 'Auditory Comprehension', 'Auditory Attention'],
    ageRange: { min: 5, max: 21 },
    version: '4th Edition',
    publisher: 'Pro-Ed',
    year: 2016,
    standardization: 'Standardized on a sample of 1,827 individuals aged 5-21 years',
    administrationTime: '45-60 minutes',
    scoreTypes: ['Standard Scores', 'Percentile Ranks', 'Age Equivalents'],
  },
  'casl-2': {
    id: 'casl-2',
    name: 'CASL-2',
    fullName: 'Comprehensive Assessment of Spoken Language, 2nd Edition',
    description: 'Assesses oral language skills in the areas of lexical/semantic, syntactic, supralinguistic, and pragmatic language.',
    domains: ['Lexical/Semantic', 'Syntactic', 'Supralinguistic', 'Pragmatic'],
    ageRange: { min: 3, max: 21 },
    version: '2nd Edition',
    publisher: 'WPS',
    year: 2017,
    standardization: 'Standardized on a sample of 2,394 individuals aged 3-21 years',
    administrationTime: '30-45 minutes (core subtests)',
    scoreTypes: ['Standard Scores', 'Percentile Ranks', 'Age Equivalents'],
  },
  'ctopp-2': {
    id: 'ctopp-2',
    name: 'CTOPP-2',
    fullName: 'Comprehensive Test of Phonological Processing, 2nd Edition',
    description: 'Assesses phonological awareness, phonological memory, and rapid naming abilities.',
    domains: ['Phonological Awareness', 'Phonological Memory', 'Rapid Naming'],
    ageRange: { min: 4, max: 24 },
    version: '2nd Edition',
    publisher: 'Pro-Ed',
    year: 2013,
    standardization: 'Standardized on a sample of 1,900 individuals aged 4-24 years',
    administrationTime: '30 minutes',
    scoreTypes: ['Standard Scores', 'Percentile Ranks', 'Age Equivalents'],
  },
  'ppvt-5': {
    id: 'ppvt-5',
    name: 'PPVT-5',
    fullName: 'Peabody Picture Vocabulary Test, 5th Edition',
    description: 'Assesses receptive vocabulary knowledge in a picture-pointing format.',
    domains: ['Receptive Vocabulary'],
    ageRange: { min: 2.5, max: 90 },
    version: '5th Edition',
    publisher: 'Pearson',
    year: 2019,
    standardization: 'Standardized on a sample of over 3,500 individuals aged 2.5-90+ years',
    administrationTime: '10-15 minutes',
    scoreTypes: ['Standard Scores', 'Percentile Ranks', 'Age Equivalents', 'Growth Scale Values'],
  },
  'told-p-5': {
    id: 'told-p-5',
    name: 'TOLD-P:5',
    fullName: 'Test of Language Development - Primary, 5th Edition',
    description: 'Assesses spoken language in children, including semantics, syntax, and phonology.',
    domains: ['Semantics', 'Syntax', 'Phonology', 'Overall Language'],
    ageRange: { min: 4, max: 8 },
    version: '5th Edition',
    publisher: 'Pro-Ed',
    year: 2018,
    standardization: 'Standardized on a sample of 1,035 children aged 4-8 years',
    administrationTime: '35-45 minutes',
    scoreTypes: ['Standard Scores', 'Percentile Ranks', 'Age Equivalents'],
  },
};

interface AssessmentCardProps {
  toolId: string;
}

export function AssessmentCard({ toolId }: AssessmentCardProps) {
  const [loading, setLoading] = useState(true);
  const [toolInfo, setToolInfo] = useState<any>(null);
  
  useEffect(() => {
    // Simulate fetching tool data
    const timer = setTimeout(() => {
      setToolInfo(toolsData[toolId as keyof typeof toolsData]);
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [toolId]);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!toolInfo) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Tool information not found
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{toolInfo.name}</CardTitle>
        <CardDescription>{toolInfo.fullName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>{toolInfo.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Age Range</h4>
              <p className="text-sm">{toolInfo.ageRange.min}-{toolInfo.ageRange.max} years</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Publisher</h4>
              <p className="text-sm">{toolInfo.publisher}, {toolInfo.year}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Administration Time</h4>
              <p className="text-sm">{toolInfo.administrationTime}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Version</h4>
              <p className="text-sm">{toolInfo.version}</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Domains Assessed</h4>
            <div className="flex flex-wrap gap-2 mt-1">
              {toolInfo.domains.map((domain: string, index: number) => (
                <span 
                  key={index}
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                >
                  {domain}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-1">Score Types</h4>
            <p className="text-sm">{toolInfo.scoreTypes.join(', ')}</p>
          </div>
          
          <div className="pt-4 flex justify-end">
            <Button variant="outline" size="sm" className="mr-2">
              View Documentation
            </Button>
            <Button size="sm">
              Add to Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}