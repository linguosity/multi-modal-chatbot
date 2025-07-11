'use client';

import React, { useReducer, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import {
  ReportTemplateSchema,
  ReportSectionGroupSchema,
  ReportSectionTypeSchema
} from '@/lib/schemas/report-template';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';

// Infer types from schemas
type ReportTemplate = z.infer<typeof ReportTemplateSchema>;
type ReportSectionGroup = z.infer<typeof ReportSectionGroupSchema>;
type ReportSectionType = z.infer<typeof ReportSectionTypeSchema>;

// --- DND Kit Tree Types ---
interface FlattenedItem {
  id: string;
  parentId: string | null;
  type: 'group' | 'section';
  data: ReportSectionGroup | ReportSectionType;
  depth: number;
}

// --- End DND Kit Tree Types ---

// Define Action Types for the Reducer
enum TemplateActionType {
  SET_TEMPLATE = 'SET_TEMPLATE',
  UPDATE_TEMPLATE_METADATA = 'UPDATE_TEMPLATE_METADATA',
  ADD_GROUP = 'ADD_GROUP',
  REMOVE_GROUP = 'REMOVE_GROUP',
  UPDATE_GROUP_TITLE = 'UPDATE_GROUP_TITLE',
  ADD_SECTION_TO_GROUP = 'ADD_SECTION_TO_GROUP',
  REMOVE_SECTION_FROM_GROUP = 'REMOVE_SECTION_FROM_GROUP',
  REORDER_ITEMS = 'REORDER_ITEMS',
  UPDATE_SECTION_TITLE = 'UPDATE_SECTION_TITLE',
}

// Define Actions
type TemplateAction =
  | { type: TemplateActionType.SET_TEMPLATE; payload: ReportTemplate }
  | { type: TemplateActionType.UPDATE_TEMPLATE_METADATA; payload: { name?: string; description?: string } }
  | { type: TemplateActionType.ADD_GROUP; payload: { title?: string; availableSectionTypes: ReportSectionType[] } }
  | { type: TemplateActionType.REMOVE_GROUP; payload: { groupId: string; availableSectionTypes: ReportSectionType[] } }
  | { type: TemplateActionType.UPDATE_GROUP_TITLE; payload: { groupId: string; title: string; availableSectionTypes: ReportSectionType[] } }
  | { type: TemplateActionType.ADD_SECTION_TO_GROUP; payload: { groupId: string; sectionTypeId: string; availableSectionTypes: ReportSectionType[] } }
  | { type: TemplateActionType.REMOVE_SECTION_FROM_GROUP; payload: { groupId: string; sectionTypeId: string; availableSectionTypes: ReportSectionType[] } }
  | { type: TemplateActionType.REORDER_ITEMS; payload: { activeId: string; overId: string; availableSectionTypes: ReportSectionType[] } }
  | { type: TemplateActionType.UPDATE_SECTION_TITLE; payload: { sectionId: string; title: string; availableSectionTypes: ReportSectionType[] } };


// Converts our ReportTemplateSchema to a flattened DND Kit compatible structure
const convertTemplateToFlattenedItems = (template: ReportTemplate, availableSectionTypes: ReportSectionType[]): FlattenedItem[] => {
    const flattened: FlattenedItem[] = [];
    template.groups.forEach(group => {
        flattened.push({
            id: group.id,
            parentId: null,
            type: 'group' as const,
            data: group,
            depth: 0,
        });
        group.sectionTypeIds.forEach(sectionTypeId => {
            const sectionType = availableSectionTypes.find(s => s.id === sectionTypeId);
            if (sectionType) {
                flattened.push({
                    id: sectionTypeId,
                    parentId: group.id,
                    type: 'section' as const,
                    data: sectionType,
                    depth: 1,
                });
            }
        });
    });
    return flattened;
};

// Converts a flattened DND Kit compatible structure back to ReportTemplateSchema
const convertFlattenedItemsToTemplate = (flattenedItems: FlattenedItem[], currentTemplate: ReportTemplate): ReportTemplate => {
    const newGroups: ReportSectionGroup[] = [];
    const groupItems = flattenedItems.filter(item => item.type === 'group' && item.parentId === null);

    groupItems.forEach(groupItem => {
        const groupData = groupItem.data as ReportSectionGroup;
        const sectionTypeIds = flattenedItems
            .filter(item => item.type === 'section' && item.parentId === groupItem.id)
            .map(item => item.id);
        
        newGroups.push({
            id: groupData.id,
            title: groupData.title,
            sectionTypeIds: sectionTypeIds,
        });
    });
    
    const orderedGroupIds = groupItems.map(item => item.id);
    newGroups.sort((a, b) => orderedGroupIds.indexOf(a.id) - orderedGroupIds.indexOf(b.id));

    return { ...currentTemplate, groups: newGroups };
};

// Reducer Function
const templateReducer = (state: ReportTemplate, action: TemplateAction): ReportTemplate => {
    const { availableSectionTypes } = 'payload' in action && action.payload && 'availableSectionTypes' in action.payload ? action.payload : { availableSectionTypes: [] };
    const currentFlattened = convertTemplateToFlattenedItems(state, availableSectionTypes as ReportSectionType[]);

    switch (action.type) {
        case TemplateActionType.SET_TEMPLATE:
            return action.payload;
        case TemplateActionType.UPDATE_TEMPLATE_METADATA:
            return { ...state, ...action.payload };
        case TemplateActionType.ADD_GROUP:
            {
                const { title } = action.payload;
                const newGroup: ReportSectionGroup = {
                    id: uuidv4(),
                    title: title || 'New Group',
                    sectionTypeIds: [],
                };
                const newFlattenedItems = [
                    ...currentFlattened,
                    { id: newGroup.id, parentId: null, type: 'group' as const, data: newGroup, depth: 0 },
                ];
                return convertFlattenedItemsToTemplate(newFlattenedItems, state);
            }
        case TemplateActionType.REMOVE_GROUP:
            {
                const { groupId } = action.payload;
                const newFlattenedItems = currentFlattened.filter(item => item.id !== groupId && item.parentId !== groupId);
                return convertFlattenedItemsToTemplate(newFlattenedItems, state);
            }
        case TemplateActionType.UPDATE_GROUP_TITLE:
            {
                const { groupId, title } = action.payload;
                const newFlattenedItems = currentFlattened.map(item =>
                    item.id === groupId && item.type === 'group' ? { ...item, data: { ...(item.data as ReportSectionGroup), title } } : item
                );
                return convertFlattenedItemsToTemplate(newFlattenedItems, state);
            }
        case TemplateActionType.ADD_SECTION_TO_GROUP:
            {
                const { groupId, sectionTypeId } = action.payload;
                const sectionType = (action.payload.availableSectionTypes).find(s => s.id === sectionTypeId);
                if (!sectionType) return state;

                const newFlattenedItems = [
                    ...currentFlattened,
                    { id: sectionTypeId, parentId: groupId, type: 'section' as const, data: sectionType, depth: 1 },
                ];
                return convertFlattenedItemsToTemplate(newFlattenedItems, state);
            }
        case TemplateActionType.REMOVE_SECTION_FROM_GROUP:
            {
                const { groupId, sectionTypeId } = action.payload;
                const newFlattenedItems = currentFlattened.filter(item => !(item.id === sectionTypeId && item.parentId === groupId));
                return convertFlattenedItemsToTemplate(newFlattenedItems, state);
            }
        case TemplateActionType.REORDER_ITEMS:
            {
                const { activeId, overId } = action.payload;
                const activeItemIndex = currentFlattened.findIndex(item => item.id === activeId);
                const overItemIndex = currentFlattened.findIndex(item => item.id === overId);
                const overItem = currentFlattened[overItemIndex];
                
                if (activeItemIndex === -1 || !overItem) {
                    return state;
                }

                const activeItem = currentFlattened[activeItemIndex];
                
                const newParentId: string | null = overItem.type === 'group' ? overItem.id : overItem.parentId;
                
                if (activeItem.type === 'group' && newParentId !== null) {
                    return state;
                }

                const newItems = arrayMove(currentFlattened, activeItemIndex, overItemIndex);
                
                const movedItem = newItems.find(item => item.id === activeId)!;
                if (movedItem.parentId !== newParentId) {
                    movedItem.parentId = newParentId;
                    movedItem.depth = newParentId === null ? 0 : 1;
                }

                return convertFlattenedItemsToTemplate(newItems, state);
            }
        case TemplateActionType.UPDATE_SECTION_TITLE:
            {
                const { sectionId, title } = action.payload;
                const newFlattenedItems = currentFlattened.map(item => {
                    if (item.id === sectionId && item.type === 'section') {
                        return { ...item, data: { ...(item.data as ReportSectionType), default_title: title } };
                    }
                    return item;
                });
                return convertFlattenedItemsToTemplate(newFlattenedItems, state);
            }
        default:
            return state;
    }
};


interface TemplateEditorProps {
  initialTemplate?: ReportTemplate;
  onSave: (template: ReportTemplate) => void;
  onCancel: () => void;
}

const initialTemplateState: ReportTemplate = {
  id: uuidv4(),
  name: '',
  description: '',
  groups: [],
  user_id: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const TemplateEditor: React.FC<TemplateEditorProps> = ({ initialTemplate, onSave, onCancel }) => {
  const [state, dispatch] = useReducer(templateReducer, initialTemplate || initialTemplateState);
  const [availableSectionTypes, setAvailableSectionTypes] = useState<ReportSectionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSectionTypes = async () => {
      try {
        const response = await fetch('/api/report-section-types');
        if (!response.ok) {
          throw new Error(`Error fetching section types: ${response.statusText}`);
        }
        const data = await response.json();
        setAvailableSectionTypes(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSectionTypes();
  }, []);

  useEffect(() => {
    if (initialTemplate) {
      dispatch({ type: TemplateActionType.SET_TEMPLATE, payload: initialTemplate });
    }
  }, [initialTemplate]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const flattenedItems = convertTemplateToFlattenedItems(state, availableSectionTypes);
  const sortedIds = flattenedItems.map(item => item.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }
    
    const overItem = flattenedItems.find(item => item.id === over.id);

    if (!overItem) {
        return;
    }

    if (active.data.current?.isPaletteItem && overItem.type === 'group') {
        dispatch({
            type: TemplateActionType.ADD_SECTION_TO_GROUP,
            payload: {
                groupId: overItem.id,
                sectionTypeId: (active.id as string).replace('palette-','') as string,
                availableSectionTypes,
            },
        });
        return;
    }
    
    if (!active.data.current?.isPaletteItem) {
        dispatch({
            type: TemplateActionType.REORDER_ITEMS,
            payload: {
                activeId: active.id as string,
                overId: over.id as string,
                availableSectionTypes,
            },
        });
    }
  };

  const handleRemoveGroup = (groupId: string) => {
    dispatch({ type: TemplateActionType.REMOVE_GROUP, payload: { groupId, availableSectionTypes } });
  };

  const handleUpdateGroupTitle = (groupId: string, title: string) => {
    dispatch({ type: TemplateActionType.UPDATE_GROUP_TITLE, payload: { groupId, title, availableSectionTypes } });
  };
  
  const handleRemoveSection = (groupId: string, sectionTypeId: string) => {
    dispatch({ type: TemplateActionType.REMOVE_SECTION_FROM_GROUP, payload: { groupId, sectionTypeId, availableSectionTypes } });
  };

  const handleUpdateSectionTitle = (sectionId: string, title: string) => {
    dispatch({ type: TemplateActionType.UPDATE_SECTION_TITLE, payload: { sectionId, title, availableSectionTypes } });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="p-6">
        <div className="mb-4">
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            value={state.name}
            onChange={(e) => dispatch({ type: TemplateActionType.UPDATE_TEMPLATE_METADATA, payload: { name: e.target.value } })}
          />
        </div>
        <div className="mb-4">
          <Label htmlFor="template-description">Description</Label>
          <Input
            id="template-description"
            value={state.description || ''}
            onChange={(e) => dispatch({ type: TemplateActionType.UPDATE_TEMPLATE_METADATA, payload: { description: e.target.value } })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Available Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <SortableContext items={availableSectionTypes.map(s => `palette-${s.id}`)}>
                    {availableSectionTypes.map(sectionType => (
                        <PaletteItem key={sectionType.id} id={sectionType.id} title={sectionType.default_title} />
                    ))}
                </SortableContext>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Template Structure</CardTitle>
                <Button onClick={() => dispatch({ type: TemplateActionType.ADD_GROUP, payload: { availableSectionTypes } })}> 
                  <Plus className="mr-2 h-4 w-4" /> Add Group
                </Button>
              </CardHeader>
              <CardContent>
                <div role="tree">
                  <SortableContext items={sortedIds}>
                    {flattenedItems.map(item => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        onRemoveGroup={handleRemoveGroup}
                        onUpdateGroupTitle={handleUpdateGroupTitle}
                        onRemoveSection={handleRemoveSection}
                        onUpdateSectionTitle={handleUpdateSectionTitle}
                      />
                    ))}
                  </SortableContext>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(state)}>Save Template</Button>
        </div>
      </div>
    </DndContext>
  );
};

const PaletteItem = ({ id, title }: { id: string; title: string }) => {
    const { attributes, listeners, setNodeRef } = useSortable({
        id: `palette-${id}`,
        data: { isPaletteItem: true, id: id }
    });
    
    return (
        <div ref={setNodeRef} {...attributes} {...listeners} className="p-2 my-1 border rounded bg-gray-100 cursor-grab touch-none">
            {title}
        </div>
    );
};

const SortableItem = ({ item, onRemoveGroup, onUpdateGroupTitle, onRemoveSection, onUpdateSectionTitle }: {
    item: FlattenedItem;
    onRemoveGroup: (id: string) => void;
    onUpdateGroupTitle: (id: string, title: string) => void;
    onRemoveSection: (groupId: string, sectionId: string) => void;
    onUpdateSectionTitle: (sectionId: string, title: string) => void; // New prop
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginLeft: `${item.depth * 20}px`,
    };

    if (item.type === 'group') {
        const group = item.data as ReportSectionGroup;
        return (
            <div ref={setNodeRef} style={style} role="treeitem" aria-level={item.depth + 1} className="p-2 my-2 rounded flex items-center justify-between">
                <div className="flex items-center flex-grow">
                    <button {...attributes} {...listeners} className="cursor-grab p-1 touch-none" aria-label="Move group"><GripVertical /></button>
                    <Input
                        value={group.title}
                        onChange={(e) => onUpdateGroupTitle(item.id, e.target.value)}
                        className="font-bold bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        aria-label={`Group title, level ${item.depth + 1}`}
                    />
                </div>
                <Button variant="ghost" size="sm" onClick={() => onRemoveGroup(item.id)} aria-label="Delete group"><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div>
        );
    }

    if (item.type === 'section') {
        const section = item.data as ReportSectionType;
        return (
            <div ref={setNodeRef} style={style} role="treeitem" aria-level={item.depth + 1} className="p-2 my-1 rounded flex items-center justify-between">
                <div className="flex items-center flex-grow">
                    <button {...attributes} {...listeners} className="cursor-grab p-1 touch-none" aria-label="Move section"><GripVertical /></button>
                    <Input
                        value={section.default_title}
                        onChange={(e) => onUpdateSectionTitle(item.id, e.target.value)}
                        className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        aria-label={`Section title, level ${item.depth + 1}`}
                    />
                </div>
                <Button variant="ghost" size="sm" onClick={() => onRemoveSection(item.parentId!, item.id)} aria-label="Delete section"><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </div>
        );
    }

    return null;
};

export default TemplateEditor;