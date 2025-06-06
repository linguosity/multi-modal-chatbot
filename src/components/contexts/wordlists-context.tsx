'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WordList } from '@/lib/schemas/wordlist';

// Define types for word list sections
interface WordListSection {
  id: string;
  title: string;
  content: string[];
  type: 'words' | 'phrases' | 'sentences' | 'narrative';
}

// New type for sidebar navigation
interface WordListSidebarItem {
  title: string;
  url?: string;
  id?: string;
  isActive?: boolean;
}

interface WordListsContextType {
  // For current word list
  currentWordList: WordList | null;
  setCurrentWordList: (wordList: WordList | null) => void;
  
  // For sidebar navigation
  wordListSections: WordListSidebarItem[];
  setWordListSections: (sections: WordListSidebarItem[]) => void;
  
  // For active section
  currentSectionId: string;
  setCurrentSectionId: (id: string) => void;
  
  // Handler for section change (shared)
  handleSectionChange: (sectionId: string) => void;
  
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const WordListsContext = createContext<WordListsContextType | null>(null);

export function WordListsProvider({ children }: { children: ReactNode }) {
  const [currentWordList, setCurrentWordList] = useState<WordList | null>(null);
  const [wordListSections, setWordListSections] = useState<WordListSidebarItem[]>([]);
  const [currentSectionId, setCurrentSectionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSectionChange = (sectionId: string) => {
    setCurrentSectionId(sectionId);
  };

  return (
    <WordListsContext.Provider
      value={{
        currentWordList,
        setCurrentWordList,
        wordListSections,
        setWordListSections,
        currentSectionId,
        setCurrentSectionId,
        handleSectionChange,
        isLoading,
        setIsLoading
      }}
    >
      {children}
    </WordListsContext.Provider>
  );
}

export function useWordLists() {
  const context = useContext(WordListsContext);
  if (!context) {
    throw new Error('useWordLists must be used within a WordListsProvider');
  }
  return context;
}