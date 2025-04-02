'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface EditModeContextType {
  globalEditMode: boolean;
  setGlobalEditMode: (value: boolean) => void;
  toggleGlobalEditMode: () => void;
  isCardEditing: (cardId: string) => boolean;
  startCardEditing: (cardId: string) => void;
  stopCardEditing: (cardId: string) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
}

const EditModeContext = createContext<EditModeContextType | null>(null);

export function EditModeProvider({ children }: { children: ReactNode }) {
  const [globalEditMode, setGlobalEditMode] = useState(false);
  const [editingCards, setEditingCards] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const toggleGlobalEditMode = useCallback(() => {
    setGlobalEditMode((prev) => !prev);
    // When exiting global edit mode, clear all editing cards
    if (globalEditMode) {
      setEditingCards(new Set());
    }
  }, [globalEditMode]);

  const isCardEditing = useCallback(
    (cardId: string) => {
      return globalEditMode || editingCards.has(cardId);
    },
    [globalEditMode, editingCards]
  );

  const startCardEditing = useCallback((cardId: string) => {
    setEditingCards((prev) => {
      const newSet = new Set(prev);
      newSet.add(cardId);
      return newSet;
    });
  }, []);

  const stopCardEditing = useCallback((cardId: string) => {
    setEditingCards((prev) => {
      const newSet = new Set(prev);
      newSet.delete(cardId);
      return newSet;
    });
  }, []);

  return (
    <EditModeContext.Provider
      value={{
        globalEditMode,
        setGlobalEditMode,
        toggleGlobalEditMode,
        isCardEditing,
        startCardEditing,
        stopCardEditing,
        hasUnsavedChanges,
        setHasUnsavedChanges
      }}
    >
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const context = useContext(EditModeContext);
  if (!context) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
}