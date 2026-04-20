'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  type OnNodeDrag,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useReport } from '@/lib/context/ReportContext'
import { EvidenceChip, fileKindFromType, type EvidenceKind } from '@/components/EvidenceChip'

// ─── Canvas persistence ──────────────────────────────────────────────────────
// Canvas state is stored on `file_uploads` rows: `confirmed_section_id` for the
// attachment (shared with /triage), and `ai_extraction_result.canvas_position`
// for the x/y. Chip node ids are `chip-${fileId}`; strip the prefix when
// talking to the API.
const CHIP_PREFIX = 'chip-'
const BUCKET_PREFIX = 'bucket-'
const PATCH_DEBOUNCE_MS = 500

type CanvasRow = {
  id: string
  filename: string
  file_type: string
  confirmed_section_id?: string | null
  canvas_position: { x: number; y: number } | null
}

type PendingUpdate = {
  fileId: string
  confirmed_section_id?: string | null
  x?: number
  y?: number
}

// ─── Node data types ─────────────────────────────────────────────────────────

type BucketOption = { id: string; num: string; title: string }

type ChipNodeData = {
  kind: EvidenceKind
  name: string
  meta?: string
  attached?: string | null
  // Shared so every chip can expose the keyboard-accessible Move-to menu.
  // WCAG 2.1.1 (Keyboard) — drag-and-drop must have an equivalent.
  buckets?: BucketOption[]
  onMoveTo?: (chipNodeId: string, bucketNodeId: string | null) => void
  nodeId?: string
}

type BucketNodeData = {
  num: string
  title: string
  count: number
}

// ─── Custom nodes ────────────────────────────────────────────────────────────

function ChipNode({ data }: NodeProps<Node<ChipNodeData>>) {
  const attachedBucket = data.buckets?.find((b) => b.id === data.attached) ?? null
  return (
    <div style={{ pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: 4 }}>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      <EvidenceChip
        kind={data.kind}
        name={data.name}
        meta={data.meta}
        tone={data.attached ? 'terra' : 'default'}
      />
      {/* Keyboard-accessible Move-to menu.
          Native <select> gives free keyboard navigation + screen-reader announcement. */}
      {data.buckets && data.buckets.length > 0 && data.nodeId && data.onMoveTo && (
        <label
          className="nodrag"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--ink-3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            background: 'var(--card-surface)',
            border: '1px solid var(--line-2)',
            borderRadius: 2,
            padding: '2px 4px',
            cursor: 'pointer',
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <span className="sr-only">
            Move {data.name} to a section. Currently {attachedBucket ? `in ${attachedBucket.title}` : 'unassigned'}.
          </span>
          <span aria-hidden>↱</span>
          <select
            value={data.attached ?? ''}
            onChange={(e) => data.onMoveTo!(data.nodeId!, e.target.value || null)}
            aria-label={`Section for ${data.name}`}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--ink)',
            }}
          >
            <option value="">— unassigned —</option>
            {data.buckets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.num} · {b.title}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  )
}

function BucketNode({ data, selected }: NodeProps<Node<BucketNodeData>>) {
  const filled = data.count > 0
  return (
    <div
      style={{
        minWidth: 260,
        minHeight: 120,
        border: `1.5px solid ${selected ? 'var(--terracotta-ink)' : 'var(--line)'}`,
        background: filled ? 'var(--card-surface)' : 'rgba(255,255,255,0.6)',
        borderRadius: 4,
        boxShadow: '4px 4px 0 rgba(17,17,17,0.08)',
        padding: 12,
        pointerEvents: 'all',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="wf-label">{data.num}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>{data.title}</span>
        </div>
        {filled && <span className="wf-pill terra">● {data.count}</span>}
      </div>
      <div>
        {filled ? (
          <span className="wf-sm">{data.count} source{data.count === 1 ? '' : 's'} attached</span>
        ) : (
          <span className="wf-hand accent" style={{ fontSize: 16 }}>drop here →</span>
        )}
      </div>
    </div>
  )
}

const nodeTypes = { chip: ChipNode, bucket: BucketNode }

// ─── Layout helpers ──────────────────────────────────────────────────────────

const BUCKET_WIDTH = 280
const BUCKET_HEIGHT = 150
const CHIP_WIDTH = 220
const CHIP_HEIGHT = 56

function hitBucket(chipNode: Node<ChipNodeData>, buckets: Node<BucketNodeData>[]): Node<BucketNodeData> | null {
  const cx = chipNode.position.x + CHIP_WIDTH / 2
  const cy = chipNode.position.y + CHIP_HEIGHT / 2
  return (
    buckets.find(
      (b) =>
        cx >= b.position.x &&
        cx <= b.position.x + BUCKET_WIDTH &&
        cy >= b.position.y &&
        cy <= b.position.y + BUCKET_HEIGHT
    ) ?? null
  )
}

// Heuristic auto-layout suggestion (until AI returns real assignments)
function suggestBucketId(name: string, kind: EvidenceKind, buckets: Node<BucketNodeData>[]): string | null {
  const n = name.toLowerCase()
  const match = (regex: RegExp) => buckets.find((b) => regex.test(b.data.title.toLowerCase()))?.id ?? null
  if (kind === 'pdf' && /celf|gfta|ppvt|evt|test/.test(n)) return match(/language|assessment/) ?? buckets[2]?.id ?? null
  if (kind === 'audio' || /obs/.test(n)) return match(/articulation|phonology|pragmatic/) ?? buckets[3]?.id ?? null
  if (kind === 'note' || /email|interview|intake/.test(n)) return match(/referral|background/) ?? buckets[0]?.id ?? null
  if (/sample|mlu|transcript/.test(n)) return match(/language|expressive/) ?? buckets[4]?.id ?? null
  return buckets[1]?.id ?? null
}

// ─── Page ────────────────────────────────────────────────────────────────────

function CanvasInner() {
  const { report } = useReport()
  const [toast, setToast] = useState<string | null>(null)

  const sections = report?.sections ?? []
  const uploadedFiles = useMemo(() => {
    const meta = (report?.metadata ?? {}) as Record<string, unknown>
    const raw = (meta.uploadedFiles as Array<{ id: string; name?: string; fileName?: string; type?: string }> | undefined) ?? []
    return Array.isArray(raw) ? raw : []
  }, [report])

  // ── Build initial nodes ────────────────────────────────────────────────────
  const initialBuckets: Node<BucketNodeData>[] = useMemo(
    () =>
      sections.map((s, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        return {
          id: `bucket-${s.id}`,
          type: 'bucket',
          position: { x: 780 + col * 340, y: 100 + row * 180 },
          data: {
            num: (i + 1).toString().padStart(2, '0'),
            title: s.title,
            count: 0,
          },
          draggable: true,
        }
      }),
    [sections]
  )

  const bucketOptions: BucketOption[] = useMemo(
    () => initialBuckets.map((b) => ({ id: b.id, num: b.data.num, title: b.data.title })),
    [initialBuckets]
  )

  // forward-decl reference so we can thread the keyboard-move callback into
  // the chip node data without a circular hook dep.
  const moveToRef = useRef<((chipId: string, bucketId: string | null) => void) | null>(null)

  const initialChips: Node<ChipNodeData>[] = useMemo(
    () =>
      uploadedFiles.map((f, i) => ({
        id: `chip-${f.id}`,
        type: 'chip',
        position: { x: 120, y: 120 + i * 90 },
        data: {
          kind: fileKindFromType(f.type || '') as EvidenceKind,
          name: f.fileName || f.name || 'untitled',
          meta: (f.type || '').split('/')[1] || 'file',
          attached: null,
          nodeId: `chip-${f.id}`,
          buckets: bucketOptions,
          onMoveTo: (chipId: string, bucketId: string | null) => moveToRef.current?.(chipId, bucketId),
        },
        draggable: true,
      })),
    [uploadedFiles, bucketOptions]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ChipNodeData | BucketNodeData>>([
    ...initialBuckets,
    ...initialChips,
  ])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Sync when report data loads asynchronously
  useEffect(() => {
    setNodes([...initialBuckets, ...initialChips])
    setEdges([])
  }, [initialBuckets, initialChips, setNodes, setEdges])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }, [])

  /**
   * Keyboard-accessible counterpart to drag-to-attach. Called from the chip
   * node's native <select>. Snaps the chip into the bucket (or back to the
   * tray column when bucketId is null) and updates the attachment state.
   */
  const handleMoveTo = useCallback((chipNodeId: string, bucketId: string | null) => {
    setNodes((ns) => {
      const bucket = bucketId ? ns.find((n) => n.id === bucketId && n.type === 'bucket') as Node<BucketNodeData> | undefined : null
      const existingInBucket = bucketId
        ? ns.filter((n) => n.type === 'chip' && (n.data as ChipNodeData).attached === bucketId && n.id !== chipNodeId).length
        : 0
      return ns.map((n) => {
        if (n.id !== chipNodeId || n.type !== 'chip') return n
        const chip = n as Node<ChipNodeData>
        if (bucket) {
          return {
            ...chip,
            position: { x: bucket.position.x + 16, y: bucket.position.y + 50 + existingInBucket * 28 },
            data: { ...chip.data, attached: bucketId },
          }
        }
        return {
          ...chip,
          data: { ...chip.data, attached: null },
        }
      })
    })
    showToast(bucketId ? 'Attached via keyboard' : 'Detached via keyboard')
  }, [setNodes, showToast])

  // Keep the ref current so chip-node <select> onChange handlers (captured at
  // node-construction time) dispatch into the latest callback.
  useEffect(() => {
    moveToRef.current = handleMoveTo
  }, [handleMoveTo])

  const recomputeBucketCounts = useCallback(() => {
    setNodes((ns) => {
      const chipsByAttachment: Record<string, number> = {}
      ns.filter(isChipNode).forEach((c) => {
        const a = c.data.attached
        if (a) chipsByAttachment[a] = (chipsByAttachment[a] || 0) + 1
      })
      return ns.map((n) =>
        n.type === 'bucket'
          ? { ...n, data: { ...(n.data as BucketNodeData), count: chipsByAttachment[n.id] || 0 } }
          : n
      )
    })
  }, [setNodes])

  const rebuildEdges = useCallback(() => {
    setNodes((ns) => {
      const chips = ns.filter(isChipNode)
      const newEdges: Edge[] = chips
        .filter((c) => c.data.attached)
        .map((c) => ({
          id: `edge-${c.id}-${c.data.attached}`,
          source: c.id,
          target: c.data.attached as string,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: 'var(--terracotta)',
            strokeWidth: 1.4,
            strokeDasharray: '4 3',
          },
        }))
      setEdges(newEdges)
      return ns
    })
  }, [setNodes, setEdges])

  // Handle chip drop → attach to bucket if overlapping
  const onNodeDragStop: OnNodeDrag = useCallback(
    (_event, node) => {
      if (node.type !== 'chip') return
      const buckets = nodes.filter((n): n is Node<BucketNodeData> => n.type === 'bucket')
      const hit = hitBucket(node as Node<ChipNodeData>, buckets)
      const prevAttached = (node.data as ChipNodeData).attached

      if (hit && hit.id !== prevAttached) {
        setNodes((ns) =>
          ns.map((n) =>
            n.id === node.id && n.type === 'chip'
              ? { ...n, data: { ...(n.data as ChipNodeData), attached: hit.id } }
              : n
          )
        )
        showToast(`Attached to ${hit.data.num} · ${hit.data.title}`)
      } else if (!hit && prevAttached) {
        setNodes((ns) =>
          ns.map((n) =>
            n.id === node.id && n.type === 'chip'
              ? { ...n, data: { ...(n.data as ChipNodeData), attached: null } }
              : n
          )
        )
        showToast('Detached from section')
      }
    },
    [nodes, setNodes, showToast]
  )

  // After any node change that might affect attachment, update edges + counts
  useEffect(() => {
    recomputeBucketCounts()
    rebuildEdges()
  // Only run when chip attachment state changes (derived from nodes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.map((n) => (n.type === 'chip' ? (n.data as ChipNodeData).attached ?? '' : '')).join(',')])

  const runAutoLayout = useCallback(() => {
    showToast('AI clustering evidence by section suggestion…')
    setNodes((ns) => {
      const buckets = ns.filter((n): n is Node<BucketNodeData> => n.type === 'bucket')
      const attachedCountPerBucket: Record<string, number> = {}
      return ns.map((n) => {
        if (n.type !== 'chip') return n
        const chip = n as Node<ChipNodeData>
        const bucketId = suggestBucketId(chip.data.name, chip.data.kind, buckets)
        if (!bucketId) return n
        const bucket = buckets.find((b) => b.id === bucketId)
        if (!bucket) return n
        const idx = attachedCountPerBucket[bucketId] || 0
        attachedCountPerBucket[bucketId] = idx + 1
        return {
          ...n,
          position: { x: bucket.position.x + 16, y: bucket.position.y + 50 + idx * 28 },
          data: { ...chip.data, attached: bucketId },
        }
      })
    })
    setTimeout(() => showToast('Auto-layout complete'), 500)
  }, [setNodes, showToast])

  const resetLayout = useCallback(() => {
    setNodes([...initialBuckets, ...initialChips])
    setEdges([])
    showToast('Layout reset')
  }, [initialBuckets, initialChips, setNodes, setEdges, showToast])

  const attachedCount = nodes.filter((n) => n.type === 'chip' && (n.data as ChipNodeData).attached).length
  const chipCount = nodes.filter((n) => n.type === 'chip').length

  return (
    <div className="h-full flex flex-col bg-[var(--paper)]">
      <div className="px-6 pt-5 pb-3" style={{ borderBottom: '1.5px solid var(--line)' }}>
        <div className="wf-label">Canvas · {report?.title}</div>
        <h1 className="wf-heading" style={{ fontSize: 26, marginTop: 4 }}>Spatial board.</h1>
        <p className="wf-sm mt-1">
          Drag chips into section buckets to attach them. Use <b>✦ Auto-layout</b> to let AI cluster everything by suggestion, then fine-tune.
        </p>
      </div>

      {/* Toolbar */}
      <div
        className="flex items-center gap-2 px-5 py-2 bg-[var(--paper-2)]"
        style={{ borderBottom: '1px solid var(--line-2)' }}
      >
        <button type="button" className="wf-btn sm primary" onClick={runAutoLayout}>
          ✦ Auto-layout
        </button>
        <button type="button" className="wf-btn sm ghost" onClick={resetLayout}>
          ↺ Reset
        </button>
        <span className="ml-auto wf-ticker">
          {attachedCount} / {chipCount} attached
        </span>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative" style={{ minHeight: 500 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Background variant={BackgroundVariant.Dots} gap={28} size={1.5} color="#cfcabc" />
          <Controls position="bottom-left" />
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor={(n) => {
              if (n.type === 'bucket') return (n.data as BucketNodeData).count > 0 ? '#CE7B56' : '#efece4'
              return (n.data as ChipNodeData).attached ? '#CE7B56' : '#9a9a9a'
            }}
            maskColor="rgba(247, 245, 240, 0.7)"
            style={{ background: 'var(--card-surface)', border: '1px solid var(--line-2)' }}
          />
        </ReactFlow>

        {toast && (
          <div
            className="absolute"
            style={{
              left: '50%',
              bottom: 24,
              transform: 'translateX(-50%)',
              background: 'var(--ink)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: 3,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.04em',
              boxShadow: '3px 3px 0 rgba(17,17,17,0.2)',
              zIndex: 20,
            }}
          >
            {toast}
          </div>
        )}

        {chipCount === 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 5 }}
          >
            <div className="wf-box text-center" style={{ padding: 30, background: 'var(--card-surface)' }}>
              <div className="wf-heading" style={{ fontSize: 18, marginBottom: 6 }}>No evidence yet.</div>
              <div className="wf-sm">Upload files via AI intake to see chips on the canvas.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function isChipNode(n: Node<ChipNodeData | BucketNodeData>): n is Node<ChipNodeData> {
  return n.type === 'chip'
}

export default function CanvasPage() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
