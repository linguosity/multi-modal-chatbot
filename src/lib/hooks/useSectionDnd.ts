import {
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export type SectionId = string;

/**
 * Returns sensors + dragEnd handler for section reordering.
 * Use the returned values to set up your DndContext in a .tsx component.
 */
export function useSectionDnd(
  ids: SectionId[],
  onOrderChange: (newIds: SectionId[]) => void
) {
  // Set up sensors for both mouse/touch and keyboard interactions
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    
    try {
      const oldIdx = ids.indexOf(active.id as SectionId);
      const newIdx = ids.indexOf(over.id as SectionId);
      
      if (oldIdx !== -1 && newIdx !== -1) {
        const newOrder = arrayMove(ids, oldIdx, newIdx);
        onOrderChange(newOrder);
      }
    } catch (error) {
      console.error('Error during drag end:', error);
    }
  };

  return {
    sensors,
    handleDragEnd,
    ids,
    strategy: verticalListSortingStrategy,
    collisionDetection: closestCenter
  };
}