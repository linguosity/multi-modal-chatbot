'use client'

/**
 * Outline ⇄ Prose Section Editor — v1 editing (spec §15 steps 4–6).
 *
 * Implements inline editing via contentEditable, blur / 400ms idle commit,
 * Enter-to-new-sibling, Backspace-on-empty-to-delete, plain-text paste,
 * and IME composition guard. Prose mode commits via commitProse on blur.
 *
 * Not implemented this round (spec §15 7–14):
 *   • Tab / Shift-Tab depth (skipped per user scope — current prose
 *     sections have no nested structure, so no regression).
 *   • Mid-point Enter split.
 *   • Drag-and-drop.
 *   • Keyboard drag alternative, fine keyboard nav between rows.
 *   • Per-keystroke undo.
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
import { commitProse, toProse } from './segment'
import { findById, insertAfter, removePoint } from './tree-ops'

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
  // Structural ops (Enter, Backspace-delete) need to place focus on a row
  // that doesn't exist until after the next render. Writing a node id
  // here hands off to the EditableLine useEffect for imperative focus.
  const [focusTarget, setFocusTarget] = useState<SectionNodeId | null>(null)
  const clearFocusTarget = useCallback(() => setFocusTarget(null), [])

  // ── Structural handlers ───────────────────────────────────────────────
  const insertAfterNode = useCallback(
    (targetId: SectionNodeId) => {
      if (readOnly || readOnlyStructure) return
      const newNode: SectionNode = { id: idFactory(), text: '', children: [] }
      // Topic has no siblings — Enter on topic creates the first point.
      if (tree.topic.id === targetId) {
        commit({ ...tree, points: [newNode, ...tree.points] })
        setFocusTarget(newNode.id)
        return
      }
      const next: SectionTree = {
        ...tree,
        points: insertAfter(tree.points, targetId, newNode),
      }
      commit(next)
      setFocusTarget(newNode.id)
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
      setFocusTarget(prevId)
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

  const commitProseText = useCallback(
    (newParagraph: string) => {
      if (readOnly) return
      const { next } = commitProse(tree, newParagraph, idFactory)
      // Only commit if something actually changed — avoid false-positive
      // autosaves on blur-without-edit.
      if (
        next.topic.text === tree.topic.text &&
        next.points.length === tree.points.length &&
        next.points.every((p, i) => p.text === tree.points[i]?.text)
      ) {
        return
      }
      commit(next)
    },
    [tree, commit, idFactory, readOnly],
  )

  const tablistId = useId()
  const outlineTabId = `${tablistId}-outline`
  const proseTabId = `${tablistId}-prose`
  const panelId = `${tablistId}-panel`
  const prefersReduced = !!useReducedMotion()
  const fadeDuration = prefersReduced ? 0.001 : 0.16

  const prose = useMemo(() => toProse(tree), [tree])

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
            onEnter={insertAfterNode}
            onBackspaceEmpty={deletePoint}
          />
        ) : (
          <ProseEditor
            tree={tree}
            text={prose}
            readOnly={readOnly}
            onCommitProse={commitProseText}
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

interface OutlineEditorProps {
  tree: SectionTree
  readOnly: boolean
  focusTarget: SectionNodeId | null
  onFocused: () => void
  onUpdateText: (id: SectionNodeId, text: string) => void
  onEnter: (id: SectionNodeId) => void
  onBackspaceEmpty: (id: SectionNodeId) => void
}

function OutlineEditor(props: OutlineEditorProps) {
  const { tree, readOnly, focusTarget, onFocused, onUpdateText, onEnter, onBackspaceEmpty } = props
  return (
    <div>
      <EditableLine
        nodeId={tree.topic.id}
        initialText={tree.topic.text}
        placeholder="Topic sentence…"
        ariaLabel="Topic sentence"
        readOnly={readOnly}
        shouldFocus={focusTarget === tree.topic.id}
        onFocused={onFocused}
        onCommitText={onUpdateText}
        onEnter={onEnter}
        // Topic doesn't delete on backspace — empty-topic is a valid state
        // (§8 case 10).
        onBackspaceEmpty={() => {}}
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
      />
    </div>
  )
}

interface OutlineListProps {
  nodes: SectionNode[]
  depth: number
  readOnly: boolean
  focusTarget: SectionNodeId | null
  onFocused: () => void
  onUpdateText: (id: SectionNodeId, text: string) => void
  onEnter: (id: SectionNodeId) => void
  onBackspaceEmpty: (id: SectionNodeId) => void
}

function OutlineList(props: OutlineListProps) {
  const { nodes, depth, readOnly, focusTarget, onFocused, onUpdateText, onEnter, onBackspaceEmpty } =
    props
  return (
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        marginLeft: depth === 0 ? 0 : 26,
      }}
    >
      {nodes.map((n, i) => (
        <li
          key={n.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '28px 1fr',
            columnGap: 8,
            padding: '2px 0',
            alignItems: 'start',
          }}
        >
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
              shouldFocus={focusTarget === n.id}
              onFocused={onFocused}
              onCommitText={onUpdateText}
              onEnter={onEnter}
              onBackspaceEmpty={onBackspaceEmpty}
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
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function bulletFor(depth: number, index: number): string {
  if (depth === 0) return String(index + 1).padStart(2, '0')
  if (depth === 1) return '·'
  return '○'
}

// ─── Editable line primitive ────────────────────────────────────────────

interface EditableLineProps {
  nodeId: SectionNodeId
  initialText: string
  placeholder?: string
  ariaLabel?: string
  readOnly: boolean
  shouldFocus: boolean
  onFocused: () => void
  onCommitText: (id: SectionNodeId, text: string) => void
  onEnter: (id: SectionNodeId) => void
  onBackspaceEmpty: (id: SectionNodeId) => void
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
    onFocused,
    onCommitText,
    onEnter,
    onBackspaceEmpty,
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

  // Imperative focus after structural ops. Places caret at end.
  useEffect(() => {
    if (!shouldFocus || !ref.current) return
    const el = ref.current
    el.focus()
    const sel = window.getSelection()
    if (sel) {
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
      sel.removeAllRanges()
      sel.addRange(range)
    }
    onFocused()
  }, [shouldFocus, onFocused])

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
        const txt = e.clipboardData.getData('text/plain')
        // execCommand is deprecated but still the pragmatic way to insert
        // into contentEditable without fighting selection APIs. Matches
        // the spec §6.1 rationale.
        document.execCommand('insertText', false, txt)
      }}
      onKeyDown={(e) => {
        if (composingRef.current) return
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          commitIfChanged()
          onEnter(nodeId)
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

interface ProseEditorProps {
  tree: SectionTree
  text: string
  readOnly: boolean
  onCommitProse: (paragraph: string) => void
}

function ProseEditor(props: ProseEditorProps) {
  const { tree, text, readOnly, onCommitProse } = props
  const ref = useRef<HTMLDivElement>(null)
  const composingRef = useRef(false)
  const lastCommittedRef = useRef(text)

  // Seed on mount.
  useEffect(() => {
    if (!ref.current) return
    if (ref.current.textContent !== text) {
      ref.current.textContent = text
    }
    lastCommittedRef.current = text
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-sync when the tree changes externally (mode swap, autosave
  // round-trip) — but never while this element is focused.
  useEffect(() => {
    if (!ref.current) return
    if (document.activeElement === ref.current) return
    if (ref.current.textContent !== text) {
      ref.current.textContent = text
    }
    lastCommittedRef.current = text
  }, [text, tree])

  return (
    <div
      ref={ref}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      role="textbox"
      aria-label="Prose paragraph"
      aria-multiline="true"
      spellCheck={false}
      data-placeholder="Write the section as a paragraph…"
      onFocus={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--se-focus)'
      }}
      onBlur={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
        if (composingRef.current) return
        const txt = ref.current?.textContent ?? ''
        if (txt === lastCommittedRef.current) return
        lastCommittedRef.current = txt
        onCommitProse(txt)
      }}
      onMouseEnter={(e) => {
        if (document.activeElement === e.currentTarget) return
        e.currentTarget.style.backgroundColor = 'var(--se-hover)'
      }}
      onMouseLeave={(e) => {
        if (document.activeElement === e.currentTarget) return
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
      onCompositionStart={() => {
        composingRef.current = true
      }}
      onCompositionEnd={() => {
        composingRef.current = false
      }}
      onPaste={(e) => {
        e.preventDefault()
        const txt = e.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, txt)
      }}
      style={{
        outline: 'none',
        cursor: readOnly ? 'default' : 'text',
        transition: 'background-color 140ms ease',
        margin: 0,
        fontSize: 15.5,
        lineHeight: 1.78,
        padding: '4px 6px',
        borderRadius: 4,
        minHeight: '4em',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    />
  )
}
