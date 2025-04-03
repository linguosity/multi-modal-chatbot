"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, BookOpen, Image, Save, Download, Settings, Wand, Book, GripVertical } from "lucide-react";

export default function NarrativelyPage() {
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [narrativeLevel, setNarrativeLevel] = useState<string>("focused_chains");
  const [activeTab, setActiveTab] = useState<'vocabulary' | 'grammar'>('vocabulary');

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

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-6">
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Narratively</CardTitle>
              <CardDescription>
                Generate developmentally appropriate narratives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'vocabulary' | 'grammar')} className="mb-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="vocabulary">
                    <Book className="w-4 h-4 mr-2" />
                    Target Vocabulary
                  </TabsTrigger>
                  <TabsTrigger value="grammar">
                    <GripVertical className="w-4 h-4 mr-2" />
                    Target Grammar
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="vocabulary" className="space-y-4 pt-4">
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
                </TabsContent>
                <TabsContent value="grammar" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="grammarFeature">Target Grammar Feature</Label>
                    <select 
                      id="grammarFeature"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                  </div>
                </TabsContent>
              </Tabs>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="narrativeLevel">Narrative Development Level</Label>
                  <select 
                    id="narrativeLevel"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={narrativeLevel}
                    onChange={(e) => setNarrativeLevel(e.target.value)}
                  >
                    {/* Heaps level commented out as requested */}
                    {/* <option value="heaps">Heaps (2-3 years)</option> */}
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

                {narrativeLevel === 'true_narratives' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Story Grammar Elements</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-1" />
                            Customize
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4">
                          <h4 className="font-medium mb-3">Story Elements</h4>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="setting">Setting</Label>
                              <Input
                                id="setting"
                                placeholder="e.g., enchanted forest, space station"
                                value={storyGrammar.setting}
                                onChange={(e) => setStoryGrammar({...storyGrammar, setting: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="characters">Characters</Label>
                              <Input
                                id="characters"
                                placeholder="e.g., brave knight, curious scientist"
                                value={storyGrammar.characters}
                                onChange={(e) => setStoryGrammar({...storyGrammar, characters: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="problem">Problem</Label>
                              <Input
                                id="problem"
                                placeholder="e.g., lost treasure, broken bridge"
                                value={storyGrammar.problem}
                                onChange={(e) => setStoryGrammar({...storyGrammar, problem: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="attempts">Attempts</Label>
                              <Input
                                id="attempts"
                                placeholder="e.g., asking for help, creating a map"
                                value={storyGrammar.attempts}
                                onChange={(e) => setStoryGrammar({...storyGrammar, attempts: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="resolution">Resolution</Label>
                              <Input
                                id="resolution"
                                placeholder="e.g., finding treasure, making friends"
                                value={storyGrammar.resolution}
                                onChange={(e) => setStoryGrammar({...storyGrammar, resolution: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="theme">Theme</Label>
                              <Input
                                id="theme"
                                placeholder="e.g., friendship, courage, persistence"
                                value={storyGrammar.theme}
                                onChange={(e) => setStoryGrammar({...storyGrammar, theme: e.target.value})}
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Object.values(storyGrammar).some(v => v.trim() !== '') 
                        ? 'Custom elements will be incorporated into the story' 
                        : 'Click Customize to specify story elements (optional)'}
                    </p>
                  </div>
                )}

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

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includePreReading" className="cursor-pointer">
                      Include Pre-Reading Activities
                    </Label>
                    <Switch
                      id="includePreReading"
                      checked={includePreReading}
                      onCheckedChange={setIncludePreReading}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeQuestions" className="cursor-pointer">
                      Include Barrett's Taxonomy Questions
                    </Label>
                    <Switch
                      id="includeQuestions"
                      checked={includeBarrettQuestions}
                      onCheckedChange={setIncludeBarrettQuestions}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeImages" className="cursor-pointer">
                      Generate Story Images
                    </Label>
                    <Switch
                      id="includeImages"
                      checked={includeImages}
                      onCheckedChange={setIncludeImages}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand className="mr-2 h-4 w-4" />
                    Generate Narrative
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="w-full md:w-2/3">
          {loading ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="py-12 text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#A87C39]" />
                <p className="text-lg font-medium">Generating narrative...</p>
                <p className="text-sm text-muted-foreground mt-2">This may take a moment.</p>
              </CardContent>
            </Card>
          ) : generatedContent ? (
            <Tabs defaultValue="narrative">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="narrative">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Story
                  </TabsTrigger>
                  {generatedContent.vocabulary && (
                    <TabsTrigger value="vocabulary">
                      Vocabulary
                    </TabsTrigger>
                  )}
                  {generatedContent.preReadingActivities && (
                    <TabsTrigger value="preReading">
                      Pre-Reading
                    </TabsTrigger>
                  )}
                  {generatedContent.comprehensionQuestions && (
                    <TabsTrigger value="questions">
                      Questions
                    </TabsTrigger>
                  )}
                  {generatedContent.images && (
                    <TabsTrigger value="images">
                      <Image className="h-4 w-4 mr-2" />
                      Images
                    </TabsTrigger>
                  )}
                </TabsList>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              <TabsContent value="narrative">
                <Card>
                  <CardHeader>
                    <CardTitle>Narrative</CardTitle>
                    <CardDescription>
                      {renderNarrativeLevelDescription(narrativeLevel)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: generatedContent.narrative }} />
                  </CardContent>
                </Card>
              </TabsContent>

              {generatedContent.vocabulary && (
                <TabsContent value="vocabulary">
                  <Card>
                    <CardHeader>
                      <CardTitle>Target Vocabulary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {generatedContent.vocabulary.map((word: any, index: number) => (
                          <div key={index} className="p-4 bg-[#F8F7F4] rounded-lg">
                            <h3 className="text-lg font-semibold text-[#A87C39]">
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

              {generatedContent.preReadingActivities && (
                <TabsContent value="preReading">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pre-Reading Activities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: generatedContent.preReadingActivities }} />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {generatedContent.comprehensionQuestions && (
                <TabsContent value="questions">
                  <Card>
                    <CardHeader>
                      <CardTitle>Comprehension Questions</CardTitle>
                      <CardDescription>Based on Barrett's Taxonomy of Reading Comprehension</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {generatedContent.comprehensionQuestions.map((question: any, index: number) => (
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

              {generatedContent.images && (
                <TabsContent value="images">
                  <Card>
                    <CardHeader>
                      <CardTitle>Story Images</CardTitle>
                      <CardDescription>Characters and settings are consistent across all scenes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {generatedContent.images && generatedContent.images.map((image: any, index: number) => (
                          <div key={index} className="space-y-2">
                            {image.url ? (
                              <img 
                                src={image.url} 
                                alt={`Story scene ${index + 1}`}
                                className="w-full h-auto rounded-lg shadow-md"
                              />
                            ) : (
                              <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                                <p className="text-muted-foreground">Failed to generate image</p>
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
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-[#A87C39] opacity-50" />
                <p className="text-lg font-medium">Generate a narrative</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Customize the options and click "Generate Narrative" to create a story
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}