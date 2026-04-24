/**
 * Slot registry — the canonical schema that the unified block editor
 * renders against.
 *
 * Each slot is a typed field the AI can extract into from source
 * documents (intake forms, assessment reports, transcripts), the
 * validator can check for completeness, and the renderer can format
 * uniformly on export. Clinicians never see slot ids or types — only
 * the resulting prose. Slots are flat (global namespace) rather than
 * nested per section, so cross-section references ("see age in
 * header", "link to GFTA-3 standard score from conclusion") are
 * trivial lookups.
 *
 * Adding a slot: drop an entry in SLOT_REGISTRY and reference its id
 * from the section schema below. A tree with paragraph.slot set to an
 * unknown id is still valid — it just renders as free-form text and
 * the validator treats it as if the slot weren't declared. That gives
 * us backward compatibility when a slot is renamed or retired.
 */

export type SlotType =
  | 'string'
  | 'number'
  | 'months' // integer months; renders as "14 months" or "1 year 2 months"
  | 'date' // ISO date; renders as locale short date
  | 'boolean' // renders as Yes / No in prose
  | 'enum' // constrained string with `options`
  | 'string-array' // multi-value; renders as comma-joined

export interface SlotDef {
  id: string
  label: string
  type: SlotType
  required?: boolean
  /** Constrained value set when type is 'enum'. */
  options?: readonly string[]
  /**
   * Derive this slot's value from other slots when not directly filled.
   * Runs in the validator; derived values have status 'derived' and
   * are treated as present for completion purposes.
   */
  inferFrom?: {
    slots: readonly string[]
    compute: (values: Record<string, unknown>) => unknown
  }
  placeholder?: string
  description?: string
}

// ─── Helpers used by inferFrom ──────────────────────────────────────────

function parseDate(v: unknown): Date | null {
  if (!v || typeof v !== 'string') return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function diffInMonths(from: Date, to: Date): number {
  const years = to.getFullYear() - from.getFullYear()
  const months = to.getMonth() - from.getMonth()
  let total = years * 12 + months
  // Adjust if the day-of-month hasn't been reached yet.
  if (to.getDate() < from.getDate()) total -= 1
  return Math.max(0, total)
}

// ─── Registry ───────────────────────────────────────────────────────────

export const SLOT_REGISTRY = {
  // Identity
  first_name: { id: 'first_name', label: 'First name', type: 'string', required: true },
  last_name: { id: 'last_name', label: 'Last name', type: 'string', required: true },
  student_name: {
    id: 'student_name',
    label: 'Student name',
    type: 'string',
    inferFrom: {
      slots: ['first_name', 'last_name'],
      compute: (v) =>
        v.first_name && v.last_name ? `${v.first_name} ${v.last_name}` : null,
    },
  },
  student_id: { id: 'student_id', label: 'Student ID', type: 'string' },
  date_of_birth: { id: 'date_of_birth', label: 'Date of birth', type: 'date', required: true },
  grade: { id: 'grade', label: 'Grade', type: 'string' },
  school_name: { id: 'school_name', label: 'School', type: 'string' },
  primary_languages: {
    id: 'primary_languages',
    label: 'Primary language(s)',
    type: 'string-array',
  },

  // Evaluation metadata
  evaluation_date: { id: 'evaluation_date', label: 'Evaluation date', type: 'date', required: true },
  evaluation_dates: { id: 'evaluation_dates', label: 'Evaluation date(s)', type: 'string-array' },
  report_date: { id: 'report_date', label: 'Report date', type: 'date' },
  evaluator_name: { id: 'evaluator_name', label: 'Evaluator', type: 'string', required: true },
  evaluator_credentials: {
    id: 'evaluator_credentials',
    label: 'Evaluator credentials',
    type: 'string',
  },
  eligibility_status: {
    id: 'eligibility_status',
    label: 'Eligibility',
    type: 'enum',
    options: ['eligible', 'not_eligible', 'pending', 'exited'],
  },

  // Derived
  age: {
    id: 'age',
    label: 'Age at evaluation',
    type: 'months',
    inferFrom: {
      slots: ['date_of_birth', 'evaluation_date'],
      compute: (v) => {
        const dob = parseDate(v.date_of_birth)
        const evalDate = parseDate(v.evaluation_date)
        if (!dob || !evalDate) return null
        return diffInMonths(dob, evalDate)
      },
    },
  },

  // Health / developmental
  medical_history: { id: 'medical_history', label: 'Medical history', type: 'string' },
  hearing_screening: {
    id: 'hearing_screening',
    label: 'Hearing screening',
    type: 'enum',
    options: ['pass', 'refer', 'not_tested'],
  },
  vision_screening: {
    id: 'vision_screening',
    label: 'Vision screening',
    type: 'enum',
    options: ['pass', 'refer', 'not_tested'],
  },
  developmental_milestones: {
    id: 'developmental_milestones',
    label: 'Developmental milestones',
    type: 'string',
  },
  first_word: { id: 'first_word', label: 'First words (age)', type: 'months' },
  sitting_unsupported: {
    id: 'sitting_unsupported',
    label: 'Sat unsupported (age)',
    type: 'months',
  },
  walking: { id: 'walking', label: 'Walked (age)', type: 'months' },

  // Family background
  home_languages: {
    id: 'home_languages',
    label: 'Language(s) at home',
    type: 'string-array',
  },
  family_history_communication_disorders: {
    id: 'family_history_communication_disorders',
    label: 'Family history of communication disorders',
    type: 'boolean',
  },
  family_history_details: {
    id: 'family_history_details',
    label: 'Family history details',
    type: 'string',
  },
  parent_education: { id: 'parent_education', label: 'Parent education', type: 'string' },
  cultural_factors: { id: 'cultural_factors', label: 'Cultural factors', type: 'string' },

  // Referral / concern
  referral_source: { id: 'referral_source', label: 'Referral source', type: 'string' },
  reason_for_referral: {
    id: 'reason_for_referral',
    label: 'Reason for referral',
    type: 'string',
    required: true,
  },
  parent_concern: { id: 'parent_concern', label: 'Parent concern', type: 'string' },

  // Validity
  validity_rating: {
    id: 'validity_rating',
    label: 'Validity',
    type: 'enum',
    options: ['valid', 'questionable', 'invalid'],
  },
  validity_factors: { id: 'validity_factors', label: 'Validity factors', type: 'string' },

  // Conclusion / recommendations
  primary_diagnosis: { id: 'primary_diagnosis', label: 'Primary finding', type: 'string' },
  severity: {
    id: 'severity',
    label: 'Severity',
    type: 'enum',
    options: ['mild', 'moderate', 'severe', 'profound'],
  },
  recommendations_summary: {
    id: 'recommendations_summary',
    label: 'Recommendations (summary)',
    type: 'string',
  },
} as const satisfies Record<string, SlotDef>

export type SlotId = keyof typeof SLOT_REGISTRY

/** Narrow-typed lookup helper; returns undefined for unknown ids. */
export function getSlotDef(id: string): SlotDef | undefined {
  return (SLOT_REGISTRY as Record<string, SlotDef>)[id]
}

// ─── Section schemas ────────────────────────────────────────────────────
//
// Each SectionSlotSchema declares which slots a section *expects* — used
// by the validator to compute per-section completion and by the AI
// slot-filling prompt to know what to extract. A section can still
// carry free-form (slot-less) paragraphs; the schema only governs the
// slotted ones.

export interface SectionSlotSchema {
  /** Matches report_sections.sectionType. */
  sectionType: string
  label: string
  slotIds: readonly string[]
}

export const SECTION_SCHEMAS: Record<string, SectionSlotSchema> = {
  heading: {
    sectionType: 'heading',
    label: 'Student Information',
    slotIds: [
      'first_name',
      'last_name',
      'date_of_birth',
      'age',
      'student_id',
      'grade',
      'primary_languages',
      'evaluation_date',
      'evaluation_dates',
      'report_date',
      'evaluator_name',
      'evaluator_credentials',
      'school_name',
      'eligibility_status',
    ],
  },
  reason_for_referral: {
    sectionType: 'reason_for_referral',
    label: 'Reason for Referral',
    slotIds: ['referral_source', 'reason_for_referral', 'parent_concern'],
  },
  health_developmental_history: {
    sectionType: 'health_developmental_history',
    label: 'Health & Developmental History',
    slotIds: [
      'medical_history',
      'hearing_screening',
      'vision_screening',
      'developmental_milestones',
      'first_word',
      'sitting_unsupported',
      'walking',
    ],
  },
  family_background: {
    sectionType: 'family_background',
    label: 'Family Background',
    slotIds: [
      'home_languages',
      'family_history_communication_disorders',
      'family_history_details',
      'parent_education',
      'cultural_factors',
    ],
  },
  validity_statement: {
    sectionType: 'validity_statement',
    label: 'Validity Statement',
    slotIds: ['validity_rating', 'validity_factors'],
  },
  conclusion: {
    sectionType: 'conclusion',
    label: 'Conclusion',
    slotIds: ['primary_diagnosis', 'severity', 'eligibility_status', 'recommendations_summary'],
  },
}

export function getSectionSchema(sectionType: string): SectionSlotSchema | undefined {
  return SECTION_SCHEMAS[sectionType]
}
