'use client'

/**
 * Outline ⇄ Prose Section Editor — component shell (v1, spec §15.4).
 *
 * Intentionally does NOT implement editing yet. This lands the frame,
 * props/state wiring, and the mode toggle so follow-up PRs can add
 * outline rendering, prose rendering, keyboard handling, and drag-drop
 * against a stable surface.
 */

import React, { useCallback, useId, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { SectionEditorMode, SectionNodeId, SectionTree } from './types'
import { toProse } from './segment'

export interface SectionEditorProps {
  /** Initial tree state. The component owns edits from this point forward. */
  value: SectionTree

  /** Fires on every committed edit. Not wired in the shell. */
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

export default function SectionEditor(props: SectionEditorProps) {
  const {
    value,
    mode: controlledMode,
    onModeChange,
    label,
    readOnly = false,
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

  const tablistId = useId()
  const outlineTabId = `${tablistId}-outline`
  const proseTabId = `${tablistId}-prose`
  const panelId = `${tablistId}-panel`

  const prefersReduced = useReducedMotion()
  const fadeDuration = prefersReduced ? 0.001 : 0.16

  const prose = useMemo(() => toProse(value), [value])

  return (
    <div
      className="se-editor"
      style={{
        backgroundColor: 'var(--se-paper)',
        backgroundImage:
          'radial-gradient(rgba(138,127,110,0.32) 1px, transparent 1px)',
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
        reducedMotion={!!prefersReduced}
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
          transition: prefersReduced
            ? undefined
            : 'padding 280ms ease',
        }}
      >
        {mode === 'outline' ? (
          <OutlinePreview value={value} />
        ) : (
          <ProsePreview text={prose} />
        )}
      </motion.div>
    </div>
  )
}

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
  const {
    mode,
    onChange,
    disabled,
    outlineTabId,
    proseTabId,
    panelId,
    reducedMotion,
    label,
  } = props

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
        transition={{
          duration: slideDuration,
          ease: [0.4, 0, 0.2, 1],
        }}
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

/**
 * Outline preview. Shell-only — renders read-only topic + numbered
 * points + bullets. Editing (contentEditable, Enter/Tab/Backspace, drag)
 * lands in follow-up PRs (spec §15 steps 5–7).
 */
function OutlinePreview({ value }: { value: SectionTree }) {
  return (
    <div>
      <p
        style={{
          fontSize: 15.5,
          fontWeight: 500,
          lineHeight: 1.55,
          letterSpacing: '-0.003em',
          margin: 0,
          marginBottom: 20,
        }}
      >
        {value.topic.text || (
          <span style={{ color: 'var(--se-muted)' }}>Topic sentence…</span>
        )}
      </p>
      <OutlineList nodes={value.points} depth={0} />
    </div>
  )
}

function OutlineList({
  nodes,
  depth,
}: {
  nodes: SectionTree['points']
  depth: number
}) {
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
            padding: '4px 0',
            fontSize: 15,
            lineHeight: 1.7,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-se-mono, var(--font-mono))',
              fontSize: 12,
              color: 'var(--se-muted)',
              paddingTop: 3,
            }}
          >
            {bulletFor(depth, i)}
          </span>
          <div>
            <span>{n.text}</span>
            {n.children.length > 0 && (
              <OutlineList nodes={n.children} depth={depth + 1} />
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

function ProsePreview({ text }: { text: string }) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: 15.5,
        lineHeight: 1.78,
      }}
    >
      {text || <span style={{ color: 'var(--se-muted)' }}>No content yet.</span>}
    </p>
  )
}
