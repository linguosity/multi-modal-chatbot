import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SectionId } from '../lib/hooks/useSectionDnd';
import { GripVertical } from 'lucide-react';
import { SectionToggle } from './ui/ProgressIndicator';

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

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
      }}
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors
        ${active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-100'}`}
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
        onClick={onSelect}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate">{section.title}</span>
          {section.required && !section.complete && (
            <span className="text-red-500 flex-shrink-0 text-xs" title="Required">*</span>
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