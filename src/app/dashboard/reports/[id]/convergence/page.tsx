'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useReport } from '@/lib/context/ReportContext'
import { Sheet, SheetContent } from '@/components/ui/sheet'

// ─── Types + taxonomy ────────────────────────────────────────────────────────

type EvidenceType =
  | 'dynamic_assessment' | 'language_sample' | 'parent_report' | 'teacher_report'
  | 'standardized_test' | 'screening' | 'observation' | 'developmental_history'

type Modality = 'expressive' | 'receptive' | 'mixed' | 'pragmatic' | 'speech'
type LangContext = 'L1' | 'L2' | 'both' | 'unknown'
type Finding = 'supports_disorder' | 'does_not_support' | 'mixed' | 'unclear'
type Setting = 'home' | 'school' | 'clinic' | 'other'

interface Evidence {
  id: string
  type: EvidenceType
  modality: Modality
  lang: LangContext
  finding: Finding
  V: number // 0-3
  R: number // 0-3
  Rl: number // 0-3
  source: string
  note: string
  setting: Setting
  strength: number // derived
}

const TYPE_META: Record<EvidenceType, { label: string; fill: string; glyph: string }> = {
  dynamic_assessment:    { label: 'Dynamic assessment', fill: '#D97757', glyph: 'DA' },
  language_sample:       { label: 'Language sample',    fill: '#7B9E89', glyph: 'LS' },
  parent_report:         { label: 'Parent report',      fill: '#C9A96E', glyph: 'PR' },
  teacher_report:        { label: 'Teacher report',     fill: '#9B7BAE', glyph: 'TR' },
  standardized_test:     { label: 'Standardized test',  fill: '#8AA3B8', glyph: 'ST' },
  screening:             { label: 'Screening',          fill: '#B5B091', glyph: 'SC' },
  observation:           { label: 'Observation',        fill: '#A87B6A', glyph: 'OB' },
  developmental_history: { label: 'Dev. history',       fill: '#9C9282', glyph: 'DH' },
}

const LANG_BORDER: Record<LangContext, { stroke: string; dash: string; label: string; double?: boolean }> = {
  L1:      { stroke: '#1a1a1a', dash: '0',   label: 'L1 (Spanish)' },
  L2:      { stroke: '#1a1a1a', dash: '3 2', label: 'L2 (English)' },
  both:    { stroke: '#1a1a1a', dash: '0',   label: 'Both languages', double: true },
  unknown: { stroke: '#1a1a1a', dash: '1 2', label: 'Unknown' },
}

const FINDING_DIR: Record<Finding, number> = {
  supports_disorder: 1, does_not_support: -1, mixed: 0, unclear: 0,
}

// ─── Mock data (replace with Supabase fetch when evidence_scores table lands) ─

const RAW_EVIDENCE: Omit<Evidence, 'strength'>[] = [
  { id: 'e1',  type: 'dynamic_assessment',    modality: 'expressive', lang: 'both',    finding: 'supports_disorder', V: 3, R: 3, Rl: 2, source: 'Learnability task — novel word task', note: 'Limited gains across modeling + cueing across both languages.', setting: 'clinic' },
  { id: 'e2',  type: 'language_sample',       modality: 'mixed',      lang: 'L1',      finding: 'mixed',             V: 3, R: 3, Rl: 2, source: 'Spanish narrative sample', note: 'Age-appropriate length; some morphosyntactic errors.', setting: 'clinic' },
  { id: 'e3',  type: 'language_sample',       modality: 'expressive', lang: 'L2',      finding: 'supports_disorder', V: 2, R: 3, Rl: 3, source: 'English narrative sample', note: 'Reduced MLU, limited cohesion ties — but L2 exposure ~2 yrs.', setting: 'school' },
  { id: 'e4',  type: 'standardized_test',     modality: 'mixed',      lang: 'L2',      finding: 'supports_disorder', V: 2, R: 1, Rl: 2, source: 'CELF-5 (English admin)', note: 'Composite 78 — flagged for cultural/linguistic bias.', setting: 'clinic' },
  { id: 'e5',  type: 'standardized_test',     modality: 'receptive',  lang: 'L2',      finding: 'supports_disorder', V: 2, R: 2, Rl: 2, source: 'WMLS-R English', note: 'Below average; norms English-monolingual.', setting: 'clinic' },
  { id: 'e6',  type: 'parent_report',         modality: 'mixed',      lang: 'L1',      finding: 'does_not_support',  V: 2, R: 3, Rl: 2, source: 'Parent intake (Spanish)', note: 'Parent reports fluent home communication; concerns school-only.', setting: 'home' },
  { id: 'e7',  type: 'teacher_report',        modality: 'expressive', lang: 'L2',      finding: 'supports_disorder', V: 2, R: 3, Rl: 2, source: 'Classroom teacher email', note: 'Hesitant participation; difficulty following multi-step directions.', setting: 'school' },
  { id: 'e8',  type: 'observation',           modality: 'pragmatic',  lang: 'L2',      finding: 'supports_disorder', V: 3, R: 3, Rl: 2, source: 'Classroom obs (28 min)', note: 'Limited peer initiation; off-topic responses 4× in sample.', setting: 'school' },
  { id: 'e9',  type: 'screening',             modality: 'speech',     lang: 'L2',      finding: 'does_not_support',  V: 2, R: 1, Rl: 2, source: 'Speech screening', note: 'All targets correct — articulation not a concern.', setting: 'school' },
  { id: 'e10', type: 'developmental_history', modality: 'mixed',      lang: 'L1',      finding: 'mixed',             V: 2, R: 2, Rl: 1, source: 'Developmental history form', note: 'Late first words (~22mo); otherwise WNL.', setting: 'home' },
  { id: 'e11', type: 'observation',           modality: 'pragmatic',  lang: 'both',    finding: 'mixed',             V: 3, R: 3, Rl: 1, source: 'Playground observation', note: 'Engages peers in Spanish; withdraws in English settings.', setting: 'school' },
  { id: 'e12', type: 'language_sample',       modality: 'expressive', lang: 'L1',      finding: 'does_not_support',  V: 3, R: 3, Rl: 2, source: 'Spanish play-based sample', note: 'Strong narrative structure, age-appropriate vocab in L1.', setting: 'home' },
]

/** Bilingual modifier: ST validity −1, parent_report validity +1 */
function applyBilingualMod<T extends { type: EvidenceType; V: number }>(e: T): T {
  if (e.type === 'standardized_test') return { ...e, V: Math.max(0, e.V - 1) }
  if (e.type === 'parent_report')     return { ...e, V: Math.min(3, e.V + 1) }
  return e
}

const EVIDENCE: Evidence[] = RAW_EVIDENCE
  .map(applyBilingualMod)
  .map((e) => ({ ...e, strength: (e.V + e.R + e.Rl) / 9 }))

// ─── Convergence math ────────────────────────────────────────────────────────

interface ConvergenceResult {
  idx: number
  label: string
  classification: string
  support: number
  nonsupport: number
  mixed: number
  total: number
  count: number
  flags: { kind: 'warn' | 'ok' | 'info'; text: string }[]
}

function computeConvergence(items: Evidence[], excluded: Record<string, boolean>): ConvergenceResult {
  const active = items.filter((i) => !excluded[i.id])
  let support = 0, nonsupport = 0, mixed = 0, total = 0
  active.forEach((e) => {
    total += e.strength
    if (e.finding === 'supports_disorder') support += e.strength
    else if (e.finding === 'does_not_support') nonsupport += e.strength
    else mixed += e.strength
  })
  const denom = total || 1
  const idx = Math.abs(support - nonsupport) / denom
  let label = 'Low convergence'
  if (idx >= 0.6) label = 'High convergence'
  else if (idx >= 0.3) label = 'Moderate convergence'

  let classification = 'INCONCLUSIVE / MONITOR'
  if (idx >= 0.6 && support > nonsupport) classification = 'SUPPORTS DISORDER'
  else if (idx >= 0.6 && nonsupport > support) classification = 'DOES NOT SUPPORT'
  else if (idx < 0.3) classification = 'LOW CONFIDENCE — CONFLICTING'

  const types = new Set(active.map((e) => e.type))
  const settings = new Set(active.map((e) => e.setting))
  const flags: ConvergenceResult['flags'] = []
  if (types.size === 1 && active[0]?.type === 'standardized_test')
    flags.push({ kind: 'warn', text: 'Only standardized-test data — insufficient evidence.' })
  if (active.some((e) => e.type === 'dynamic_assessment'))
    flags.push({ kind: 'info', text: 'Dynamic assessment present — prioritize in narrative summary.' })
  if (
    active.length >= 3 &&
    active.filter((e) => e.type === 'parent_report' && e.finding === 'does_not_support').length > 0 &&
    active.filter((e) => e.type !== 'parent_report' && e.finding === 'supports_disorder').length >= 3
  )
    flags.push({ kind: 'warn', text: 'Parent report contradicts other sources — context discrepancy, follow-up needed.' })
  if (types.size >= 3) flags.push({ kind: 'ok', text: `Diverse data: ${types.size} evidence types.` })
  if (settings.has('home') && settings.has('school'))
    flags.push({ kind: 'ok', text: 'Ecological coverage: home + school.' })
  if (types.size < 2) flags.push({ kind: 'warn', text: 'Low data diversity — fewer than 2 evidence types.' })

  return { idx, label, classification, support, nonsupport, mixed, total, count: active.length, flags }
}

// ─── Beeswarm layout (greedy collision packing) ──────────────────────────────

interface PlacedEvidence extends Evidence {
  x: number
  y: number
  r: number
}

function layoutBeeswarm(items: Evidence[], width: number, height: number, padX = 60): PlacedEvidence[] {
  const cy = height / 2
  const xScale = (dir: number, strength: number) => {
    const span = (width - padX * 2) / 2
    const pull = 0.35 + strength * 0.6
    return width / 2 + dir * span * pull
  }
  const radius = (s: number) => 8 + s * 18
  const sorted = [...items].sort((a, b) => b.strength - a.strength)
  const placed: PlacedEvidence[] = []
  sorted.forEach((item) => {
    const dir = FINDING_DIR[item.finding]
    const tx = xScale(dir, item.strength)
    const r = radius(item.strength)
    let bestY = cy
    let bestDist = Infinity
    for (let dy = 0; dy <= height / 2; dy += 2) {
      for (const sign of [1, -1]) {
        const y = cy + sign * dy
        if (y - r < 8 || y + r > height - 8) continue
        const collides = placed.some((p) => {
          const dx = p.x - tx
          const ddy = p.y - y
          return Math.sqrt(dx * dx + ddy * ddy) < p.r + r + 2
        })
        if (!collides) {
          const dist = Math.abs(dy)
          if (dist < bestDist) {
            bestDist = dist
            bestY = y
          }
        }
        if (bestDist === 0) break
      }
      if (bestDist === 0) break
    }
    placed.push({ ...item, x: tx, y: bestY, r })
  })
  return placed
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ConvergencePage() {
  const { report } = useReport()
  const [excluded, setExcluded] = useState<Record<string, boolean>>({})
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<EvidenceType | null>(null)
  const [viewMode, setViewMode] = useState<'beeswarm' | 'table'>('beeswarm')
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 880, h: 380 })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect
      setSize({ w: Math.max(600, r.width), h: Math.max(320, r.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const visible = useMemo(
    () => EVIDENCE.filter((e) => !filterType || e.type === filterType),
    [filterType]
  )
  const placed = useMemo(
    () => layoutBeeswarm(visible.filter((e) => !excluded[e.id]), size.w, size.h),
    [visible, excluded, size]
  )
  const conv = useMemo(() => computeConvergence(EVIDENCE, excluded), [excluded])

  const dialPct = Math.round(conv.idx * 100)
  const dialColor =
    conv.idx >= 0.6 ? 'var(--terracotta-ink)' : conv.idx >= 0.3 ? '#C9A96E' : '#9B7BAE'

  const selected = selectedId ? EVIDENCE.find((e) => e.id === selectedId) ?? null : null

  return (
    <div className="min-h-full bg-[var(--paper)] p-6">
      <div className="flex flex-col gap-1 mb-5">
        <div className="wf-label">Analytical view · {report?.title}</div>
        <h1 className="wf-heading" style={{ fontSize: 26 }}>Convergence.</h1>
        <p className="wf-sm mt-1">
          Evidence plotted across the supports ↔ does-not-support spectrum. Dot size = strength (V+R+R)/9 · color = type · border = language context. Click a dot to adjust scores or exclude from the index.
        </p>
      </div>

      <div className="wf-conv-wrap">
        {/* Header summary */}
        <div className="wf-conv-summary">
          <div className="wf-conv-dial-cell">
            <ConvergenceDial pct={dialPct} color={dialColor} />
            <div className="wf-conv-dial-meta">
              <div className="wf-label" style={{ fontSize: 10 }}>Convergence index</div>
              <div className="wf-conv-dial-num" style={{ color: dialColor }}>{conv.idx.toFixed(2)}</div>
              <div className="wf-conv-dial-label">{conv.label}</div>
            </div>
          </div>

          <div className="wf-conv-stats">
            <StatBar label="Supports disorder" value={conv.support}    total={conv.total} tone="support" />
            <StatBar label="Does not support"  value={conv.nonsupport} total={conv.total} tone="nonsupport" />
            <StatBar label="Mixed / unclear"   value={conv.mixed}      total={conv.total} tone="mixed" />
            <div className="wf-conv-meta-row">
              <span><b>{conv.count}</b> items included</span>
              <span><b>Σ strength</b> {conv.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="wf-conv-verdict-cell">
            <div className="wf-label" style={{ fontSize: 10 }}>Suggested classification</div>
            <div
              className="wf-conv-verdict"
              data-tone={
                conv.classification.includes('SUPPORTS DISORDER')
                  ? 'support'
                  : conv.classification.includes('DOES NOT')
                    ? 'nonsupport'
                    : 'neutral'
              }
            >
              {conv.classification}
            </div>
            <div className="wf-conv-verdict-sub">Review and decide — this is a prompt, not a verdict.</div>
          </div>
        </div>

        {/* Flags */}
        {conv.flags.length > 0 && (
          <div className="wf-conv-flags">
            {conv.flags.map((f, i) => (
              <div key={i} className={`wf-flag ${f.kind}`}>
                <span className="wf-flag-glyph">
                  {f.kind === 'warn' ? '!' : f.kind === 'ok' ? '✓' : 'i'}
                </span>
                {f.text}
              </div>
            ))}
          </div>
        )}

        {/* View toggle — WCAG 1.1.1 (non-text content alternative) */}
        <div className="flex items-center justify-between">
          <div
            role="tablist"
            aria-label="Convergence view"
            className="inline-flex rounded-[3px] border border-[var(--line)] overflow-hidden"
            style={{ boxShadow: '2px 2px 0 var(--line-2)' }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'beeswarm'}
              onClick={() => setViewMode('beeswarm')}
              className="wf-btn sm"
              style={{
                boxShadow: 'none',
                borderRadius: 0,
                borderTop: 'none',
                borderBottom: 'none',
                borderLeft: 'none',
                background: viewMode === 'beeswarm' ? 'var(--ink)' : 'var(--card-surface)',
                color: viewMode === 'beeswarm' ? 'var(--card-surface)' : 'var(--ink)',
              }}
            >
              ◉ Beeswarm
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'table'}
              onClick={() => setViewMode('table')}
              className="wf-btn sm"
              style={{
                boxShadow: 'none',
                borderRadius: 0,
                borderTop: 'none',
                borderBottom: 'none',
                borderRight: 'none',
                background: viewMode === 'table' ? 'var(--ink)' : 'var(--card-surface)',
                color: viewMode === 'table' ? 'var(--card-surface)' : 'var(--ink)',
              }}
            >
              ☰ Table
            </button>
          </div>
          <span className="wf-sm">
            {viewMode === 'beeswarm'
              ? 'Click a dot to open rubric details.'
              : 'Sort by column. Click a row to open rubric details.'}
          </span>
        </div>

        {/* Plot */}
        {viewMode === 'beeswarm' ? (
          <div className="wf-conv-plot-wrap" ref={wrapRef}>
            <Beeswarm
              width={size.w}
              height={size.h}
              placed={placed}
              filterType={filterType}
              hoverId={hoverId}
              selectedId={selectedId}
              onHover={setHoverId}
              onSelect={setSelectedId}
            />
          </div>
        ) : (
          <EvidenceTable
            evidence={EVIDENCE}
            filterType={filterType}
            excluded={excluded}
            onSelect={setSelectedId}
            onToggleExcluded={(id) => setExcluded((prev) => ({ ...prev, [id]: !prev[id] }))}
          />
        )}

        {/* Legend */}
        <Legend filterType={filterType} setFilterType={setFilterType} />
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-[480px] sm:max-w-[480px] bg-[var(--paper)] overflow-y-auto">
          {selected && (
            <EvidenceDetail
              item={selected}
              included={!excluded[selected.id]}
              onToggleIncluded={() =>
                setExcluded((prev) => ({ ...prev, [selected.id]: !prev[selected.id] }))
              }
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function ConvergenceDial({ pct, color }: { pct: number; color: string }) {
  const r = 38
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#e8e3d4" strokeWidth="6" />
      <circle
        cx="48" cy="48" r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={`${dash} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
      />
      <text x="48" y="54" textAnchor="middle" fontFamily="var(--font-display)" fontSize="22" fill="var(--ink)">
        {pct}
        <tspan fontSize="11" fill="var(--ink-3)">%</tspan>
      </text>
    </svg>
  )
}

function StatBar({ label, value, total, tone }: { label: string; value: number; total: number; tone: 'support' | 'nonsupport' | 'mixed' }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  const fill: Record<typeof tone, string> = {
    support: 'var(--terracotta)',
    nonsupport: '#9B7BAE',
    mixed: '#C9A96E',
  }
  return (
    <div className="wf-stat-row">
      <div className="wf-stat-label">{label}</div>
      <div className="wf-stat-bar">
        <div className="wf-stat-fill" style={{ width: `${pct}%`, background: fill[tone] }} />
      </div>
      <div className="wf-stat-val">{value.toFixed(2)}</div>
    </div>
  )
}

function Beeswarm({
  width, height, placed, filterType, hoverId, selectedId, onHover, onSelect,
}: {
  width: number
  height: number
  placed: PlacedEvidence[]
  filterType: EvidenceType | null
  hoverId: string | null
  selectedId: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string | null) => void
}) {
  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'block' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelect(null)
      }}
    >
      <rect x={0} y={0} width={width / 2} height={height} fill="#fbf6ee" />
      <rect x={width / 2} y={0} width={width / 2} height={height} fill="#fff5ee" opacity="0.6" />
      <line
        x1={width / 2} y1={20}
        x2={width / 2} y2={height - 20}
        stroke="#1a1a1a" strokeWidth="1.5" strokeDasharray="2 4"
      />
      <text x={20} y={26} fontFamily="var(--font-mono)" fontSize="11" fill="var(--ink-3)" letterSpacing="0.1em">
        DOES NOT SUPPORT
      </text>
      <text x={width - 20} y={26} textAnchor="end" fontFamily="var(--font-mono)" fontSize="11" fill="var(--ink-3)" letterSpacing="0.1em">
        SUPPORTS DISORDER
      </text>
      <text x={width / 2} y={height - 8} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-4)" letterSpacing="0.12em">
        MIXED / UNCLEAR
      </text>

      {placed.map((d) => {
        const t = TYPE_META[d.type]
        const lb = LANG_BORDER[d.lang]
        const isSel = selectedId === d.id
        const isHov = hoverId === d.id
        const dimmed = filterType !== null && filterType !== d.type
        return (
          <g
            key={d.id}
            onMouseEnter={() => onHover(d.id)}
            onMouseLeave={() => onHover(null)}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(d.id)
            }}
            style={{ cursor: 'pointer' }}
          >
            {lb.double && <circle cx={d.x} cy={d.y} r={d.r + 2.5} fill="none" stroke={lb.stroke} strokeWidth="1" />}
            <circle
              cx={d.x} cy={d.y} r={d.r}
              fill={t.fill}
              stroke={lb.stroke}
              strokeWidth={isSel ? 2.5 : isHov ? 2 : 1.25}
              strokeDasharray={lb.dash}
              opacity={dimmed ? 0.25 : 0.92}
            />
            <text
              x={d.x}
              y={d.y + 3}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={Math.max(8, d.r * 0.55)}
              fill="#fff"
              fontWeight={700}
              pointerEvents="none"
            >
              {t.glyph}
            </text>
          </g>
        )
      })}

      {hoverId && (() => {
        const d = placed.find((p) => p.id === hoverId)
        if (!d) return null
        const t = TYPE_META[d.type]
        const tipW = 240, tipH = 78
        let tx = d.x + d.r + 10
        if (tx + tipW > width - 8) tx = d.x - d.r - 10 - tipW
        let ty = d.y - tipH / 2
        if (ty < 8) ty = 8
        if (ty + tipH > height - 8) ty = height - 8 - tipH
        return (
          <g pointerEvents="none">
            <rect x={tx} y={ty} width={tipW} height={tipH} fill="var(--card-surface)" stroke="var(--line)" strokeWidth="1.25" rx="2" />
            <text x={tx + 10} y={ty + 16} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-3)" letterSpacing="0.1em">
              {t.label.toUpperCase()}
            </text>
            <text x={tx + 10} y={ty + 34} fontFamily="var(--font-display)" fontSize="13" fill="var(--ink)">
              {d.source}
            </text>
            <text x={tx + 10} y={ty + 54} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-3)">
              V {d.V} · R {d.R} · Rel {d.Rl} → strength {d.strength.toFixed(2)}
            </text>
            <text x={tx + 10} y={ty + 68} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-4)">
              {LANG_BORDER[d.lang].label} · {d.setting}
            </text>
          </g>
        )
      })()}
    </svg>
  )
}

function Legend({
  filterType, setFilterType,
}: {
  filterType: EvidenceType | null
  setFilterType: (val: EvidenceType | null) => void
}) {
  return (
    <div className="wf-conv-legend">
      <div className="wf-legend-col">
        <div className="wf-legend-title">Type · click to filter</div>
        <div className="wf-legend-grid">
          {(Object.keys(TYPE_META) as EvidenceType[]).map((k) => {
            const t = TYPE_META[k]
            return (
              <button
                key={k}
                type="button"
                onClick={() => setFilterType(filterType === k ? null : k)}
                className={`wf-legend-chip ${filterType === k ? 'on' : ''}`}
              >
                <span className="wf-legend-dot" style={{ background: t.fill }}>{t.glyph}</span>
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="wf-legend-col">
        <div className="wf-legend-title">Border = language</div>
        <div className="flex flex-col gap-1.5 mt-1">
          <LegendBorderRow dash="0" label="L1 (home language)" />
          <LegendBorderRow dash="3 2" label="L2 (school language)" />
          <LegendBorderRow dash="0" double label="Both languages" />
          <LegendBorderRow dash="1 2" label="Unknown" />
        </div>
      </div>

      <div className="wf-legend-col">
        <div className="wf-legend-title">Size = strength</div>
        <div className="flex gap-3 items-end mt-2">
          {[0.25, 0.55, 0.85].map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <svg width={36} height={36}>
                <circle cx={18} cy={18} r={8 + s * 18} fill="#c8c3b3" stroke="#1a1a1a" strokeWidth="1.25" opacity="0.85" />
              </svg>
              <span className="wf-sm" style={{ fontSize: 10 }}>{s.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EvidenceTable({
  evidence, filterType, excluded, onSelect, onToggleExcluded,
}: {
  evidence: Evidence[]
  filterType: EvidenceType | null
  excluded: Record<string, boolean>
  onSelect: (id: string) => void
  onToggleExcluded: (id: string) => void
}) {
  type SortKey = 'source' | 'type' | 'finding' | 'V' | 'R' | 'Rl' | 'strength'
  const [sortKey, setSortKey] = useState<SortKey>('strength')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const rows = useMemo(() => {
    const visible = evidence.filter((e) => !filterType || e.type === filterType)
    const sorted = [...visible].sort((a, b) => {
      const av = a[sortKey] as number | string
      const bv = b[sortKey] as number | string
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
    })
    return sorted
  }, [evidence, filterType, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(typeof evidence[0]?.[key] === 'number' ? 'desc' : 'asc')
    }
  }

  const th = (key: SortKey, label: string) => (
    <th
      scope="col"
      style={{
        textAlign: typeof evidence[0]?.[key] === 'number' ? 'right' : 'left',
        padding: '8px 10px',
        borderBottom: '1.5px solid var(--line)',
        background: 'var(--paper-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-3)',
        cursor: 'pointer',
      }}
      onClick={() => toggleSort(key)}
      aria-sort={sortKey === key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label} {sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
    </th>
  )

  return (
    <div className="wf-box" style={{ padding: 0, overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
        }}
      >
        <caption className="sr-only">
          Evidence rubric scores — sortable alternative to the beeswarm plot.
        </caption>
        <thead>
          <tr>
            {th('source', 'Source')}
            {th('type', 'Type')}
            {th('finding', 'Finding')}
            {th('V', 'V')}
            {th('R', 'R')}
            {th('Rl', 'Rel')}
            {th('strength', 'Strength')}
            <th scope="col" style={{ padding: '8px 10px', borderBottom: '1.5px solid var(--line)', background: 'var(--paper-2)' }}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isExcluded = !!excluded[row.id]
            const t = TYPE_META[row.type]
            return (
              <tr
                key={row.id}
                style={{
                  background: isExcluded ? 'var(--paper)' : 'transparent',
                  opacity: isExcluded ? 0.55 : 1,
                  borderBottom: '1px solid var(--line-2)',
                }}
              >
                <td style={{ padding: '8px 10px' }}>
                  <button
                    type="button"
                    onClick={() => onSelect(row.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      color: 'var(--ink)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      fontSize: 13,
                    }}
                  >
                    {row.source}
                  </button>
                  <div className="wf-sm" style={{ marginTop: 2 }}>
                    {LANG_BORDER[row.lang].label} · {row.setting}
                  </div>
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <span className="wf-legend-dot" style={{ background: t.fill, width: 18, height: 18, fontSize: 8 }}>
                    {t.glyph}
                  </span>{' '}
                  {t.label}
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <span className={`wf-finding-badge f-${row.finding}`}>{row.finding.replace(/_/g, ' ')}</span>
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{row.V}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{row.R}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{row.Rl}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--terracotta-ink)', fontWeight: 600 }}>
                  {row.strength.toFixed(2)}
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => onToggleExcluded(row.id)}
                    className="wf-btn sm ghost"
                    aria-label={isExcluded ? `Re-include ${row.source} in convergence index` : `Exclude ${row.source} from convergence index`}
                  >
                    {isExcluded ? 'Include' : 'Exclude'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function LegendBorderRow({ dash, double, label }: { dash: string; double?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={28} height={20}>
        {double && <circle cx={14} cy={10} r={9} fill="none" stroke="#1a1a1a" strokeWidth="1" />}
        <circle cx={14} cy={10} r={6.5} fill="#e8e3d4" stroke="#1a1a1a" strokeWidth="1.5" strokeDasharray={dash} />
      </svg>
      <span className="wf-sm" style={{ fontSize: 11 }}>{label}</span>
    </div>
  )
}

function PipScore({ label, value, max = 3, hint }: { label: string; value: number; max?: number; hint?: string }) {
  return (
    <div className="wf-score-row">
      <div className="wf-score-label">{label}</div>
      <div className="wf-score-pips">
        {Array.from({ length: max }).map((_, i) => (
          <span key={i} className={`wf-pip ${i < value ? 'on' : ''}`} />
        ))}
      </div>
      <div className="wf-score-hint">{hint}</div>
    </div>
  )
}

function EvidenceDetail({
  item, included, onToggleIncluded,
}: {
  item: Evidence
  included: boolean
  onToggleIncluded: () => void
}) {
  const t = TYPE_META[item.type]
  const lb = LANG_BORDER[item.lang]
  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex items-center gap-3">
        <span className="wf-legend-dot lg" style={{ background: t.fill }}>{t.glyph}</span>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="wf-label">{t.label} · {item.modality}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, lineHeight: 1.2 }}>{item.source}</div>
        </div>
      </div>

      <div className="wf-detail-note">&ldquo;{item.note}&rdquo;</div>

      <div className="wf-detail-meta">
        <div>
          <span className="wf-label">Finding</span>
          <b className={`wf-finding-badge f-${item.finding}`}>{item.finding.replace(/_/g, ' ')}</b>
        </div>
        <div>
          <span className="wf-label">Language context</span>
          <b>{lb.label}</b>
        </div>
        <div>
          <span className="wf-label">Setting</span>
          <b style={{ textTransform: 'capitalize' }}>{item.setting}</b>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="wf-label bold">Rubric scores</div>
        <PipScore
          label="Validity"
          value={item.V}
          hint={
            item.type === 'standardized_test' ? 'auto −1 (bilingual norm mismatch)'
              : item.type === 'parent_report' ? 'auto +1 (bilingual context)'
                : 'AI suggested'
          }
        />
        <PipScore label="Relevance" value={item.R} hint="functional impact" />
        <PipScore label="Reliability" value={item.Rl} hint="internal consistency" />
        <div className="wf-strength-row">
          <span className="wf-label">Evidence strength</span>
          <span className="wf-strength-bar">
            <span className="wf-strength-fill" style={{ width: `${item.strength * 100}%` }} />
          </span>
          <b style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{item.strength.toFixed(2)}</b>
        </div>
      </div>

      <div className="flex gap-2 pt-2 flex-wrap">
        <button type="button" className="wf-btn sm primary">Confirm scores</button>
        <button type="button" className="wf-btn sm ghost">Adjust…</button>
        <button type="button" className="wf-btn sm ghost" onClick={onToggleIncluded}>
          {included ? 'Exclude from index' : 'Include in index'}
        </button>
      </div>

      <div className="wf-detail-foot">
        Auto-scored from rubric. SLP override is preserved in the report.
      </div>
    </div>
  )
}
