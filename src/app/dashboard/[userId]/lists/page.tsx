'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, ListMusic, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWordLists } from '@/components/contexts/wordlists-context';

// Mock data for word lists
const MOCK_WORD_LISTS = [
  {
    id: '123',
    title: 'John Smith - /s/ Initial Position',
    targetSound: '/s/',
    wordPosition: 'initial',
    maxSyllables: 2,
    createdAt: '2024-03-15',
    updatedAt: '2024-03-18',
    studentName: 'John Smith',
    studentAge: '8'
  },
  {
    id: '456',
    title: 'Emma Johnson - /r/ Medial Position',
    targetSound: '/r/',
    wordPosition: 'medial',
    maxSyllables: 3,
    createdAt: '2024-02-20',
    updatedAt: '2024-03-10',
    studentName: 'Emma Johnson',
    studentAge: '5'
  }
];

export default function UserWordListsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  
  // State for word lists
  const [wordLists, setWordLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Clear section groups in the word lists context
  const { setWordListSections } = useWordLists();
  useEffect(() => {
    setWordListSections([]);
  }, [setWordListSections]);
  
  // Load word lists (mock data for now)
  useEffect(() => {
    // Simulate API delay
    const timer = setTimeout(() => {
      // In a real app, you'd filter by userId here
      setWordLists(MOCK_WORD_LISTS.map(list => ({
        ...list,
        userId
      })));
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [userId]);
  
  // Handle creating a new word list
  const handleNewWordList = () => {
    router.push(`/dashboard/${userId}/lists/new`);
  };
  
  // Handle viewing a word list
  const handleViewWordList = (listId: string) => {
    router.push(`/dashboard/${userId}/lists/${listId}`);
  };
  
  // Filter word lists based on search query
  const filteredWordLists = wordLists.filter(list => 
    list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    list.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    list.targetSound.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Word Lists</h1>
        <Button onClick={handleNewWordList}>
          <Plus className="h-4 w-4 mr-2" />
          New Word List
        </Button>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search word lists..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {filteredWordLists.length === 0 ? (
            <div className="text-center py-20">
              <ListMusic className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No word lists found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'No word lists match your search criteria' : 'Create your first word list to get started'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={handleNewWordList}
                  className="mt-4"
                >
                  Create a word list
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWordLists.map((list) => (
                <Card key={list.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{list.title}</CardTitle>
                    <CardDescription>
                      Updated: {new Date(list.updatedAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Target: <span className="font-mono">{list.targetSound}</span> ({list.wordPosition} position)</p>
                    <p className="text-sm">Max Syllables: {list.maxSyllables}</p>
                    {list.studentName && (
                      <p className="text-sm text-muted-foreground">Student: {list.studentName}</p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleViewWordList(list.id)}
                    >
                      Open List
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}