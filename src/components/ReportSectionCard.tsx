'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Sparkles, FileText, Edit, List, Plus, Trash2 } from 'lucide-react'
import TiptapEditor from './TiptapEditor'
import { ReportSection, DataPoint } from '@/lib/schemas/report'
import { Textarea } from '@/components/ui/textarea'
import { Tree, NodeRendererProps, TreeApi, CreateHandler, MoveHandler, DeleteHandler } from 'react-arborist'
import { v4 as uuidv4 } from 'uuid'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface ArboristNode {
  id: string;
  text?: string;
  heading?: string;
  prose_template?: string;
  children?: ArboristNode[];
}

interface Props {
  section: ReportSection
  reportId: string
  onUpdateSectionAction: (
    sectionId: string,
    content: string,
    points?: DataPoint[]
  ) => void
}

const convertNodesToDataPoints = (nodes: ArboristNode[]): DataPoint[] => {
  return nodes.map((node: ArboristNode): DataPoint => {
    if (node.children) {
      return { 
        heading: node.heading || '', 
        prose_template: node.prose_template, 
        points: convertNodesToDataPoints(node.children) 
      };
    } else {
      return node.text || '';
    }
  });
};

const addIdsToDataPoints = (dataPoints: DataPoint[]): ArboristNode[] => {
  return dataPoints.map((dp: DataPoint): ArboristNode => {
    const id = uuidv4();
    if (typeof dp === 'string') {
      return { id, text: dp };
    } else if (dp && typeof dp === 'object' && 'heading' in dp) {
      return { 
        id, 
        heading: dp.heading as string, 
        prose_template: (dp as any).prose_template, 
        children: (dp as any).points ? addIdsToDataPoints((dp as any).points) : [] 
      };
    }
    return { id, text: '' }; // Fallback for unexpected dp shape
  });
};

function DotGrip() {
  return (
    <svg
      viewBox="0 0 4 12"
      className="absolute inset-0 m-auto block h-3 w-1.5 fill-muted-foreground opacity-0 group-hover:opacity-70 transition-opacity"
    >
      {[0, 4, 8].map((x) =>
        [0, 4, 8, 12].map((y) => (
          <circle key={`${x}-${y}`} cx={x / 4} cy={y / 4} r=".25" />
        ))
      )}
    </svg>
  )
}

export const ReportSectionCard: React.FC<Props> = ({
  section,
  reportId,
  onUpdateSectionAction
}) => {
  const [tab, setTab] = useState<'points' | 'editor'>('points')
  const [treeData, setTreeData] = useState<ArboristNode[]>(() => addIdsToDataPoints(section.points || []));
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEditPopover, setShowEditPopover] = useState(false)
  const treeRef = useRef<TreeApi<ArboristNode>>(null);

  const updateTreeData = (newData: ArboristNode[]) => {
    setTreeData(newData);
        onUpdateSectionAction(section.id, section.content, convertNodesToDataPoints(newData));
  }

  const callAI = async (mode: 'points' | 'prose') => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          sectionId: section.id,
          generation_type: mode,
          ...(mode === 'points'
            ? { unstructuredInput: section.content }
            : { points: convertNodesToDataPoints(treeData) })
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'AI error')
      if (mode === 'points') {
        const newPoints = json.updatedSection.points || [];
        const newTreeData = addIdsToDataPoints(newPoints);
        updateTreeData(newTreeData);
      } else {
                onUpdateSectionAction(section.id, json.updatedSection.content, convertNodesToDataPoints(treeData))
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const Row: React.FC<NodeRendererProps<ArboristNode>> = ({ node, style, dragHandle }) => {
    const { heading, prose_template, text, children } = node.data as ArboristNode;
    const isHeading = !!children;

    return (
      <div
        style={style}
        className={cn(
          'group flex items-center overflow-hidden',
          node.isDragging && 'bg-muted/40'
        )}
      >
        <span
          ref={dragHandle}
          className="flex-shrink-0 w-6 relative cursor-grab border-l-4 border-border group-hover:border-primary"
        >
          <DotGrip />
        </span>
        <div style={{ width: (node.level * 20) }} />
        {isHeading ? (
          <div className="flex-1 min-w-0">
            <input
              className="w-full font-semibold truncate bg-transparent border-b border-border/40 focus:border-primary outline-none py-0.5"
              value={heading || ''}
              onChange={(e) => onUpdate({ id: node.id, data: { heading: e.target.value } })}
            />
            <Textarea
              className="w-full bg-transparent border rounded-md p-2 text-sm mt-1"
              placeholder="Mini-template paragraph (optional)"
              value={prose_template || ''}
              onChange={(e) => onUpdate({ id: node.id, data: { prose_template: e.target.value } })}
            />
          </div>
        ) : (
          <input
            className="flex-1 min-w-0 truncate bg-transparent text-sm border-b border-border/40 focus:border-primary outline-none py-0.5"
            value={text || ''}
            onChange={(e) => onUpdate({ id: node.id, data: { text: e.target.value } })}
          />
        )}


        <Popover>
          <PopoverTrigger asChild>
            <button
              className="ml-1 px-1 text-lg leading-none opacity-0 group-hover:opacity-100"
            >
              ⋯
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-32 p-1">
            <button
              className="flex items-center w-full px-2 py-1 text-sm hover:bg-muted rounded-md"
              onClick={() => treeRef.current?.create({ parentId: node.id, index: 0 })}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Point
            </button>
            <button
              className="flex items-center w-full px-2 py-1 text-sm hover:bg-muted rounded-md"
              onClick={() => treeRef.current?.create({ parentId: node.id, index: 0 })}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Heading
            </button>
            <button
              className="flex items-center w-full px-2 py-1 text-sm hover:bg-muted rounded-md text-red-600"
              onClick={() => treeRef.current?.delete([node.id])}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </button>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  const onMove: MoveHandler<ArboristNode> = ({ dragIds, parentId, index }) => {
    // Note: This is a simplified implementation - react-arborist handles complex tree moves internally
    // For now, we'll just update the tree data directly
    console.log('🔄 onMove: Moving items', { dragIds, parentId, index });
    // The tree component will handle the actual move operation
  };

  const onUpdate = ({ id, data }: { id: string; data: Partial<ArboristNode> }) => {
    const map = (nodes: ArboristNode[]): ArboristNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, ...data };
        }
        if (node.children) {
          return { ...node, children: map(node.children) };
        }
        return node;
      });
    }
    updateTreeData(map(treeData));
  };

  const onDelete: DeleteHandler<ArboristNode> = ({ ids }) => {
    const filter = (nodes: ArboristNode[]): ArboristNode[] => {
      return nodes.filter(node => !ids.includes(node.id)).map(node => {
        if (node.children) {
          return { ...node, children: filter(node.children) };
        }
        return node;
      });
    }
    updateTreeData(filter(treeData));
  };

  const onCreate: CreateHandler<ArboristNode> = ({ parentId, index, type }) => {
    const newNode: ArboristNode = {
      id: uuidv4(),
      ...(type === 'leaf' 
        ? { text: 'New Point' } 
        : { heading: 'New Heading', children: [] })
    };

    const insert = (nodes: ArboristNode[]): ArboristNode[] => {
      if (parentId === null) {
        return [...nodes.slice(0, index), newNode, ...nodes.slice(index)];
      }
      return nodes.map(node => {
        if (node.id === parentId) {
          const children = node.children || [];
          return { ...node, children: [...children.slice(0, index), newNode, ...children.slice(index)] };
        }
        if (node.children) {
          return { ...node, children: insert(node.children) };
        }
        return node;
      });
    }
    
    updateTreeData(insert(treeData));
    return newNode;
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {section.title}
          <div className="flex items-center space-x-2">
            <Button
              variant={tab === 'points' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTab('points')}
            >
              <List className="h-4 w-4 mr-2" /> Key Points
            </Button>
            <Button
              variant={tab === 'editor' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTab('editor')}
            >
              <Edit className="h-4 w-4 mr-2" /> Editor
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {tab === 'points' ? (
          <div>
            {treeData.length === 0 && !section.content ? (
              <div className="text-xs text-muted-foreground italic mt-2 mb-3">
                No data points yet. You can add them manually or generate them with AI.
                <Popover open={showEditPopover} onOpenChange={setShowEditPopover}>
                  <PopoverTrigger asChild>
                    <button
                      className="ml-2 text-blue-500 underline text-xs hover:text-blue-700"
                    >
                      Edit Example
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">Edit Section</h4>
                        <p className="text-sm text-muted-foreground">
                          Fill in the blanks to create your section content.
                        </p>
                      </div>
                      <Textarea
                        defaultValue={section.content}
                                                onChange={(e) => onUpdateSectionAction(section.id, e.target.value, convertNodesToDataPoints(treeData))}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setShowEditPopover(false)}>Cancel</Button>
                        <Button onClick={() => {
                          setShowEditPopover(false)
                        }}>Save & Insert</Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              <Tree<ArboristNode>
                ref={treeRef}
                data={treeData}
                children={Row}
                height={400}
                width="100%"
                indent={24}
                rowHeight={35}
                openByDefault
                onMove={onMove}
                onCreate={onCreate}
                onDelete={onDelete}
              />
            )}
            <div className="flex justify-end space-x-2 mt-4">
              <Button onClick={() => callAI('points')} disabled={loading}>
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? 'Generating…' : 'Generate Points'}
              </Button>
              <Button
                onClick={() => callAI('prose')}
                disabled={loading || treeData.length === 0}
              >
                <FileText className="mr-2 h-4 w-4" />
                {loading ? 'Writing…' : 'Write Section'}
              </Button>
            </div>
          </div>
        ) : (
          <TiptapEditor
            content={section.content}
            onChange={(newContent) => onUpdateSectionAction(section.id, newContent, convertNodesToDataPoints(treeData))}
          />
        )}
      </CardContent>
    </Card>
  )
}
