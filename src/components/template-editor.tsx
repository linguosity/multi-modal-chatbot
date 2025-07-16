'use client';

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import React, { useEffect, useState } from 'react';

import { SortableTree, SimpleTreeItemWrapper, TreeItemComponentProps } from 'dnd-kit-sortable-tree';

import {
  ReportTemplateSchema,
  ReportSectionGroupSchema,
  ReportSectionTypeSchema
} from '@/lib/schemas/report-template';

// Import DEFAULT_SECTIONS from report.ts
import { DEFAULT_SECTIONS } from '@/lib/schemas/report';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, GripVertical } from 'lucide-react';

// New type system
import { TreeItem, GroupNode, SectionNode, TemplateCreationMode } from '@/types/tree-types';

// Infer types from schemas
type ReportTemplate = z.infer<typeof ReportTemplateSchema>;
type ReportSectionGroup = z.infer<typeof ReportSectionGroupSchema>;
type ReportSectionType = z.infer<typeof ReportSectionTypeSchema>;

// --- Props expected from your TemplatesPage ---
interface TemplateEditorProps {
  initialTemplate?: ReportTemplate;
  onCancel: () => void;
  onSave?: (templateData: any) => Promise<void>;
}

// --- Helper to create section lookup from API data ---
function createSectionLookup(sectionTypes: ReportSectionType[]): Record<string, ReportSectionType> {
  return sectionTypes.reduce((acc, section) => {
    acc[section.id] = section;
    return acc;
  }, {} as Record<string, ReportSectionType>);
}

// --- Helper to convert template to tree structure ---
function templateToTree(template: ReportTemplate, sectionLookup: Record<string, ReportSectionType>): TreeItem[] {
  return template.groups?.map(group => ({
    id: group.id,
    name: group.title,
    data: {
      kind: 'group',
      id: group.id,
      title: group.title,
      sectionTypeIds: group.sectionTypeIds
    } as GroupNode,
    children: group.sectionTypeIds.map(sectionId => {
      const sectionType = sectionLookup[sectionId];
      return {
        id: sectionId,
        name: sectionType?.name || 'Unknown Section',
        data: {
          kind: 'section',
          id: sectionId,
          name: sectionType?.name || 'Unknown Section',
          default_title: sectionType?.default_title || 'Unknown Section',
          ai_directive: sectionType?.ai_directive || 'Generate content for this section.'
        } as SectionNode
      };
    })
  })) || [];
}

// --- Helper to update a node's name in tree recursively ---
function updateTreeItemName(tree: TreeItem[], id: string, newName: string): TreeItem[] {
  return tree.map(item => {
    if (item.id === id) {
      // Update the name and the data object
      const updatedData = item.data.kind === 'group' 
        ? { ...item.data, title: newName } as GroupNode
        : item.data;
      return { ...item, name: newName, data: updatedData };
    }
    return item.children 
      ? { ...item, children: updateTreeItemName(item.children, id, newName) }
      : item;
  });
}

// --- Helper to remove a section from any group in tree recursively ---
function removeSectionFromTree(tree: TreeItem[], sectionId: string): TreeItem[] {
  return tree.map(item => {
    if (item.children) {
      const filteredChildren = item.children.filter(child => child.id !== sectionId);
      // Update the group's sectionTypeIds if it's a group
      if (item.data.kind === 'group') {
        const updatedData = {
          ...item.data,
          sectionTypeIds: filteredChildren.map(child => child.id)
        } as GroupNode;
        return { ...item, children: filteredChildren, data: updatedData };
      }
      return { ...item, children: filteredChildren };
    }
    return item;
  });
}

// Top-level helper that produces a stable component type
function makeTreeItemComponent(
  onUpdateTreeItems: (updater: (items: TreeItem[]) => TreeItem[]) => void
) {
  return React.forwardRef<HTMLDivElement, TreeItemComponentProps<TreeItem>>(
    function TreeItemComponent({ handleProps, ...props }, ref) {
      return (
        <TreeNode
          {...props}
          ref={ref}
          handleProps={handleProps}
          onUpdateTreeItems={onUpdateTreeItems}
        />
      );
    }
  );
}

// --- Clean TreeNode with custom handle & no duplicate grab area ---
const TreeNode = React.forwardRef<HTMLDivElement, TreeItemComponentProps<TreeItem> & { 
  onUpdateTreeItems: (updater: (items: TreeItem[]) => TreeItem[]) => void 
}>(({ item, depth, handleProps, onUpdateTreeItems, ...wrapperProps }, ref) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(item.name);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  // Commit changes
  const commit = () => {
    onUpdateTreeItems(items => updateTreeItemName(items, item.id, draftName));
    setIsEditing(false);
  };

  // Cancel changes
  const cancel = () => {
    setDraftName(item.name);
    setIsEditing(false);
  };
  
  return (
    <SimpleTreeItemWrapper
      {...wrapperProps}
      ref={ref}
      item={item}
      depth={depth}
      manualDrag
      showDragHandle={false}
      className="list-none"        // leave padding alone
      contentClassName="w-full"    // no !p-0 override
    >
      <div className="group flex items-center mb-1">
        {/* Drag Handle (ONLY draggable area) */}
        <div
          {...handleProps}
          className={`flex items-center justify-center px-2 h-8 cursor-grab flex-shrink-0 ${
            depth === 0 ? 'hover:bg-blue-100' : 'hover:bg-gray-100'
          }`}
        >
          <GripVertical className="h-3 w-3 text-gray-400" />
        </div>
        
        {/* Text + actions */}
        <div
          className={`flex items-center flex-1 h-8 rounded-md text-sm font-medium overflow-hidden ${
            depth === 0 ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-800'
          }`}
        >
          {/* title / inline edit */}
          <div className="flex items-center flex-1 px-2 min-w-0">
            {isEditing ? (
              <input
                ref={inputRef}
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
                onBlur={commit}
                onKeyDown={e => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') cancel();
                }}
                className="bg-transparent border-none outline-none text-inherit font-inherit min-w-0 flex-1"
                aria-label="Title"
              />
            ) : (
              <span
                className="min-w-0 flex-1 cursor-pointer select-none truncate"
                onClick={() => setIsEditing(true)}
                title={`${item.name} (Click to edit)`}
              >
                {item.name}
              </span>
            )}
            
            {/* Action Buttons - Compact and minimal */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Add Child Button (only for groups) */}
              {depth === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-green-100 flex-shrink-0"
                  title="Add section"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newSectionId = uuidv4();
                    const newSection: TreeItem = {
                      id: newSectionId,
                      name: 'New Section',
                      data: {
                        kind: 'section',
                        id: newSectionId,
                        name: 'New Section',
                        default_title: 'New Section',
                        ai_directive: 'Generate content for this section based on the provided context.'
                      } as SectionNode,
                    };
                    
                    onUpdateTreeItems(items =>
                      items.map(groupItem =>
                        groupItem.id === item.id
                          ? {
                              ...groupItem,
                              children: [
                                ...(groupItem.children || []),
                                newSection,
                              ],
                            }
                          : groupItem
                      )
                    );
                  }}
                >
                  <Plus className="h-3 w-3 text-green-600" />
                </Button>
              )}
              
              {/* Delete Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-red-100 flex-shrink-0"
                title={depth === 0 ? "Delete group" : "Delete section"}
                onClick={(e) => {
                  e.stopPropagation();
                  if (depth === 0) {
                    onUpdateTreeItems(items => items.filter(g => g.id !== item.id));
                  } else {
                    onUpdateTreeItems(items => removeSectionFromTree(items, item.id));
                  }
                }}
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SimpleTreeItemWrapper>
  );
});
TreeNode.displayName = 'TreeNode';

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  initialTemplate,
  onCancel,
  onSave,
}) => {
  // --- Fetch section types from API (required for parsing) ---
  const [availableSectionTypes, setAvailableSectionTypes] = useState<ReportSectionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Local state for the DnD tree view ---
  const [treeItems, setTreeItems] = useState<TreeItem[]>([]);
  // --- Form fields for name/description (sync with tree for real template object) ---
  const [name, setName] = useState<string>(initialTemplate?.name || '');
  const [description, setDescription] = useState<string>(initialTemplate?.description || '');

  // --- Fetch all section types needed for display/lookup ---
  useEffect(() => {
    const fetchSectionTypes = async () => {
      try {
        const response = await fetch('/api/report-section-types');
        if (!response.ok) throw new Error('Failed to fetch section types');
        const data = await response.json();
        setAvailableSectionTypes(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchSectionTypes();
  }, []);

  // --- Template creation mode state ---
  const [creationMode, setCreationMode] = useState<TemplateCreationMode>('default');

  // Create stable TreeItemComponent to prevent remount cycles
  const TreeItemComponent = React.useMemo(
    () => makeTreeItemComponent(setTreeItems),
    [] // setTreeItems identity is stable from React, so safe
  );

  // --- When initialTemplate or section types change, re-parse into treeItems ---
  useEffect(() => {
    if (initialTemplate) {
      if (availableSectionTypes.length > 0) {
        const sectionLookup = createSectionLookup(availableSectionTypes);
        setTreeItems(templateToTree(initialTemplate, sectionLookup));
      }
      setName(initialTemplate.name || '');
      setDescription(initialTemplate.description || '');
    } else {
      if (creationMode === 'default') {
        createDefaultTemplate();
      } else {
        createScratchTemplate();
      }
    }
  }, [initialTemplate, availableSectionTypes, creationMode]);

  // --- Create default template structure from DEFAULT_SECTIONS ---
  const createDefaultTemplate = () => {
    // Build groups using the predefined DEFAULT_SECTIONS structure
    const defaultGroups = [
      {
        id: uuidv4(),
        title: "Initial Information & Background",
        sections: [
          DEFAULT_SECTIONS.HEADING,
          DEFAULT_SECTIONS.REASON_FOR_REFERRAL,
          DEFAULT_SECTIONS.HEALTH_DEVELOPMENTAL_HISTORY,
          DEFAULT_SECTIONS.FAMILY_BACKGROUND,
          DEFAULT_SECTIONS.PARENT_CONCERN
        ]
      },
      {
        id: uuidv4(),
        title: "Assessment Process & Results", 
        sections: [
          DEFAULT_SECTIONS.VALIDITY_STATEMENT,
          DEFAULT_SECTIONS.ASSESSMENT_TOOLS,
          DEFAULT_SECTIONS.ASSESSMENT_RESULTS,
          DEFAULT_SECTIONS.LANGUAGE_SAMPLE
        ]
      },
      {
        id: uuidv4(),
        title: "Conclusions & Recommendations",
        sections: [
          DEFAULT_SECTIONS.ELIGIBILITY_CHECKLIST,
          DEFAULT_SECTIONS.CONCLUSION,
          DEFAULT_SECTIONS.RECOMMENDATIONS,
          DEFAULT_SECTIONS.ACCOMMODATIONS
        ]
      }
    ];
    
    const defaultTreeItems: TreeItem[] = defaultGroups.map((group) => {
      const treeItem: TreeItem = {
        id: group.id,
        name: group.title,
        data: {
          kind: 'group',
          id: group.id,
          title: group.title,
          sectionTypeIds: group.sections.map(s => s.id)
        } as GroupNode,
        children: group.sections.map((section) => {
          return {
            id: section.id,
            name: section.title,
            data: {
              kind: 'section',
              id: section.id,
              name: section.title,
              default_title: section.title,
              ai_directive: (section as any).generationPrompt || 'Generate content for this section.'
            } as SectionNode
          };
        })
      };
      
      return treeItem;
    });
    
    setTreeItems(defaultTreeItems);
    setName('New Report Template');
    setDescription('Custom report template');
  };

  

  const createScratchTemplate = () => {
    console.log('📝 createScratchTemplate: Creating empty template');
    setTreeItems([]);
    setName('New Template (From Scratch)');
    setDescription('Custom template built from scratch');
  };

  if (loading) return <div className="p-6">Loading editor...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  // Handle save functionality
  const handleSave = async () => {
    try {
      // Convert tree items back to template format
      const templateData = {
        name,
        description,
        groups: treeItems.map(item => ({
          id: item.id,
          title: item.name,
          sectionTypeIds: item.children?.map(child => child.id) || []
        }))
      };

      // Use the onSave prop if provided, otherwise just close
      if (onSave) {
        await onSave(templateData);
      } else {
        console.log('Saving template:', templateData);
      }
      
      // Close the editor
      onCancel();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  return (
    <div className="p-6 space-y-2 max-h-screen overflow-y-auto template-editor">
      <style>{`
        /* Aggressively target all possible border sources */
        .template-editor * {
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }
        /* Remove padding from sortable tree items */
        .dnd-sortable-tree_simple_tree-item {
          padding: 0px !important;
        }
        /* But restore borders for inputs and buttons that need them */
        .template-editor input[type="text"],
        .template-editor input[type="radio"],
        .template-editor button {
          border: 1px solid #d1d5db !important;
        }
        .template-editor input[type="radio"] {
          border-radius: 50% !important;
        }
        .template-editor button {
          border-radius: 0.375rem !important;
        }
      `}</style>

        {/* Simplified Template Creation Mode Selector */}
      {!initialTemplate && (
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="creationMode"
              value="default"
              checked={creationMode === 'default'}
              onChange={(e) => setCreationMode(e.target.value as TemplateCreationMode)}
              className="mr-1"
            />
            <span className="text-sm">default</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="creationMode"
              value="scratch"
              checked={creationMode === 'scratch'}
              onChange={(e) => setCreationMode(e.target.value as TemplateCreationMode)}
              className="mr-1"
            />
            <span className="text-sm">scratch</span>
          </label>
        </div>
      )}
      
      {/* Template Name and Description in same row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1 text-sm font-medium">Template Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Description</label>
          <Input value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </div>
      
      <SortableTree
        items={treeItems}
        onItemsChanged={setTreeItems}
        TreeItemComponent={TreeItemComponent}
        indentationWidth={16}
        pointerSensorOptions={{activationConstraint: {distance: 5}}}
      />
      
      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save Template</Button>
      </div>
    </div>
  );
};

export default TemplateEditor;