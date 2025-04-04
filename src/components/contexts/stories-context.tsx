"use client";

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { Story } from '@/lib/schemas/story';

interface StoriesContextType {
  stories: Record<string, Story>;
  activeStoryId: string | null;
  loading: boolean;
  error: string | null;
  loadStory: (storyId: string) => Promise<Story | null>;
  createStory: (story: Partial<Story>) => Promise<Story | null>;
  updateStory: (storyId: string, updates: Partial<Story>) => Promise<Story | null>;
  deleteStory: (storyId: string) => Promise<boolean>;
  setActiveStoryId: (storyId: string | null) => void;
  getStoriesByUserId: (userId: string) => Promise<Story[]>;
}

const StoriesContext = createContext<StoriesContextType | undefined>(undefined);

export const StoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stories, setStories] = useState<Record<string, Story>>({});
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load story by ID
  const loadStory = useCallback(async (storyId: string): Promise<Story | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // If we already have this story in our state, return it
      if (stories[storyId]) {
        setLoading(false);
        return stories[storyId];
      }

      // Otherwise fetch it from the API
      const response = await fetch(`/api/stories/get?id=${storyId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load story');
      }
      
      const data = await response.json();
      setStories(prevStories => ({
        ...prevStories,
        [storyId]: data.story
      }));
      
      setLoading(false);
      return data.story;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
      return null;
    }
  }, [stories]);

  // Create a new story
  const createStory = useCallback(async (story: Partial<Story>): Promise<Story | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create story');
      }
      
      const data = await response.json();
      setStories(prevStories => ({
        ...prevStories,
        [data.story.id]: data.story
      }));
      
      setLoading(false);
      return data.story;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
      return null;
    }
  }, []);

  // Update an existing story
  const updateStory = useCallback(async (storyId: string, updates: Partial<Story>): Promise<Story | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stories/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, updates })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update story');
      }
      
      const data = await response.json();
      setStories(prevStories => ({
        ...prevStories,
        [storyId]: data.story
      }));
      
      setLoading(false);
      return data.story;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
      return null;
    }
  }, []);

  // Delete a story
  const deleteStory = useCallback(async (storyId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/stories/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete story');
      }
      
      setStories(prevStories => {
        const newStories = { ...prevStories };
        delete newStories[storyId];
        return newStories;
      });
      
      if (activeStoryId === storyId) {
        setActiveStoryId(null);
      }
      
      setLoading(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
      return false;
    }
  }, [activeStoryId]);

  // Get stories by user ID
  const getStoriesByUserId = useCallback(async (userId: string): Promise<Story[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/stories/get?userId=${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load stories');
      }
      
      const data = await response.json();
      
      // Update our stories state with all stories we received
      const storiesMap: Record<string, Story> = {};
      data.stories.forEach((story: Story) => {
        storiesMap[story.id] = story;
      });
      
      setStories(prevStories => ({
        ...prevStories,
        ...storiesMap
      }));
      
      setLoading(false);
      return data.stories;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setLoading(false);
      return [];
    }
  }, []);

  // Provide the context value
  const contextValue: StoriesContextType = {
    stories,
    activeStoryId,
    loading,
    error,
    loadStory,
    createStory,
    updateStory,
    deleteStory,
    setActiveStoryId,
    getStoriesByUserId
  };

  return (
    <StoriesContext.Provider value={contextValue}>
      {children}
    </StoriesContext.Provider>
  );
};

export const useStories = (): StoriesContextType => {
  const context = useContext(StoriesContext);
  if (context === undefined) {
    throw new Error('useStories must be used within a StoriesProvider');
  }
  return context;
};