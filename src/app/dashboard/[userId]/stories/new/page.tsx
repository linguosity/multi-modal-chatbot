"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Loader2, Wand, ArrowLeft } from "lucide-react";
import { useStories } from '@/components/contexts/stories-context';
import { NARRATIVE_LEVELS } from '@/lib/schemas/story';

export default function NewStoryPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;
  const { createStory, loading, error } = useStories();
  
  // Form state
  const [title, setTitle] = useState<string>('');
  const [narrativeLevel, setNarrativeLevel] = useState<string>(NARRATIVE_LEVELS.FOCUSED_CHAINS);
  const [studentAge, setStudentAge] = useState<string>('8');
  const [studentName, setStudentName] = useState<string>('');
  const [vocabularyInput, setVocabularyInput] = useState<string>('');
  const [includePreReading, setIncludePreReading] = useState<boolean>(true);
  const [includeQuestions, setIncludeQuestions] = useState<boolean>(true);
  const [includeImages, setIncludeImages] = useState<boolean>(false);
  const [streamGeneration, setStreamGeneration] = useState<boolean>(true);
  
  // UI state
  const [generatingStory, setGeneratingStory] = useState<boolean>(false);
  const [streamedContent, setStreamedContent] = useState<string>('');
  const [isStreamComplete, setIsStreamComplete] = useState<boolean>(false);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert("Please enter a title for your story");
      return;
    }
    
    setGeneratingStory(true);
    setStreamedContent('');
    setIsStreamComplete(false);
    
    try {
      // Process vocabulary words
      const targetVocabulary = vocabularyInput
        .split(/[,\n]/)
        .map(word => word.trim())
        .filter(word => word.length > 0);
      
      // Prepare request body
      const requestBody = {
        narrativeLevel,
        studentAge: parseInt(studentAge),
        studentName,
        targetVocabulary,
        languages: ['English'],
        includePreReadingActivities: includePreReading,
        includeBarrettQuestions: includeQuestions,
        generateImages: includeImages,
        stream: streamGeneration
      };
      
      if (streamGeneration) {
        // Set up EventSource for streaming
        const response = await fetch('/api/stories/generate-narrative', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        // For server-sent events, we need to read the stream
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let narrativeContent = '';
        
        while (true) {
          const { value, done } = await reader.read();
          
          if (done) {
            setIsStreamComplete(true);
            break;
          }
          
          // Parse the SSE data
          const text = decoder.decode(value);
          const lines = text.split('\n\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.substring(6));
                
                if (event.type === 'content_block_delta' && event.delta.text) {
                  narrativeContent += event.delta.text;
                  setStreamedContent(narrativeContent);
                }
              } catch (err) {
                console.error('Error parsing SSE data:', err);
              }
            }
          }
        }
        
        // Create the story after streaming is complete
        if (narrativeContent) {
          const storyData = {
            id: nanoid(),
            userId,
            studentId: 'sample-student', // TODO: Implement proper student selection
            title,
            narrativeLevel,
            narrative: `<p>${narrativeContent}</p>`,
            languages: ['English'],
            targetVocabulary,
            studentAge: parseInt(studentAge),
            status: 'generated',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          const newStory = await createStory(storyData);
          
          if (newStory) {
            // Redirect to the story view page
            router.push(`/dashboard/${userId}/stories/${newStory.id}`);
          }
        }
      } else {
        // Non-streaming generation
        const response = await fetch('/api/stories/generate-narrative', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Create the story with the generated content
        const storyData = {
          id: nanoid(),
          userId,
          studentId: 'sample-student', // TODO: Implement proper student selection
          title,
          narrativeLevel,
          narrative: data.narrative,
          languages: ['English'],
          targetVocabulary,
          preReadingActivities: data.preReadingActivities,
          vocabulary: data.vocabulary,
          comprehensionQuestions: data.comprehensionQuestions,
          images: data.images,
          studentAge: parseInt(studentAge),
          wordCount: data.metadata?.wordCount,
          status: 'generated',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const newStory = await createStory(storyData);
        
        if (newStory) {
          // Redirect to the story view page
          router.push(`/dashboard/${userId}/stories/${newStory.id}`);
        }
      }
    } catch (err) {
      console.error('Error generating story:', err);
      alert('Failed to generate story. Please try again.');
    } finally {
      setGeneratingStory(false);
    }
  };
  
  // Handle navigation back to stories list
  const handleBack = () => {
    router.push(`/dashboard/${userId}/stories`);
  };
  
  // Helper to render narrative level description
  const renderNarrativeLevelDescription = (level: string): string => {
    const descriptions: Record<string, string> = {
      'sequences': 'Related events around a central topic but lacking causal relationships (3 years)',
      'primitive_narratives': 'Has a central person, object, or event with actions and feelings (4 years)',
      'chain_narratives': 'Events linked by cause and effect or time (5 years)',
      'focused_chains': 'Events revolve around a problem and a goal (5-6 years)',
      'true_narratives': 'Complete story with setting, characters, problem, resolution (6-7+ years)'
    };
    return descriptions[level] || '';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Button variant="ghost" onClick={handleBack} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Stories
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create New Story</CardTitle>
              <CardDescription>
                Configure your story settings and generate a narrative
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Story Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter a title for your story"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="narrativeLevel">Narrative Development Level</Label>
                  <select
                    id="narrativeLevel"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={narrativeLevel}
                    onChange={(e) => setNarrativeLevel(e.target.value)}
                  >
                    <option value={NARRATIVE_LEVELS.SEQUENCES}>Sequences (3 years)</option>
                    <option value={NARRATIVE_LEVELS.PRIMITIVE_NARRATIVES}>Primitive Narratives (4 years)</option>
                    <option value={NARRATIVE_LEVELS.CHAIN_NARRATIVES}>Chain Narratives (5 years)</option>
                    <option value={NARRATIVE_LEVELS.FOCUSED_CHAINS}>Focused Chains (5-6 years)</option>
                    <option value={NARRATIVE_LEVELS.TRUE_NARRATIVES}>True Narratives (6-7+ years)</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {renderNarrativeLevelDescription(narrativeLevel)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentAge">Student Age</Label>
                    <Input
                      id="studentAge"
                      type="number"
                      min="2"
                      max="18"
                      value={studentAge}
                      onChange={(e) => setStudentAge(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Student Name (Optional)</Label>
                    <Input
                      id="studentName"
                      placeholder="Optional"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vocabulary">Target Vocabulary Words</Label>
                  <Textarea
                    id="vocabulary"
                    placeholder="Enter words separated by commas or new lines"
                    rows={4}
                    value={vocabularyInput}
                    onChange={(e) => setVocabularyInput(e.target.value)}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    These words will be highlighted in the generated narrative
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includePreReading">Include Pre-Reading Activities</Label>
                    <Switch
                      id="includePreReading"
                      checked={includePreReading}
                      onCheckedChange={setIncludePreReading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeQuestions">Include Comprehension Questions</Label>
                    <Switch
                      id="includeQuestions"
                      checked={includeQuestions}
                      onCheckedChange={setIncludeQuestions}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeImages">Generate Story Images</Label>
                    <Switch
                      id="includeImages"
                      checked={includeImages}
                      onCheckedChange={setIncludeImages}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="streamGeneration">Stream Generation</Label>
                    <Switch
                      id="streamGeneration"
                      checked={streamGeneration}
                      onCheckedChange={setStreamGeneration}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={generatingStory}>
                  {generatingStory ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand className="mr-2 h-4 w-4" />
                      Generate Story
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          {generatingStory || streamedContent ? (
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Story Preview</CardTitle>
                <CardDescription>
                  {generatingStory && !isStreamComplete ? 'Generating narrative...' : 'Generated content'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {streamedContent ? (
                  <div className="prose max-w-none">
                    <p>{streamedContent}</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium">Story Preview</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Configure your settings and click "Generate Story" to create a new narrative
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}