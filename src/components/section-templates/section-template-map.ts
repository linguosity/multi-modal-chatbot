/**
 * Section type → template config. The section page reads a section's
 * `section_type` and dispatches to the matching renderer below.
 *
 * Templates A–E come from the data-entry redesign wireframe:
 *   • A — Student Identity / structured demographics
 *   • B — Narrative with optional fields (yesno + textarea + chips)
 *   • C — Decision cards (eligibility, validity)
 *   • D — Tools collection
 *   • E — Recommendations / accommodations
 *   • outline — outline ⇄ prose narrative editor (SectionEditor)
 *
 * For section types not listed here, the dispatcher falls back to the
 * outline-prose SectionEditor which gracefully handles legacy content.
 */

import type { TemplateBField } from './TemplateB'
import type { TemplateCCriterion } from './TemplateC'

export type TemplateKind = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'outline'

export interface TemplateConfig {
  template: TemplateKind
  /** Field config for Template B (narrative). Required when template === 'B'. */
  fields?: TemplateBField[]
  /** Criteria list for Template C. Required when template === 'C'. */
  criteria?: TemplateCCriterion[]
  /** Variant for Template E. Required when template === 'E'. */
  eVariant?: 'recommendations' | 'accommodations'
  /** Pill label for Template C completion strip. */
  completePillLabel?: string
}

const REASON_FIELDS: TemplateBField[] = [
  {
    key: 'referral_source',
    label: 'Referral Source',
    type: 'chips',
    options: ['Teacher', 'Parent', 'Self', 'Pediatrician', 'SST', 'Other'],
  },
  {
    key: 'primary_concerns',
    label: 'Primary Concerns',
    placeholder: 'Describe the primary communication concerns that prompted this referral…',
    rows: 4,
    ai: true,
  },
  {
    key: 'academic_impact',
    label: 'Academic Impact Demonstrated',
    type: 'yesno',
    justificationKey: 'academic_impact_details',
    justificationPlaceholder: 'Describe how communication difficulties impact academic performance…',
  },
]

const HEALTH_FIELDS: TemplateBField[] = [
  {
    key: 'birth_complications',
    label: 'Birth / Pregnancy Complications',
    type: 'yesno',
    justificationKey: 'birth_details',
    justificationPlaceholder: 'Describe any complications…',
  },
  {
    key: 'developmental_milestones',
    label: 'Developmental Milestones',
    placeholder: 'Document motor, language, and cognitive milestones…',
    rows: 4,
    ai: true,
  },
  {
    key: 'medical_conditions',
    label: 'Medical Conditions',
    type: 'select',
    suggestions: [
      'None reported',
      'Chronic ear infections',
      'Hearing loss',
      'Allergies',
      'Seizure disorder',
    ],
  },
  {
    key: 'hearing_vision',
    label: 'Hearing / Vision Status',
    placeholder: 'e.g. Passed screening 03/2026…',
    rows: 2,
  },
]

const PARENT_FIELDS: TemplateBField[] = [
  { key: 'parent_name', label: 'Parent / Guardian', placeholder: 'Name of informant' },
  {
    key: 'communication_concerns',
    label: 'Communication Concerns',
    placeholder: 'Parent-reported concerns about speech and language…',
    rows: 4,
    ai: true,
  },
  {
    key: 'social_concerns',
    label: 'Social Interaction Concerns',
    placeholder: 'Parent-reported social and emotional observations…',
    rows: 3,
  },
  {
    key: 'onset_duration',
    label: 'Onset & Duration',
    placeholder: 'When concerns were first noticed…',
    rows: 2,
  },
]

// Conclusion fields. Mirrors CONCLUSION_SECTION in
// src/lib/structured-schemas.ts. summary_statement is the headline
// narrative the AI synthesizes — it gets the most rows so the prose
// renders as one cohesive passage instead of fragments.
const CONCLUSION_FIELDS: TemplateBField[] = [
  {
    key: 'primary_diagnosis',
    label: 'Primary Diagnosis',
    placeholder: 'State the primary diagnosis…',
    rows: 2,
    ai: true,
  },
  {
    key: 'severity_level',
    label: 'Severity',
    type: 'chips',
    options: ['Mild', 'Moderate', 'Severe'],
  },
  {
    key: 'prognosis',
    label: 'Prognosis',
    type: 'chips',
    options: ['Excellent', 'Good', 'Fair', 'Poor'],
  },
  {
    key: 'summary_statement',
    label: 'Summary Statement',
    placeholder: 'Synthesize findings, eligibility decision, and rationale…',
    rows: 8,
    ai: true,
  },
]

const FAMILY_FIELDS: TemplateBField[] = [
  {
    key: 'home_languages',
    label: 'Language(s) at Home',
    placeholder: 'Languages spoken in the home environment…',
    rows: 2,
    ai: true,
  },
  {
    key: 'cultural_factors',
    label: 'Cultural / Linguistic Factors',
    placeholder: 'Cultural and linguistic considerations relevant to the assessment…',
    rows: 3,
    ai: true,
  },
  {
    key: 'family_history',
    label: 'Family History',
    placeholder: 'Family history of speech, language, or learning concerns…',
    rows: 2,
  },
]

// Decision/justification fields here mirror ELIGIBILITY_CHECKLIST_SECTION
// in src/lib/structured-schemas.ts — that schema is what the AI tool
// gets, so keeping these in sync means extracted values render directly.
const ELIGIBILITY_CRITERIA: TemplateCCriterion[] = [
  {
    key: 'speech_impairment',
    title: 'Meets criteria for speech/language impairment',
    definition:
      'A student has a language or speech disorder when they demonstrate difficulty understanding or using spoken language to such an extent that it adversely affects educational performance.',
    decisionField: 'speech_criteria',
    justificationField: 'speech_justification',
  },
  {
    key: 'language_impairment',
    title: 'Meets criteria for language impairment',
    definition:
      'The student demonstrates deficits in comprehension and/or expression of language that significantly impact the ability to communicate in educational settings.',
    decisionField: 'language_criteria',
    justificationField: 'language_justification',
  },
  {
    key: 'educational_impact',
    title: 'Adverse effect on educational performance',
    definition:
      "The communication disorder negatively impacts the student's ability to access curriculum, participate in classroom activities, and/or interact with peers and adults in the educational environment.",
    decisionField: 'educational_impact',
    justificationField: 'educational_impact_details',
  },
  {
    key: 'specialized_instruction',
    title: 'Requires specialized instruction',
    definition:
      'The student requires instruction specifically designed to meet their unique communication needs that cannot be provided through general education alone.',
    decisionField: 'services_required',
    justificationField: 'services_justification',
  },
]

// Validity criteria. Field paths bind to VALIDITY_STATEMENT_SECTION in
// src/lib/structured-schemas.ts — TemplateC reads via dot-paths so the
// schema's nested `student_cooperation.cooperative` and
// `validity_factors.attention_issues` shapes resolve directly. The
// `environmental_factors` row stays UI-only (no canonical schema field).
const VALIDITY_CRITERIA: TemplateCCriterion[] = [
  {
    key: 'results_valid',
    title: 'Test results are valid and reliable',
    definition:
      "Results are considered representative of the student's typical performance based on behavior during testing, cooperation level, and consistency of responses.",
    decisionField: 'is_valid',
    justificationField: 'results_valid_justification',
  },
  {
    key: 'student_cooperation',
    title: 'Student demonstrated adequate cooperation',
    definition:
      'The student was sufficiently cooperative and engaged throughout the evaluation to obtain reliable results.',
    decisionField: 'student_cooperation.cooperative',
    justificationField: 'student_cooperation.understanding',
  },
  {
    key: 'attention_factors',
    title: 'Attention and fatigue factors controlled',
    definition:
      'Testing breaks and accommodations were provided as needed. No significant attention or fatigue effects compromised results.',
    decisionField: 'validity_factors.attention_issues',
    justificationField: 'validity_factors.attention_notes',
  },
  {
    key: 'cultural_factors',
    title: 'Linguistic and cultural factors considered',
    definition:
      "The student's bilingual status and cultural background were appropriately considered in test selection, administration, and interpretation of results.",
    decisionField: 'validity_factors.cultural_considerations',
    justificationField: 'validity_factors.cultural_notes',
  },
  {
    key: 'environmental_factors',
    title: 'Environmental conditions adequate',
    definition:
      'Testing was conducted in a quiet room with minimal distractions, appropriate lighting, and comfortable seating.',
    decisionField: 'environmental_factors_decision',
    justificationField: 'environmental_factors_justification',
  },
]

/**
 * Per-section-type template selection. Keys mirror the section_type values
 * stored on report_sections rows.
 */
export const SECTION_TEMPLATE_MAP: Record<string, TemplateConfig> = {
  heading: { template: 'A' },
  student_information: { template: 'A' },

  reason_for_referral: { template: 'B', fields: REASON_FIELDS },
  health_developmental_history: { template: 'B', fields: HEALTH_FIELDS },
  family_background: { template: 'B', fields: FAMILY_FIELDS },
  parent_concern: { template: 'B', fields: PARENT_FIELDS },

  assessment_tools: { template: 'D' },

  assessment_results: { template: 'F' },
  conclusion: { template: 'B', fields: CONCLUSION_FIELDS },

  validity_statement: {
    template: 'C',
    criteria: VALIDITY_CRITERIA,
    completePillLabel: 'Results valid',
  },
  eligibility_checklist: {
    template: 'C',
    criteria: ELIGIBILITY_CRITERIA,
    completePillLabel: 'Eligibility: Meets criteria',
  },

  recommendations: { template: 'E', eVariant: 'recommendations' },
  accommodations: { template: 'E', eVariant: 'accommodations' },
}

export function resolveTemplate(sectionType: string | null | undefined): TemplateConfig {
  if (!sectionType) return { template: 'outline' }
  return SECTION_TEMPLATE_MAP[sectionType] ?? { template: 'outline' }
}
