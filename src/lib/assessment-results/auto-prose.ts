/**
 * Auto-prose renderer for assessment_results.domain_summary[].
 *
 * Pure function: takes a single domain_summary entry plus the assessment_tools[]
 * inventory, returns one paragraph of clinician-readable prose. Deterministic
 * and stylistically boring on purpose — the prose has no incentive to pad,
 * which is the property that makes the whole "structured rubric → derived
 * paragraph" partition actually solve the redundancy problem.
 *
 * Sentence shape:
 *   [Domain] is a [verdict] per [aggregate]. <strengths sentence?> <concerns
 *   sentence?> <convergence sentence>.
 *
 * If `narrative_override` is set on the entry, it wins outright and is
 * returned as-is — that's the clinician escape hatch.
 */

import type {
  AssessmentDomainSummary,
  AssessmentEvidence,
  AssessmentTool,
} from '@/lib/structured-schemas'
import { deriveConvergence } from './convergence'

/** Tone of the domain at a glance, derived from the rubric. */
type DomainVerdict = 'relative strength' | 'mixed picture' | 'area of concern' | 'noted'

function deriveVerdict(d: AssessmentDomainSummary): DomainVerdict {
  const strengths = (d.can_do ?? []).filter(Boolean).length
  const concerns = (d.support_needed ?? []).filter(Boolean).length
  if (strengths > 0 && concerns === 0) return 'relative strength'
  if (concerns > 0 && strengths === 0) return 'area of concern'
  if (strengths > 0 && concerns > 0) return 'mixed picture'
  // Fall back to evidence if rubric is empty.
  const findings = (d.evidence ?? []).map((e) => e.finding)
  if (findings.some((f) => f === 'concern') && !findings.some((f) => f === 'strength')) return 'area of concern'
  if (findings.some((f) => f === 'strength') && !findings.some((f) => f === 'concern')) return 'relative strength'
  if (findings.includes('mixed')) return 'mixed picture'
  return 'noted'
}

function joinList(items: readonly string[]): string {
  const cleaned = items.map((s) => s.trim()).filter(Boolean)
  if (cleaned.length === 0) return ''
  if (cleaned.length === 1) return cleaned[0]
  if (cleaned.length === 2) return `${cleaned[0]} and ${cleaned[1]}`
  return `${cleaned.slice(0, -1).join('; ')}; and ${cleaned[cleaned.length - 1]}`
}

function titleForToolId(toolId: string, tools: readonly AssessmentTool[]): string {
  const hit = tools.find((t) => t.id === toolId)
  return (hit?.title || toolId).trim()
}

function aggregateLabel(evidence: readonly AssessmentEvidence[], tools: readonly AssessmentTool[]): string {
  const informative = evidence.filter((e) => e.finding !== 'na')
  if (informative.length === 0) return 'available data'
  if (informative.length === 1) return titleForToolId(informative[0].tool_id, tools)
  if (informative.length === 2) {
    return `${titleForToolId(informative[0].tool_id, tools)} and ${titleForToolId(informative[1].tool_id, tools)}`
  }
  return 'multiple sources'
}

function strengthsSentence(d: AssessmentDomainSummary): string {
  const items = (d.can_do ?? []).filter(Boolean)
  if (items.length === 0) return ''
  return `Strengths include ${joinList(items)}.`
}

function concernsSentence(d: AssessmentDomainSummary): string {
  const items = (d.support_needed ?? []).filter(Boolean)
  if (items.length === 0) return ''
  return `Areas needing support include ${joinList(items)}.`
}

function convergenceSentence(d: AssessmentDomainSummary, tools: readonly AssessmentTool[]): string {
  // Always derive on the fly — the stored convergence may be a stale cache
  // from before the latest evidence[] edit.
  const c = deriveConvergence(d.evidence)
  if (!c) return ''
  const agreeingTitles = (c.agreeing_tool_ids ?? []).map((id) => titleForToolId(id, tools))
  const conflictingTitles = (c.conflicting_tool_ids ?? []).map((id) => titleForToolId(id, tools))
  switch (c.level) {
    case 'high':
      return agreeingTitles.length > 0
        ? `All sources agree on this picture (${joinList(agreeingTitles)}).`
        : 'All available sources agree on this picture.'
    case 'moderate':
      return agreeingTitles.length > 0
        ? `Two sources agree on this picture (${joinList(agreeingTitles)}).`
        : 'Two sources agree on this picture.'
    case 'low': {
      const rationale = (c.rationale || '').trim()
      const head = conflictingTitles.length > 0
        ? `Sources disagree (${joinList(conflictingTitles)})`
        : 'Sources disagree on this picture'
      return rationale ? `${head}; ${rationale}.` : `${head}.`
    }
    case 'single_source':
      return agreeingTitles.length > 0
        ? `Based on a single source (${agreeingTitles[0]}).`
        : 'Based on a single source.'
    default:
      return ''
  }
}

function articleFor(verdict: DomainVerdict): string {
  // 'noted' takes no article ("Domain is noted per X."). Everything else
  // takes "a" or "an" based on the leading vowel of the verdict.
  if (verdict === 'noted') return ''
  return /^[aeiou]/i.test(verdict) ? 'an' : 'a'
}

function leadSentence(
  domain: string,
  verdict: DomainVerdict,
  aggregate: string,
  contexts: readonly string[],
): string {
  const article = articleFor(verdict)
  const subject = article ? `${article} ${verdict}` : verdict
  const ctx = contexts.filter(Boolean)
  const ctxTail = ctx.length > 0 ? `, observed in ${joinList(ctx)}` : ''
  return `${domain} is ${subject} per ${aggregate}${ctxTail}.`
}

/**
 * Render one paragraph for a single domain_summary entry.
 *
 *  - narrative_override wins outright when present (non-empty after trim).
 *  - When the rubric is fully empty (no can_do, no support_needed, no
 *    evidence) AND no override exists, returns '' so the caller can suppress
 *    the row entirely instead of printing a content-free skeleton.
 */
export function renderDomainProse(
  domain: AssessmentDomainSummary,
  tools: readonly AssessmentTool[],
): string {
  const override = (domain.narrative_override || '').trim()
  if (override) return override

  const hasRubric =
    (domain.can_do?.length ?? 0) > 0 ||
    (domain.support_needed?.length ?? 0) > 0 ||
    (domain.evidence?.length ?? 0) > 0
  if (!hasRubric) return ''

  const verdict = deriveVerdict(domain)
  const aggregate = aggregateLabel(domain.evidence ?? [], tools)
  const lead = leadSentence(domain.domain, verdict, aggregate, domain.contexts ?? [])

  const parts: string[] = [lead]
  const strengths = strengthsSentence(domain)
  if (strengths) parts.push(strengths)
  const concerns = concernsSentence(domain)
  if (concerns) parts.push(concerns)
  const convergence = convergenceSentence(domain, tools)
  if (convergence) parts.push(convergence)

  return parts.join(' ')
}

/**
 * Render every entry in a domain_summary[] as one paragraph each, in order.
 * Empty entries (no rubric, no override) are skipped so the output reads
 * cleanly even when the AI emitted a partial fill.
 */
export function renderAllDomainProse(
  summary: readonly AssessmentDomainSummary[],
  tools: readonly AssessmentTool[],
): Array<{ domain: string; paragraph: string; isOverride: boolean }> {
  return (summary ?? [])
    .map((d) => {
      const isOverride = !!(d.narrative_override && d.narrative_override.trim())
      const paragraph = renderDomainProse(d, tools)
      return { domain: d.domain, paragraph, isOverride }
    })
    .filter((r) => r.paragraph.length > 0)
}
