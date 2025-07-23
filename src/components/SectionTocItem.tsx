import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SectionId } from './useSectionDnd';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

// EDIT HERE: using actual ReportSection type from schemas
import { ReportSection } from '@/lib/schemas/report';

export function SectionTocItem({
  section,
  active,
  onSelect
}: {
  section: ReportSection;
  active: boolean;
  onSelect: () => void;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({ id: section.id });

  // Determine section status for icon
  const getSectionStatus = () => {
    if (!section.content || section.content.trim() === '') {
      return section.isRequired ? 'required-empty' : 'optional-empty';
    }
    return 'complete';
  };

  const getSectionIcon = () => {
    const status = getSectionStatus();
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'required-empty':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'optional-empty':
        return <Circle className="h-4 w-4 text-gray-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
      }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
        active
          ? 'bg-indigo-50 text-indigo-800 font-medium'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab select-none text-lg leading-none"
        aria-label="Drag handle"
        onClick={(e) => e.stopPropagation()} // Prevent triggering section selection
      >
        ⋮⋮
      </span>

      {/* Section status icon */}
      {getSectionIcon()}

      {/* Section title */}
      <span className="truncate flex-1">{section.title}</span>
    </div>
  );
}