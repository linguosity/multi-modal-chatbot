import React, { useEffect, memo } from 'react';
import { EditableCard } from './EditableCard';
import { getSectionDisplayName } from '@/lib/report-utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { useReportStore } from '@/lib/store';

interface ReportSectionsListProps {
  addSectionExample?: () => void;
  enableEmpty?: boolean;
  emptyMessage?: string;
  debug?: boolean;
}

/**
 * A reusable component that renders a list of report sections from the global store
 */
function ReportSectionsListComponent({
  addSectionExample,
  enableEmpty = false,
  emptyMessage = "No sections to display.",
  debug = false
}: ReportSectionsListProps) {
  // Get state from the store
  const { 
    sections, 
    updatedSections, 
    updateSection 
  } = useReportStore();
  
  // Component ID for debugging
  const componentId = React.useId();

  // Debug logging for component props - but only when debug is true to avoid extra renders
  useEffect(() => {
    if (debug) {
      console.log(`🔍 ReportSectionsList [${componentId.substring(0, 8)}] - Sections received:`, 
        Object.keys(sections).length);
    }
  }, [sections, debug, componentId]);

  // Filter sections based on if they have content (unless enableEmpty is true)
  const filteredSections = Object.entries(sections).filter(([_, value]) => {
    let hasContent = false;
    
    if (Array.isArray(value)) {
      // For arrays, check if they have valid items
      hasContent = value.length > 0 && value.some(item => typeof item === 'string' && item.trim() !== '');
    } else if (typeof value === 'string') {
      // For strings, check if they have content
      hasContent = value.trim().length > 0;
    }
    
    const shouldInclude = enableEmpty || hasContent;
    return shouldInclude;
  });

  if (filteredSections.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CardDescription className="text-center mb-4">{emptyMessage}</CardDescription>
          {addSectionExample && (
            <Button onClick={addSectionExample} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Example Sections
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {filteredSections.map(([key, value]) => (
        <div key={`section-${key}`} className="section-card">
          <EditableCard
            title={getSectionDisplayName(key)}
            initialContent={value}
            onSave={(content) => updateSection(key, content)}
            renderViewMode={({ content }) => {
              const highlightClass = updatedSections.includes(key) 
                ? 'bg-yellow-50 p-2 rounded border border-yellow-200 animate-pulse' 
                : '';
              
              // Check if this is a list format (array)
              const isList = Array.isArray(value);
              
              if (!value) {
                return (
                  <div className={`whitespace-pre-wrap ${highlightClass}`}>
                    <span className="text-muted-foreground italic">
                      Empty section. Click Edit to add content.
                    </span>
                  </div>
                );
              }
              
              if (isList) {
                return (
                  <div className={highlightClass}>
                    <ul className="list-disc pl-5 space-y-1">
                      {(value as string[]).map((item, index) => (
                        <li key={index} className="whitespace-pre-wrap">{item}</li>
                      ))}
                    </ul>
                  </div>
                );
              }

              // Handle string content (paragraph format)
              return (
                <div className={`whitespace-pre-wrap ${highlightClass}`}>
                  {value}
                </div>
              );
            }}
          />
        </div>
      ))}
    </>
  );
}

// Use memo to prevent unnecessary re-renders
export const ReportSectionsList = memo(ReportSectionsListComponent);