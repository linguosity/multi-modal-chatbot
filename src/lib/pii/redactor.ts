/**
 * PII redaction pipeline — wraps the regex detector with stable token
 * allocation and (optional) DB persistence.
 *
 * Contract:
 *   1. The redactor runs server-side before any text is sent to Claude.
 *   2. Tokens are stable per (entity_type, detected_value) within a report,
 *      so multiple mentions of the same student map to the same `[STUDENT_001]`.
 *   3. Mappings persist to `pii_mappings` when the table exists. If it
 *      doesn't (migration 004 not applied yet), the redactor still runs —
 *      tokens are in memory for the lifetime of the request — but logs a
 *      warning so ops can spot the regression.
 *
 * Design review §10: the LLM never sees raw PII.
 */

import { detectPII, tokenFor, defaultAction, type DetectedEntity, type PIIEntityType, type PIIAction } from './detect'

export interface RedactionResult {
  redactedText: string
  entitiesFound: Array<{
    type: PIIEntityType
    detectedValue: string
    token: string
    action: PIIAction
    confidence: number
    needsReview: boolean
  }>
}

/**
 * Stateful redactor: keeps a running map of (type, value) → token so
 * repeated mentions within the same scan produce the same token.
 */
export class PIIRedactor {
  private tokenByKey = new Map<string, string>()
  // Per-type running counter so the first STUDENT mention becomes _001.
  private countsByType = new Map<PIIEntityType, number>()

  /** Get or allocate a stable token for this (type, value) pair. */
  getOrAllocateToken(type: PIIEntityType, detectedValue: string): string {
    const key = `${type}:${detectedValue}`
    const existing = this.tokenByKey.get(key)
    if (existing) return existing
    const next = (this.countsByType.get(type) ?? 0) + 1
    this.countsByType.set(type, next)
    const token = tokenFor(type, next)
    this.tokenByKey.set(key, token)
    return token
  }

  /**
   * Run the detector against `text`, replace each detected span with its
   * stable token, and return the redacted string plus the list of entities.
   *
   * Replacement is done in reverse offset order so earlier offsets stay valid.
   */
  redact(text: string): RedactionResult {
    if (!text || typeof text !== 'string') return { redactedText: text ?? '', entitiesFound: [] }

    const detected: DetectedEntity[] = detectPII(text)
    if (detected.length === 0) return { redactedText: text, entitiesFound: [] }

    // Sort by start descending so slice-and-replace from the end doesn't
    // invalidate offsets earlier in the string.
    const sorted = [...detected].sort((a, b) => b.start - a.start)

    let redacted = text
    const entitiesFound: RedactionResult['entitiesFound'] = []

    for (const entity of sorted) {
      const action = defaultAction(entity.type)
      const token = this.getOrAllocateToken(entity.type, entity.detected)

      // `remove` actions replace with empty string; `replace` and `semantic`
      // use the token (the UI can later show a human-readable substitute).
      const replacement = action === 'remove' ? '' : token

      redacted = redacted.slice(0, entity.start) + replacement + redacted.slice(entity.end)

      entitiesFound.push({
        type: entity.type,
        detectedValue: entity.detected,
        token,
        action,
        confidence: entity.confidence,
        needsReview: !!entity.needsReview,
      })
    }

    return { redactedText: redacted, entitiesFound }
  }

  /** Every unique (type, value, token) this redactor has seen so far. */
  listAllMappings(): Array<{ type: PIIEntityType; detectedValue: string; token: string }> {
    const out: Array<{ type: PIIEntityType; detectedValue: string; token: string }> = []
    for (const [key, token] of this.tokenByKey.entries()) {
      const [type, ...rest] = key.split(':')
      out.push({ type: type as PIIEntityType, detectedValue: rest.join(':'), token })
    }
    return out
  }

  /**
   * Re-identify tokens back to real values when displaying to the SLP.
   * Caller supplies the redacted text returned by the LLM.
   */
  reidentify(text: string): string {
    if (!text) return text
    let out = text
    for (const [key, token] of this.tokenByKey.entries()) {
      const [, ...rest] = key.split(':')
      const realValue = rest.join(':')
      // Global replace — tokens are distinct shapes unlikely to clash.
      out = out.split(token).join(realValue)
    }
    return out
  }
}

/**
 * Persist a batch of entity findings to `pii_mappings`. Idempotent on the
 * unique (report_id, detected_value, entity_type) key. Silently no-ops when
 * the table doesn't exist (migration 004 not yet applied).
 *
 * `supabase` here is the admin/service-role client used by the server route.
 */
export async function persistPIIMappings(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  reportId: string,
  entities: RedactionResult['entitiesFound'],
  sourceFile?: string
): Promise<{ ok: boolean; persisted: number; error?: string }> {
  if (entities.length === 0) return { ok: true, persisted: 0 }

  const rows = entities.map((e) => ({
    report_id: reportId,
    entity_type: e.type,
    detected_value: e.detectedValue,
    token: e.token,
    action: e.action,
    confidence: e.confidence,
    source_file: sourceFile ?? null,
    needs_review: e.needsReview,
  }))

  try {
    const { error } = await supabase
      .from('pii_mappings')
      .upsert(rows, { onConflict: 'report_id,detected_value,entity_type' })

    if (error) {
      // Table missing (PGRST205 / 42P01) is expected when the migration
      // hasn't run yet — degrade silently to memory-only redaction.
      const code = error.code ?? ''
      const msg = error.message ?? String(error)
      if (code === 'PGRST205' || code === '42P01' || /relation.*does not exist|could not find/i.test(msg)) {
        console.warn('[pii] pii_mappings table not found — running redaction without persistence. Apply migration 004.')
        return { ok: false, persisted: 0, error: 'table_missing' }
      }
      console.error('[pii] Failed to persist mappings:', error)
      return { ok: false, persisted: 0, error: msg }
    }

    return { ok: true, persisted: rows.length }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[pii] Unexpected error during persist:', msg)
    return { ok: false, persisted: 0, error: msg }
  }
}
