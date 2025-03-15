import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

// Type for report sections - can be strings (paragraphs) or string arrays (lists)
export type SectionContent = string | string[];
export type ReportSections = Record<string, SectionContent>;

// Helper to filter out empty sections
const filterEmptySections = (sections: ReportSections): ReportSections => {
  return Object.entries(sections)
    .filter(([_, value]) => {
      // Handle array values (lists)
      if (Array.isArray(value)) {
        return value.length > 0 && value.some(item => typeof item === 'string' && item.trim() !== '');
      }
      // Handle string values (paragraphs)
      return value && typeof value === 'string' && value.trim() !== '';
    })
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as ReportSections);
};

// Define the store state
interface ReportStore {
  // Section content
  sections: ReportSections;
  
  // Recently updated sections for highlighting
  updatedSections: string[];
  
  // Action to set or update sections
  setSections: (sections: ReportSections) => void;
  
  // Action to update a single section
  updateSection: (key: string, content: string) => void;
  
  // Action to merge new sections with existing ones
  mergeSections: (newSections: ReportSections) => string[];
  
  // Action to highlight updated sections
  highlightSections: (sectionKeys: string[]) => void;
  
  // Action to clear highlighted sections
  clearHighlights: () => void;
  
  // Action to reset all sections
  resetSections: () => void;
}

// Create the store
export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sections: {},
      updatedSections: [],
      
      // Replace all sections
      setSections: (sections) => set({
        sections: filterEmptySections(sections)
      }),
      
      // Update a single section
      updateSection: (key, content) => {
        const currentSections = get().sections;
        
        // Check if content is empty
        let isEmpty = false;
        if (Array.isArray(content)) {
          // For arrays, check if empty or all items are empty strings
          isEmpty = content.length === 0 || !content.some(item => typeof item === 'string' && item.trim() !== '');
        } else {
          // For strings, check if empty
          isEmpty = !content || (typeof content === 'string' && content.trim() === '');
        }
        
        // If content is empty, remove the section
        if (isEmpty) {
          const { [key]: _, ...rest } = currentSections;
          set({ sections: rest });
          return;
        }
        
        // Compare content to avoid unnecessary re-renders
        let isDifferent = false;
        const currentContent = currentSections[key];
        
        if (Array.isArray(content) && Array.isArray(currentContent)) {
          // Compare arrays
          if (content.length !== currentContent.length) {
            isDifferent = true;
          } else {
            isDifferent = content.some((item, index) => item !== currentContent[index]);
          }
        } else if (Array.isArray(content) || Array.isArray(currentContent)) {
          // One is array, one is not - different
          isDifferent = true;
        } else {
          // Compare strings
          isDifferent = currentContent !== content;
        }
        
        // Only update if the content is different
        if (isDifferent) {
          set({
            sections: {
              ...currentSections,
              [key]: content
            }
          });
        }
      },
      
      // Merge new sections with existing ones
      mergeSections: (newSections) => {
        const currentSections = get().sections;
        const filtered = filterEmptySections(newSections);
        const changedSectionKeys: string[] = [];
        
        // Only proceed if we have filtered sections
        if (Object.keys(filtered).length === 0) {
          return [];
        }
        
        // Add or update sections
        const updatedSections = { ...currentSections };
        
        Object.entries(filtered).forEach(([key, value]) => {
          // Skip format metadata keys
          if (key.endsWith('_format')) {
            return;
          }
          
          // Compare content
          let isDifferent = false;
          const currentValue = updatedSections[key];
          
          if (Array.isArray(value) && Array.isArray(currentValue)) {
            // Compare arrays
            if (value.length !== currentValue.length) {
              isDifferent = true;
            } else {
              isDifferent = value.some((item, index) => item !== currentValue[index]);
            }
          } else if (Array.isArray(value) || Array.isArray(currentValue)) {
            // One is array, one is not - different
            isDifferent = true;
          } else {
            // Compare regular values
            isDifferent = currentValue !== value;
          }
          
          // Only update if different
          if (isDifferent) {
            changedSectionKeys.push(key);
            updatedSections[key] = value;
          }
        });
        
        // Only update state if something changed
        if (changedSectionKeys.length > 0) {
          set({ 
            sections: updatedSections,
            updatedSections: changedSectionKeys
          });
          
          // Clear highlights after 3 seconds
          setTimeout(() => {
            set((state) => {
              // Only clear if these are still the active highlighted sections
              if (shallow(state.updatedSections, changedSectionKeys)) {
                return { updatedSections: [] };
              }
              return state;
            });
          }, 3000);
        }
        
        return changedSectionKeys;
      },
      
      // Highlight specific sections
      highlightSections: (sectionKeys) => {
        if (sectionKeys.length === 0) return;
        
        set({ updatedSections: sectionKeys });
        
        // Clear highlights after 3 seconds
        setTimeout(() => {
          set((state) => {
            // Only clear if these are still the active highlighted sections
            if (shallow(state.updatedSections, sectionKeys)) {
              return { updatedSections: [] };
            }
            return state;
          });
        }, 3000);
      },
      
      // Clear highlighted sections
      clearHighlights: () => set({ updatedSections: [] }),
      
      // Reset all sections
      resetSections: () => set({ sections: {} })
    }),
    {
      name: 'report-sections-storage', // Name for localStorage
      storage: createJSONStorage(() => localStorage), // Explicitly use localStorage
      partialize: (state) => ({ sections: state.sections }), // Only persist sections
    }
  )
);