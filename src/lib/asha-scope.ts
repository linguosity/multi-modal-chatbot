/**
 * ASHA Scope of Practice for Speech-Language Pathology — taxonomy reference.
 *
 * This is the canonical, immutable source of truth for SLP communication and
 * feeding/swallowing domains. Every domain enum across the app — tool catalog
 * tags, assessment_results.domain_summary[].domain, target_domains[],
 * default_domains[] on the user profile — pulls from this module.
 *
 * Do NOT edit the taxonomy. Treat it as policy, not preference. If ASHA
 * publishes an updated scope of practice, that's a sourced edit; otherwise
 * leave it alone.
 *
 * The taxonomy has two top-level branches (Communication, Feeding and
 * Swallowing), 13 mid-level categories, and ~30 leaf domains. A "domain" in
 * this app's enums is a *leaf* unless explicitly noted — leaves are precise
 * and consistent across reports. Parent labels are useful for grouping,
 * presets, and matrix axes, but data fields should land at the leaf level.
 */

// ─── Taxonomy ────────────────────────────────────────────────────────────

export const ASHA_TAXONOMY = {
  Communication: {
    'Speech Production': [
      'Articulation',
      'Phonology',
      'Motor Speech / Apraxia / Dysarthria',
      'Intelligibility',
    ],
    Fluency: ['Stuttering', 'Cluttering'],
    Language: [
      'Receptive Language',
      'Expressive Language',
      'Morphology / Syntax',
      'Semantics / Vocabulary',
      'Narrative / Discourse',
      'Literacy-Related Language',
      'Social Communication / Pragmatics',
    ],
    Cognition: [
      'Attention',
      'Memory',
      'Executive Function',
      'Problem Solving',
      'Cognitive-Communication',
    ],
    Voice: ['Quality', 'Pitch', 'Loudness', 'Vocal Function'],
    Resonance: ['Hypernasality', 'Hyponasality', 'Velopharyngeal Function'],
    'Hearing-Related Communication': [
      'Aural Rehabilitation',
      'Auditory Processing Support',
      'Communication Access',
    ],
    AAC: [
      'Unaided Communication',
      'Low-Tech AAC',
      'High-Tech AAC',
    ],
  },
  'Feeding and Swallowing': {
    'Feeding and Swallowing': [
      'Oral Feeding',
      'Dysphagia',
      'Feeding Behaviors',
      'Oral-Motor Feeding Skills',
      'Mealtime Participation / Safety',
    ],
  },
} as const

export type AshaTopLevel = keyof typeof ASHA_TAXONOMY

// ─── Derived constants ───────────────────────────────────────────────────

/** All parent (mid-level) labels, ordered top-level → mid-level. */
export const ASHA_PARENTS: readonly string[] = (() => {
  const out: string[] = []
  for (const top of Object.keys(ASHA_TAXONOMY) as AshaTopLevel[]) {
    for (const parent of Object.keys(ASHA_TAXONOMY[top])) {
      out.push(parent)
    }
  }
  return out
})()

/** Every leaf domain label, deduplicated and ordered. The canonical enum
 *  for `default_domains_assessed`, `target_domains`, and `domain_summary[i].domain`. */
export const ASHA_LEAVES: readonly string[] = (() => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const top of Object.keys(ASHA_TAXONOMY) as AshaTopLevel[]) {
    const branch = ASHA_TAXONOMY[top] as Record<string, readonly string[]>
    for (const parent of Object.keys(branch)) {
      for (const leaf of branch[parent]) {
        if (!seen.has(leaf)) {
          seen.add(leaf)
          out.push(leaf)
        }
      }
    }
  }
  return out
})()

export type AshaLeaf = (typeof ASHA_LEAVES)[number]

// Reverse maps for fast lookup.
const PARENT_BY_LEAF: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  for (const top of Object.keys(ASHA_TAXONOMY) as AshaTopLevel[]) {
    const branch = ASHA_TAXONOMY[top] as Record<string, readonly string[]>
    for (const parent of Object.keys(branch)) {
      for (const leaf of branch[parent]) {
        out[leaf] = parent
      }
    }
  }
  return out
})()

const TOP_BY_PARENT: Record<string, string> = (() => {
  const out: Record<string, string> = {}
  for (const top of Object.keys(ASHA_TAXONOMY) as AshaTopLevel[]) {
    for (const parent of Object.keys(ASHA_TAXONOMY[top])) {
      out[parent] = top
    }
  }
  return out
})()

// ─── Helpers ─────────────────────────────────────────────────────────────

export function isLeaf(name: string): boolean {
  return name in PARENT_BY_LEAF
}

export function isParent(name: string): boolean {
  return name in TOP_BY_PARENT
}

export function parentOf(leaf: string): string | undefined {
  return PARENT_BY_LEAF[leaf]
}

export function topLevelOf(name: string): string | undefined {
  if (isLeaf(name)) return TOP_BY_PARENT[PARENT_BY_LEAF[name]]
  if (isParent(name)) return TOP_BY_PARENT[name]
  return undefined
}

export function leavesOf(parent: string): readonly string[] {
  for (const top of Object.keys(ASHA_TAXONOMY) as AshaTopLevel[]) {
    const branch = ASHA_TAXONOMY[top] as Record<string, readonly string[]>
    if (parent in branch) return branch[parent]
  }
  return []
}

// ─── Aliases (legacy → ASHA leaf) ────────────────────────────────────────

/**
 * Legacy domain labels we've used pre-ASHA-lockin, mapped to canonical
 * ASHA leaves. Used by `canonicalDomain()` in convergence.ts when
 * normalizing existing report data and AI-emitted labels that drift.
 *
 * Only one-to-one mappings live here. Genuinely non-ASHA labels (e.g.
 * "Adaptive Behavior", "Developmental") have no destination and should
 * be dropped during reconciliation rather than coerced.
 */
export const ASHA_LEGACY_ALIASES: Record<string, string> = {
  // Pre-ASHA short names → canonical ASHA leaves
  pragmatics: 'Social Communication / Pragmatics',
  'pragmatic language': 'Social Communication / Pragmatics',
  'social communication': 'Social Communication / Pragmatics',
  'social/pragmatic': 'Social Communication / Pragmatics',
  'social/pragmatic communication': 'Social Communication / Pragmatics',
  'social-pragmatic communication': 'Social Communication / Pragmatics',
  vocabulary: 'Semantics / Vocabulary',
  semantics: 'Semantics / Vocabulary',
  morphosyntax: 'Morphology / Syntax',
  morphology: 'Morphology / Syntax',
  syntax: 'Morphology / Syntax',
  'narrative language': 'Narrative / Discourse',
  narrative: 'Narrative / Discourse',
  discourse: 'Narrative / Discourse',
  literacy: 'Literacy-Related Language',
  'phonological awareness': 'Literacy-Related Language',
  'motor speech': 'Motor Speech / Apraxia / Dysarthria',
  apraxia: 'Motor Speech / Apraxia / Dysarthria',
  dysarthria: 'Motor Speech / Apraxia / Dysarthria',
  'speech': 'Articulation',
  'speech intelligibility': 'Intelligibility',
  'speech intelligibility/articulation': 'Articulation', // could be either leaf; pick the more specific
  receptive: 'Receptive Language',
  expressive: 'Expressive Language',
  fluency: 'Stuttering', // safe default; clinician can override to Cluttering
  voice: 'Quality',  // top-leaf default
  resonance: 'Velopharyngeal Function', // top-leaf default
  'cognitive-communication': 'Cognitive-Communication',
  'cognitive communication': 'Cognitive-Communication',
  cognition: 'Cognitive-Communication', // top-leaf default
  swallowing: 'Dysphagia',
  dysphagia: 'Dysphagia',
  feeding: 'Oral Feeding',
}

/**
 * Snap a free-text domain label to a canonical ASHA leaf. Returns the input
 * unchanged when no alias matches; the caller can then decide whether to
 * keep, drop, or flag the unknown label.
 */
export function snapToAshaLeaf(label: string | undefined | null): string | undefined {
  if (!label) return undefined
  const trimmed = label.trim()
  if (!trimmed) return undefined
  if (isLeaf(trimmed)) return trimmed
  const key = trimmed.toLowerCase().replace(/\s+/g, ' ')
  return ASHA_LEGACY_ALIASES[key] ?? undefined
}

// ─── Preset bundles (for onboarding + new-report) ────────────────────────

/**
 * Onboarding presets — one-click "I'm typically a __ SLP" defaults. Each
 * preset is a list of ASHA leaves the user gets pre-checked. Selecting a
 * preset is equivalent to checking those leaves; users can tweak before
 * saving.
 *
 * The empty-state default for a clinician who skipped onboarding entirely
 * is `school_based_pediatric` (most common SLP role).
 */
export const ASHA_PRESETS: Record<string, { label: string; description: string; leaves: readonly string[] }> = {
  school_based_pediatric: {
    label: 'School-based pediatric',
    description: 'Most common: speech production, language, social communication, fluency, voice.',
    leaves: [
      'Articulation',
      'Phonology',
      'Intelligibility',
      'Receptive Language',
      'Expressive Language',
      'Morphology / Syntax',
      'Semantics / Vocabulary',
      'Narrative / Discourse',
      'Social Communication / Pragmatics',
      'Stuttering',
      'Quality',         // voice — vocal nodules, hoarseness, breathy voice (common in elementary)
      'Vocal Function',  // voice use / vocal hygiene
    ],
  },
  medical_adult: {
    label: 'Medical / adult',
    description: 'Cognitive-communication, aphasia, voice, resonance, dysphagia.',
    leaves: [
      'Receptive Language',
      'Expressive Language',
      'Cognitive-Communication',
      'Attention',
      'Memory',
      'Executive Function',
      'Problem Solving',
      // Voice — full coverage (gender-affirming, age-related, neurogenic, abuse)
      'Quality',
      'Pitch',
      'Loudness',
      'Vocal Function',
      // Resonance — full coverage (palatal, neurogenic)
      'Hypernasality',
      'Hyponasality',
      'Velopharyngeal Function',
      'Motor Speech / Apraxia / Dysarthria',
      'Dysphagia',
    ],
  },
  voice_specialist: {
    label: 'Voice / resonance specialist',
    description: 'Voice quality, vocal function, resonance.',
    leaves: [
      'Quality',
      'Pitch',
      'Loudness',
      'Vocal Function',
      'Hypernasality',
      'Hyponasality',
      'Velopharyngeal Function',
    ],
  },
  birth_to_three: {
    label: 'Birth-to-three / early intervention',
    description:
      'Prelinguistic and early communication, feeding, social-communication foundations. Prelinguistic skills (joint attention, gestures, vocal play, intent, turn-taking) are captured by Social Communication / Pragmatics + Expressive Language; Unaided Communication covers gesture and sign as preverbal modes.',
    leaves: [
      // Prelinguistic / preverbal foundations — distributed across these
      // leaves since ASHA scope doesn't have a discrete "Prelinguistic"
      // leaf. The combination below is what EI SLPs typically document.
      'Social Communication / Pragmatics', // joint attention, gestures, turn-taking, intent
      'Expressive Language',                // vocalizations, proto-words, communicative intent
      'Unaided Communication',              // gesture, sign, body movement as comm modes
      'Receptive Language',
      // Speech production foundations
      'Articulation',
      'Phonology',
      'Intelligibility',
      // Feeding
      'Oral Feeding',
      'Feeding Behaviors',
      'Oral-Motor Feeding Skills',
    ],
  },
  custom: {
    label: 'Custom',
    description: 'Start from empty and pick exactly what you need.',
    leaves: [],
  },
}

/** The default preset shipped to clinicians who skip onboarding entirely. */
export const ASHA_DEFAULT_PRESET_ID = 'school_based_pediatric'
