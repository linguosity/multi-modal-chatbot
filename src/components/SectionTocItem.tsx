import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SectionId } from '../lib/hooks/useSectionDnd';
import { GripVertical, Sparkles, Zap } from 'lucide-react';
import { SectionToggle } from './ui/ProgressIndicator';
import { useRecentUpdates } from '@/lib/context/RecentUpdatesContext';

// Using the existing report section type from your schemas
export interface Section {
  id: SectionId;
  title: string;
  required?: boolean;
  complete?: boolean;
}

export function SectionTocItem({
  section,
  active,
  onSelect,
  onToggleComplete
}: {
  section: Section;
  active: boolean;
  onSelect: () => void;
  onToggleComplete?: (sectionId: SectionId) => void;
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const { isRecentlyUpdated, getRecentUpdate, clearRecentUpdate } = useRecentUpdates();
  const isUpdated = isRecentlyUpdated(section.id);
  const recentUpdate = getRecentUpdate(section.id);

  // Debug logging
  if (isUpdated) {
    console.log(`✨ Section ${section.id} (${section.title}) is recently updated:`, recentUpdate);
  }

  const handleSelect = () => {
    // Clear the update indicator when user clicks on the section
    if (isUpdated) {
      clearRecentUpdate(section.id);
    }
    onSelect();
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
      }}
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-all duration-300 relative
        ${active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-100'}
        ${isUpdated ? 'bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-400 shadow-sm animate-pulse' : ''}`}
    >
      {/* grab handle */}
      <span
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing select-none transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Drag handle"
        onClick={(e) => e.stopPropagation()} // Prevent triggering section selection
      >
        <GripVertical size={14} />
      </span>

      <div 
        className="flex-1 flex items-center justify-between gap-2 min-w-0"
        onClick={handleSelect}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* AI Update Indicator */}
          {isUpdated && (
            <div className="flex-shrink-0 relative">
              {recentUpdate?.type === 'ai_update' ? (
                <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" title={`AI updated ${recentUpdate.changes.length} fields`} />
              ) : (
                <Zap className="h-4 w-4 text-green-500 animate-pulse" title="Recently updated" />
              )}
              {/* Pulse ring animation */}
              <div className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping"></div>
            </div>
          )}
          
          <span className={`truncate ${isUpdated ? 'font-medium text-gray-900' : ''}`}>
            {section.title}
          </span>
          
          {section.required && !section.complete && (
            <span className="text-red-500 flex-shrink-0 text-xs" title="Required">*</span>
          )}
          
          {/* Update count badge */}
          {isUpdated && recentUpdate && recentUpdate.changes.length > 0 && (
            <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium animate-bounce">
              {recentUpdate.changes.length}
            </span>
          )}
        </div>
        
        {onToggleComplete && (
          <SectionToggle
            isCompleted={section.complete || false}
            onToggle={() => onToggleComplete(section.id)}
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        )}
      </div>
    </div>
  );
}