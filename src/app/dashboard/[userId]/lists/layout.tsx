'use client';

import { ReactNode } from 'react';
import { WordListsProvider } from '@/components/contexts/wordlists-context';

interface ListsLayoutProps {
  children: ReactNode;
}

export default function ListsLayout({ children }: ListsLayoutProps) {
  return (
    <WordListsProvider>
      <div className="flex flex-col min-h-screen">
        {children}
      </div>
    </WordListsProvider>
  );
}