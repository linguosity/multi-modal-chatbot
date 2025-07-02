'use client';

import React, { useReducer, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';
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
  data: ReportSectionGroup | ReportSectionType; // Original data
  depth: number;
}

interface TreeItem extends FlattenedItem {
  children?: TreeItem[];
}
// --- End DND Kit Tree Types ---

// Define Action Types for the Reducer
enum TemplateActionType {
  SET_TEMPLATE = 'SET_TEMPLATE',
  UPDATE_TEMPLATE_METADATA = 'UPDATE_TEMPLATE_METADATA',
  ADD_GROUP = 'ADD_GROUP',
  REMOVE_GROUP = 'REMOVE_GROUP',
  UPDATE_GROUP_TITLE = 'UPDATE_GROUP_TITLE',
  SET_FLATTENED_ITEMS = 'SET_FLATTENED_ITEMS',
  ADD_SECTION_TO_GROUP = 'ADD_SECTION_TO_GROUP',
  REMOVE_SECTION_FROM_GROUP = 'REMOVE_SECTION_FROM_GROUP',
  REORDER_ITEMS = 'REORDER_ITEMS', // For both groups and sections
}

// Define Actions
type TemplateAction = 
  | { type: TemplateActionType.SET_TEMPLATE; payload: ReportTemplate }
  | { type: TemplateActionType.UPDATE_TEMPLATE_METADATA; payload: { name?: string; description?: string } }
  | { type: TemplateActionType.ADD_GROUP; payload?: { title?: string } }
  | { type: TemplateActionType.REMOVE_GROUP; payload: { groupId: string } }
  | { type: TemplateActionType.UPDATE_GROUP_TITLE; payload: { groupId: string; title: string } }
  | { type: TemplateActionType.SET_FLATTENED_ITEMS; payload: FlattenedItem[] }
  | { type: TemplateActionType.ADD_SECTION_TO_GROUP; payload: { groupId: string; sectionTypeId: string } }
  | { type: TemplateActionType.REMOVE_SECTION_FROM_GROUP; payload: { groupId: string; sectionTypeId: string } }
  | { type: TemplateActionType.REORDER_ITEMS; payload: { activeId: string; overId: string; newParentId: string | null; } };

// --- DND Kit Tree Helpers ---
// Builds a nested tree structure from a flattened array
const buildTree = (flattenedItems: FlattenedItem[]): TreeItem[] => {
  const tree: TreeItem[] = [];
  const childrenOf: Record<string, TreeItem[]> = {};

  flattenedItems.forEach(item => {
    const newItem: TreeItem = { ...item };
    if (item.parentId === null) {
      tree.push(newItem);
    } else {
      if (!childrenOf[item.parentId]) {
        childrenOf[item.parentId] = [];
      }
      childrenOf[item.parentId].push(newItem);
    }
  });

  // Recursively attach children
  const attachChildren = (items: TreeItem[]) => {
    items.forEach(item => {
      if (childrenOf[item.id]) {
        item.children = childrenOf[item.id];
        attachChildren(item.children);
      }
    });
  };

  attachChildren(tree);
  return tree;
};

// Flattens a nested tree structure into an array with parentId and depth
const flattenTree = (tree: TreeItem[], parentId: string | null = null, depth: number = 0): FlattenedItem[] => {
  let flattened: FlattenedItem[] = [];
  tree.forEach(item => {
    flattened.push({ ...item, parentId, depth });
    if (item.children) {
      flattened = flattened.concat(flattenTree(item.children, item.id, depth + 1));
    }
  });
  return flattened;
};

// Converts our ReportTemplateSchema to a flattened DND Kit compatible structure
const convertTemplateToFlattenedItems = (template: ReportTemplate, availableSectionTypes: ReportSectionType[]): FlattenedItem[] => {
  let flattened: FlattenedItem[] = [];
  template.groups.forEach(group => {
    flattened.push({
      id: group.id,
      parentId: null,
      type: 'group',
      data: group,
      depth: 0,
    });
    group.sectionTypeIds.forEach(sectionTypeId => {
      const sectionType = availableSectionTypes.find(s => s.id === sectionTypeId);
      if (sectionType) {
        flattened.push({
          id: sectionTypeId,
          parentId: group.id,
          type: 'section',
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

  return { ...currentTemplate, groups: newGroups };
};
// --- End DND Kit Tree Helpers ---

// Reducer Function
const templateReducer = (state: ReportTemplate, action: TemplateAction): ReportTemplate => {
  switch (action.type) {
    case TemplateActionType.SET_TEMPLATE:
      return action.payload;
    case TemplateActionType.UPDATE_TEMPLATE_METADATA:
      return { ...state, ...action.payload };
    case TemplateActionType.ADD_GROUP:
      {
        const newGroup: ReportSectionGroup = {
          id: uuidv4(),
          title: action.payload?.title || 'New Group',
          sectionTypeIds: [],
        };
        const newFlattenedItems = [
          ...convertTemplateToFlattenedItems(state, state.availableSectionTypes as ReportSectionType[]),
          { id: newGroup.id, parentId: null, type: 'group', data: newGroup, depth: 0 },
        ];
        return convertFlattenedItemsToTemplate(newFlattenedItems, state);
      }
    case TemplateActionType.REMOVE_GROUP:
      {
        const { groupId } = action.payload;
        const newFlattenedItems = convertTemplateToFlattenedItems(state, state.availableSectionTypes as ReportSectionType[]).filter(item => item.id !== groupId && item.parentId !== groupId);
        return convertFlattenedItemsToTemplate(newFlattenedItems, state);
      }
    case TemplateActionType.UPDATE_GROUP_TITLE:
      {
        const { groupId, title } = action.payload;
        const newFlattenedItems = convertTemplateToFlattenedItems(state, state.availableSectionTypes as ReportSectionType[]).map(item => 
          item.id === groupId && item.type === 'group' ? { ...item, data: { ...(item.data as ReportSectionGroup), title } } : item
        );
        return convertFlattenedItemsToTemplate(newFlattenedItems, state);
      }
    case TemplateActionType.SET_FLATTENED_ITEMS:
      return convertFlattenedItemsToTemplate(action.payload, state);
    case TemplateActionType.ADD_SECTION_TO_GROUP:
      {
        const { groupId, sectionTypeId } = action.payload;
        const sectionType = (state.availableSectionTypes as ReportSectionType[]).find(s => s.id === sectionTypeId);
        if (!sectionType) return state; // Should not happen

        const newFlattenedItems = [
          ...convertTemplateToFlattenedItems(state, state.availableSectionTypes as ReportSectionType[]),
          { id: sectionTypeId, parentId: groupId, type: 'section', data: sectionType, depth: 1 },
        ];
        return convertFlattenedItemsToTemplate(newFlattenedItems, state);
      }
    case TemplateActionType.REMOVE_SECTION_FROM_GROUP:
      {
        const { groupId, sectionTypeId } = action.payload;
        const newFlattenedItems = convertTemplateToFlattenedItems(state, state.availableSectionTypes as ReportSectionType[]).filter(item => !(item.id === sectionTypeId && item.parentId === groupId));
        return convertFlattenedItemsToTemplate(newFlattenedItems, state);
      }
    case TemplateActionType.REORDER_ITEMS:
      {
        const { activeId, overId, newParentId } = action.payload;
        let newFlattenedItems = convertTemplateToFlattenedItems(state, state.availableSectionTypes as ReportSectionType[]);

        const activeItemIndex = newFlattenedItems.findIndex(item => item.id === activeId);
        const overItemIndex = newFlattenedItems.findIndex(item => item.id === overId);

        if (activeItemIndex === -1) return state; // Active item not found

        const activeItem = { ...newFlattenedItems[activeItemIndex] };
        newFlattenedItems.splice(activeItemIndex, 1); // Remove active item

        // Determine new position and parent
        let targetIndex = overItemIndex;
        if (overItemIndex !== -1 && activeItem.parentId === newParentId) {
          // Reordering within the same parent
          targetIndex = arrayMove(newFlattenedItems.map(item => item.id), activeItemIndex, overItemIndex).findIndex(id => id === activeId);
        } else if (overItemIndex !== -1) {
          // Reparenting or moving to a new position with a different parent
          // Find the correct insertion point relative to overId
          // For simplicity, we'll insert it after the overItem if it's a section, or as a child of a group
          if (overItem.type === 'section') {
            targetIndex = overItemIndex + 1;
          } else if (overItem.type === 'group') {
            // If dropping on a group, make it the first child of that group
            targetIndex = newFlattenedItems.findIndex(item => item.parentId === overItem.id);
            if (targetIndex === -1) {
              targetIndex = newFlattenedItems.length; // No children yet, add to end
            }
          }
        }

        activeItem.parentId = newParentId;
        activeItem.depth = newParentId === null ? 0 : 1; // Assuming only 2 levels

        newFlattenedItems.splice(targetIndex, 0, activeItem);

        return convertFlattenedItemsToTemplate(newFlattenedItems, state);
      }
    default:
      return state;
  }
};

interface TemplateEditorProps {
  initialTemplate?: ReportTemplate; // For editing existing template
  onSave: (template: ReportTemplate) => void;
  onCancel: () => void;
}

const initialTemplateState: ReportTemplate = {
  id: undefined, // Set to undefined for new templates
  name: '',
  description: '',
  groups: [],
  user_id: '', // This will be set by the API on save
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const TemplateEditor: React.FC<TemplateEditorProps> = ({ initialTemplate, onSave, onCancel }) => {
  const [template, dispatch] = useReducer<React.Reducer<ReportTemplate, TemplateAction>>(templateReducer, initialTemplate || initialTemplateState);
  const [availableSectionTypes, setAvailableSectionTypes] = useState<ReportSectionType[]>([]);
  const [loadingSectionTypes, setLoadingSectionTypes] = useState(true);
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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingSectionTypes(false);
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

  const flattenedItems = convertTemplateToFlattenedItems(template, availableSectionTypes);
  const sortedIds = flattenedItems.map(item => item.id);

  const findItem = (id: string) => flattenedItems.find(item => item.id === id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeItem = findItem(active.id as string);
    const overItem = findItem(over.id as string);

    if (!activeItem) return; // Active item must exist

    // Handle adding a section from the palette to a group
    if (active.data.current?.type === 'availableSection' && overItem?.type === 'group') {
      const groupId = overItem.id;
      const sectionTypeId = active.id as string;
      dispatch({ type: TemplateActionType.ADD_SECTION_TO_GROUP, payload: { groupId, sectionTypeId } });
      return; // Handled, exit
    }

    // If dropping on nothing or outside a valid drop target, revert to original position
    if (!overItem) {
      // This case needs more sophisticated handling for true revert or dropping into root
      return;
    }

    // Determine the new parent ID
    let newParentId: string | null = null;
    if (overItem.type === 'group') {
      newParentId = overItem.id; // Dropped directly onto a group
    } else if (overItem.type === 'section') {
      newParentId = overItem.parentId; // Dropped onto a section, so parent is the section's parent
    }

    // Dispatch reorder action
    dispatch({ 
      type: TemplateActionType.REORDER_ITEMS, 
      payload: { 
        activeId: active.id as string, 
        overId: over.id as string, 
        newParentId: newParentId 
      }
    });
  };

  const SortableTreeItem: React.FC<{ item: FlattenedItem; availableSectionTypes: ReportSectionType[]; dispatch: React.Dispatch<TemplateAction> }> = ({ item, availableSectionTypes, dispatch }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id, data: { type: item.type, parentId: item.parentId } });
  
    const style = {
      transform: transform ? CSS.Transform.toString(transform) : undefined,
      transition,
      marginLeft: item.depth * 20, // Indent based on depth
    };
  
    if (item.type === 'group') {
      const group = item.data as ReportSectionGroup;
      const childrenIds = flattenedItems.filter(child => child.parentId === item.id).map(child => child.id);

      return (
        <Card ref={setNodeRef} style={style} className="bg-gray-50 border-dashed border-gray-300 p-4 mb-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center space-x-2">
              <div {...listeners} className="cursor-grab">
                <GripVertical className="size-5 text-gray-500" />
              </div>
              <Input
                value={group.title}
                onChange={(e) => dispatch({ type: TemplateActionType.UPDATE_GROUP_TITLE, payload: { groupId: group.id, title: e.target.value } })}
                className="text-lg font-semibold border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: TemplateActionType.REMOVE_GROUP, payload: { groupId: group.id } })}>
              <Trash2 className="size-4 text-red-500" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            <SortableContext items={childrenIds} >
              {childrenIds.length === 0 && (
                <p className="text-gray-500 text-sm">Drag sections here or click to add.</p>
              )}
              {childrenIds.map((childId) => {
                const childItem = findItem(childId);
                return childItem ? (
                  <SortableTreeItem
                    key={childItem.id}
                    item={childItem}
                    availableSectionTypes={availableSectionTypes}
                    dispatch={dispatch}
                  />
                ) : null;
              })}
            </SortableContext>
          </CardContent>
        </Card>
      );
    } else if (item.type === 'section') {
      const sectionType = item.data as ReportSectionType;
      return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between p-2 border rounded-md bg-white text-sm">
          <div className="flex items-center space-x-2">
            <div {...listeners} className="cursor-grab">
              <GripVertical className="size-4 text-gray-400" />
            </div>
            <span>{sectionType.default_title}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: TemplateActionType.REMOVE_SECTION_FROM_GROUP, payload: { groupId: item.parentId!, sectionTypeId: item.id } })}>
            <Trash2 className="size-3 text-red-400" />
          </Button>
        </div>
      );
    }
    return null;
  };

  if (loadingSectionTypes) {
    return <div className="p-6">Loading editor...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">{initialTemplate ? 'Edit Template' : 'Create New Template'}</h2>

      <div className="mb-4 space-y-2">
        <Label htmlFor="template-name">Template Name</Label>
        <Input
          id="template-name"
          value={template.name}
          onChange={(e) => dispatch({ type: TemplateActionType.UPDATE_TEMPLATE_METADATA, payload: { name: e.target.value } })}
          placeholder="e.g., Standard SLP Evaluation"
        />
      </div>
      <div className="mb-6 space-y-2">
        <Label htmlFor="template-description">Description (Optional)</Label>
        <Input
          id="template-description"
          value={template.description || ''}
          onChange={(e) => dispatch({ type: TemplateActionType.UPDATE_TEMPLATE_METADATA, payload: { description: e.target.value } })}
          placeholder="A brief description of this template"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Available Sections Palette */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Available Sections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {availableSectionTypes.map((sectionType: ReportSectionType) => (
              <div
                key={sectionType.id}
                id={sectionType.id}
                data-type="availableSection"
                className="p-2 border rounded-md bg-gray-50 text-sm cursor-grab"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', sectionType.id);
                  e.dataTransfer.setData('text/section-type-id', sectionType.id);
                }}
              >
                {sectionType.default_title}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Template Structure Area */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Template Structure</CardTitle>
            <Button onClick={() => dispatch({ type: TemplateActionType.ADD_GROUP })} size="sm">
              <Plus className="size-4 mr-2" /> Add Group
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedIds} >
                {flattenedItems.length === 0 && (
                  <p className="text-gray-500">Add a group to start building your template.</p>
                )}
                {flattenedItems.map((item) => (
                  <SortableTreeItem
                    key={item.id}
                    item={item}
                    availableSectionTypes={availableSectionTypes}
                    dispatch={dispatch}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="secondary" onClick={() => onSave(template)}>Save Template</Button>
      </div>
    </div>
  );
};

export default TemplateEditor;