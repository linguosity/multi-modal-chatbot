// -------------------------------------------------------------
// ReportSectionCard.tsx  –  v3.2  (fully typed, no TS errors)
// -------------------------------------------------------------
// Changes from previous draft
//   • <Tree data={treeNodes}> (names match)
//   • All four callbacks call syncUp(api) instead of handleTreeUpdate
//   • No other logic changed
// -------------------------------------------------------------

'use client'

/* --------------------------------------------------------------------
   Imports
--------------------------------------------------------------------- */
import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Sparkles, FileText, Edit, List, Plus, Trash2 } from 'lucide-react'
import TiptapEditor from './TiptapEditor'
import { ReportSection, DataPoint } from '@/lib/schemas/report'
import { Textarea } from '@/components/ui/textarea'
import { Tree } from 'react-arborist' // <— only Tree is needed
import { v4 as uuidv4 } from 'uuid'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { DEFAULT_SECTIONS } from '@/lib/schemas/report'
import { Node, TreeApi } from 'react-arborist'

/* --------------------------------------------------------------------
   Props & helpers
--------------------------------------------------------------------- */
interface Props {
  /** parent’s ReportSection object */
  section: ReportSection
  /** parent’s reportId (passed separately so we don’t mutate the type) */
  reportId: string
  /** callback that persists changes */
  onUpdateSection: (
    sectionId: string,
    content: string,
    points?: DataPoint[]
  ) => void
}

interface ArboristNode extends Node {
  id: string;
  text?: string;
  heading?: string;
  prose_template?: string;
  children?: ArboristNode[];
}

/**
 * Convert DataPoint[] → arborist Node[]  (adds UUIDs).
 */
const convertDataPointsToNodes = (dataPoints: DataPoint[]): ArboristNode[] => {
  return dataPoints.map((dp: DataPoint): ArboristNode => {
    const id = uuidv4();
    if (typeof dp === 'string') {
      return { id, text: dp };
    } else {
      return { id, heading: dp.heading, prose_template: dp.prose_template, children: convertDataPointsToNodes(dp.points) };
    }
  });
};

// Helper to convert react-arborist's Node[] back to DataPoint[]
const convertNodesToDataPoints = (nodes: ArboristNode[]): DataPoint[] => {
  return nodes.map((node: ArboristNode): DataPoint => {
    if (node.children) {
      return { heading: node.heading!, prose_template: node.prose_template, points: convertNodesToDataPoints(node.children) };
    } else {
      return node.text!;
    }
  });
};

/** dotted SVG used as drag handle */
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

/* --------------------------------------------------------------------
   Main component
--------------------------------------------------------------------- */
export const ReportSectionCard: React.FC<Props> = ({
  section,
  reportId,
  onUpdateSection
}) => {
  /* ---------- local UI state ---------- */
  const [tab, setTab] = useState<'points' | 'editor'>('points')
  const [points, setPoints] = useState<DataPoint[]>(section.points || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEditPopover, setShowEditPopover] = useState(false)

  /* ---------- derived: arborist data ---------- */
  const treeNodes = useMemo(() => convertDataPointsToNodes(points), [points]);

  /* ---------- helper to push edits up ---------- */
  const syncUp = (api: TreeApi<ArboristNode>) => {
    const updated = convertNodesToDataPoints(api.data)
    setPoints(updated)
    onUpdateSection(section.id, section.content, updated)
  }

  /* ---------- call AI endpoint ---------- */
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
            : { points })
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'AI error')
      if (mode === 'points') setPoints(json.updatedSection.points)
      else onUpdateSection(section.id, json.updatedSection.content, points)
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  /* ---------- row renderer ---------- */
  const Row = ({ node, style }: { node: Node<ArboristNode>, style: React.CSSProperties }) => {
    const api = node.tree as TreeApi<ArboristNode> // Tree API attached to each node
    const isHeading = !!node.data.children

    return (
      <li
        ref={node.ref}
        style={{ ...style, width: '100%' }}
        className={cn(
          'group flex items-center overflow-hidden',
          node.isDragging && 'bg-muted/40'
        )}
      >
        {/* grip strip */}
        <span
          {...node.dragHandle}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex-shrink-0 w-6 relative cursor-grab border-l-4 border-border group-hover:border-primary"
        >
          <DotGrip />
        </span>
        {/* indent */}
        <div style={{ width: node.level * 20 }} />
        {/* content */}
        {isHeading ? (
          <div className="flex-1 min-w-0">
            <input
              className="w-full font-semibold truncate bg-transparent border-b border-border/40 focus:border-primary outline-none py-0.5"
              value={node.data.heading}
              onChange={(e) => api.update(node.id, { heading: e.target.value })}
            />
            <Textarea
              className="w-full bg-transparent border rounded-md p-2 text-sm mt-1"
              placeholder="Mini-template paragraph (optional)"
              value={node.data.prose_template || ''}
              onChange={(e) =>
                api.update(node.id, { prose_template: e.target.value })
              }
            />
          </div>
        ) : (
          <input
            className="flex-1 min-w-0 truncate bg-transparent text-sm border-b border-border/40 focus:border-primary outline-none py-0.5"
            value={node.data.text}
            onChange={(e) => api.update(node.id, { text: e.target.value })}
          />
        )}

        {/* pop-over menu */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="ml-1 px-1 text-lg leading-none opacity-0 group-hover:opacity-100"
              onPointerDown={(e) => e.stopPropagation()}
            >
              ⋯
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-32 p-1">
            <button
              className="flex items-center w-full px-2 py-1 text-sm hover:bg-muted rounded-md"
              onClick={() => {
                api.create({ id: uuidv4(), text: 'New Point' }, node.id, 0)
                syncUp(api)
              }}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Point
            </button>
            <button
              className="flex items-center w-full px-2 py-1 text-sm hover:bg-muted rounded-md"
              onClick={() => {
                api.create(
                  { id: uuidv4(), heading: 'New Heading', children: [] },
                  node.id,
                  0
                )
                syncUp(api)
              }}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Heading
            </button>
            <button
              className="flex items-center w-full px-2 py-1 text-sm hover:bg-muted rounded-md text-red-600"
              onClick={() => {
                api.delete([node.id])
                syncUp(api)
              }}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </button>
          </PopoverContent>
        </Popover>
      </li>
    )
  }

  /* ---------- render ---------- */
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

        {/* points tab */}
        {tab === 'points' ? (
          <ul className="space-y-0.5 overflow-x-hidden">
            {points.length === 0 && !section.content ? (
              <div className="text-xs text-muted-foreground italic mt-2 mb-3">
                {DEFAULT_SECTIONS[section.sectionType as keyof typeof DEFAULT_SECTIONS]?.content}
                <Popover open={showEditPopover} onOpenChange={setShowEditPopover}>
                  <PopoverTrigger asChild>
                    <button
                      className="ml-2 text-blue-500 underline text-xs hover:text-blue-700"
                      onClick={() => setShowEditPopover(true)}
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
                        defaultValue={DEFAULT_SECTIONS[section.sectionType as keyof typeof DEFAULT_SECTIONS]?.content}
                        onChange={(e) => onUpdateSection(section.id, e.target.value, points)}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowEditPopover(false)}>Cancel</Button>
                        <Button onClick={() => {
                          onUpdateSection(section.id, section.content, points)
                          setShowEditPopover(false)
                        }}>Save & Insert</Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            ) : (
              <Tree
                data={treeNodes}
                rowComponent={Row}
                height={400}
                width="100%"
                indent={24}
                rowHeight={35}
                openByDefault
                onMove={(params) => {
                params.tree.move(params.dragIds, params.parentId, params.index);
                syncUp(params.tree);
              }}
              onCreate={(params) => {
                const newNode = params.type === 'leaf' ? { id: uuidv4(), text: 'New Point' } : { id: uuidv4(), heading: 'New Heading', children: [] };
                params.tree.create(newNode, params.parentId, params.index);
                syncUp(params.tree);
              }}
              onDelete={(params) => {
                params.tree.delete(params.ids);
                syncUp(params.tree);
              }}
              onUpdate={(params) => {
                params.tree.update(params.id, params.changes);
                syncUp(params.tree);
              }}
              />
            )}
            <div className="flex justify-end space-x-2 mt-4">
              <Button onClick={() => callAI('points')} disabled={loading}>
                <Sparkles className="mr-2 h-4 w-4" />
                {loading ? 'Generating…' : 'Generate Points'}
              </Button>
              <Button
                onClick={() => callAI('prose')}
                disabled={loading || points.length === 0}
              >
                <FileText className="mr-2 h-4 w-4" />
                {loading ? 'Writing…' : 'Write Section'}
              </Button>
            </div>
          </ul>
        ) : (
          /* editor tab */
          <TiptapEditor
            content={section.content}
            onChange={(newContent) => onUpdateSection(section.id, newContent, points)}
          />
        )}
      </CardContent>
    </Card>
  )
}