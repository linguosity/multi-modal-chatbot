// Seed library for v1. Initial set (35 entries) was sourced from the SC DOE
// Standardized Assessment Support for SLP doc (language-focused). Extended
// catalog appended below pulls articulation/phonology, motor speech, oral
// mech, fluency, voice, social communication, early developmental, and
// procedure-type tools from NY EI Appendix D and the SLP assessments
// reference report.
//
// Source of canonical domain names: `src/lib/asha-scope.ts`. Every value in
// `default_domains_assessed` MUST be an ASHA leaf — i.e. a member of the
// `ASHA_LEAVES` constant exported from that module. The previous "Domains
// Added" list (Social Communication, Motor Speech, Oral Mechanism, Adaptive
// Behavior, Developmental) has been removed in favor of the ASHA leaves.
// Notable mappings applied here:
//   - "Vocabulary"             → "Semantics / Vocabulary"
//   - "Pragmatics"             → "Social Communication / Pragmatics"
//   - "Social Communication"   → "Social Communication / Pragmatics"
//   - "Narrative Language"     → "Narrative / Discourse"
//   - "Morphosyntax"           → "Morphology / Syntax"
//   - "Literacy"               → "Literacy-Related Language"
//   - "Phonological Awareness" → "Literacy-Related Language" (closest leaf;
//     phonological-awareness measures are treated as literacy precursors)
//   - "Motor Speech"           → "Motor Speech / Apraxia / Dysarthria"
//   - "Voice" (used as a leaf) → "Quality" (default voice leaf)
//   - "Fluency" (used as a leaf) → "Stuttering" (default fluency leaf)
//   - "Oral Mechanism"         → dropped (procedure, not a domain; carried by
//     `measure_type: 'Oral Mechanism Examination'`)
//   - "Adaptive Behavior" / "Developmental" → dropped; tools that screen
//     broadly (Vineland-3, Bayley-4, BDI, ASQ-3, Rossetti, CSBS-DP) instead
//     list only the specific *communication* leaves they touch.

export interface ToolLibraryEntry {
  id: string
  title: string
  full_name: string
  age_range: string
  measure_type: string
  default_purpose: string
  default_domains_assessed: string[]
  _uncertain?: boolean
  _uncertain_note?: string
}

export const TOOL_LIBRARY_SEED: ToolLibraryEntry[] = [
  {
    id: 'all',
    title: 'ALL',
    full_name: 'Assessment of Language and Literacy',
    age_range: 'Pre-K, K5, 1st grade',
    measure_type: 'Standardized Test',
    default_purpose:
      'The ALL is a norm-referenced battery that evaluates early oral language and emergent literacy skills, including listening comprehension, vocabulary, phonological awareness, and print/word knowledge in pre-K through first-grade students.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Semantics / Vocabulary',
      'Literacy-Related Language',
    ],
  },
  {
    id: 'besa',
    title: 'BESA',
    full_name: 'Bilingual English-Spanish Assessment',
    age_range: '4;0-6;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The BESA is a norm-referenced bilingual battery that assesses morphosyntax, semantics, and phonology in both English and Spanish to differentiate language difference from disorder in dual-language preschool and early-elementary children.',
    default_domains_assessed: [
      'Morphology / Syntax',
      'Semantics / Vocabulary',
      'Phonology',
      'Receptive Language',
      'Expressive Language',
    ],
  },
  {
    id: 'casl_2',
    title: 'CASL-2',
    full_name: 'Comprehensive Assessment of Spoken Language',
    age_range: '3;0-21;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The CASL-2 is a norm-referenced oral-language battery that measures lexical/semantic, syntactic, supralinguistic, and pragmatic skills across receptive and expressive modalities in children, adolescents, and young adults aged 3 to 21.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Semantics / Vocabulary',
      'Morphology / Syntax',
      'Social Communication / Pragmatics',
    ],
  },
  {
    id: 'caps',
    title: 'CAPs',
    full_name: 'Clinical Assessment of Pragmatics',
    age_range: '7-18',
    measure_type: 'Standardized Test',
    default_purpose:
      'The CAPs is a norm-referenced video-based assessment that uses scripted social scenarios to evaluate pragmatic language, paralinguistic awareness, and social inferencing in school-age children and adolescents from 7 to 18 years.',
    default_domains_assessed: ['Social Communication / Pragmatics'],
  },
  {
    id: 'ccc_2',
    title: 'CCC-2',
    full_name: "Children's Communication Checklist - Second Edition",
    age_range: '4;0-16;11',
    measure_type: 'Questionnaire',
    default_purpose:
      'The CCC-2 is a norm-referenced caregiver-completed questionnaire that screens speech, syntax, semantics, coherence, and pragmatic/social communication to flag potential language and pragmatic disorders in children aged 4 to 16.',
    default_domains_assessed: [
      'Social Communication / Pragmatics',
      'Receptive Language',
      'Expressive Language',
      'Morphology / Syntax',
      'Semantics / Vocabulary',
    ],
  },
  {
    id: 'celf_p_3',
    title: 'CELF:P-3',
    full_name:
      'Clinical Evaluation of Language Fundamentals - Preschool, Third Edition',
    age_range: '3;0-6;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The CELF:P-3 is a norm-referenced language battery that evaluates receptive and expressive language, including vocabulary, sentence structure, morphology, and following directions, in preschool and early-kindergarten children aged 3 to 6.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Semantics / Vocabulary',
      'Morphology / Syntax',
    ],
  },
  {
    id: 'celf_p_2_spanish',
    title: 'CELF:P-2 (Spanish)',
    full_name:
      'Clinical Evaluation of Language Fundamentals - Preschool, Second Edition (Spanish)',
    age_range: '3;0-6;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The CELF:P-2 (Spanish) is a norm-referenced Spanish-language battery that assesses receptive and expressive language, vocabulary, and sentence structure in Spanish-speaking preschoolers aged 3 to 6.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Semantics / Vocabulary',
      'Morphology / Syntax',
    ],
  },
  {
    id: 'celf_5',
    title: 'CELF-5',
    full_name: 'Clinical Evaluation of Language Fundamentals - Fifth Edition',
    age_range: '5;0-21;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The CELF-5 is a comprehensive norm-referenced language battery that evaluates semantics, morphology, syntax, working memory, and pragmatic skills to identify language disorders in students aged 5 to 21.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Semantics / Vocabulary',
      'Morphology / Syntax',
      'Social Communication / Pragmatics',
    ],
  },
  {
    id: 'ctopp_2',
    title: 'CTOPP-2',
    full_name: 'Comprehensive Test of Phonological Processing - Second Edition',
    age_range: '4;0-24;0',
    measure_type: 'Standardized Test',
    default_purpose:
      'The CTOPP-2 is a norm-referenced battery that measures phonological awareness, phonological memory, and rapid naming to identify reading-related phonological-processing weaknesses in individuals aged 4 to 24.',
    default_domains_assessed: ['Literacy-Related Language'],
  },
  {
    id: 'day_c',
    title: 'DAY-C',
    full_name: 'Developmental Assessment of Young Children - Communication',
    age_range: 'Birth-5;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The DAY-C Communication subtest is a norm-referenced developmental measure that assesses receptive and expressive communication milestones in infants and young children from birth through 5;11.',
    default_domains_assessed: ['Receptive Language', 'Expressive Language'],
  },
  {
    id: 'delv',
    title: 'DELV',
    full_name: 'Diagnostic Evaluation of Language Variation',
    age_range: '4-9',
    measure_type: 'Standardized Test',
    default_purpose:
      'The DELV is a norm-referenced, dialect-sensitive battery that evaluates syntax, pragmatics, semantics, and phonology to differentiate language variation from disorder in children aged 4 to 9, particularly speakers of African American English.',
    default_domains_assessed: [
      'Morphology / Syntax',
      'Social Communication / Pragmatics',
      'Semantics / Vocabulary',
      'Phonology',
    ],
  },
  {
    id: 'dymond',
    title: 'DYMOND',
    full_name: 'Dynamic Measures of Narrative Language and Decoding',
    age_range: '5;0-14;5',
    measure_type: 'Dynamic Assessment',
    default_purpose:
      'The DYMOND is a dynamic, test-teach-retest assessment that measures modifiability of narrative language and decoding skills to differentiate language/literacy disorders from experiential differences in students aged 5 to 14.',
    default_domains_assessed: ['Narrative / Discourse', 'Literacy-Related Language'],
  },
  {
    id: 'esb',
    title: 'ESB',
    full_name: 'Early Sociocognitive Battery',
    age_range: '1;6-4;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The ESB is a norm-referenced battery that evaluates early sociocognitive foundations of communication — joint attention, social responsiveness, and theory-of-mind precursors — in toddlers and preschoolers aged 1;6 to 4;11.',
    default_domains_assessed: ['Social Communication / Pragmatics', 'Receptive Language'],
  },
  {
    id: 'eowpvt_4',
    title: 'EOWPVT-4',
    full_name: 'Expressive One Word Picture Vocabulary Test - Fourth Edition',
    age_range: '2;0-80;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The EOWPVT-4 is a norm-referenced single-word picture-naming test that measures expressive vocabulary by asking the examinee to name pictured nouns, verbs, and concepts across the lifespan from age 2 to 80.',
    default_domains_assessed: ['Semantics / Vocabulary', 'Expressive Language'],
  },
  {
    id: 'evt_3',
    title: 'EVT-3',
    full_name: 'Expressive Vocabulary Test - Third Edition',
    age_range: '2-90',
    measure_type: 'Standardized Test',
    default_purpose:
      'The EVT-3 is a norm-referenced individually administered measure that assesses expressive vocabulary and word retrieval through picture labeling and synonym tasks for examinees aged 2 to 90+.',
    default_domains_assessed: ['Semantics / Vocabulary', 'Expressive Language'],
  },
  {
    id: 'lpt_3',
    title: 'LPT-3',
    full_name: 'Language Processing Test - Third Edition',
    age_range: '5-11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The LPT-3 is a norm-referenced test that assesses language-processing efficiency through hierarchical semantic tasks (associations, categorization, similarities, differences, multiple meanings, attributes) in children aged 5 to 11.',
    default_domains_assessed: [
      'Semantics / Vocabulary',
      'Receptive Language',
      'Expressive Language',
    ],
  },
  {
    id: 'mava',
    title: 'MAVA',
    full_name: 'Montgomery Assessment of Vocabulary Acquisition',
    age_range: '3-12',
    measure_type: 'Standardized Test',
    default_purpose:
      'The MAVA is a norm-referenced vocabulary measure that separately evaluates receptive and expressive single-word vocabulary using parallel picture and naming tasks in children aged 3 to 12.',
    default_domains_assessed: [
      'Semantics / Vocabulary',
      'Receptive Language',
      'Expressive Language',
    ],
  },
  {
    id: 'nlm',
    title: 'NLM',
    full_name: 'Narrative Language Measure (CUBED-3 component)',
    age_range: 'PreK-3rd grade (extends to 8th)',
    measure_type: 'Narrative Assessment',
    default_purpose:
      'The NLM is a criterion-referenced narrative-retell and personal-generation measure (part of CUBED-3) that quantifies macrostructure and microstructure of oral narratives for progress monitoring and screening in students from preK through 8th grade.',
    default_domains_assessed: ['Narrative / Discourse', 'Expressive Language'],
  },
  {
    id: 'owls_2',
    title: 'OWLS-2',
    full_name: 'Oral and Written Language Scales - Second Edition',
    age_range: '3;0-21;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The OWLS-2 is a norm-referenced battery that measures listening comprehension, oral expression, reading comprehension, and written expression to evaluate integrated oral and written language in individuals aged 3 to 21.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Literacy-Related Language',
      'Morphology / Syntax',
      'Semantics / Vocabulary',
    ],
  },
  {
    id: 'pls_5',
    title: 'PLS-5',
    full_name: 'Preschool Language Scales - Fifth Edition',
    age_range: 'Birth-7;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The PLS-5 is a norm-referenced play-based language battery that evaluates auditory comprehension and expressive communication, including early vocabulary and sentence structure, in children from birth to 7;11.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Semantics / Vocabulary',
      'Morphology / Syntax',
    ],
  },
  {
    id: 'pls_5_spanish',
    title: 'PLS-5 (Spanish)',
    full_name: 'Preschool Language Scales - Fifth Edition (Spanish)',
    age_range: 'Birth-7;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The PLS-5 (Spanish) is a norm-referenced Spanish-language battery that assesses auditory comprehension and expressive communication in Spanish-speaking children from birth to 7;11.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Semantics / Vocabulary',
      'Morphology / Syntax',
    ],
  },
  {
    id: 'ppvt_4',
    title: 'PPVT-4',
    full_name: 'Peabody Picture Vocabulary Test - Fourth Edition',
    age_range: '2;6-90+',
    measure_type: 'Standardized Test',
    default_purpose:
      'The PPVT-4 is a norm-referenced picture-pointing test that measures receptive (single-word) vocabulary by having the examinee select the picture matching a spoken word, for examinees aged 2;6 to 90+.',
    default_domains_assessed: ['Semantics / Vocabulary', 'Receptive Language'],
  },
  {
    id: 'resca_e',
    title: 'RESCA-E',
    full_name: 'Receptive, Expressive, and Social Communication Assessment - Elementary',
    age_range: '5-12',
    measure_type: 'Standardized Test',
    default_purpose:
      'The RESCA-E is a norm-referenced battery that evaluates receptive language, expressive language, and social communication, including pragmatic and inferencing skills, in elementary-age students from 5 to 12.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Social Communication / Pragmatics',
      'Semantics / Vocabulary',
    ],
  },
  {
    id: 'rowpvt',
    title: 'ROWPVT',
    full_name: 'Receptive One Word Picture Vocabulary Test',
    age_range: '2-80',
    measure_type: 'Standardized Test',
    default_purpose:
      'The ROWPVT is a norm-referenced single-word picture-pointing test that measures receptive vocabulary by having the examinee identify the picture matching a spoken target across the lifespan from age 2 to 80.',
    default_domains_assessed: ['Semantics / Vocabulary', 'Receptive Language'],
  },
  {
    id: 'reel_3',
    title: 'REEL-3',
    full_name: 'Receptive-Expressive Emergent Language Scale - Third Edition',
    age_range: 'Infants-age 3',
    measure_type: 'Standardized Test',
    default_purpose:
      'The REEL-3 is a norm-referenced caregiver-interview-based measure that assesses receptive and expressive emergent language milestones in infants and toddlers from birth to age 3.',
    default_domains_assessed: ['Receptive Language', 'Expressive Language'],
  },
  {
    id: 'sldt_e',
    title: 'SLDT:E',
    full_name: 'Social Language Development Test - Elementary (Norms Updated)',
    age_range: '6-11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The SLDT:E is a norm-referenced test that evaluates social-pragmatic language skills — perspective taking, making inferences, negotiating, and supporting peers — in elementary students aged 6 to 11.',
    default_domains_assessed: ['Social Communication / Pragmatics', 'Expressive Language'],
  },
  {
    id: 'sldt_a',
    title: 'SLDT:A',
    full_name: 'Social Language Development Test - Adolescent (Norms Updated)',
    age_range: '12-18',
    measure_type: 'Standardized Test',
    default_purpose:
      'The SLDT:A is a norm-referenced test that evaluates higher-level social-pragmatic language skills, including making inferences, interpreting ironic language, problem-solving social situations, and interpreting social cues, in adolescents aged 12 to 18.',
    default_domains_assessed: ['Social Communication / Pragmatics', 'Expressive Language'],
  },
  {
    id: 'spelt_p_2',
    title: 'SPELT:P-2',
    full_name:
      'Structured Photographic Expressive Language Test - Preschool, Second Edition',
    age_range: '3;0-5;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The SPELT:P-2 is a norm-referenced photo-elicitation test that uses structured prompts to assess expressive morphology and syntax in preschoolers aged 3;0 to 5;11.',
    default_domains_assessed: ['Morphology / Syntax', 'Expressive Language'],
  },
  {
    id: 'spelt_iii',
    title: 'SPELT-III',
    full_name: 'Structured Photographic Expressive Language Test - Third Edition',
    age_range: '4;0-9;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The SPELT-III is a norm-referenced photo-elicitation test that evaluates expressive morphology and syntax through structured prompts, targeting school-age children from 4;0 to 9;11.',
    default_domains_assessed: ['Morphology / Syntax', 'Expressive Language'],
  },
  {
    id: 'sugar',
    title: 'SUGAR',
    full_name: 'Sampling Utterances and Grammatical Analysis Revised',
    age_range: '3-7;11',
    measure_type: 'Language Sample',
    default_purpose:
      'SUGAR is a standardized language-sample analysis protocol that derives MLU, words-per-sentence, clauses-per-sentence, and total-number-of-words metrics from a 50-utterance conversational sample for children aged 3 to 7;11.',
    default_domains_assessed: ['Morphology / Syntax', 'Expressive Language'],
  },
  {
    id: 'teem',
    title: 'TEEM',
    full_name: 'Test for Examining Expressive Morphology',
    age_range: '3;0-7;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The TEEM is a norm-referenced cloze-style test that uses sentence-completion prompts to evaluate expressive use of grammatical morphemes (plurals, possessives, verb tense, derivational forms) in children aged 3;0 to 7;11.',
    default_domains_assessed: ['Morphology / Syntax', 'Expressive Language'],
  },
  {
    id: 'tills',
    title: 'TILLS',
    full_name: 'Test of Integrated Language and Literacy Skills',
    age_range: '6;0-18;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The TILLS is a norm-referenced battery that evaluates integrated oral and written language across listening, speaking, reading, and writing, including phonological awareness and working memory, to identify language/literacy disorders in students aged 6 to 18.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Literacy-Related Language',
      'Morphology / Syntax',
      'Semantics / Vocabulary',
    ],
  },
  {
    id: 'tnl_3',
    title: 'TNL-3',
    full_name: 'Test of Narrative Language - Third Edition',
    age_range: '4;0-15;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The TNL-3 is a norm-referenced test that measures narrative comprehension and oral narrative production using scripted, picture-supported, and no-cue tasks in children and adolescents aged 4 to 15.',
    default_domains_assessed: [
      'Narrative / Discourse',
      'Receptive Language',
      'Expressive Language',
    ],
  },
  {
    id: 'told_p_5',
    title: 'TOLD:P-5',
    full_name: 'Test of Oral Language Development - Primary, Fifth Edition',
    age_range: '4;0-8;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The TOLD:P-5 is a norm-referenced battery that measures spoken vocabulary, grammar, and word-discrimination/articulation skills across receptive and expressive modalities in children aged 4;0 to 8;11.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Semantics / Vocabulary',
      'Morphology / Syntax',
      'Phonology',
    ],
  },
  {
    id: 'told_i_4',
    title: 'TOLD:I-4',
    full_name: 'Test of Oral Language Development - Intermediate, Fourth Edition',
    age_range: '8;0-17;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The TOLD:I-4 is a norm-referenced battery that measures higher-level spoken vocabulary, grammar, and morphosyntactic skills across receptive and expressive modalities in students aged 8;0 to 17;11.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Semantics / Vocabulary',
      'Morphology / Syntax',
    ],
  },

  // --- Extended catalog (Source: report.md + NY EI Appendix D) ---

  // Articulation / phonology / motor speech
  {
    id: 'gfta_3',
    title: 'GFTA-3',
    full_name: 'Goldman-Fristoe Test of Articulation - Third Edition',
    age_range: '2;0-21;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The GFTA-3 is a norm-referenced articulation test that evaluates consonant production at the word and sentence levels through sounds-in-words, sounds-in-sentences, and stimulability subtests for individuals aged 2 to 21.',
    default_domains_assessed: ['Articulation', 'Intelligibility'],
  },
  {
    id: 'arizona_4',
    title: 'Arizona-4',
    full_name: 'Arizona Articulation and Phonology Scale - Fourth Edition',
    age_range: '1;6-21;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The Arizona-4 is a norm-referenced measure that evaluates speech-sound production, intelligibility, and phonological/articulatory impairment via connected-speech and phonology tasks, yielding standard scores and percentile ranks for ages 18 months to 21 years.',
    default_domains_assessed: ['Articulation', 'Phonology', 'Intelligibility'],
  },
  {
    id: 'happ_3',
    title: 'HAPP-3',
    full_name: 'Hodson Assessment of Phonological Patterns - Third Edition',
    age_range: '2;0+',
    measure_type: 'Standardized Test',
    default_purpose:
      'The HAPP-3 is a norm-referenced phonological assessment designed for highly unintelligible children that identifies phonological pattern deviations and assigns severity ratings to guide intervention for children aged 2 and older.',
    default_domains_assessed: ['Phonology', 'Intelligibility'],
  },
  {
    id: 'caap_2',
    title: 'CAAP-2',
    full_name: 'Clinical Assessment of Articulation and Phonology - Second Edition',
    age_range: '2;6-11;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The CAAP-2 is a norm-referenced test that samples single-word and connected-speech production to identify articulation errors and phonological patterns in children aged 2;6 to 11;11.',
    default_domains_assessed: ['Articulation', 'Phonology'],
  },
  {
    id: 'lat',
    title: 'LAT',
    full_name: 'LinguiSystems Articulation Test',
    age_range: '3;0-21;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The LAT is a norm-referenced articulation test that evaluates all consonants and consonant blends, rates severity and stimulability, and screens for childhood apraxia of speech in individuals aged 3 to 21.',
    default_domains_assessed: ['Articulation', 'Motor Speech / Apraxia / Dysarthria'],
  },
  {
    id: 'pat_3',
    title: 'PAT-3',
    full_name: 'Photo Articulation Test - Third Edition',
    age_range: '3;0-8;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The PAT-3 is a norm-referenced articulation test that uses quick picture-naming tasks to identify articulation errors and yields standard scores for children aged 3 to 8.',
    default_domains_assessed: ['Articulation'],
  },
  {
    id: 'kspt',
    title: 'KSPT',
    full_name: 'Kaufman Speech Praxis Test for Children',
    age_range: '2;0-5;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The KSPT is a norm-referenced motor speech assessment that evaluates a child\'s ability to plan and sequence oral-motor movements, progressing from simple oral movements to complex syllable sequences to identify childhood apraxia of speech in children aged 2 to 5;11.',
    default_domains_assessed: ['Motor Speech / Apraxia / Dysarthria', 'Articulation'],
  },
  {
    id: 'demss',
    title: 'DEMSS',
    full_name: 'Dynamic Evaluation of Motor Speech Skills',
    age_range: '3;0+',
    measure_type: 'Criterion-Referenced',
    default_purpose:
      'The DEMSS is a criterion-referenced assessment administered in 30 minutes or less that evaluates children with severe speech impairments to diagnose childhood apraxia of speech and provides severity scores to guide treatment for children aged 3 and older.',
    default_domains_assessed: ['Motor Speech / Apraxia / Dysarthria', 'Articulation'],
  },
  {
    id: 'osmse_3',
    title: 'OSMSE-3',
    full_name: 'Oral Speech Mechanism Screening Examination - Third Edition',
    age_range: '5;0-78;0',
    measure_type: 'Standardized Test',
    default_purpose:
      'The OSMSE-3 is a brief 5-10 minute norm-referenced screener that evaluates the structure and function of the lips, tongue, jaw, palate, and velopharyngeal mechanism, providing age-based pass/fail cutoff scores for examinees aged 5 to 78.',
    default_domains_assessed: [],
  },
  {
    id: 'oral_motor_exam_informal',
    title: 'Oral-Motor and Speech Mechanism Exam',
    full_name: 'Oral-Motor and Speech Mechanism Examination (Informal)',
    age_range: 'All ages',
    measure_type: 'Oral Mechanism Examination',
    default_purpose:
      'The informal oral-motor and speech mechanism exam is a clinician-administered descriptive evaluation of lip, tongue, jaw, and velopharyngeal structure and function — including range of motion, strength, and diadochokinetic rate — used to identify structural or neuromotor deficits across all ages.',
    default_domains_assessed: [],
  },

  // Receptive / expressive language (additions not in SC seed)
  {
    id: 'plai_2',
    title: 'PLAI-2',
    full_name: 'Preschool Language Assessment Instrument - Second Edition',
    age_range: '3;0-5;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The PLAI-2 is a norm-referenced measure that assesses a preschooler\'s ability to meet classroom discourse demands across levels of abstraction (matching, analyzing, reasoning) and modes of response in children aged 3 to 5.',
    default_domains_assessed: ['Receptive Language', 'Expressive Language'],
  },
  {
    id: 'itpa_3',
    title: 'ITPA-3',
    full_name: 'Illinois Test of Psycholinguistic Abilities - Third Edition',
    age_range: '5;0-12;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The ITPA-3 is a norm-referenced battery that evaluates expressive and receptive oral and written language functions — listening, speaking, reading, and writing — through balanced subtests for students aged 5 to 12.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Literacy-Related Language',
      'Morphology / Syntax',
    ],
  },
  {
    id: 'mb_cdi',
    title: 'MB-CDI',
    full_name: 'MacArthur-Bates Communicative Development Inventories',
    age_range: '8 mo-3;0',
    measure_type: 'Questionnaire',
    default_purpose:
      'The MB-CDI is a norm-referenced caregiver-completed checklist that assesses early language development through inventories of words, gestures, and communicative functions for infants and toddlers aged 8 months to 3 years.',
    default_domains_assessed: [
      'Semantics / Vocabulary',
      'Expressive Language',
      'Receptive Language',
    ],
  },
  {
    id: 'teld_4',
    title: 'TELD-4',
    full_name: 'Test of Early Language Development - Fourth Edition',
    age_range: '3;0-7;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The TELD-4 is a norm-referenced measure that evaluates early receptive and expressive spoken language — including semantics and morphosyntax — to identify language delays in children aged 3;0 to 7;11.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Semantics / Vocabulary',
      'Morphology / Syntax',
    ],
  },

  // Pragmatics / social communication
  {
    id: 'topl_2',
    title: 'TOPL-2',
    full_name: 'Test of Pragmatic Language - Second Edition',
    age_range: '6;0-18;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The TOPL-2 is a norm-referenced test that evaluates social communication in context — including listening, choosing appropriate content, expressing feelings, and making requests — across multiple subtests for children and adolescents aged 6 to 18.',
    default_domains_assessed: ['Social Communication / Pragmatics'],
  },
  {
    id: 'scq',
    title: 'SCQ',
    full_name: 'Social Communication Questionnaire',
    age_range: '4;0+ (mental age >2;0)',
    measure_type: 'Questionnaire',
    default_purpose:
      'The SCQ is a norm-referenced 40-item caregiver-completed yes/no screener that evaluates social communication behaviors paralleling the ADI-R, with cutoff scores indicating risk for autism spectrum disorder in individuals aged 4 and older with a mental age above 2.',
    default_domains_assessed: ['Social Communication / Pragmatics'],
  },
  {
    id: 'plsi',
    title: 'PLSI',
    full_name: 'Pragmatic Language Skills Inventory',
    age_range: '5;0-12;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The PLSI is a norm-referenced rating scale that assesses pragmatic language across personal, social, and classroom interaction skills, providing standard scores for children aged 5 to 12.',
    default_domains_assessed: ['Social Communication / Pragmatics'],
  },
  {
    id: 'plos',
    title: 'PLOS',
    full_name: 'Pragmatic Language Observation Scale',
    age_range: '8;0-17;11',
    measure_type: 'Teacher Report',
    default_purpose:
      'The PLOS is a norm-referenced 30-item teacher rating scale that evaluates classroom spoken-language pragmatic behaviors and yields raw scores, percentile ranks, and standard scores for students aged 8 to 17.',
    default_domains_assessed: ['Social Communication / Pragmatics'],
  },
  {
    id: 'scds',
    title: 'SCDS',
    full_name: 'Social Communication Disorder Scale',
    age_range: '4;0-18;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The SCDS is a norm-referenced DSM-5-aligned screener that identifies social communication disorder via age- and gender-adjusted standard scores and percentile ranks for children and adolescents aged 4 to 18.',
    default_domains_assessed: ['Social Communication / Pragmatics'],
  },
  {
    id: 'language_sample_analysis',
    title: 'Language Sample Analysis',
    full_name: 'Language Sample Analysis (LSA)',
    age_range: 'All ages',
    measure_type: 'Language Sample',
    default_purpose:
      'Language sample analysis is an informal procedure in which the SLP collects and transcribes spontaneous speech or writing to derive measures such as mean length of utterance and percent grammatical utterances, providing a naturalistic view of language use comparable against databases like SALT, SUGAR, or CLAN.',
    default_domains_assessed: [
      'Expressive Language',
      'Morphology / Syntax',
      'Social Communication / Pragmatics',
      'Semantics / Vocabulary',
    ],
  },
  {
    id: 'dynamic_assessment_pragmatic',
    title: 'Dynamic Assessment (Social/Pragmatic)',
    full_name: 'Dynamic Assessment of Social/Pragmatic Skills',
    age_range: 'All ages',
    measure_type: 'Dynamic Assessment',
    default_purpose:
      'Dynamic assessment of social/pragmatic skills is an interactive test-teach-retest procedure that measures performance while providing mediated learning, highlighting modifiability to distinguish language differences from disorder, especially for culturally and linguistically diverse clients across all ages.',
    default_domains_assessed: ['Social Communication / Pragmatics'],
  },

  // Fluency
  {
    id: 'ssi_4',
    title: 'SSI-4',
    full_name: 'Stuttering Severity Instrument - Fourth Edition',
    age_range: '2;10+',
    measure_type: 'Standardized Test',
    default_purpose:
      'The SSI-4 is a norm-referenced fluency measure that quantifies stuttering severity by evaluating frequency, duration, physical concomitants, and speech naturalness across the lifespan.',
    default_domains_assessed: ['Stuttering'],
  },
  {
    id: 'tocs',
    title: 'TOCS',
    full_name: 'Test of Childhood Stuttering',
    age_range: '4;0-12;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The TOCS is a norm-referenced fluency measure that uses standardized subtests (rapid picture naming, modeled sentences, structured conversation, narration) plus parent/teacher rating scales to differentiate children who stutter from typically fluent peers aged 4 to 12.',
    default_domains_assessed: ['Stuttering'],
  },
  {
    id: 'oases',
    title: 'OASES',
    full_name: "Overall Assessment of the Speaker's Experience of Stuttering",
    age_range: '7;0+',
    measure_type: 'Standardized Test',
    default_purpose:
      'The OASES is a norm-referenced self-report instrument with age-specific forms for school-age children, teens, and adults that measures the impact of stuttering on daily living through Likert-scale items covering reactions, functional communication, and quality of life for individuals aged 7 and older.',
    default_domains_assessed: ['Stuttering'],
  },
  {
    id: 'spi',
    title: 'SPI',
    full_name: 'Stuttering Prediction Instrument',
    age_range: '3;0-8;11',
    measure_type: 'Informal Assessment',
    default_purpose:
      'The SPI is an informal fluency measure that uses observation and parent input to evaluate frequency and type of disfluencies along with child reactions to predict the likelihood of persistent stuttering in preschool and early-elementary children aged 3 to 8.',
    default_domains_assessed: ['Stuttering'],
  },

  // Voice
  {
    id: 'cape_v',
    title: 'CAPE-V',
    full_name: 'Consensus Auditory-Perceptual Evaluation of Voice',
    age_range: 'Adolescents & adults',
    measure_type: 'Informal Assessment',
    default_purpose:
      'The CAPE-V is a clinician-rated perceptual voice protocol that uses 100 mm visual analogue scales to rate overall severity, roughness, breathiness, strain, pitch, and loudness, generating hypotheses about physiological bases of voice quality in adolescents and adults.',
    default_domains_assessed: ['Quality', 'Pitch', 'Loudness'],
  },
  {
    id: 'grbas',
    title: 'GRBAS',
    full_name: 'GRBAS Scale',
    age_range: 'All ages',
    measure_type: 'Informal Assessment',
    default_purpose:
      'The GRBAS is a clinician-rated 4-point perceptual voice scale that assesses Grade, Roughness, Breathiness, Asthenia, and Strain to characterize voice quality across all ages.',
    default_domains_assessed: ['Quality'],
  },
  {
    id: 'vhi',
    title: 'VHI',
    full_name: 'Voice Handicap Index',
    age_range: 'Teens & adults',
    measure_type: 'Questionnaire',
    default_purpose:
      'The VHI is a 30-item self-report voice questionnaire that measures the physical, functional, and emotional consequences of voice disorders on a 0-4 Likert scale, producing severity classifications to guide therapy for adolescents and adults.',
    default_domains_assessed: ['Vocal Function', 'Quality'],
  },

  // Narrative / literacy / autism screening
  {
    id: 'rita_t',
    title: 'RITA-T',
    full_name: 'Rapid Interactive Screening Test for Autism in Toddlers',
    age_range: '1;6-3;0',
    measure_type: 'Standardized Test',
    default_purpose:
      'The RITA-T is a norm-referenced play-based autism screener that evaluates joint attention, visual problem solving, social awareness, and early social communication, yielding cutoff scores to identify toddlers aged 18-36 months who warrant further evaluation.',
    default_domains_assessed: ['Social Communication / Pragmatics'],
  },

  // Early communication / developmental (NY EI Appendix D + report Section 8)
  {
    id: 'asq_3',
    title: 'ASQ-3',
    full_name: 'Ages and Stages Questionnaires - Third Edition',
    age_range: '1-66 mo',
    measure_type: 'Questionnaire',
    default_purpose:
      'The ASQ-3 is a norm-referenced parent-completed developmental screener that evaluates communication, gross motor, fine motor, problem-solving, and personal-social skills with age-based cutoffs to flag children aged 1 to 66 months for further evaluation.',
    default_domains_assessed: ['Receptive Language', 'Expressive Language'],
  },
  {
    id: 'bayley_4',
    title: 'Bayley-4',
    full_name: 'Bayley Scales of Infant and Toddler Development - Fourth Edition',
    age_range: '1-42 mo',
    measure_type: 'Standardized Test',
    default_purpose:
      'The Bayley-4 is a comprehensive norm-referenced developmental assessment that evaluates cognitive, language, motor, social-emotional, and adaptive behavior domains through a mix of direct administration and caregiver report for infants and toddlers aged 1 to 42 months.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Social Communication / Pragmatics',
    ],
  },
  {
    id: 'vineland_3',
    title: 'Vineland-3',
    full_name: 'Vineland Adaptive Behavior Scales - Third Edition',
    age_range: 'Birth-90+',
    measure_type: 'Standardized Test',
    default_purpose:
      'The Vineland-3 is a norm-referenced caregiver- and teacher-report measure that evaluates adaptive behavior across communication, daily living skills, socialization, and motor domains to inform diagnosis and intervention planning across the lifespan from birth to 90+.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Social Communication / Pragmatics',
    ],
  },
  {
    id: 'csbs_dp',
    title: 'CSBS-DP',
    full_name: 'Communication and Symbolic Behavior Scales - Developmental Profile',
    age_range: '6-24 mo (up to 72 mo for atypical development)',
    measure_type: 'Standardized Test',
    default_purpose:
      'The CSBS-DP is a norm-referenced standardized assessment that evaluates communicative functions, gesture use, vocal/verbal means, reciprocity, social-affective signalling, and symbolic behavior through caregiver interview and direct play observation for infants and toddlers with functional ages 6 to 24 months.',
    default_domains_assessed: [
      'Social Communication / Pragmatics',
      'Expressive Language',
      'Receptive Language',
    ],
  },
  {
    id: 'rossetti',
    title: 'Rossetti',
    full_name: 'Rossetti Infant-Toddler Language Scale',
    age_range: 'Birth-3;0',
    measure_type: 'Criterion-Referenced',
    default_purpose:
      'The Rossetti is a criterion-referenced assessment that evaluates interaction-attachment, pragmatics, gesture, play, language comprehension, and language expression through observation, elicitation, and parent report for infants and toddlers from birth to 3 years.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Social Communication / Pragmatics',
    ],
  },
  {
    id: 'bdi',
    title: 'BDI',
    full_name: 'Battelle Developmental Inventory',
    age_range: 'Birth-7;11',
    measure_type: 'Standardized Test',
    default_purpose:
      'The BDI is a norm-referenced comprehensive developmental assessment that evaluates personal-social, adaptive, motor, communication, and cognitive skills using caregiver interview, structured tasks, and observation, yielding developmental quotients for children from birth to 7;11.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Social Communication / Pragmatics',
    ],
  },

  // Procedure-type / non-standardized
  {
    id: 'parent_caregiver_interview',
    title: 'Parent/Caregiver Interview',
    full_name: 'Parent/Caregiver Interview',
    age_range: 'All ages',
    measure_type: 'Interview',
    default_purpose:
      'A parent/caregiver interview is a structured or semi-structured clinician-led conversation that gathers information about a child\'s communication history, developmental milestones, daily functioning across settings, and family concerns to inform culturally and linguistically responsive evaluation across all ages.',
    default_domains_assessed: [
      'Receptive Language',
      'Expressive Language',
      'Social Communication / Pragmatics',
    ],
  },
  {
    id: 'classroom_observation',
    title: 'Classroom Observation',
    full_name: 'Classroom Observation',
    age_range: 'School age',
    measure_type: 'Observation',
    default_purpose:
      'A classroom observation is a clinician-conducted naturalistic observation of a student\'s communication, social interaction, and academic engagement within the typical instructional setting to evaluate functional language use and educational impact in school-age children.',
    default_domains_assessed: [
      'Social Communication / Pragmatics',
      'Receptive Language',
      'Expressive Language',
    ],
  },
]
