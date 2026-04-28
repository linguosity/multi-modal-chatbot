'use client'

/**
 * DomainTreePicker — hybrid tree picker for ASHA scope leaves.
 *
 * Used in 4 places in the app:
 *   1. Onboarding step 1 (sets profiles.default_domains)
 *   2. New-report substep (sets reports.target_domains, defaults from profile)
 *   3. Mid-report sidebar / inline "+ Add domain" (edits target_domains)
 *   4. Settings page (re-edit profile defaults)
 *
 * Behavior:
 *   • Two-level tree: parent categories (Speech Production, Language,
 *     Cognition, …) collapsible to show their ASHA-leaf children.
 *   • Each parent shows a checkbox with 3 states (checked, unchecked,
 *     indeterminate). Clicking the parent checkbox toggles every child.
 *   • Each leaf shows a normal checkbox. Selection state is the array of
 *     leaf names (parents are derived).
 *   • Optional row of preset pills above the tree. "Custom" = clear all
 *     selections AND collapse all parents (per locked design).
 *   • Optional search filter — matches on leaf and parent label, auto-
 *     expands matching parents.
 *
 * Value contract:
 *   • `value` is always an array of ASHA leaf names. Parent labels are
 *     never stored; the visual indeterminate state is derived from which
 *     leaves under that parent are present in `value`.
 *
 * Styling: wf-* design system (paper background, ink borders, terracotta
 * accents). No external UI deps beyond Lucide for the chevron + check icons.
 */

import * as React from 'react'
import { ChevronRight, Check, Search, X } from 'lucide-react'
import {
  ASHA_TAXONOMY,
  ASHA_LEAVES,
  ASHA_PRESETS,
  type AshaTopLevel,
} from '@/lib/asha-scope'

export interface DomainTreePickerProps {
  /** Selected ASHA leaves. */
  value: readonly string[]
  /** Called with the new selection on every change. */
  onChange: (next: string[]) => void
  /** Show the preset pills row above the tree. Onboarding=true, new-report=false. */
  showPresets?: boolean
  /** Show the search input. Default true. */
  showSearch?: boolean
  /** Initial collapsed-state for parents. Default: all expanded. The
   *  "Custom" preset collapses all parents on click regardless. */
  initiallyCollapsed?: boolean
  className?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────

interface ParentRow {
  parent: string
  topLevel: AshaTopLevel
  leaves: readonly string[]
}

function flattenParents(): ParentRow[] {
  const out: ParentRow[] = []
  for (const top of Object.keys(ASHA_TAXONOMY) as AshaTopLevel[]) {
    const branch = ASHA_TAXONOMY[top] as Record<string, readonly string[]>
    for (const parent of Object.keys(branch)) {
      out.push({ parent, topLevel: top, leaves: branch[parent] })
    }
  }
  return out
}

const ALL_PARENT_ROWS = flattenParents()

function parentState(
  parent: ParentRow,
  selected: ReadonlySet<string>,
): 'unchecked' | 'checked' | 'indeterminate' {
  let count = 0
  for (const leaf of parent.leaves) if (selected.has(leaf)) count += 1
  if (count === 0) return 'unchecked'
  if (count === parent.leaves.length) return 'checked'
  return 'indeterminate'
}

function parentMatchesSearch(parent: ParentRow, q: string): boolean {
  if (!q) return true
  const needle = q.toLowerCase()
  if (parent.parent.toLowerCase().includes(needle)) return true
  return parent.leaves.some((l) => l.toLowerCase().includes(needle))
}

function leafMatchesSearch(leaf: string, q: string): boolean {
  if (!q) return true
  return leaf.toLowerCase().includes(q.toLowerCase())
}

// ─── Visual primitives ──────────────────────────────────────────────────

interface TriCheckboxProps {
  state: 'unchecked' | 'checked' | 'indeterminate'
  onClick: (e: React.MouseEvent) => void
  size?: number
  ariaLabel?: string
}

function TriCheckbox({ state, onClick, size = 16, ariaLabel }: TriCheckboxProps) {
  const checked = state === 'checked'
  const indeterminate = state === 'indeterminate'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      onClick={onClick}
      className="flex-shrink-0 inline-flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: 3,
        border: `1.5px solid ${checked || indeterminate ? 'var(--terracotta)' : 'var(--line)'}`,
        background: checked || indeterminate ? 'var(--terracotta)' : 'var(--card-surface)',
        color: '#fff',
        cursor: 'pointer',
        transition: 'background 80ms, border-color 80ms',
      }}
    >
      {checked && <Check size={size - 4} strokeWidth={3} />}
      {indeterminate && (
        <span
          aria-hidden
          style={{
            display: 'block',
            width: Math.max(6, size - 8),
            height: 2,
            background: '#fff',
            borderRadius: 1,
          }}
        />
      )}
    </button>
  )
}

// ─── Main component ──────────────────────────────────────────────────────

export function DomainTreePicker({
  value,
  onChange,
  showPresets = false,
  showSearch = true,
  initiallyCollapsed = false,
  className,
}: DomainTreePickerProps) {
  const selected = React.useMemo(() => new Set(value), [value])
  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => {
    if (!initiallyCollapsed) return new Set()
    return new Set(ALL_PARENT_ROWS.map((p) => p.parent))
  })
  const [query, setQuery] = React.useState('')

  const setLeaves = (next: ReadonlySet<string>) => {
    // Preserve ASHA_LEAVES order — keeps the persisted JSON predictable.
    onChange(ASHA_LEAVES.filter((l) => next.has(l)))
  }

  const toggleLeaf = (leaf: string) => {
    const next = new Set(selected)
    if (next.has(leaf)) next.delete(leaf)
    else next.add(leaf)
    setLeaves(next)
  }

  const toggleParent = (parent: ParentRow) => {
    const state = parentState(parent, selected)
    const next = new Set(selected)
    if (state === 'checked') {
      for (const l of parent.leaves) next.delete(l)
    } else {
      for (const l of parent.leaves) next.add(l)
    }
    setLeaves(next)
  }

  const toggleCollapse = (parent: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(parent)) next.delete(parent)
      else next.add(parent)
      return next
    })
  }

  const applyPreset = (presetId: string) => {
    const preset = ASHA_PRESETS[presetId]
    if (!preset) return
    if (presetId === 'custom') {
      // Per locked design: Custom = empty selection AND all folders collapsed.
      setLeaves(new Set())
      setCollapsed(new Set(ALL_PARENT_ROWS.map((p) => p.parent)))
      return
    }
    setLeaves(new Set(preset.leaves))
    // Auto-expand any parent containing a selected leaf, so the user sees
    // the preset's effect rather than guessing under collapsed sections.
    const expandTargets = new Set<string>()
    for (const parent of ALL_PARENT_ROWS) {
      if (parent.leaves.some((l) => preset.leaves.includes(l))) {
        expandTargets.add(parent.parent)
      }
    }
    setCollapsed((prev) => {
      const next = new Set(prev)
      for (const p of expandTargets) next.delete(p)
      return next
    })
  }

  const trimmedQuery = query.trim()

  // When searching, force-expand matching parents so the user can see hits.
  const effectiveCollapsed = React.useMemo(() => {
    if (!trimmedQuery) return collapsed
    const next = new Set(collapsed)
    for (const parent of ALL_PARENT_ROWS) {
      if (parentMatchesSearch(parent, trimmedQuery)) next.delete(parent.parent)
    }
    return next
  }, [collapsed, trimmedQuery])

  const visibleParents = trimmedQuery
    ? ALL_PARENT_ROWS.filter((p) => parentMatchesSearch(p, trimmedQuery))
    : ALL_PARENT_ROWS

  const totalSelected = selected.size
  const totalLeaves = ASHA_LEAVES.length

  // Detect which preset (if any) currently matches the selection so we can
  // highlight the active pill. Empty selection → custom.
  const activePresetId = React.useMemo(() => {
    if (totalSelected === 0) return 'custom'
    for (const id of Object.keys(ASHA_PRESETS)) {
      if (id === 'custom') continue
      const preset = ASHA_PRESETS[id]
      if (preset.leaves.length !== totalSelected) continue
      if (preset.leaves.every((l) => selected.has(l))) return id
    }
    return undefined
  }, [selected, totalSelected])

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: 'var(--card-surface)',
        border: '1.25px solid var(--line)',
        borderRadius: 6,
        padding: 14,
      }}
    >
      {/* Top row: search + selection summary + clear-all */}
      {(showSearch || totalSelected > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {showSearch && (
            <div
              style={{
                position: 'relative',
                flex: 1,
                minWidth: 0,
              }}
            >
              <Search
                size={13}
                style={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ink-4)',
                }}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search domains…"
                className="w-full font-mono"
                style={{
                  fontSize: 12,
                  padding: '6px 8px 6px 28px',
                  border: '1.25px solid var(--line-2)',
                  borderRadius: 4,
                  background: 'var(--paper)',
                  outline: 'none',
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="bg-transparent cursor-pointer"
                  style={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    color: 'var(--ink-4)',
                    padding: 2,
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              color: 'var(--ink-3)',
              whiteSpace: 'nowrap',
            }}
          >
            {totalSelected} of {totalLeaves} selected
          </span>
          {totalSelected > 0 && (
            <button
              type="button"
              onClick={() => setLeaves(new Set())}
              className="font-mono cursor-pointer"
              style={{
                fontSize: 11,
                padding: '3px 8px',
                border: '1px solid var(--line)',
                borderRadius: 3,
                background: 'transparent',
                color: 'var(--ink-3)',
              }}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Preset pills row */}
      {showPresets && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {Object.entries(ASHA_PRESETS).map(([id, preset]) => {
            const isActive = id === activePresetId
            return (
              <button
                key={id}
                type="button"
                onClick={() => applyPreset(id)}
                title={preset.description}
                className="font-mono cursor-pointer"
                style={{
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 99,
                  border: `1.25px solid ${isActive ? 'var(--terracotta-ink)' : 'var(--line)'}`,
                  background: isActive ? '#fbe7da' : 'var(--paper)',
                  color: isActive ? 'var(--terracotta-ink)' : 'var(--ink-2)',
                }}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Tree */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxHeight: 420,
          overflowY: 'auto',
        }}
      >
        {visibleParents.map((parent) => {
          const state = parentState(parent, selected)
          const isCollapsed = effectiveCollapsed.has(parent.parent)
          const selectedCount = parent.leaves.filter((l) => selected.has(l)).length
          return (
            <div key={parent.parent}>
              {/* Parent row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '5px 4px',
                  borderRadius: 3,
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleCollapse(parent.parent)}
                  aria-label={isCollapsed ? `Expand ${parent.parent}` : `Collapse ${parent.parent}`}
                  className="flex-shrink-0 bg-transparent cursor-pointer"
                  style={{
                    border: 'none',
                    padding: 2,
                    display: 'inline-flex',
                  }}
                >
                  <ChevronRight
                    size={13}
                    style={{
                      color: 'var(--ink-4)',
                      transform: isCollapsed ? 'none' : 'rotate(90deg)',
                      transition: 'transform 100ms',
                    }}
                  />
                </button>
                <TriCheckbox
                  state={state}
                  onClick={() => toggleParent(parent)}
                  ariaLabel={`${parent.parent} (${selectedCount} of ${parent.leaves.length} selected)`}
                />
                <button
                  type="button"
                  onClick={() => toggleCollapse(parent.parent)}
                  className="font-mono bg-transparent cursor-pointer text-left"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    padding: 0,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: 'var(--ink)',
                  }}
                >
                  {parent.parent}
                </button>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10.5,
                    color: 'var(--ink-4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {selectedCount}/{parent.leaves.length}
                </span>
              </div>

              {/* Leaf rows */}
              {!isCollapsed && (
                <div style={{ paddingLeft: 32, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {parent.leaves
                    .filter((l) => leafMatchesSearch(l, trimmedQuery))
                    .map((leaf) => {
                      const checked = selected.has(leaf)
                      return (
                        <label
                          key={leaf}
                          className="cursor-pointer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '3px 4px',
                            borderRadius: 3,
                          }}
                          onMouseEnter={(e) => {
                            ;(e.currentTarget as HTMLElement).style.background = 'var(--paper-2)'
                          }}
                          onMouseLeave={(e) => {
                            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                          }}
                        >
                          <TriCheckbox
                            state={checked ? 'checked' : 'unchecked'}
                            size={14}
                            onClick={(e) => {
                              e.preventDefault()
                              toggleLeaf(leaf)
                            }}
                            ariaLabel={leaf}
                          />
                          <span
                            className="font-mono"
                            style={{
                              fontSize: 12,
                              color: 'var(--ink)',
                            }}
                          >
                            {leaf}
                          </span>
                        </label>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })}
        {visibleParents.length === 0 && (
          <div
            className="font-mono"
            style={{
              padding: 16,
              textAlign: 'center',
              color: 'var(--ink-4)',
              fontSize: 12,
            }}
          >
            No domains match &ldquo;{trimmedQuery}&rdquo;.
          </div>
        )}
      </div>
    </div>
  )
}

export default DomainTreePicker
