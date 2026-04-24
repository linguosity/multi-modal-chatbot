'use client'

/**
 * Specialized block renderers — score-card and criterion. Both render
 * differently in outline (structured form) vs prose (generated sentence),
 * both update their tree fields via a single `onFieldChange` callback.
 *
 * The card bodies are small inline forms with `<input>`/`<textarea>`
 * elements — NOT contentEditable. That means their DOM doesn't fight
 * React renders and field commits are immediate (onChange). Paragraph
 * blocks still use the contentEditable EditableLine path in the parent.
 */

import React, { useCallback } from 'react'
import type { CriterionBlock, ScoreCardBlock, SectionNodeId } from './types'

// ─── Score card ─────────────────────────────────────────────────────────

export interface ScoreCardRowProps {
  block: ScoreCardBlock
  readOnly: boolean
  onFieldChange: (id: SectionNodeId, patch: Partial<ScoreCardBlock>) => void
}

export function ScoreCardRow({ block, readOnly, onFieldChange }: ScoreCardRowProps) {
  const onChange = useCallback(
    (patch: Partial<ScoreCardBlock>) => onFieldChange(block.id, patch),
    [block.id, onFieldChange],
  )
  return (
    <div
      className="se-card"
      style={{
        border: '1px solid var(--se-border)',
        borderRadius: 6,
        padding: '12px 14px',
        backgroundColor: 'rgba(255,255,255,0.45)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-se-mono, var(--font-mono))',
          fontSize: 10.5,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--se-muted)',
          marginBottom: 10,
        }}
      >
        Score card
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.9fr 0.9fr 1fr',
          gap: 10,
        }}
      >
        <LabeledInput
          label="Test"
          value={block.testName}
          placeholder="Goldman-Fristoe-3"
          readOnly={readOnly}
          onChange={(v) => onChange({ testName: v })}
        />
        <LabeledInput
          label="Subtest"
          value={block.subtest}
          placeholder="optional"
          readOnly={readOnly}
          onChange={(v) => onChange({ subtest: v })}
        />
        <LabeledInput
          label="Std score"
          value={block.standardScore}
          placeholder="78"
          readOnly={readOnly}
          onChange={(v) => onChange({ standardScore: v })}
        />
        <LabeledInput
          label="Percentile"
          value={block.percentile}
          placeholder="7"
          readOnly={readOnly}
          onChange={(v) => onChange({ percentile: v })}
        />
      </div>
      <div style={{ marginTop: 10 }}>
        <LabeledInput
          label="Interpretation"
          value={block.interpretation}
          placeholder="Below average — more than one SD below the mean"
          readOnly={readOnly}
          onChange={(v) => onChange({ interpretation: v })}
        />
      </div>
      {(block.notes || !readOnly) && (
        <div style={{ marginTop: 10 }}>
          <LabeledTextarea
            label="Notes"
            value={block.notes}
            placeholder="Error patterns, stimulability, anything that doesn't fit the cells"
            readOnly={readOnly}
            onChange={(v) => onChange({ notes: v })}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Prose rendering of a score card — a compact factual sentence with a
 * subtle pill marker so the reader still knows this came from structured
 * data.
 */
export function ScoreCardProseRow({ block, readOnly, onFieldChange }: ScoreCardRowProps) {
  // Prose stays editable at the field level — surfacing the same form,
  // just denser. Keeps the toggle as a lens: no edit is lost either way.
  return <ScoreCardRow block={block} readOnly={readOnly} onFieldChange={onFieldChange} />
}

export function scoreCardToProseText(b: ScoreCardBlock): string {
  const name = b.testName || 'Test'
  const score = b.standardScore ? `standard score ${b.standardScore}` : ''
  const pct = b.percentile ? `${b.percentile}th percentile` : ''
  const interp = b.interpretation ? b.interpretation : ''
  const parts: string[] = []
  parts.push(`The ${name}${b.subtest ? ' (' + b.subtest + ')' : ''} yielded`)
  const figures = [score, pct].filter(Boolean).join(', ')
  if (figures) parts.push(figures + '.')
  else parts.push('no structured result.')
  if (interp) parts.push(interp + '.')
  if (b.notes) parts.push(b.notes.trim())
  return parts.join(' ')
}

// ─── Criterion ──────────────────────────────────────────────────────────

export interface CriterionRowProps {
  block: CriterionBlock
  readOnly: boolean
  onFieldChange: (id: SectionNodeId, patch: Partial<CriterionBlock>) => void
}

export function CriterionRow({ block, readOnly, onFieldChange }: CriterionRowProps) {
  const onChange = useCallback(
    (patch: Partial<CriterionBlock>) => onFieldChange(block.id, patch),
    [block.id, onFieldChange],
  )
  const cycle = useCallback(() => {
    if (readOnly) return
    // null → true → false → null cycle gives the clinician three states.
    const next: CriterionBlock['met'] =
      block.met === null ? true : block.met === true ? false : null
    onChange({ met: next })
  }, [block.met, onChange, readOnly])

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <button
        type="button"
        onClick={cycle}
        disabled={readOnly}
        aria-label={`Criterion ${metLabel(block.met)}`}
        aria-pressed={block.met === true}
        style={{
          flex: 'none',
          marginTop: 1,
          width: 18,
          height: 18,
          borderRadius: 4,
          border: '1.5px solid var(--se-border)',
          backgroundColor:
            block.met === true
              ? 'var(--se-accent)'
              : block.met === false
                ? 'rgba(42,36,27,0.12)'
                : 'transparent',
          color: '#fff',
          fontFamily: 'var(--font-se-mono, var(--font-mono))',
          fontSize: 11,
          lineHeight: 1,
          cursor: readOnly ? 'default' : 'pointer',
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {block.met === true ? '✓' : block.met === false ? '×' : ''}
      </button>
      <div style={{ flex: 1 }}>
        <LabeledInput
          label="Criterion"
          value={block.label}
          placeholder="Communication impairment is present"
          readOnly={readOnly}
          onChange={(v) => onChange({ label: v })}
          variant="plain"
        />
        {(block.justification || (!readOnly && block.met !== null)) && (
          <div style={{ marginTop: 6 }}>
            <LabeledTextarea
              label="Justification"
              value={block.justification}
              placeholder="Evidence and reasoning"
              readOnly={readOnly}
              onChange={(v) => onChange({ justification: v })}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function CriterionProseRow(props: CriterionRowProps) {
  return <CriterionRow {...props} />
}

export function criterionToProseText(b: CriterionBlock): string {
  const who = 'The student'
  const met =
    b.met === true
      ? 'meets'
      : b.met === false
        ? 'does not meet'
        : 'has not been evaluated against'
  const label = b.label || 'the criterion'
  const justification = b.justification ? ` — ${b.justification.trim()}` : ''
  return `${who} ${met} the criterion "${label}"${justification}.`
}

function metLabel(met: boolean | null): string {
  if (met === true) return 'met'
  if (met === false) return 'not met'
  return 'not yet evaluated'
}

// ─── Primitives ─────────────────────────────────────────────────────────

interface LabeledInputProps {
  label: string
  value: string
  placeholder?: string
  readOnly: boolean
  onChange: (v: string) => void
  variant?: 'default' | 'plain'
}

function LabeledInput({ label, value, placeholder, readOnly, onChange, variant = 'default' }: LabeledInputProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          fontFamily: 'var(--font-se-mono, var(--font-mono))',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--se-muted)',
        }}
      >
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        style={{
          border:
            variant === 'plain' ? 'none' : '1px solid var(--se-border)',
          borderRadius: 4,
          padding: variant === 'plain' ? '2px 0' : '6px 8px',
          fontSize: 14,
          backgroundColor: variant === 'plain' ? 'transparent' : '#fff',
          color: 'var(--se-ink)',
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />
    </label>
  )
}

interface LabeledTextareaProps {
  label: string
  value: string
  placeholder?: string
  readOnly: boolean
  onChange: (v: string) => void
}

function LabeledTextarea({ label, value, placeholder, readOnly, onChange }: LabeledTextareaProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          fontFamily: 'var(--font-se-mono, var(--font-mono))',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--se-muted)',
        }}
      >
        {label}
      </span>
      <textarea
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        rows={2}
        style={{
          border: '1px solid var(--se-border)',
          borderRadius: 4,
          padding: '6px 8px',
          fontSize: 14,
          backgroundColor: '#fff',
          color: 'var(--se-ink)',
          fontFamily: 'inherit',
          outline: 'none',
          resize: 'vertical',
          minHeight: 44,
        }}
      />
    </label>
  )
}

// ─── Insert menu ────────────────────────────────────────────────────────

import type { BlockKind } from './types'

export interface InsertMenuProps {
  onInsert: (kind: BlockKind) => void
  readOnly: boolean
}

/**
 * Compact "+" button that opens a small picker to insert a new block of
 * a chosen kind after the current row. Hides unless the containing row
 * is hovered (see `.se-row:hover .se-insert` in globals.css).
 */
export function InsertMenu({ onInsert, readOnly }: InsertMenuProps) {
  const [open, setOpen] = React.useState(false)
  if (readOnly) return null
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        aria-label="Insert new block below"
        onClick={() => setOpen((o) => !o)}
        className="se-insert"
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: '1px dashed var(--se-border)',
          backgroundColor: 'transparent',
          color: 'var(--se-muted)',
          cursor: 'pointer',
          padding: 0,
          fontSize: 12,
          lineHeight: 1,
        }}
      >
        +
      </button>
      {open && (
        <>
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 20 }}
          />
          <div
            role="menu"
            style={{
              position: 'absolute',
              left: 22,
              top: 0,
              zIndex: 21,
              backgroundColor: '#fff',
              border: '1px solid var(--se-border)',
              borderRadius: 6,
              boxShadow: '0 10px 30px rgba(42,36,27,0.18)',
              minWidth: 180,
              padding: 4,
            }}
          >
            <InsertItem onClick={() => { onInsert('paragraph'); setOpen(false) }} label="Paragraph" hint="Free text" />
            <InsertItem onClick={() => { onInsert('score-card'); setOpen(false) }} label="Score card" hint="Standardized test result" />
            <InsertItem onClick={() => { onInsert('criterion'); setOpen(false) }} label="Criterion" hint="Checklist item with justification" />
          </div>
        </>
      )}
    </span>
  )
}

function InsertItem({ onClick, label, hint }: { onClick: () => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '6px 10px',
        border: 'none',
        background: 'transparent',
        borderRadius: 4,
        cursor: 'pointer',
        color: 'var(--se-ink)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--se-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--se-muted)' }}>{hint}</div>
    </button>
  )
}
