"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen, Image, ArrowLeft, Download, Pencil, Trash2, Clock, FileText, ChevronRight, Home } from "lucide-react";
import { useStories } from '@/components/contexts/stories-context';
import { Story } from '@/lib/schemas/story';

export default function StoryViewPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;
  const storyId = params?.storyId as string;
  const { loadStory, deleteStory, loading, error } = useStories();
  
  const [story, setStory] = useState<Story | null>(null);
  const [activeTab, setActiveTab] = useState('narrative');
  
  useEffect(() => {
    async function fetchStory() {
      if (storyId) {
        const loadedStory = await loadStory(storyId);
        if (loadedStory) {
          setStory(loadedStory);
        }
      }
    }
    
    fetchStory();
  }, [storyId, loadStory]);
  
  // Handle navigation back to stories list
  const handleBack = () => {
    router.push(`/dashboard/${userId}/stories`);
  };
  
  // Handle story deletion
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this story?')) {
      const success = await deleteStory(storyId);
      if (success) {
        router.push(`/dashboard/${userId}/stories`);
      }
    }
  };
  
  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Helper to get narrative level display name
  const getNarrativeLevelDisplay = (level: string): string => {
    const displayNames: Record<string, string> = {
      'sequences': 'Sequences (3 years)',
      'primitive_narratives': 'Primitive Narratives (4 years)',
      'chain_narratives': 'Chain Narratives (5 years)',
      'focused_chains': 'Focused Chains (5-6 years)',
      'true_narratives': 'True Narratives (6-7+ years)'
    };
    
    return displayNames[level] || level;
  };

  return (
    <div className="container mx-auto">

      <Button variant="ghost" onClick={handleBack} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Stories
      </Button>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading story...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {story && (
        <>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold">{story.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 bg-[#F8F7F4] text-[#A87C39] text-xs rounded-full">
                  {getNarrativeLevelDisplay(story.narrativeLevel)}
                </span>
                <span className="text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Updated {formatDate(story.updatedAt)}
                </span>
                <span className="text-sm text-muted-foreground">
                  <FileText className="h-3 w-3 inline mr-1" />
                  {story.wordCount || 0} words
                </span>
              </div>
            </div>
            <div className="space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          <Tabs defaultValue="narrative" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="narrative">
                <BookOpen className="h-4 w-4 mr-2" />
                Story
              </TabsTrigger>
              
              {story.vocabulary && story.vocabulary.length > 0 && (
                <TabsTrigger value="vocabulary">
                  Vocabulary
                </TabsTrigger>
              )}
              
              {story.preReadingActivities && (
                <TabsTrigger value="preReading">
                  Pre-Reading
                </TabsTrigger>
              )}
              
              {story.comprehensionQuestions && story.comprehensionQuestions.length > 0 && (
                <TabsTrigger value="questions">
                  Questions
                </TabsTrigger>
              )}
              
              {story.images && story.images.length > 0 && (
                <TabsTrigger value="images">
                  <Image className="h-4 w-4 mr-2" />
                  Images
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="narrative">
              <Card>
                <CardHeader>
                  <CardTitle>Narrative</CardTitle>
                  <CardDescription>
                    {getNarrativeLevelDisplay(story.narrativeLevel)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: story.narrative }} />
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    {story.targetVocabulary && story.targetVocabulary.length > 0 && (
                      <div className="mb-2">
                        <span className="font-medium">Target Vocabulary:</span>{' '}
                        {story.targetVocabulary.join(', ')}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Languages:</span>{' '}
                      {story.languages.join(', ')}
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            {story.vocabulary && story.vocabulary.length > 0 && (
              <TabsContent value="vocabulary">
                <Card>
                  <CardHeader>
                    <CardTitle>Target Vocabulary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {story.vocabulary.map((word, index) => (
                        <div key={index} className="p-4 bg-[#F8F7F4] rounded-lg">
                          <h3 className="text-lg font-semibold text-[#A87C39]">{word.word}</h3>
                          <p className="text-sm mt-1">{word.definition}</p>
                          <p className="text-sm mt-1 italic">"{word.exampleSentence}"</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {story.preReadingActivities && (
              <TabsContent value="preReading">
                <Card>
                  <CardHeader>
                    <CardTitle>Pre-Reading Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: story.preReadingActivities }} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {story.comprehensionQuestions && story.comprehensionQuestions.length > 0 && (
              <TabsContent value="questions">
                <Card>
                  <CardHeader>
                    <CardTitle>Comprehension Questions</CardTitle>
                    <CardDescription>Based on Barrett's Taxonomy of Reading Comprehension</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {story.comprehensionQuestions.map((question, index) => (
                        <div key={index} className="p-4 bg-[#F8F7F4] rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-base font-medium">{question.question}</h3>
                            <span className="text-xs px-2 py-1 bg-[#DCE4DF] text-[#3C6E58] rounded-full">
                              {question.level.charAt(0).toUpperCase() + question.level.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Sample answer: {question.sampleAnswer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {story.images && story.images.length > 0 && (
              <TabsContent value="images">
                <Card>
                  <CardHeader>
                    <CardTitle>Story Images</CardTitle>
                    <CardDescription>Visual representations of the narrative</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {story.images.map((image, index) => (
                        <div key={index} className="space-y-2">
                          {image.url ? (
                            <img 
                              src={image.url} 
                              alt={`Story scene ${index + 1}`}
                              className="w-full h-auto rounded-lg shadow-md"
                            />
                          ) : (
                            <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                              <p className="text-muted-foreground">Image not available</p>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">{image.context}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
}