"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, Clock, FileText, Search, ChevronRight, Home } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useStories } from '@/components/contexts/stories-context';
import { Story } from '@/lib/schemas/story';

export default function StoriesPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;
  const { getStoriesByUserId, loading, error } = useStories();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadStories() {
      if (userId) {
        const userStories = await getStoriesByUserId(userId);
        setStories(userStories);
      }
    }
    
    loadStories();
  }, [userId, getStoriesByUserId]);

  const handleCreateStory = () => {
    router.push(`/dashboard/${userId}/stories/new`);
  };

  const handleViewStory = (storyId: string) => {
    router.push(`/dashboard/${userId}/stories/${storyId}`);
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
  
  // Filter stories based on search query
  const filteredStories = stories.filter(story => 
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (story.targetVocabulary && story.targetVocabulary.some(word => 
      word.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  return (
    <div className="container mx-auto">
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stories</h1>
        <Button onClick={handleCreateStory}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Story
        </Button>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search stories..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">Loading stories...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {!loading && filteredStories.length === 0 && (
        <Card className="border-dashed border-2 p-6">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No stories found</h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchQuery ? 'No stories match your search criteria' : 'Create your first story to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreateStory}>
                <Plus className="h-4 w-4 mr-2" />
                Create New Story
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {filteredStories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => (
            <Card key={story.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewStory(story.id)}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{story.title}</CardTitle>
                  <span className="px-2 py-1 bg-[#F8F7F4] text-[#A87C39] text-xs rounded-full">
                    {getNarrativeLevelDisplay(story.narrativeLevel)}
                  </span>
                </div>
                <CardDescription className="text-sm">
                  {story.targetVocabulary && story.targetVocabulary.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {story.targetVocabulary.slice(0, 3).map((word, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-[#DCE4DF] text-[#3C6E58] text-xs rounded">
                          {word}
                        </span>
                      ))}
                      {story.targetVocabulary.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-[#DCE4DF] text-[#3C6E58] text-xs rounded">
                          +{story.targetVocabulary.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="line-clamp-3 text-sm text-muted-foreground mb-2" 
                     dangerouslySetInnerHTML={{ __html: story.narrative.substring(0, 150) + '...' }} />
              </CardContent>
              <CardFooter className="flex justify-between pt-0 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Updated {formatDate(story.updatedAt)}</span>
                </div>
                <div className="flex items-center">
                  <FileText className="h-3 w-3 mr-1" />
                  <span>{story.wordCount || 0} words</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}