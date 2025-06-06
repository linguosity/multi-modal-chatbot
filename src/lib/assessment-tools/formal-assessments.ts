import type { AssessmentTool, AssessmentToolsCollection } from './types';

/**
 * Formal Assessment Tools Collection
 * Standardized tests with normative data and quantitative scoring
 */
export const formalAssessmentTools: AssessmentToolsCollection = {
  "taps4": {
    id: "taps4",
    name: "Test of Auditory Processing Skills - Fourth Edition (TAPS-4)",
    year: "2018",
    authors: ["Donna Geffner", "Ronald Goldman"],
    targetPopulation: "Children with suspected auditory processing disorders",
    targetAgeRange: "5-21 years",
    type: "quantitative",
    domains: ["receptive"],
    description: "Assesses auditory processing abilities including word discrimination, phonological processing, and auditory memory.",
    subtests: [
      {
        name: "Word Discrimination",
        description: "Assesses ability to differentiate between similar-sounding words",
        domain: "receptive"
      },
      {
        name: "Phonological Segmentation",
        description: "Measures ability to manipulate sounds within words",
        domain: "receptive"
      },
      {
        name: "Phonological Blending",
        description: "Evaluates ability to blend sounds into words",
        domain: "receptive"
      },
      {
        name: "Number Memory Forward",
        description: "Assesses auditory memory for sequences of numbers",
        domain: "receptive"
      },
      {
        name: "Number Memory Reversed",
        description: "Measures working memory involving manipulation of auditory information",
        domain: "receptive"
      }
    ],
    caveats: [
      "Not a comprehensive test of language",
      "Performance may be affected by attention and working memory skills",
      "Does not directly assess receptive vocabulary or syntax"
    ],
    references: [
      "Geffner, D., & Goldman, R. (2018). Test of Auditory Processing Skills–Fourth Edition (TAPS-4). Novato, CA: Academic Therapy Publications."
    ]
  },
  
  "ppvt5": {
    id: "ppvt5",
    name: "Peabody Picture Vocabulary Test - Fifth Edition (PPVT-5)",
    year: "2019",
    authors: ["Lloyd M. Dunn", "Douglas M. Dunn", "Leota M. Dunn"],
    targetPopulation: "Individuals with suspected receptive vocabulary deficits",
    targetAgeRange: "2.5-90+ years",
    type: "quantitative",
    domains: ["receptive"],
    description: "Measures receptive vocabulary knowledge by having examinees point to pictures that represent spoken words.",
    subtests: [
      {
        name: "Receptive Vocabulary",
        description: "Measures understanding of single words through picture identification",
        domain: "receptive"
      }
    ],
    caveats: [
      "Only assesses single-word vocabulary comprehension",
      "Does not assess expressive vocabulary or connected language",
      "Cultural bias may affect performance for some populations"
    ],
    references: [
      "Dunn, L. M., Dunn, D. M., & Dunn, L. M. (2019). Peabody Picture Vocabulary Test–Fifth Edition (PPVT-5). Bloomington, MN: NCS Pearson."
    ]
  },
  
  "ctopp2": {
    id: "ctopp2",
    name: "Comprehensive Test of Phonological Processing - Second Edition (CTOPP-2)",
    year: "2013",
    authors: ["Richard K. Wagner", "Joseph K. Torgesen", "Carol A. Rashotte", "Nils A. Pearson"],
    targetPopulation: "Individuals with suspected phonological processing deficits",
    targetAgeRange: "4-24 years",
    type: "quantitative",
    domains: ["receptive", "expressive"],
    description: "Assesses phonological awareness, phonological memory, and rapid naming abilities.",
    subtests: [
      {
        name: "Elision",
        description: "Measures ability to remove phonological segments from spoken words to form other words",
        domain: "expressive"
      },
      {
        name: "Blending Words",
        description: "Assesses ability to synthesize sounds to form words",
        domain: "receptive"
      },
      {
        name: "Sound Matching",
        description: "Evaluates ability to identify words with the same initial or final sounds",
        domain: "receptive"
      },
      {
        name: "Memory for Digits",
        description: "Measures ability to repeat sequences of numbers accurately",
        domain: "expressive"
      },
      {
        name: "Rapid Digit Naming",
        description: "Assesses speed of naming sequences of digits",
        domain: "expressive"
      }
    ],
    caveats: [
      "Not a comprehensive language assessment",
      "Results should be interpreted in context of overall language abilities",
      "Performance may be affected by attention and working memory"
    ],
    references: [
      "Wagner, R. K., Torgesen, J. K., Rashotte, C. A., & Pearson, N. A. (2013). Comprehensive Test of Phonological Processing–Second Edition (CTOPP-2). Austin, TX: PRO-ED."
    ]
  },
  
  "owls2": {
    id: "owls2",
    name: "Oral and Written Language Scales - Second Edition (OWLS-2)",
    year: "2011",
    authors: ["Elizabeth Carrow-Woolfolk"],
    targetPopulation: "Children and adolescents with suspected oral and written language disorders",
    targetAgeRange: "3-21 years",
    type: "quantitative",
    domains: ["receptive", "expressive"],
    description: "Comprehensive assessment of receptive and expressive language in both oral and written domains.",
    subtests: [
      {
        name: "Listening Comprehension",
        description: "Measures understanding of spoken language",
        domain: "receptive"
      },
      {
        name: "Oral Expression",
        description: "Evaluates ability to use spoken language to respond to questions and complete sentences",
        domain: "expressive"
      },
      {
        name: "Reading Comprehension",
        description: "Assesses understanding of written text",
        domain: "receptive"
      },
      {
        name: "Written Expression",
        description: "Evaluates ability to communicate through writing",
        domain: "expressive"
      }
    ],
    caveats: [
      "Administration can be lengthy if all scales are used",
      "Cultural and linguistic factors should be considered in interpretation",
      "Written scales may not be appropriate for younger children"
    ],
    references: [
      "Carrow-Woolfolk, E. (2011). Oral and Written Language Scales–Second Edition (OWLS-2). Los Angeles, CA: Western Psychological Services."
    ]
  },
  
  "klpa3": {
    id: "klpa3",
    name: "Khan-Lewis Phonological Analysis - Third Edition (KLPA-3)",
    year: "2015",
    authors: ["Linda Khan", "Nancy Lewis"],
    targetPopulation: "Children with suspected phonological process disorders",
    targetAgeRange: "2-21 years",
    type: "quantitative",
    domains: ["articulation"],
    description: "In-depth analysis of phonological processes using the same stimulus words as the GFTA-3.",
    subtests: [
      {
        name: "Phonological Process Analysis",
        description: "Identifies and quantifies common phonological processes",
        domain: "articulation"
      }
    ],
    caveats: [
      "Typically administered in conjunction with GFTA-3",
      "Does not provide comprehensive assessment of all speech sound production issues",
      "Cultural and dialectal considerations necessary for interpretation"
    ],
    references: [
      "Khan, L., & Lewis, N. (2015). Khan-Lewis Phonological Analysis–Third Edition (KLPA-3). Bloomington, MN: NCS Pearson."
    ]
  },
  
  "teld4": {
    id: "teld4",
    name: "Test of Early Language Development - Fourth Edition (TELD-4)",
    year: "2018",
    authors: ["Wayne P. Hresko", "D. Kim Reid", "Donald D. Hammill"],
    targetPopulation: "Young children with suspected language delays",
    targetAgeRange: "3-7;11 years",
    type: "quantitative",
    domains: ["receptive", "expressive"],
    description: "Assessment of receptive and expressive language development in young children.",
    subtests: [
      {
        name: "Receptive Language",
        description: "Evaluates understanding of spoken language through picture identification and following directions",
        domain: "receptive"
      },
      {
        name: "Expressive Language",
        description: "Assesses ability to produce language through naming, sentence completion, and answering questions",
        domain: "expressive"
      }
    ],
    caveats: [
      "Limited assessment of complex language skills",
      "May not be sensitive to subtle language impairments",
      "Consider cultural and dialectal variations in interpretation"
    ],
    references: [
      "Hresko, W. P., Reid, D. K., & Hammill, D. D. (2018). Test of Early Language Development–Fourth Edition (TELD-4). Austin, TX: PRO-ED."
    ]
  },
  
  "sst4": {
    id: "sst4",
    name: "Stuttering Severity Instrument - Fourth Edition (SSI-4)",
    year: "2009",
    authors: ["Glyndon D. Riley"],
    targetPopulation: "Individuals who stutter",
    targetAgeRange: "2-adult",
    type: "quantitative",
    domains: ["fluency"],
    description: "Standardized assessment for measuring stuttering frequency, duration, physical concomitants, and severity.",
    subtests: [
      {
        name: "Frequency Measurement",
        description: "Calculates percentage of stuttered syllables in speech samples",
        domain: "fluency"
      },
      {
        name: "Duration Assessment",
        description: "Measures average length of the three longest stuttering events",
        domain: "fluency"
      },
      {
        name: "Physical Concomitants",
        description: "Evaluates observable physical behaviors associated with stuttering",
        domain: "fluency"
      }
    ],
    caveats: [
      "Snapshot view may not represent typical stuttering patterns",
      "Does not assess impact on communication or quality of life",
      "Client awareness of assessment may affect stuttering frequency",
      "Does not evaluate covert stuttering behaviors"
    ],
    references: [
      "Riley, G. D. (2009). Stuttering Severity Instrument–Fourth Edition (SSI-4). Austin, TX: PRO-ED."
    ]
  },
  
  "cape_v": {
    id: "cape_v",
    name: "Consensus Auditory-Perceptual Evaluation of Voice (CAPE-V)",
    year: "2009",
    authors: ["American Speech-Language-Hearing Association"],
    targetPopulation: "Individuals with voice disorders",
    targetAgeRange: "5-adult",
    type: "mixed",
    domains: ["voice"],
    description: "Standardized protocol for perceptual evaluation of voice quality across multiple parameters.",
    subtests: [
      {
        name: "Overall Severity",
        description: "Global rating of voice deviation from normal",
        domain: "voice"
      },
      {
        name: "Roughness",
        description: "Assessment of perceived vocal roughness or harshness",
        domain: "voice"
      },
      {
        name: "Breathiness",
        description: "Evaluation of audible air escape during phonation",
        domain: "voice"
      },
      {
        name: "Strain",
        description: "Perception of vocal effort or tension",
        domain: "voice"
      },
      {
        name: "Pitch",
        description: "Rating of pitch appropriateness and variation",
        domain: "voice"
      },
      {
        name: "Loudness",
        description: "Assessment of vocal intensity appropriateness",
        domain: "voice"
      }
    ],
    caveats: [
      "Subjective nature requires clinical expertise",
      "Inter-rater reliability can vary",
      "Should be supplemented with acoustic and physiological measures",
      "Limited normative data for comparison"
    ],
    references: [
      "American Speech-Language-Hearing Association. (2009). Consensus Auditory-Perceptual Evaluation of Voice (CAPE-V). Special Interest Division 3, Voice and Voice Disorders."
    ]
  },
  
  "tops3e": {
    id: "tops3e",
    name: "Test of Problem Solving - Third Edition: Elementary (TOPS-3E)",
    year: "2013",
    authors: ["Linda Bowers", "Rosemary Huisingh", "Carolyn LoGiudice"],
    targetPopulation: "Children with suspected language-based critical thinking deficits",
    targetAgeRange: "6-12;11 years",
    type: "quantitative",
    domains: ["receptive", "expressive", "pragmatic"],
    description: "Assesses language-based thinking skills including problem solving, critical thinking, and reasoning.",
    subtests: [
      {
        name: "Making Inferences",
        description: "Measures ability to draw logical conclusions from given information",
        domain: "receptive"
      },
      {
        name: "Sequencing",
        description: "Assesses ability to arrange ideas in logical temporal order",
        domain: "expressive"
      },
      {
        name: "Negative Questions",
        description: "Evaluates understanding and formulation of questions with negative elements",
        domain: "receptive"
      },
      {
        name: "Problem Solving",
        description: "Assesses ability to identify problems and generate solutions",
        domain: "pragmatic"
      },
      {
        name: "Predicting",
        description: "Measures ability to anticipate outcomes based on given information",
        domain: "pragmatic"
      }
    ],
    caveats: [
      "Performance influenced by vocabulary knowledge and world experience",
      "Cultural and socioeconomic factors may affect test performance",
      "Does not comprehensively assess basic language skills"
    ],
    references: [
      "Bowers, L., Huisingh, R., & LoGiudice, C. (2013). Test of Problem Solving-Third Edition: Elementary (TOPS-3E). Austin, TX: PRO-ED."
    ]
  },
  
  "capa": {
    id: "capa",
    name: "Clinical Assessment of Pragmatics (CAPs)",
    year: "2017",
    authors: ["Adriana Lavi", "Gail Richard"],
    targetPopulation: "Children and adolescents with suspected pragmatic language disorders",
    targetAgeRange: "7-18 years",
    type: "quantitative",
    domains: ["pragmatic"],
    description: "Video-based assessment of pragmatic language skills in social contexts.",
    subtests: [
      {
        name: "Pragmatic Judgment",
        description: "Assesses ability to identify appropriate social responses",
        domain: "pragmatic"
      },
      {
        name: "Social Context Appraisal",
        description: "Evaluates understanding of social situations and expectations",
        domain: "pragmatic"
      },
      {
        name: "Paralinguistic Decoding",
        description: "Measures ability to interpret facial expressions, body language, and tone of voice",
        domain: "pragmatic"
      },
      {
        name: "Instrumental Performance Appraisal",
        description: "Assesses use of language to accomplish goals",
        domain: "pragmatic"
      },
      {
        name: "Affective Expression",
        description: "Evaluates ability to express emotions appropriately",
        domain: "pragmatic"
      },
      {
        name: "Paralinguistic Signals",
        description: "Assesses use of appropriate facial expressions and body language",
        domain: "pragmatic"
      }
    ],
    caveats: [
      "Video-based format may not reflect real-world social interactions",
      "Cultural differences may affect interpretation of social scenarios",
      "Limited sensitivity to subtle pragmatic deficits",
      "May be challenging for individuals with attention difficulties"
    ],
    references: [
      "Lavi, A., & Richard, G. (2017). Clinical Assessment of Pragmatics (CAPs). Novato, CA: Academic Therapy Publications."
    ]
  },
  
  "reel4": {
    id: "reel4",
    name: "Receptive-Expressive Emergent Language Test - Fourth Edition (REEL-4)",
    year: "2010",
    authors: ["Kenneth R. Bzoch", "Richard League", "Virginia L. Brown"],
    targetPopulation: "Infants and toddlers with suspected language delays",
    targetAgeRange: "0-3 years",
    type: "quantitative",
    domains: ["receptive", "expressive"],
    description: "Parent interview-based assessment of early language development for very young children.",
    subtests: [
      {
        name: "Receptive Language",
        description: "Measures understanding of language through caregiver report",
        domain: "receptive"
      },
      {
        name: "Expressive Language",
        description: "Assesses language production skills through caregiver report",
        domain: "expressive"
      }
    ],
    caveats: [
      "Relies on parent/caregiver observation and memory",
      "May not identify subtle language delays",
      "Cultural and socioeconomic factors may influence reporting",
      "Limited sensitivity for children with autism spectrum disorders"
    ],
    references: [
      "Bzoch, K. R., League, R., & Brown, V. L. (2010). Receptive-Expressive Emergent Language Test–Fourth Edition (REEL-4). Austin, TX: PRO-ED."
    ]
  },
  
  "slap": {
    id: "slap",
    name: "Standardized Language Assessment Protocol (SLAP)",
    year: "2015",
    authors: ["Brian Goldstein", "Aquiles Iglesias"],
    targetPopulation: "Spanish-English bilingual children with suspected language disorders",
    targetAgeRange: "4-9 years",
    type: "quantitative",
    domains: ["expressive"],
    description: "Standardized language sample analysis protocol for differentiating language difference from disorder in bilingual children.",
    subtests: [
      {
        name: "Narrative Production",
        description: "Elicits and analyzes storytelling in both languages",
        domain: "expressive"
      },
      {
        name: "Morphosyntactic Analysis",
        description: "Evaluates grammatical structures in both languages",
        domain: "expressive"
      },
      {
        name: "Code-Switching Patterns",
        description: "Assesses appropriate language mixing behaviors",
        domain: "expressive"
      }
    ],
    caveats: [
      "Limited standardization data for some language pairs",
      "Requires clinician proficiency in both languages for accurate interpretation",
      "May not be applicable to all dialectal variations",
      "Time-intensive administration and analysis"
    ],
    references: [
      "Goldstein, B., & Iglesias, A. (2015). Standardized Language Assessment Protocol. Philadelphia, PA: Temple University."
    ]
  }
};