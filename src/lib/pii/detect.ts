/**
 * Regex-based PII detector — MVP version for ROADMAP Phase 8.
 *
 * Deliberately simple: high-precision patterns for the PII categories an SLP
 * report typically contains. False negatives (missed PII) are surfaced in the
 * confirmation UI so the clinician can add manual redactions.
 *
 * Future work: plug in Gemini Nano / Chrome Prompt API / compromise.js for
 * unstructured-name detection. This module deliberately does not attempt
 * free-form name detection via regex — too many false positives.
 */

export type PIIEntityType =
  | 'STUDENT'
  | 'PARENT_GUARDIAN'
  | 'TEACHER'
  | 'SCHOOL'
  | 'DOB'
  | 'DATE'
  | 'ADDRESS'
  | 'PHONE'
  | 'EMAIL'
  | 'MRN'
  | 'SSN'
  | 'OTHER'

export type PIIAction = 'replace' | 'semantic' | 'remove'

export interface DetectedEntity {
  type: PIIEntityType
  detected: string
  /** Byte offset in the source text */
  start: number
  end: number
  confidence: number
  needsReview?: boolean
}

const PATTERNS: Array<{
  type: PIIEntityType
  regex: RegExp
  confidence: number
  needsReview?: boolean
  /**
   * Optional filter — returns false to drop the match (e.g. discarding
   * obvious false positives like "00/00/0000").
   */
  filter?: (match: RegExpExecArray) => boolean
}> = [
  // Phone numbers — US formats
  {
    type: 'PHONE',
    regex: /\b(?:\+?1[-.\s]?)?(?:\(\d{3}\)\s?|\d{3}[-.\s])\d{3}[-.\s]\d{4}\b/g,
    confidence: 0.98,
  },

  // Email
  {
    type: 'EMAIL',
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    confidence: 0.99,
  },

  // SSN
  {
    type: 'SSN',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    confidence: 0.99,
  },

  // MRN — common hospital formats
  {
    type: 'MRN',
    regex: /\bMRN[:\s#-]*\d[\d-]{3,}\b/gi,
    confidence: 0.88,
    needsReview: true,
  },

  // DOB — context-gated so we don't catch every date
  {
    type: 'DOB',
    regex: /\b(?:DOB|D\.O\.B\.|Date of Birth|Birthdate)[:\s]*((?:\d{1,2}\/\d{1,2}\/\d{2,4})|(?:\d{4}-\d{2}-\d{2}))/gi,
    confidence: 0.97,
  },

  // Bare dates (fallback — lower confidence)
  {
    type: 'DATE',
    regex: /\b(?:\d{1,2}\/\d{1,2}\/\d{2,4})|(?:\d{4}-\d{2}-\d{2})\b/g,
    confidence: 0.8,
    needsReview: true,
    filter: (m) => {
      const s = m[0]
      return !/^0+[\/-]0+/.test(s) // drop 00/00/00 placeholder
    },
  },

  // Street addresses — requires a number + street word
  {
    type: 'ADDRESS',
    regex: /\b\d{1,6}\s+[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl)\.?\b/g,
    confidence: 0.92,
  },

  // School (explicit suffix)
  {
    type: 'SCHOOL',
    regex: /\b[A-Z][a-zA-Z'\-]+(?:\s+[A-Z][a-zA-Z'\-]+)*\s+(?:Elementary|Middle|High|Academy|Charter|Montessori|Preschool)(?:\s+School)?\b/g,
    confidence: 0.93,
  },

  // Teacher — "Ms./Mr./Mrs./Dr. LastName"
  {
    type: 'TEACHER',
    regex: /\b(?:Ms|Mr|Mrs|Dr|Miss)\.\s+[A-Z][a-zA-Z'\-]+\b/g,
    confidence: 0.85,
    needsReview: true,
  },
]

/**
 * Run all regex patterns against `text` and return the detected entities with
 * their source offsets. Caller is responsible for attaching tokens.
 */
export function detectPII(text: string): DetectedEntity[] {
  const out: DetectedEntity[] = []
  for (const pat of PATTERNS) {
    pat.regex.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = pat.regex.exec(text)) !== null) {
      if (pat.filter && !pat.filter(m)) continue
      const value = m[1] ?? m[0]
      const start = m.index + (m[0].length - value.length)
      out.push({
        type: pat.type,
        detected: value,
        start,
        end: start + value.length,
        confidence: pat.confidence,
        needsReview: pat.needsReview,
      })
    }
  }

  // Deduplicate identical (type, detected) within the same scan
  const seen = new Set<string>()
  return out.filter((e) => {
    const key = `${e.type}:${e.detected}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Generate a stable token for a detected entity. Caller provides the running
 * counter-per-type so multiple mentions of the same value map to the same
 * token (e.g. [STUDENT_001] used consistently across files).
 */
export function tokenFor(type: PIIEntityType, index: number): string {
  const id = index.toString().padStart(3, '0')
  switch (type) {
    case 'STUDENT':         return `[STUDENT_${id}]`
    case 'PARENT_GUARDIAN': return `[PARENT_${id}]`
    case 'TEACHER':         return `[TEACHER_${id}]`
    case 'SCHOOL':          return `[SCHOOL_${id}]`
    case 'DOB':             return `[DOB]`
    case 'DATE':            return `[DATE]`
    case 'ADDRESS':         return `[ADDRESS]`
    case 'PHONE':           return `[PHONE]`
    case 'EMAIL':           return `[EMAIL]`
    case 'MRN':             return `[MEDICAL_ID]`
    case 'SSN':             return `[SSN]`
    default:                return `[REDACTED]`
  }
}

/**
 * Default action per entity type (matches wireframe expectations).
 * `semantic` replaces with an age/range equivalent (e.g. DOB → "[AGE: 9 years]").
 */
export function defaultAction(type: PIIEntityType): PIIAction {
  switch (type) {
    case 'DOB':
    case 'DATE':
      return 'semantic'
    case 'ADDRESS':
    case 'PHONE':
    case 'EMAIL':
    case 'MRN':
    case 'SSN':
      return 'remove'
    default:
      return 'replace'
  }
}
