'use client'

/**
 * Outline ⇄ Prose Section Editor — v1 editor.
 *
 * Model: one section = { topic, tree-of-points }. A "point" is a
 * paragraph (not a sentence). Outline and prose are two renderings of
 * the same tree — outline shows indent + numbering, prose renders each
 * point as its own <p>, both commit text back by stable id on blur.
 * No segmentation, no fuzzy matching — the tree is canonical and the
 * toggle is a lens.
 *
 * Interactions:
 *   • Inline editing via contentEditable, blur / 400ms idle commit.
 *   • Enter: split the current paragraph at the cursor into two
 *     siblings (left stays with original id + children, right is a
 *     fresh-id empty-children sibling). At end-of-line the split is
 *     degenerate — right is empty — which reduces to "new sibling
 *     below". At start-of-line, left is empty, original text moves
 *     into the right.
 *   • Tab / Shift+Tab: nest / promote (outline only — prose view has
 *     no visual depth).
 *   • Backspace on empty: delete, focus previous row.
 *   • Paste: stripped to plain text. Multi-paragraph paste → first
 *     piece inserts at cursor, remainder becomes new sibling points.
 *   • Drag-drop (outline only): pointer-event, depth-from-cursor-X.
 *   • ⌘⇧O / Ctrl+⇧O: toggle mode from anywhere in the editor.
 *   • IME composition guarded on every commit path.
 *
 * Not implemented:
 *   • Drag-drop in prose view (paragraphs have no handle gutter).
 *   • Keyboard drag alternative (Space pick up, arrows, Space drop).
 *   • Per-keystroke undo — blur-commit bypasses browser undo.
 */

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type {
  SectionEditorMode,
  SectionNode,
  SectionNodeId,
  SectionTree,
} from './types'
import {
  findById,
  insertAfter,
  normalizeDepths,
  removePoint,
  toFlat,
  toTree,
} from './tree-ops'

/** Spec §3 — readability cap at depth 2 (three visible levels). */
const MAX_DEPTH = 2

/**
 * Outline row grid geometry. These drive BOTH depth-from-cursor-X in
 * drag detection AND the visual drop indicator — keeping them together
 * prevents detection and the rendered line from drifting apart.
 *
 * Row grid: `[handle 16px | gap 6 | bullet 28px | gap 6 | text 1fr]`.
 * So depth-0 content starts 56px in from the row's left edge.
 * Each additional depth adds 26px (spec §5.1 indent).
 */
const CONTENT_START_OFFSET = 16 + 6 + 28 + 6
const DEPTH_INDENT = 26

export interface SectionEditorProps {
  /** Initial tree state. Re-syncs into local state when the user is not
   *  actively editing (e.g. autosave round-trips). */
  value: SectionTree

  /** Fires on every committed edit (blur, idle-debounce, structural op). */
  onChange?: (next: SectionTree) => void

  /** Controlled mode. Defaults to 'outline' when omitted. */
  mode?: SectionEditorMode
  onModeChange?: (next: SectionEditorMode) => void

  /** For a11y and analytics. */
  label?: string

  /** Disable structural edits but allow text edits. Default false. */
  readOnlyStructure?: boolean
  /** Fully disable editing. Default false. */
  readOnly?: boolean

  /** Override the id factory (tests, cross-instance coordination). */
  idFactory?: () => SectionNodeId
}

function defaultIdFactory(): SectionNodeId {
  return `tmp_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

export default function SectionEditor(props: SectionEditorProps) {
  const {
    value,
    onChange,
    mode: controlledMode,
    onModeChange,
    label,
    readOnly = false,
    readOnlyStructure = false,
    idFactory = defaultIdFactory,
  } = props

  const [uncontrolledMode, setUncontrolledMode] = useState<SectionEditorMode>('outline')
  const mode = controlledMode ?? uncontrolledMode
  const setMode = useCallback(
    (next: SectionEditorMode) => {
      if (!controlledMode) setUncontrolledMode(next)
      onModeChange?.(next)
    },
    [controlledMode, onModeChange],
  )

  // The parent's `value` is the canonical seed. Local `tree` can race ahead
  // during active editing; we re-sync from props only when nothing inside
  // the editor is focused — that guards against autosave round-trips
  // clobbering the cursor mid-keystroke.
  const [tree, setTree] = useState<SectionTree>(value)
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const active = typeof document !== 'undefined' ? document.activeElement : null
    if (rootRef.current && active && rootRef.current.contains(active)) return
    setTree(value)
  }, [value])

  const commit = useCallback(
    (next: SectionTree) => {
      setTree(next)
      onChange?.(next)
    },
    [onChange],
  )

  // ── Focus orchestration ───────────────────────────────────────────────
  // Focus orchestration target. Structural ops don't run focus() until
  // after React's next render — writing `{ id, position }` here hands off
  // to each EditableLine's useEffect for imperative focus + caret place.
  interface FocusTarget {
    id: SectionNodeId
    position: 'start' | 'end'
  }
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null)
  const clearFocusTarget = useCallback(() => setFocusTarget(null), [])

  // Walk helper: replace a node's text in-place in the tree by id.
  const walkReplaceText = useCallback(
    (ns: SectionNode[], id: SectionNodeId, text: string): SectionNode[] =>
      ns.map((n) =>
        n.id === id
          ? { ...n, text }
          : { ...n, children: walkReplaceText(n.children, id, text) },
      ),
    [],
  )

  // ── Structural handlers ───────────────────────────────────────────────
  /**
   * Enter-split. Left half stays with `targetId` and keeps its children.
   * Right half becomes a fresh-id sibling with no children. Degenerates
   * correctly at end-of-line (rightText === '' → empty sibling) and
   * start-of-line (leftText === '' → original text moves into the new
   * row). Focus lands at the start of the new sibling.
   */
  const splitAtCursor = useCallback(
    (targetId: SectionNodeId, leftText: string, rightText: string) => {
      if (readOnly || readOnlyStructure) return
      const newNode: SectionNode = { id: idFactory(), text: rightText, children: [] }
      if (tree.topic.id === targetId) {
        commit({
          ...tree,
          topic: { ...tree.topic, text: leftText },
          points: [newNode, ...tree.points],
        })
        setFocusTarget({ id: newNode.id, position: 'start' })
        return
      }
      const withLeftUpdated = walkReplaceText(tree.points, targetId, leftText)
      commit({
        ...tree,
        points: insertAfter(withLeftUpdated, targetId, newNode),
      })
      setFocusTarget({ id: newNode.id, position: 'start' })
    },
    [tree, commit, idFactory, readOnly, readOnlyStructure, walkReplaceText],
  )

  /**
   * Multi-paragraph paste. First paragraph inserts at the cursor via the
   * normal paste path; the remainder become new sibling points below
   * `targetId`, and focus lands at the end of the last inserted.
   */
  const insertParagraphsAfter = useCallback(
    (targetId: SectionNodeId, paragraphs: string[]) => {
      if (readOnly || readOnlyStructure) return
      if (paragraphs.length === 0) return
      const newNodes: SectionNode[] = paragraphs.map((text) => ({
        id: idFactory(),
        text,
        children: [],
      }))
      let nextPoints = tree.points
      if (tree.topic.id === targetId) {
        // Paste on topic → new points take the head of the list, in
        // order.
        nextPoints = [...newNodes, ...tree.points]
      } else {
        // insertAfter only inserts one at a time; splice via flat for
        // the multi-paragraph case so order is preserved.
        let cursorId = targetId
        for (const nn of newNodes) {
          nextPoints = insertAfter(nextPoints, cursorId, nn)
          cursorId = nn.id
        }
      }
      commit({ ...tree, points: nextPoints })
      const last = newNodes[newNodes.length - 1]
      setFocusTarget({ id: last.id, position: 'end' })
    },
    [tree, commit, idFactory, readOnly, readOnlyStructure],
  )

  const deletePoint = useCallback(
    (id: SectionNodeId) => {
      if (readOnly || readOnlyStructure) return
      if (tree.topic.id === id) return // Never delete the topic.
      // Find which row precedes `id` — that's where focus lands.
      const flatOrdered: SectionNodeId[] = [tree.topic.id]
      const walk = (ns: SectionNode[]) => {
        for (const n of ns) {
          flatOrdered.push(n.id)
          walk(n.children)
        }
      }
      walk(tree.points)
      const idx = flatOrdered.indexOf(id)
      const prevId = idx > 0 ? flatOrdered[idx - 1] : tree.topic.id
      commit({ ...tree, points: removePoint(tree.points, id) })
      setFocusTarget({ id: prevId, position: 'end' })
    },
    [tree, commit, readOnly, readOnlyStructure],
  )

  const adjustDepth = useCallback(
    (id: SectionNodeId, delta: number) => {
      if (readOnly || readOnlyStructure) return
      if (tree.topic.id === id) return // Topic has no depth.
      const flat = toFlat(tree.points)
      const idx = flat.findIndex((n) => n.id === id)
      if (idx === -1) return

      const startDepth = flat[idx].depth
      // Collect the subtree: all consecutive rows after `idx` whose depth
      // is greater than `startDepth`.
      let endIdx = idx
      for (let i = idx + 1; i < flat.length; i++) {
        if (flat[i].depth <= startDepth) break
        endIdx = i
      }

      if (delta > 0) {
        // Tab: only if there's a row above (so a prev sibling / ancestor
        // exists to nest under) AND we're not at the depth cap.
        if (idx === 0) return
        if (startDepth + delta > MAX_DEPTH) return
      }
      if (delta < 0) {
        if (startDepth + delta < 0) return
      }

      for (let i = idx; i <= endIdx; i++) {
        flat[i].depth += delta
      }
      normalizeDepths(flat)
      commit({ ...tree, points: toTree(flat) })
      setFocusTarget({ id, position: 'end' })
    },
    [tree, commit, readOnly, readOnlyStructure],
  )

  const moveSubtree = useCallback(
    (sourceId: SectionNodeId, slotIndex: number, targetDepth: number) => {
      if (readOnly || readOnlyStructure) return
      if (tree.topic.id === sourceId) return
      const flat = toFlat(tree.points)
      const srcIdx = flat.findIndex((n) => n.id === sourceId)
      if (srcIdx === -1) return

      const sourceDepth = flat[srcIdx].depth
      let srcEnd = srcIdx
      for (let i = srcIdx + 1; i < flat.length; i++) {
        if (flat[i].depth <= sourceDepth) break
        srcEnd = i
      }
      const subtreeLen = srcEnd - srcIdx + 1
      // Extract the moving range.
      const moving = flat.slice(srcIdx, srcEnd + 1).map((n) => ({ ...n }))
      // Remove from the original position.
      const remaining = [...flat.slice(0, srcIdx), ...flat.slice(srcEnd + 1)]

      // `slotIndex` was computed against the original flat list. Adjust
      // it for the removal: if the slot was at or after `srcIdx`, shift
      // it back by the subtree length.
      let insertAt = slotIndex
      if (slotIndex > srcIdx) {
        insertAt = Math.max(slotIndex - subtreeLen, 0)
      }
      insertAt = Math.min(Math.max(insertAt, 0), remaining.length)

      // Shift depths proportionally so the subtree keeps its internal
      // structure at the new top-level depth.
      const depthDelta = targetDepth - sourceDepth
      for (const m of moving) m.depth = Math.max(0, m.depth + depthDelta)

      const next = [...remaining.slice(0, insertAt), ...moving, ...remaining.slice(insertAt)]
      normalizeDepths(next)
      commit({ ...tree, points: toTree(next) })
      setFocusTarget({ id: sourceId, position: 'end' })
    },
    [tree, commit, readOnly, readOnlyStructure],
  )

  const updateText = useCallback(
    (id: SectionNodeId, text: string) => {
      if (readOnly) return
      if (tree.topic.id === id) {
        if (tree.topic.text === text) return
        commit({ ...tree, topic: { ...tree.topic, text } })
        return
      }
      const node = findById(tree.points, id)
      if (!node || node.text === text) return
      // Walk and replace by id.
      const walk = (ns: SectionNode[]): SectionNode[] =>
        ns.map((n) => (n.id === id ? { ...n, text } : { ...n, children: walk(n.children) }))
      commit({ ...tree, points: walk(tree.points) })
    },
    [tree, commit, readOnly],
  )

  const tablistId = useId()
  const outlineTabId = `${tablistId}-outline`
  const proseTabId = `${tablistId}-prose`
  const panelId = `${tablistId}-panel`
  const prefersReduced = !!useReducedMotion()
  const fadeDuration = prefersReduced ? 0.001 : 0.16

  // ⌘⇧O / Ctrl+⇧O — toggle mode from anywhere inside the editor. Scoped
  // to rootRef so we don't steal the shortcut when focus is elsewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!rootRef.current?.contains(document.activeElement)) return
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        setMode(mode === 'outline' ? 'prose' : 'outline')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, setMode])

  return (
    <div
      ref={rootRef}
      className="se-editor"
      style={{
        backgroundColor: 'var(--se-paper)',
        backgroundImage: 'radial-gradient(rgba(138,127,110,0.32) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        padding: '32px',
        borderRadius: 12,
        fontFamily: 'var(--font-se-sans, var(--font-sans))',
        color: 'var(--se-ink)',
      }}
    >
      <ModeToggle
        mode={mode}
        onChange={setMode}
        disabled={readOnly}
        tablistId={tablistId}
        outlineTabId={outlineTabId}
        proseTabId={proseTabId}
        panelId={panelId}
        reducedMotion={prefersReduced}
        label={label}
      />

      <motion.div
        role="tabpanel"
        id={panelId}
        aria-labelledby={mode === 'outline' ? outlineTabId : proseTabId}
        key={mode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: fadeDuration, ease: 'easeOut' }}
        style={{
          marginTop: 20,
          backgroundColor: 'var(--se-card)',
          border: '1px solid var(--se-border)',
          borderRadius: 10,
          padding: mode === 'outline' ? '34px 36px' : '26px 36px',
          boxShadow:
            '0 22px 44px -22px rgba(42,36,27,0.28), 0 2px 4px rgba(42,36,27,0.04)',
          transition: prefersReduced ? undefined : 'padding 280ms ease',
        }}
      >
        {mode === 'outline' ? (
          <OutlineEditor
            tree={tree}
            readOnly={readOnly}
            focusTarget={focusTarget}
            onFocused={clearFocusTarget}
            onUpdateText={updateText}
            onEnter={splitAtCursor}
            onBackspaceEmpty={deletePoint}
            onAdjustDepth={adjustDepth}
            onMoveSubtree={moveSubtree}
            onPasteParagraphs={insertParagraphsAfter}
          />
        ) : (
          <ProseEditor
            tree={tree}
            readOnly={readOnly}
            focusTarget={focusTarget}
            onFocused={clearFocusTarget}
            onUpdateText={updateText}
            onEnter={splitAtCursor}
            onBackspaceEmpty={deletePoint}
            onPasteParagraphs={insertParagraphsAfter}
          />
        )}
      </motion.div>
    </div>
  )
}

// ─── Mode toggle ────────────────────────────────────────────────────────

interface ModeToggleProps {
  mode: SectionEditorMode
  onChange: (next: SectionEditorMode) => void
  disabled: boolean
  tablistId: string
  outlineTabId: string
  proseTabId: string
  panelId: string
  reducedMotion: boolean
  label?: string
}

function ModeToggle(props: ModeToggleProps) {
  const { mode, onChange, disabled, outlineTabId, proseTabId, panelId, reducedMotion, label } =
    props
  const slideDuration = reducedMotion ? 0.001 : 0.28
  return (
    <div
      role="tablist"
      aria-label={label ?? 'Section editor mode'}
      style={{
        position: 'relative',
        display: 'inline-flex',
        padding: 4,
        borderRadius: 999,
        border: '1px solid var(--se-border)',
        backgroundColor: 'rgba(255,255,255,0.6)',
      }}
    >
      <motion.div
        aria-hidden
        animate={{ x: mode === 'outline' ? 0 : '100%' }}
        transition={{ duration: slideDuration, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          width: 'calc(50% - 4px)',
          height: 'calc(100% - 8px)',
          borderRadius: 999,
          backgroundColor: 'var(--se-ink)',
        }}
      />
      <ToggleTab
        id={outlineTabId}
        panelId={panelId}
        selected={mode === 'outline'}
        disabled={disabled}
        onClick={() => onChange('outline')}
        label="Outline"
        reducedMotion={reducedMotion}
      />
      <ToggleTab
        id={proseTabId}
        panelId={panelId}
        selected={mode === 'prose'}
        disabled={disabled}
        onClick={() => onChange('prose')}
        label="Prose"
        reducedMotion={reducedMotion}
      />
    </div>
  )
}

interface ToggleTabProps {
  id: string
  panelId: string
  selected: boolean
  disabled: boolean
  onClick: () => void
  label: string
  reducedMotion: boolean
}

function ToggleTab(props: ToggleTabProps) {
  const { id, panelId, selected, disabled, onClick, label, reducedMotion } = props
  return (
    <button
      id={id}
      role="tab"
      type="button"
      aria-selected={selected}
      aria-controls={panelId}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      onClick={onClick}
      style={{
        position: 'relative',
        zIndex: 1,
        minWidth: 84,
        padding: '6px 18px',
        borderRadius: 999,
        border: 'none',
        background: 'transparent',
        color: selected ? '#fff' : 'var(--se-ink)',
        fontFamily: 'var(--font-se-mono, var(--font-mono))',
        fontSize: 12,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: reducedMotion ? undefined : 'color 220ms ease',
      }}
    >
      {label}
    </button>
  )
}

// ─── Outline editor ─────────────────────────────────────────────────────

interface SharedEditorProps {
  tree: SectionTree
  readOnly: boolean
  focusTarget: { id: SectionNodeId; position: 'start' | 'end' } | null
  onFocused: () => void
  onUpdateText: (id: SectionNodeId, text: string) => void
  onEnter: (id: SectionNodeId, leftText: string, rightText: string) => void
  onBackspaceEmpty: (id: SectionNodeId) => void
  onPasteParagraphs: (id: SectionNodeId, paragraphs: string[]) => void
}

interface OutlineEditorProps extends SharedEditorProps {
  onAdjustDepth: (id: SectionNodeId, delta: number) => void
  onMoveSubtree: (sourceId: SectionNodeId, slotIndex: number, targetDepth: number) => void
}

function OutlineEditor(props: OutlineEditorProps) {
  const {
    tree,
    readOnly,
    focusTarget,
    onFocused,
    onUpdateText,
    onEnter,
    onBackspaceEmpty,
    onAdjustDepth,
    onMoveSubtree,
    onPasteParagraphs,
  } = props

  // ── Drag state ───────────────────────────────────────────────────────
  // Snapshot of all rendered rows, captured at pointerdown. Keeps the
  // drop math stable even if React re-renders during the drag (it won't,
  // because we only update overlay state, but defensive snapshots cost
  // nothing).
  interface RowLayout {
    id: SectionNodeId
    depth: number
    top: number
    bottom: number
    left: number
  }
  interface DragState {
    sourceId: SectionNodeId
    sourceDepth: number
    subtreeIds: Set<SectionNodeId>
    subtreeCount: number
    previewText: string
    rowLayouts: RowLayout[]
    /** Outline container's page-coordinate top + left. Absolute drop
     *  indicator positions are offset from these so the line always
     *  lines up with the visible content edge, independent of what row
     *  sits at index 0. */
    containerTop: number
    containerLeft: number
    pointerX: number
    pointerY: number
    slotIndex: number | null
    targetDepth: number | null
    valid: boolean
  }

  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  useEffect(() => {
    dragRef.current = drag
  }, [drag])
  const containerRef = useRef<HTMLDivElement>(null)

  /** Collect rowLayouts by scanning DOM nodes tagged with data-row-id. */
  const captureRowLayouts = useCallback((): RowLayout[] => {
    if (!containerRef.current) return []
    const rows = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>('[data-row-id]'),
    )
    return rows.map((el) => {
      const rect = el.getBoundingClientRect()
      return {
        id: el.dataset.rowId as SectionNodeId,
        depth: Number(el.dataset.rowDepth ?? 0),
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      }
    })
  }, [])

  const computeDropTarget = useCallback(
    (
      pointerX: number,
      pointerY: number,
      layouts: RowLayout[],
      subtreeIds: Set<SectionNodeId>,
      containerLeft: number,
    ): { slotIndex: number | null; targetDepth: number | null; valid: boolean } => {
      if (layouts.length === 0) {
        return { slotIndex: 0, targetDepth: 0, valid: true }
      }
      // Pick the slot index. Slot i = "insert before row i". Slot n =
      // "insert after last row".
      let slot = layouts.length
      for (let i = 0; i < layouts.length; i++) {
        const mid = (layouts[i].top + layouts[i].bottom) / 2
        if (pointerY < mid) {
          slot = i
          break
        }
      }
      // Drop must not land inside the dragged subtree.
      const rowAbove = slot > 0 ? layouts[slot - 1] : null
      const rowBelow = slot < layouts.length ? layouts[slot] : null
      const aboveInSubtree = rowAbove ? subtreeIds.has(rowAbove.id) : false
      const belowInSubtree = rowBelow ? subtreeIds.has(rowBelow.id) : false
      if (aboveInSubtree || belowInSubtree) {
        return { slotIndex: slot, targetDepth: null, valid: false }
      }
      // Depth math, anchored at the real content-start X. Same constant
      // the overlay uses to draw, so detection and rendering agree.
      const contentStartX = containerLeft + CONTENT_START_OFFSET
      const proposed = Math.floor((pointerX - contentStartX) / DEPTH_INDENT)
      const maxDepth = Math.min(MAX_DEPTH, rowAbove ? rowAbove.depth + 1 : 0)
      const minDepth = rowBelow ? rowBelow.depth : 0
      const safeMin = Math.min(minDepth, maxDepth)
      const clamped = Math.min(Math.max(proposed, safeMin), maxDepth)
      return { slotIndex: slot, targetDepth: clamped, valid: true }
    },
    [],
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const pointerX = e.clientX + window.scrollX
      const pointerY = e.clientY + window.scrollY
      const { slotIndex, targetDepth, valid } = computeDropTarget(
        pointerX,
        pointerY,
        d.rowLayouts,
        d.subtreeIds,
        d.containerLeft,
      )
      setDrag({ ...d, pointerX, pointerY, slotIndex, targetDepth, valid })
    },
    [computeDropTarget],
  )

  const endDrag = useCallback(() => {
    setDrag(null)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }, [])

  const handlePointerUp = useCallback(() => {
    const d = dragRef.current
    if (d && d.valid && d.slotIndex !== null && d.targetDepth !== null) {
      onMoveSubtree(d.sourceId, d.slotIndex, d.targetDepth)
    }
    endDrag()
  }, [onMoveSubtree, endDrag])

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dragRef.current) {
        e.preventDefault()
        endDrag()
      }
    },
    [endDrag],
  )

  // Document-level listeners only live while dragging.
  useEffect(() => {
    if (!drag) return
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', endDrag)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', endDrag)
      window.removeEventListener('keydown', handleKey)
    }
  }, [drag, handlePointerMove, handlePointerUp, endDrag, handleKey])

  const handleDragStart = useCallback(
    (id: SectionNodeId, text: string, e: React.PointerEvent) => {
      if (readOnly) return
      e.preventDefault()
      const layouts = captureRowLayouts()
      const srcIdx = layouts.findIndex((l) => l.id === id)
      if (srcIdx === -1) return
      const sourceDepth = layouts[srcIdx].depth
      const subtreeIds = new Set<SectionNodeId>()
      subtreeIds.add(id)
      let subtreeCount = 0
      for (let i = srcIdx + 1; i < layouts.length; i++) {
        if (layouts[i].depth <= sourceDepth) break
        subtreeIds.add(layouts[i].id)
        subtreeCount++
      }
      // Snapshot the container's page position so the overlay can
      // offset-from-container instead of offset-from-row-0 (which was
      // wrong for depth-1 first rows and for empty-list drops).
      const cRect = containerRef.current?.getBoundingClientRect()
      const containerTop = (cRect?.top ?? 0) + window.scrollY
      const containerLeft = (cRect?.left ?? 0) + window.scrollX
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'grabbing'
      setDrag({
        sourceId: id,
        sourceDepth,
        subtreeIds,
        subtreeCount,
        previewText: text.slice(0, 60) || 'Point',
        rowLayouts: layouts,
        containerTop,
        containerLeft,
        pointerX: e.clientX + window.scrollX,
        pointerY: e.clientY + window.scrollY,
        slotIndex: null,
        targetDepth: null,
        valid: false,
      })
    },
    [readOnly, captureRowLayouts],
  )

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <EditableLine
        nodeId={tree.topic.id}
        initialText={tree.topic.text}
        placeholder="Topic sentence…"
        ariaLabel="Topic sentence"
        readOnly={readOnly}
        shouldFocus={focusTarget?.id === tree.topic.id}
        focusPosition={focusTarget?.position}
        onFocused={onFocused}
        onCommitText={onUpdateText}
        onEnter={onEnter}
        // Topic doesn't delete on backspace — empty-topic is a valid state.
        // Topic also doesn't nest — Tab is a no-op.
        onBackspaceEmpty={() => {}}
        onIndent={() => {}}
        onPasteParagraphs={onPasteParagraphs}
        style={{
          fontSize: 15.5,
          fontWeight: 500,
          lineHeight: 1.55,
          letterSpacing: '-0.003em',
          marginBottom: 20,
          padding: '4px 6px',
          borderRadius: 4,
        }}
      />
      <OutlineList
        nodes={tree.points}
        depth={0}
        readOnly={readOnly}
        focusTarget={focusTarget}
        onFocused={onFocused}
        onUpdateText={onUpdateText}
        onEnter={onEnter}
        onBackspaceEmpty={onBackspaceEmpty}
        onIndent={onAdjustDepth}
        onPasteParagraphs={onPasteParagraphs}
        onDragStart={handleDragStart}
        draggingId={drag?.sourceId ?? null}
        subtreeIds={drag?.subtreeIds ?? null}
      />

      {drag && <DragOverlay drag={drag} />}
    </div>
  )
}

interface OutlineListProps {
  nodes: SectionNode[]
  depth: number
  readOnly: boolean
  focusTarget: { id: SectionNodeId; position: 'start' | 'end' } | null
  onFocused: () => void
  onUpdateText: (id: SectionNodeId, text: string) => void
  onEnter: (id: SectionNodeId, leftText: string, rightText: string) => void
  onBackspaceEmpty: (id: SectionNodeId) => void
  onIndent: (id: SectionNodeId, delta: number) => void
  onPasteParagraphs: (id: SectionNodeId, paragraphs: string[]) => void
  onDragStart: (id: SectionNodeId, text: string, e: React.PointerEvent) => void
  draggingId: SectionNodeId | null
  subtreeIds: Set<SectionNodeId> | null
}

function OutlineList(props: OutlineListProps) {
  const {
    nodes,
    depth,
    readOnly,
    focusTarget,
    onFocused,
    onUpdateText,
    onEnter,
    onBackspaceEmpty,
    onIndent,
    onPasteParagraphs,
    onDragStart,
    draggingId,
    subtreeIds,
  } = props
  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        marginLeft: depth === 0 ? 0 : 26,
      }}
    >
      {nodes.map((n, i) => {
        const isBeingDragged = !!subtreeIds && subtreeIds.has(n.id)
        return (
          <li
            key={n.id}
            data-row-id={n.id}
            data-row-depth={depth}
            className="se-row"
            style={{
              display: 'grid',
              gridTemplateColumns: '16px 28px 1fr',
              columnGap: 6,
              padding: '2px 0',
              alignItems: 'start',
              opacity: isBeingDragged && draggingId === n.id ? 0.35 : 1,
            }}
          >
            <DragHandle
              readOnly={readOnly}
              onPointerDown={(e) => onDragStart(n.id, n.text, e)}
            />
            <span
              aria-hidden
              style={{
                fontFamily: 'var(--font-se-mono, var(--font-mono))',
                fontSize: 12,
                color: 'var(--se-muted)',
                paddingTop: 9,
              }}
            >
              {bulletFor(depth, i)}
            </span>
            <div>
              <EditableLine
                nodeId={n.id}
                initialText={n.text}
                placeholder="Add a point…"
                ariaLabel={`Point ${i + 1}`}
                readOnly={readOnly}
                shouldFocus={focusTarget?.id === n.id}
                focusPosition={focusTarget?.position}
                onFocused={onFocused}
                onCommitText={onUpdateText}
                onEnter={onEnter}
                onBackspaceEmpty={onBackspaceEmpty}
                onIndent={onIndent}
                onPasteParagraphs={onPasteParagraphs}
                style={{
                  fontSize: 15,
                  lineHeight: 1.7,
                  padding: '4px 6px',
                  borderRadius: 4,
                }}
              />
              {n.children.length > 0 && (
                <OutlineList
                  nodes={n.children}
                  depth={depth + 1}
                  readOnly={readOnly}
                  focusTarget={focusTarget}
                  onFocused={onFocused}
                  onUpdateText={onUpdateText}
                  onEnter={onEnter}
                  onBackspaceEmpty={onBackspaceEmpty}
                  onIndent={onIndent}
                  onPasteParagraphs={onPasteParagraphs}
                  onDragStart={onDragStart}
                  draggingId={draggingId}
                  subtreeIds={subtreeIds}
                />
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function DragHandle(props: { readOnly: boolean; onPointerDown: (e: React.PointerEvent) => void }) {
  if (props.readOnly) return <span aria-hidden />
  return (
    <button
      type="button"
      aria-label="Drag to reorder"
      onPointerDown={props.onPointerDown}
      className="se-drag-handle"
      style={{
        padding: '8px 2px 2px',
        cursor: 'grab',
        background: 'transparent',
        border: 'none',
        color: 'var(--se-muted)',
        lineHeight: 1,
        fontSize: 14,
        borderRadius: 4,
        touchAction: 'none',
      }}
    >
      ⋮⋮
    </button>
  )
}

// ─── Drag overlay ───────────────────────────────────────────────────────

function DragOverlay({
  drag,
}: {
  drag: {
    pointerX: number
    pointerY: number
    previewText: string
    subtreeCount: number
    rowLayouts: { id: SectionNodeId; depth: number; top: number; bottom: number; left: number }[]
    containerTop: number
    containerLeft: number
    slotIndex: number | null
    targetDepth: number | null
    valid: boolean
  }
}) {
  const {
    pointerX,
    pointerY,
    previewText,
    subtreeCount,
    rowLayouts,
    containerTop,
    containerLeft,
    slotIndex,
    targetDepth,
    valid,
  } = drag

  let indicatorTop: number | null = null
  let indicatorLeft: number | null = null
  if (valid && slotIndex !== null && targetDepth !== null) {
    const above = slotIndex > 0 ? rowLayouts[slotIndex - 1] : null
    const below = slotIndex < rowLayouts.length ? rowLayouts[slotIndex] : null
    // Place the line at the boundary between above and below. If only
    // one exists (empty list / dropping at end), anchor to that one.
    indicatorTop =
      above && below
        ? (above.bottom + below.top) / 2
        : above
          ? above.bottom
          : below
            ? below.top
            : containerTop
    indicatorLeft = containerLeft + CONTENT_START_OFFSET + targetDepth * DEPTH_INDENT
  }

  return (
    <>
      {indicatorTop !== null && indicatorLeft !== null && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: indicatorTop - containerTop - 1 + 'px',
            left: Math.max(0, indicatorLeft - containerLeft) + 'px',
            right: 0,
            height: 2,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: -5,
              top: -4,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: 'var(--se-accent)',
              boxShadow: '0 0 0 2px rgba(255,255,255,0.9)',
            }}
          />
          <div
            style={{
              height: 2,
              background: 'var(--se-accent)',
              borderRadius: 2,
              opacity: 0.9,
            }}
          />
        </div>
      )}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: pointerY - window.scrollY + 14,
          left: pointerX - window.scrollX + 14,
          padding: '6px 10px',
          borderRadius: 6,
          backgroundColor: 'var(--se-ink)',
          color: '#fff',
          fontSize: 12,
          letterSpacing: 0,
          whiteSpace: 'nowrap',
          maxWidth: 320,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          pointerEvents: 'none',
          zIndex: 50,
          boxShadow: '0 10px 30px rgba(42,36,27,0.25)',
          opacity: valid ? 1 : 0.55,
        }}
      >
        {previewText.length > 60 ? previewText.slice(0, 57) + '…' : previewText}
        {subtreeCount > 0 && (
          <span style={{ marginLeft: 8, opacity: 0.75 }}>+{subtreeCount} nested</span>
        )}
      </div>
    </>
  )
}

function bulletFor(depth: number, index: number): string {
  if (depth === 0) return String(index + 1).padStart(2, '0')
  if (depth === 1) return '·'
  return '○'
}

/**
 * Return the caret offset (in characters) within `root`, flattening
 * across text nodes. Used to split a point on Enter — we can't just
 * read `range.startOffset` because it's local to whatever text node
 * contains the caret.
 */
function getCursorOffset(root: HTMLElement): number {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return 0
  const range = sel.getRangeAt(0)
  const pre = range.cloneRange()
  pre.selectNodeContents(root)
  pre.setEnd(range.startContainer, range.startOffset)
  return pre.toString().length
}

// ─── Editable line primitive ────────────────────────────────────────────

interface EditableLineProps {
  nodeId: SectionNodeId
  initialText: string
  placeholder?: string
  ariaLabel?: string
  readOnly: boolean
  shouldFocus: boolean
  /** Where to place the caret when `shouldFocus` flips true. Defaults to end. */
  focusPosition?: 'start' | 'end'
  onFocused: () => void
  onCommitText: (id: SectionNodeId, text: string) => void
  onEnter: (id: SectionNodeId, leftText: string, rightText: string) => void
  onBackspaceEmpty: (id: SectionNodeId) => void
  onIndent: (id: SectionNodeId, delta: number) => void
  onPasteParagraphs: (id: SectionNodeId, paragraphs: string[]) => void
  style?: React.CSSProperties
}

function EditableLine(props: EditableLineProps) {
  const {
    nodeId,
    initialText,
    placeholder,
    ariaLabel,
    readOnly,
    shouldFocus,
    focusPosition = 'end',
    onFocused,
    onCommitText,
    onEnter,
    onBackspaceEmpty,
    onIndent,
    onPasteParagraphs,
    style,
  } = props

  const ref = useRef<HTMLDivElement>(null)
  const composingRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCommittedRef = useRef(initialText)

  // Seed text imperatively so React never fights contentEditable. React
  // re-renders can't overwrite textContent during active editing because
  // we guard on document.activeElement.
  useEffect(() => {
    if (!ref.current) return
    if (ref.current.textContent !== initialText) {
      ref.current.textContent = initialText
    }
    lastCommittedRef.current = initialText
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // External-value sync: only when this row isn't the focused element.
  useEffect(() => {
    if (!ref.current) return
    if (document.activeElement === ref.current) return
    if (ref.current.textContent !== initialText) {
      ref.current.textContent = initialText
    }
    lastCommittedRef.current = initialText
  }, [initialText])

  // Imperative focus after structural ops. Respects focusPosition so
  // Enter-split can land the caret at the start of the new sibling
  // while Backspace-delete lands it at the end of the previous row.
  useEffect(() => {
    if (!shouldFocus || !ref.current) return
    const el = ref.current
    el.focus()
    const sel = window.getSelection()
    if (sel) {
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(focusPosition === 'start')
      sel.removeAllRanges()
      sel.addRange(range)
    }
    onFocused()
  }, [shouldFocus, focusPosition, onFocused])

  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()

  const commitIfChanged = useCallback(() => {
    if (!ref.current) return
    const txt = normalize(ref.current.textContent ?? '')
    if (txt === lastCommittedRef.current) return
    lastCommittedRef.current = txt
    onCommitText(nodeId, txt)
  }, [nodeId, onCommitText])

  const scheduleDebounced = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (composingRef.current) return
      commitIfChanged()
    }, 400)
  }, [commitIfChanged])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div
      ref={ref}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      role="textbox"
      aria-label={ariaLabel}
      aria-multiline="false"
      spellCheck={false}
      data-placeholder={placeholder}
      className="se-editable-line"
      onFocus={(e) => {
        // Lazy-pad visual focus on the element.
        e.currentTarget.style.backgroundColor = 'var(--se-focus)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
          debounceRef.current = null
        }
        commitIfChanged()
      }}
      onMouseEnter={(e) => {
        if (document.activeElement === e.currentTarget) return
        e.currentTarget.style.backgroundColor = 'var(--se-hover)'
      }}
      onMouseLeave={(e) => {
        if (document.activeElement === e.currentTarget) return
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
      onInput={() => {
        if (composingRef.current) return
        scheduleDebounced()
      }}
      onCompositionStart={() => {
        composingRef.current = true
      }}
      onCompositionEnd={() => {
        composingRef.current = false
        scheduleDebounced()
      }}
      onPaste={(e) => {
        e.preventDefault()
        const raw = e.clipboardData.getData('text/plain')
        // Multi-paragraph paste → first paragraph inserts at cursor,
        // remainder become new sibling points.
        const paragraphs = raw.split(/\r?\n{2,}|\r?\n/).map((p) => p.trim()).filter(Boolean)
        if (paragraphs.length === 0) return
        document.execCommand('insertText', false, paragraphs[0])
        if (paragraphs.length > 1) {
          commitIfChanged()
          onPasteParagraphs(nodeId, paragraphs.slice(1))
        }
      }}
      onKeyDown={(e) => {
        if (composingRef.current) return
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          const el = ref.current
          if (!el) return
          const fullText = el.textContent ?? ''
          const cursorOffset = getCursorOffset(el)
          const leftText = fullText.slice(0, cursorOffset)
          const rightText = fullText.slice(cursorOffset)
          // Update our own lastCommittedRef so the imminent re-render
          // (which re-seeds text from `initialText`) doesn't also fire
          // a commitIfChanged and double-write leftText.
          lastCommittedRef.current = normalize(leftText)
          onEnter(nodeId, leftText, rightText)
          return
        }
        if (e.key === 'Tab') {
          e.preventDefault()
          commitIfChanged()
          onIndent(nodeId, e.shiftKey ? -1 : 1)
          return
        }
        if (e.key === 'Backspace') {
          const txt = ref.current?.textContent ?? ''
          if (txt === '') {
            e.preventDefault()
            onBackspaceEmpty(nodeId)
          }
        }
      }}
      style={{
        outline: 'none',
        cursor: readOnly ? 'default' : 'text',
        transition: 'background-color 140ms ease',
        minHeight: '1.4em',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        ...style,
      }}
    />
  )
}

// ─── Prose editor ───────────────────────────────────────────────────────

/**
 * Prose view. Same tree, same ids — rendered as topic + each point as
 * its own <p>, flat (depth-first order, no indent, no bullet, no
 * handle). Every paragraph is the same EditableLine primitive used by
 * outline mode, so Enter-split / Backspace-merge / paragraph paste all
 * follow the same code path. Switching modes is a pure lens swap.
 *
 * No drag-drop in prose mode: there's no handle gutter to anchor the
 * drop-indicator math against. Reordering belongs in outline view.
 */
type ProseEditorProps = SharedEditorProps

function ProseEditor(props: ProseEditorProps) {
  const {
    tree,
    readOnly,
    focusTarget,
    onFocused,
    onUpdateText,
    onEnter,
    onBackspaceEmpty,
    onPasteParagraphs,
  } = props

  // Flatten depth-first so nested structure still renders (just without
  // visual indent). Editing any row commits via its stable id, keeping
  // the tree's nesting intact through round-trips.
  const flat = useMemo(() => toFlat(tree.points), [tree.points])

  return (
    <div>
      <EditableLine
        nodeId={tree.topic.id}
        initialText={tree.topic.text}
        placeholder="Topic paragraph…"
        ariaLabel="Topic paragraph"
        readOnly={readOnly}
        shouldFocus={focusTarget?.id === tree.topic.id}
        focusPosition={focusTarget?.position}
        onFocused={onFocused}
        onCommitText={onUpdateText}
        onEnter={onEnter}
        onBackspaceEmpty={() => {}}
        onIndent={() => {}}
        onPasteParagraphs={onPasteParagraphs}
        style={{
          fontSize: 15.5,
          fontWeight: 500,
          lineHeight: 1.78,
          letterSpacing: '-0.003em',
          padding: '6px 8px',
          borderRadius: 4,
          marginBottom: 12,
        }}
      />
      {flat.map((p, i) => (
        <div key={p.id} style={{ marginBottom: 8 }}>
          <EditableLine
            nodeId={p.id}
            initialText={p.text}
            placeholder="Paragraph…"
            ariaLabel={`Paragraph ${i + 1}`}
            readOnly={readOnly}
            shouldFocus={focusTarget?.id === p.id}
            focusPosition={focusTarget?.position}
            onFocused={onFocused}
            onCommitText={onUpdateText}
            onEnter={onEnter}
            onBackspaceEmpty={onBackspaceEmpty}
            // Tab isn't useful in prose — no visual depth to express,
            // and silent reordering would confuse the user.
            onIndent={() => {}}
            onPasteParagraphs={onPasteParagraphs}
            style={{
              fontSize: 15.5,
              lineHeight: 1.78,
              padding: '6px 8px',
              borderRadius: 4,
            }}
          />
        </div>
      ))}
    </div>
  )
}
