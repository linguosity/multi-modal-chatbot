// Hook for section drag-and-drop reordering
export type SectionId = string; // EDIT HERE: matches ReportSection.id type

import {
  DndContext,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

/**
 * Generic DnD provider for a vertical list.
 * Call useSectionDnd(ids, onOrderChange) inside ReportSidebar.
 */
export function useSectionDnd(
  ids: SectionId[],
  onOrderChange: (newIds: SectionId[]) => void
) {
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = ids.indexOf(active.id as SectionId);
    const newIdx = ids.indexOf(over.id as SectionId);
    onOrderChange(arrayMove(ids, oldIdx, newIdx));
  };

  const Provider = ({ children }: { children: React.ReactNode }) => (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );

  return { Provider };
}