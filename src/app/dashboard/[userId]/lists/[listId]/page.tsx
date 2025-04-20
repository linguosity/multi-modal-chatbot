'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useWordLists } from '@/components/contexts/wordlists-context';

// Mock word list data
const MOCK_WORD_LIST = {
  id: '123',
  title: 'John Smith - /s/ Initial Position',
  targetSound: '/s/',
  wordPosition: 'initial',
  maxSyllables: 2,
  createdAt: '2024-03-15',
  updatedAt: '2024-03-18',
  studentName: 'John Smith',
  studentAge: '8',
  realWords: [
    "sun", "sit", "soap", "say", "six", "sand", "saw", "sip", "sell", "sick",
    "safe", "same", "sad", "sail", "salt", "sock", "soft", "soup", "seed", "seat"
  ],
  nonsenseWords: [
    "seb", "sig", "sop", "sut", "sek", "siv", "som", "saf", "sut", "sym"
  ],
  phrases: [
    "six sunny days",
    "sad sick sailor",
    "silver sand castle",
    "soft silk scarf",
    "second summer sunset"
  ],
  sentences: [
    "Sam saw six seals swimming.",
    "Sally sells seashells by the seashore.",
    "The student solved several science problems.",
    "Seven sisters sat silently.",
    "Susan sang songs at the celebration."
  ],
  narrative: `<p>Once upon a time, there was a <mark>silly</mark> <mark>snake</mark> named <mark>Sam</mark>. <mark>Sam</mark> loved to <mark>slither</mark> through the <mark>sand</mark> on <mark>sunny</mark> days. One day, <mark>Sam</mark> <mark>spotted</mark> a <mark>sparkling</mark> <mark>stone</mark> in the <mark>soil</mark>.</p>
  
  <p>"What a <mark>surprising</mark> <mark>sight</mark>!" <mark>said</mark> <mark>Sam</mark>. He <mark>slowly</mark> <mark>slid</mark> toward the <mark>shiny</mark> object. When he got closer, he <mark>saw</mark> it was a <mark>special</mark> <mark>silver</mark> key.</p>
  
  <p><mark>Sam</mark> decided to <mark>search</mark> for what the key might open. He <mark>slithered</mark> through the <mark>soft</mark> grass, past a <mark>small</mark> pond, and up a <mark>steep</mark> hill. At the top, he found a <mark>strange</mark> little box with a <mark>silver</mark> lock.</p>
  
  <p>When <mark>Sam</mark> used the key, the box opened to reveal a <mark>stunning</mark> map leading to a <mark>secret</mark> garden filled with the <mark>sweetest</mark> berries a <mark>snake</mark> could ever taste. From that day on, <mark>Sam</mark> would <mark>smile</mark> whenever he thought about his <mark>special</mark> discovery.</p>`
};

export default function WordListDetailsPage() {
  const router = useRouter();
  // Properly handle route parameters in Next.js 15+
  const params = useParams();
  const userId = params.userId;
  const listId = params.listId;
  
  const [loading, setLoading] = useState(true);
  const [wordList, setWordList] = useState<any>(null);
  
  const { setCurrentWordList } = useWordLists();
  
  // Load word list data
  useEffect(() => {
    const fetchWordList = async () => {
      try {
        // In a real app, you'd fetch from API
        await new Promise(resolve => setTimeout(resolve, 500));
        setWordList(MOCK_WORD_LIST);
        setCurrentWordList(MOCK_WORD_LIST);
      } catch (error) {
        console.error('Error fetching word list:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWordList();
    
    return () => {
      // Cleanup
      setCurrentWordList(null);
    };
  }, [listId, setCurrentWordList]);
  
  // Handle edit
  const handleEdit = () => {
    router.push(`/dashboard/${userId}/lists/${listId}/edit`);
  };
  
  // Handle download
  const handleDownload = () => {
    if (!wordList) return;
    
    // Create downloadable content
    const content = `
# ${wordList.title}
Target Sound: ${wordList.targetSound}
Position: ${wordList.wordPosition}
Max Syllables: ${wordList.maxSyllables}
Created: ${new Date(wordList.createdAt).toLocaleDateString()}

## Real Words
${wordList.realWords.join(', ')}

## Nonsense Words
${wordList.nonsenseWords.join(', ')}

## Phrases
${wordList.phrases.join('\n')}

## Sentences
${wordList.sentences.join('\n')}

## Narrative
${wordList.narrative.replace(/<\/?[^>]+(>|$)/g, '')}
    `.trim();
    
    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wordList.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  if (loading || !wordList) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Loading Word List...</h1>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{wordList.title}</h1>
          <p className="text-muted-foreground">
            Created {new Date(wordList.createdAt).toLocaleDateString()} · 
            Updated {new Date(wordList.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Settings used to generate this word list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium">Target Sound</h3>
              <p className="font-mono text-lg">{wordList.targetSound}</p>
            </div>
            <div>
              <h3 className="font-medium">Word Position</h3>
              <p className="capitalize">{wordList.wordPosition}</p>
            </div>
            <div>
              <h3 className="font-medium">Max Syllables</h3>
              <p>{wordList.maxSyllables}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="words" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="words">Words</TabsTrigger>
          <TabsTrigger value="phrases">Phrases</TabsTrigger>
          <TabsTrigger value="sentences">Sentences</TabsTrigger>
          <TabsTrigger value="narrative">Narrative</TabsTrigger>
        </TabsList>
        
        <TabsContent value="words">
          <Card>
            <CardHeader>
              <CardTitle>Target Words</CardTitle>
              <CardDescription>
                Real and nonsense words containing the target sound
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Real Words</h3>
                <div className="flex flex-wrap gap-2">
                  {wordList.realWords.map((word: string, index: number) => (
                    <div 
                      key={index} 
                      className="px-3 py-2 bg-muted rounded-md font-medium"
                    >
                      {word}
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <h3 className="font-semibold mb-2">Nonsense Words</h3>
                <div className="flex flex-wrap gap-2">
                  {wordList.nonsenseWords.map((word: string, index: number) => (
                    <div 
                      key={index} 
                      className="px-3 py-2 bg-muted rounded-md font-medium"
                    >
                      {word}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="phrases">
          <Card>
            <CardHeader>
              <CardTitle>Target Phrases</CardTitle>
              <CardDescription>
                Short phrases containing the target sound
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {wordList.phrases.map((phrase: string, index: number) => (
                  <li 
                    key={index} 
                    className="p-3 bg-muted rounded-md font-medium"
                  >
                    {phrase}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sentences">
          <Card>
            <CardHeader>
              <CardTitle>Target Sentences</CardTitle>
              <CardDescription>
                Complete sentences containing the target sound
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {wordList.sentences.map((sentence: string, index: number) => (
                  <li 
                    key={index} 
                    className="p-3 bg-muted rounded-md font-medium"
                  >
                    {sentence}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="narrative">
          <Card>
            <CardHeader>
              <CardTitle>Target Narrative</CardTitle>
              <CardDescription>
                A story incorporating multiple target words (highlighted)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: wordList.narrative }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}