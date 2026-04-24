/**
 * Server-side re-identification layer.
 *
 * Once text has been de-identified on the way INTO the LLM (redactor.ts),
 * the LLM's response comes back with tokens like `[STUDENT_001]` embedded.
 * This module loads the per-report mapping from `pii_mappings` and swaps
 * tokens back to their real values before content is returned to the SLP.
 *
 * Runs server-side only. The client never sees tokens.
 *
 * Design review §10 — trust is a feature; the protection is invisible to the
 * SLP, but must be reliable end-to-end.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any

export interface PIIReidentifier {
  reidentifyString(input: string): string
  reidentifyDeep<T>(input: T): T
  /** token → original value map — exposed for debug / audit; never ship to client. */
  size(): number
}

/**
 * Build a re-identifier scoped to a single report. Loads every non-excluded
 * mapping from `pii_mappings` and returns helpers that swap tokens back to
 * their real values in strings or nested objects.
 *
 * Returns a no-op re-identifier if the table doesn't exist (migration 004
 * not applied) — in that case nothing was ever de-identified so re-id is moot.
 */
export async function buildReidentifier(
  supabase: SupabaseLike,
  reportId: string
): Promise<PIIReidentifier> {
  const tokenToValue = new Map<string, string>()

  try {
    const { data, error } = await supabase
      .from('pii_mappings')
      .select('token, detected_value, action, is_excluded')
      .eq('report_id', reportId)

    if (error) {
      const code = error.code ?? ''
      const msg = error.message ?? String(error)
      if (code === 'PGRST205' || code === '42P01' || /relation.*does not exist|could not find/i.test(msg)) {
        // Migration 004 not applied yet — silently degrade.
        return noopReidentifier()
      }
      console.error('[pii] Failed to load mappings for reidentify:', error)
      return noopReidentifier()
    }

    for (const row of data ?? []) {
      if (!row?.token || !row?.detected_value) continue
      if (row.is_excluded) continue
      // `remove` actions were scrubbed entirely — there's no token to restore.
      if (row.action === 'remove') continue
      tokenToValue.set(row.token, row.detected_value)
    }
  } catch (err) {
    console.warn('[pii] Unexpected error loading mappings:', err)
    return noopReidentifier()
  }

  if (tokenToValue.size === 0) return noopReidentifier()

  // Pre-compile a single regex that matches any token — much faster than
  // iterating per-string when content is large. Escape regex metachars.
  const escaped = Array.from(tokenToValue.keys()).map(escapeRegex)
  const tokenRegex = new RegExp(escaped.join('|'), 'g')

  const reidentifyString = (input: string): string => {
    if (typeof input !== 'string' || input.length === 0) return input
    return input.replace(tokenRegex, (match) => tokenToValue.get(match) ?? match)
  }

  const reidentifyDeep = <T,>(input: T): T => {
    if (input == null) return input
    if (typeof input === 'string') return reidentifyString(input) as unknown as T
    if (Array.isArray(input)) {
      return input.map((item) => reidentifyDeep(item)) as unknown as T
    }
    if (typeof input === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
        out[k] = reidentifyDeep(v)
      }
      return out as T
    }
    return input
  }

  return {
    reidentifyString,
    reidentifyDeep,
    size: () => tokenToValue.size,
  }
}

function noopReidentifier(): PIIReidentifier {
  return {
    reidentifyString: (s) => s,
    reidentifyDeep: (v) => v,
    size: () => 0,
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
