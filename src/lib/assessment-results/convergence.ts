/**
 * Derived convergence + cross-source domain merge.
 *
 * Single source of truth for two related computations:
 *   1. `deriveConvergence(evidence[])` — given the per-source findings,
 *      what's the convergence level? Pure function, server-safe, no React.
 *   2. `mergeDomainEntries(existing, incoming)` — when a new intake adds a
 *      domain row that matches an existing canonical domain, merge them so
 *      we end up with ONE row per domain whose `evidence[]` carries every
 *      source. Recomputes convergence after merge.
 *
 * The schema still stores `convergence` so the AI can carry it through and
 * a clinician could override, but renderers and the route always recompute
 * — the stored value is a cache, not the source of truth.
 */

import type {
  AssessmentConvergence,
  AssessmentDomainSummary,
  AssessmentEvidence,
  AssessmentFinding,
} from '@/lib/structured-schemas'

// ─── Domain alias map ───────────────────────────────────────────────────

/**
 * Canonical domain names. The AI sometimes emits long-form names
 * ("Speech Intelligibility/Articulation", "Social/Pragmatic Communication")
 * and sometimes short ("Articulation", "Pragmatics"). Snap to canonical so
 * cross-tool merging actually finds the existing row.
 */
const DOMAIN_ALIASES: Record<string, string> = {
  'articulation': 'Articulation',
  'articulation/phonology': 'Articulation',
  'phonology': 'Articulation',
  'speech': 'Articulation',
  'speech intelligibility': 'Articulation',
  'speech intelligibility/articulation': 'Articulation',
  'speech sound production': 'Articulation',
  'intelligibility': 'Articulation',
  'receptive': 'Receptive Language',
  'receptive language': 'Receptive Language',
  'expressive': 'Expressive Language',
  'expressive language': 'Expressive Language',
  'pragmatics': 'Pragmatics',
  'pragmatic': 'Pragmatics',
  'pragmatic language': 'Pragmatics',
  'social': 'Pragmatics',
  'social communication': 'Pragmatics',
  'social/pragmatic': 'Pragmatics',
  'social/pragmatic communication': 'Pragmatics',
  'social-pragmatic': 'Pragmatics',
  'voice': 'Voice',
  'fluency': 'Fluency',
  'stuttering': 'Fluency',
}

export function canonicalDomain(name: string | undefined | null): string {
  if (!name) return ''
  const trimmed = name.trim()
  if (!trimmed) return ''
  const key = trimmed.toLowerCase().replace(/\s+/g, ' ')
  return DOMAIN_ALIASES[key] ?? trimmed
}

// ─── Convergence derivation ──────────────────────────────────────────────

const isConcernLike = (f: AssessmentFinding): boolean => f === 'concern' || f === 'mixed'
const isNoConcernLike = (f: AssessmentFinding): boolean => f === 'wnl' || f === 'strength'

/**
 * Compute the convergence object from a list of evidence entries.
 *
 *   - 0 informative entries → single_source with empty agreeing list
 *   - 1 informative entry  → single_source
 *   - all entries on the same side of the concern/no-concern split → high (≥3)
 *     or moderate (2)
 *   - mixed sides → low; majority agrees, minority conflicts; rationale
 *     auto-generated
 *
 * "Informative" excludes findings of `na` ("not assessed by this source").
 */
export function deriveConvergence(
  evidence: readonly AssessmentEvidence[] | undefined,
): AssessmentConvergence {
  const informative = (evidence ?? []).filter(
    (e) => e && typeof e.tool_id === 'string' && e.finding && e.finding !== 'na',
  )

  if (informative.length === 0) {
    return { level: 'single_source', agreeing_tool_ids: [] }
  }
  if (informative.length === 1) {
    return { level: 'single_source', agreeing_tool_ids: [informative[0].tool_id] }
  }

  const concernIds = informative.filter((e) => isConcernLike(e.finding)).map((e) => e.tool_id)
  const noConcernIds = informative.filter((e) => isNoConcernLike(e.finding)).map((e) => e.tool_id)

  // Genuine disagreement — flagged as low with a rationale.
  if (concernIds.length > 0 && noConcernIds.length > 0) {
    const [agreeing, conflicting] =
      concernIds.length >= noConcernIds.length
        ? [concernIds, noConcernIds]
        : [noConcernIds, concernIds]
    return {
      level: 'low',
      agreeing_tool_ids: agreeing,
      conflicting_tool_ids: conflicting,
      rationale: `${agreeing.length} of ${informative.length} sources agree; ${conflicting.length} differ.`,
    }
  }

  // All on one side (all concern-like or all no-concern-like).
  const ids = informative.map((e) => e.tool_id)
  return {
    level: informative.length >= 3 ? 'high' : 'moderate',
    agreeing_tool_ids: ids,
  }
}

/**
 * Return a copy of the domain entry with `convergence` recomputed from
 * evidence[]. The renderer calls this on every read so the visible
 * convergence is always in sync with the visible evidence — the stored
 * value is just a cache.
 */
export function withDerivedConvergence(
  domain: AssessmentDomainSummary,
): AssessmentDomainSummary {
  return { ...domain, convergence: deriveConvergence(domain.evidence) }
}

// ─── Domain merge (cross-source integration) ─────────────────────────────

function dedupeStrings(...lists: Array<readonly string[] | undefined>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const list of lists) {
    for (const v of list ?? []) {
      if (typeof v !== 'string') continue
      const trimmed = v.trim()
      if (!trimmed) continue
      const key = trimmed.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(trimmed)
    }
  }
  return out
}

/**
 * Dedupe evidence entries on tool_id. Newer entries win — the order matters,
 * pass `incoming` first when you want a fresh intake to overwrite a stale
 * finding for the same tool.
 */
function dedupeEvidence(
  ...lists: Array<readonly AssessmentEvidence[] | undefined>
): AssessmentEvidence[] {
  const seen = new Set<string>()
  const out: AssessmentEvidence[] = []
  for (const list of lists) {
    for (const e of list ?? []) {
      if (!e || typeof e.tool_id !== 'string') continue
      if (seen.has(e.tool_id)) continue
      seen.add(e.tool_id)
      out.push(e)
    }
  }
  return out
}

/**
 * Merge an incoming domain entry into an existing one. Preserves the
 * clinician-authored `narrative_override` and any `_auto_archived_*` flags
 * on the existing row. Recomputes convergence from the merged evidence[].
 */
export function mergeDomainEntries(
  existing: AssessmentDomainSummary,
  incoming: AssessmentDomainSummary,
): AssessmentDomainSummary {
  const existingOverride = (existing.narrative_override ?? '').trim()
  const incomingOverride = (incoming.narrative_override ?? '').trim()
  const merged: AssessmentDomainSummary = {
    domain: existing.domain || incoming.domain,
    can_do: dedupeStrings(existing.can_do, incoming.can_do),
    support_needed: dedupeStrings(existing.support_needed, incoming.support_needed),
    contexts: dedupeStrings(existing.contexts, incoming.contexts),
    evidence: dedupeEvidence(incoming.evidence, existing.evidence),
    convergence: { level: 'single_source', agreeing_tool_ids: [] }, // recomputed below
  }
  // Preserve clinician override; only adopt incoming's if existing has none.
  if (existingOverride) {
    merged.narrative_override = existing.narrative_override
  } else if (incomingOverride) {
    merged.narrative_override = incoming.narrative_override
  }
  // Preserve archive flags from existing entry — incoming intakes can't
  // change the archival history of a row.
  for (const flagKey of ['_auto_archived', '_auto_archived_at', '_auto_archived_from'] as const) {
    const v = (existing as unknown as Record<string, unknown>)[flagKey]
    if (v !== undefined) (merged as unknown as Record<string, unknown>)[flagKey] = v
  }
  merged.convergence = deriveConvergence(merged.evidence)
  return merged
}

// ─── Domain-list integration (the post-apply step) ───────────────────────

/**
 * Take a (possibly malformed) domain_summary[] and produce a clean array:
 *
 *   1. Spread any nested arrays back to peer level (defensive against the
 *      AI emitting `[{...}]` and the apply-merge tucking it in as one
 *      element). Drops non-object entries.
 *   2. Group entries by canonical domain name. Multiple entries for the
 *      same canonical domain merge via mergeDomainEntries; the *first*
 *      occurrence's domain label is kept (so an existing "Speech
 *      Intelligibility/Articulation" row keeps that label rather than being
 *      silently relabeled to "Articulation").
 *   3. Recompute convergence on every output entry.
 *
 * Idempotent: passing the output through this function again returns it
 * unchanged.
 */
export function reconcileDomainSummary(
  raw: unknown,
): AssessmentDomainSummary[] {
  if (!Array.isArray(raw)) return []

  // Step 1: flatten nested arrays.
  const flat: AssessmentDomainSummary[] = []
  for (const entry of raw) {
    if (Array.isArray(entry)) {
      for (const inner of entry) {
        if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
          flat.push(inner as AssessmentDomainSummary)
        }
      }
    } else if (entry && typeof entry === 'object') {
      flat.push(entry as AssessmentDomainSummary)
    }
  }

  // Step 2: group by canonical domain. Keep first occurrence's label.
  const byCanon = new Map<string, AssessmentDomainSummary>()
  const order: string[] = []
  for (const entry of flat) {
    const canon = canonicalDomain(entry.domain) || `__unnamed_${order.length}`
    const existing = byCanon.get(canon)
    if (existing) {
      byCanon.set(canon, mergeDomainEntries(existing, entry))
    } else {
      byCanon.set(canon, entry)
      order.push(canon)
    }
  }

  // Step 3: recompute convergence and return in original order.
  return order.map((c) => withDerivedConvergence(byCanon.get(c)!))
}
