"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, BookOpen, Image, Save, ArrowRight, Settings, Wand, Book, GripVertical } from "lucide-react";
import { NARRATIVE_LEVELS } from '@/lib/schemas/story';
import { useStories } from '@/components/contexts/stories-context';

export default function NarrativelyPage() {
  const router = useRouter();
  const { createStory } = useStories();
  
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [narrativeLevel, setNarrativeLevel] = useState<string>(NARRATIVE_LEVELS.FOCUSED_CHAINS);
  const [activeTab, setActiveTab] = useState<'vocabulary' | 'grammar'>('vocabulary');
  const [storyTitle, setStoryTitle] = useState<string>('');

  // Vocabulary settings
  const [vocabularyInput, setVocabularyInput] = useState<string>("");
  
  // Grammar settings
  const [targetGrammar, setTargetGrammar] = useState<string>("past_tense");
  
  // Story settings
  const [studentAge, setStudentAge] = useState<string>("8");
  const [studentName, setStudentName] = useState<string>("");
  const [includeImages, setIncludeImages] = useState<boolean>(true);
  const [includeBarrettQuestions, setIncludeBarrettQuestions] = useState<boolean>(true);
  const [includePreReading, setIncludePreReading] = useState<boolean>(true);
  
  // Story grammar elements for True Narratives
  const [storyGrammar, setStoryGrammar] = useState({
    setting: "",
    characters: "",
    problem: "",
    attempts: "",
    resolution: "",
    theme: ""
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setGeneratedContent(null);

    try {
      // Process vocabulary words - split by commas or new lines
      const vocabularyWords = vocabularyInput
        .split(/[,\n]/)
        .map(word => word.trim())
        .filter(word => word.length > 0);

      if (activeTab === 'vocabulary' && vocabularyWords.length === 0) {
        alert("Please enter at least one vocabulary word");
        setLoading(false);
        return;
      }

      const requestBody: any = {
        templateType: 'narrative',
        narrativeLevel,
        studentAge: parseInt(studentAge),
        studentName,
        includeBarrettQuestions,
        includePreReadingActivities: includePreReading,
        generateImages: includeImages,
        consistentImageStyle: true // Ensure characters and settings are consistent across images
      };

      // Add appropriate content based on active tab
      if (activeTab === 'vocabulary') {
        requestBody.targetVocabulary = vocabularyWords;
      } else {
        requestBody.targetGrammar = targetGrammar;
      }

      // Add story grammar elements for true narratives
      if (narrativeLevel === 'true_narratives') {
        requestBody.storyGrammar = Object.fromEntries(
          Object.entries(storyGrammar).filter(([_, value]) => value.trim() !== '')
        );
      }

      const response = await fetch('/api/generate-template', {
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
      setGeneratedContent(data);
    } catch (error) {
      console.error('Error generating narrative:', error);
      alert('Failed to generate narrative. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderNarrativeLevelDescription = (level: string) => {
    const descriptions = {
      'sequences': 'Related events around a central topic but lacking causal relationships (3 years)',
      'primitive_narratives': 'Has a central person, object, or event with actions and feelings (4 years)',
      'chain_narratives': 'Events linked by cause and effect or time (5 years)',
      'focused_chains': 'Events revolve around a problem and a goal (5-6 years)',
      'true_narratives': 'Complete story with setting, characters, problem, resolution (6-7+ years)'
    };
    return descriptions[level as keyof typeof descriptions] || '';
  };
  
  // Save story to database and redirect to story view
  const handleSaveStory = async () => {
    if (!generatedContent) return;
    
    try {
      // Generate a title if none is provided
      const title = storyTitle.trim() || `Story - ${new Date().toLocaleDateString()}`;
      
      // Process vocabulary words
      const targetVocabulary = vocabularyInput
        .split(/[,\n]/)
        .map(word => word.trim())
        .filter(word => word.length > 0);
      
      // Create story data
      const storyData = {
        id: nanoid(),
        userId: 'user-1', // TODO: Use actual user ID once authentication is implemented
        studentId: 'student-1', // TODO: Use actual student ID once student management is implemented
        title,
        narrativeLevel,
        narrative: generatedContent.narrative,
        languages: ['English'],
        targetVocabulary,
        preReadingActivities: generatedContent.preReadingActivities,
        vocabulary: generatedContent.vocabulary,
        comprehensionQuestions: generatedContent.comprehensionQuestions,
        images: generatedContent.images,
        studentAge: parseInt(studentAge),
        wordCount: generatedContent.narrative.split(' ').length,
        status: 'generated',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const newStory = await createStory(storyData);
      
      if (newStory) {
        // Redirect to the story view page
        router.push(`/dashboard/user-1/stories/${newStory.id}`);
      }
    } catch (error) {
      console.error('Error saving story:', error);
      alert('Failed to save story. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-1 px-2">
        <div className="flex items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="mr-2 z-10">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[450px] max-h-[80vh] overflow-y-auto space-y-3" side="right" align="start">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'vocabulary' | 'grammar')} className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="vocabulary">
                    <Book className="w-4 h-4 mr-1" />
                    Target Vocabulary
                  </TabsTrigger>
                  <TabsTrigger value="grammar">
                    <GripVertical className="w-4 h-4 mr-1" />
                    Target Grammar
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="vocabulary" className="space-y-3 pt-3">
                  <Label htmlFor="vocabulary">Target Vocabulary Words</Label>
                  <Textarea
                    id="vocabulary"
                    placeholder="Enter words separated by commas or new lines"
                    rows={3}
                    value={vocabularyInput}
                    onChange={(e) => setVocabularyInput(e.target.value)}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    These words will be highlighted in the generated narrative
                  </p>
                </TabsContent>
                <TabsContent value="grammar" className="space-y-3 pt-3">
                  <Label htmlFor="grammarFeature">Target Grammar Feature</Label>
                  <select
                    id="grammarFeature"
                    className="w-full border rounded-md px-3 py-1 text-sm"
                    value={targetGrammar}
                    onChange={(e) => setTargetGrammar(e.target.value)}
                  >
                    <option value="past_tense">Past Tense</option>
                    <option value="present_tense">Present Tense</option>
                    <option value="future_tense">Future Tense</option>
                    <option value="plural_nouns">Plural Nouns</option>
                    <option value="pronouns">Pronouns</option>
                    <option value="prepositions">Prepositions</option>
                    <option value="conjunctions">Conjunctions</option>
                    <option value="adjectives">Adjectives</option>
                    <option value="adverbs">Adverbs</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    The narrative will emphasize the selected grammar feature
                  </p>
                </TabsContent>
              </Tabs>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="narrativeLevel">Narrative Development Level</Label>
                  <select
                    id="narrativeLevel"
                    className="w-full border rounded-md px-3 py-1 text-sm"
                    value={narrativeLevel}
                    onChange={(e) => setNarrativeLevel(e.target.value)}
                  >
                    <option value="sequences">Sequences (3 years)</option>
                    <option value="primitive_narratives">Primitive Narratives (4 years)</option>
                    <option value="chain_narratives">Chain Narratives (5 years)</option>
                    <option value="focused_chains">Focused Chains (5-6 years)</option>
                    <option value="true_narratives">True Narratives (6-7+ years)</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {renderNarrativeLevelDescription(narrativeLevel)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="studentAge">Student Age</Label>
                    <Input
                      id="studentAge"
                      type="number"
                      min="2"
                      max="18"
                      value={studentAge}
                      onChange={(e) => setStudentAge(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="studentName">Student Name (Optional)</Label>
                    <Input
                      id="studentName"
                      placeholder="Optional"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includePreReading">Include Pre-Reading Activities</Label>
                    <Switch
                      id="includePreReading"
                      checked={includePreReading}
                      onCheckedChange={setIncludePreReading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeBarrett">Include Barrett's Taxonomy Questions</Label>
                    <Switch
                      id="includeBarrett"
                      checked={includeBarrettQuestions}
                      onCheckedChange={setIncludeBarrettQuestions}
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
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand className="mr-1 h-4 w-4" />
                      Generate Narrative
                    </>
                  )}
                </Button>
              </form>
            </PopoverContent>
          </Popover>
        </div>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/dashboard/user-1/stories')}
        >
          My Narratives
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
      
      {/* Story content area - always render to ensure visibility before streaming */}
      <div className="flex-1 overflow-auto p-1 pt-0">
        {generatedContent || loading ? (
          <Tabs defaultValue="narrative" className="h-full">
            <div className="flex justify-between items-center mb-1 h-9">
              <TabsList className="h-8">
                <TabsTrigger value="narrative">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Story
                </TabsTrigger>
                {generatedContent?.vocabulary && (
                  <TabsTrigger value="vocabulary">
                    Vocabulary
                  </TabsTrigger>
                )}
                {generatedContent?.preReadingActivities && (
                  <TabsTrigger value="preReading">
                    Pre-Reading
                  </TabsTrigger>
                )}
                {generatedContent?.comprehensionQuestions && (
                  <TabsTrigger value="questions">
                    Questions
                  </TabsTrigger>
                )}
                {generatedContent?.images && (
                  <TabsTrigger value="images">
                    <Image className="h-4 w-4 mr-1" />
                    Images
                  </TabsTrigger>
                )}
              </TabsList>
              
              {generatedContent && (
                <div className="flex items-center">
                  <Input
                    placeholder="Enter narrative title"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    className="w-44 h-7 mr-1 text-sm"
                  />
                  <Button size="sm" className="h-7" onClick={handleSaveStory}>
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
              )}
              
              {!generatedContent && !loading && (
                <Button 
                  size="sm"
                  className="h-7"
                  onClick={handleSubmit}
                >
                  <Wand className="h-3 w-3 mr-1" />
                  Generate Narrative
                </Button>
              )}
            </div>

            <TabsContent value="narrative" className="h-[calc(100%-2.5rem)] overflow-auto">
              <Card className="h-full flex flex-col">
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#A87C39]" />
                      <p className="font-medium">Generating narrative...</p>
                      <p className="text-xs text-muted-foreground">This may take a moment</p>
                    </div>
                  </div>
                ) : generatedContent ? (
                  <>
                    <CardHeader className="py-2">
                      <CardTitle className="text-lg">Narrative</CardTitle>
                      <CardDescription className="text-xs">
                        {renderNarrativeLevelDescription(narrativeLevel)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto pt-0">
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: generatedContent.narrative }} />
                    </CardContent>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-4">
                    <div>
                      <BookOpen className="h-10 w-10 mx-auto mb-3 text-[#A87C39] opacity-50" />
                      <p className="text-base font-medium">No narrative generated yet</p>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Customize the options in Settings and click Generate
                      </p>
                      <Button 
                        onClick={handleSubmit} 
                        disabled={loading}
                        size="sm"
                      >
                        <Wand className="mr-1 h-4 w-4" />
                        Generate Narrative
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {generatedContent?.vocabulary && (
              <TabsContent value="vocabulary" className="h-[calc(100%-2.5rem)] overflow-auto">
                <Card className="h-full">
                  <CardHeader className="py-2">
                    <CardTitle className="text-base">Target Vocabulary</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {generatedContent.vocabulary.map((word: any, index: number) => (
                        <div key={index} className="p-3 bg-[#F8F7F4] rounded-lg">
                          <h3 className="text-base font-semibold text-[#A87C39]">
                            {word.word}
                          </h3>
                          <p className="text-sm mt-1">{word.definition}</p>
                          <p className="text-sm mt-1 italic">"{word.exampleSentence}"</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {generatedContent?.preReadingActivities && (
              <TabsContent value="preReading" className="h-[calc(100%-2.5rem)] overflow-auto">
                <Card className="h-full">
                  <CardHeader className="py-2">
                    <CardTitle className="text-base">Pre-Reading Activities</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto pt-0">
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: generatedContent.preReadingActivities }} />
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {generatedContent?.comprehensionQuestions && (
              <TabsContent value="questions" className="h-[calc(100%-2.5rem)] overflow-auto">
                <Card className="h-full">
                  <CardHeader className="py-2">
                    <CardTitle className="text-base">Comprehension Questions</CardTitle>
                    <CardDescription className="text-xs">Based on Barrett's Taxonomy of Reading Comprehension</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto pt-0">
                    <div className="space-y-3">
                      {generatedContent.comprehensionQuestions.map((question: any, index: number) => (
                        <div key={index} className="p-3 bg-[#F8F7F4] rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-sm font-medium">{question.question}</h3>
                            <span className="text-xs px-2 py-0.5 bg-[#DCE4DF] text-[#3C6E58] rounded-full">
                              {question.level.charAt(0).toUpperCase() + question.level.slice(1)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Sample answer: {question.sampleAnswer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {generatedContent?.images && (
              <TabsContent value="images" className="h-[calc(100%-2.5rem)] overflow-auto">
                <Card className="h-full">
                  <CardHeader className="py-2">
                    <CardTitle className="text-base">Story Images</CardTitle>
                    <CardDescription className="text-xs">Characters and settings are consistent across all scenes</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedContent.images.map((image: any, index: number) => (
                        <div key={index} className="space-y-1">
                          {image.url ? (
                            <img 
                              src={image.url} 
                              alt={`Story scene ${index + 1}`}
                              className="w-full h-auto rounded-lg shadow-md"
                            />
                          ) : (
                            <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                              <p className="text-xs text-muted-foreground">Failed to generate image</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">{image.context}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="py-8 text-center">
              <BookOpen className="h-10 w-10 mx-auto mb-3 text-[#A87C39] opacity-50" />
              <p className="text-base font-medium">Generate a narrative</p>
              <p className="text-sm text-muted-foreground mt-1 mb-3">
                Customize the options and click "Generate Narrative" to create a story
              </p>
              <Button 
                onClick={handleSubmit} 
                size="sm"
              >
                <Wand className="mr-1 h-4 w-4" />
                Generate Narrative
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}