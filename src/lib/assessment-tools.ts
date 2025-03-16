/**
 * Pre-defined assessment tools for speech-language evaluation
 */

// Common assessment tool structure
export interface AssessmentTool {
  id: string;
  name: string;
  year: string;
  authors: string[];
  targetPopulation: string;
  targetAgeRange: string;
  type: "quantitative" | "qualitative" | "mixed";
  domains: string[];
  description: string;
  subtests?: {
    name: string;
    description: string;
    domain?: string;
    scores?: {
      raw?: number;
      scaled?: number;
      standardScore?: number;
      percentile?: number;
      ageEquivalent?: string;
      interpretation?: string;
    }[];
  }[];
  results?: {
    summary: string;
    scores?: any;
  };
  caveats?: string[];
  references?: string[];
}

/**
 * Formal Assessment Tools
 */
export const formalAssessmentTools: Record<string, AssessmentTool> = {
  "celf5": {
    id: "celf5",
    name: "Clinical Evaluation of Language Fundamentals - Fifth Edition (CELF-5)",
    year: "2013",
    authors: ["Eleanor Semel", "Elisabeth H. Wiig", "Wayne A. Secord"],
    targetPopulation: "Children and adolescents with suspected language disorders",
    targetAgeRange: "5-21 years",
    type: "quantitative",
    domains: ["receptive", "expressive", "pragmatic"],
    description: "Comprehensive language assessment that evaluates a student's ability to understand and produce language across various contexts.",
    subtests: [
      {
        name: "Sentence Comprehension",
        description: "Measures comprehension of spoken sentences of increasing length and complexity",
        domain: "receptive"
      },
      {
        name: "Linguistic Concepts",
        description: "Assesses understanding of linguistic concepts and ability to follow directions",
        domain: "receptive"
      },
      {
        name: "Word Structure",
        description: "Evaluates morphological development and use of grammatical morphemes",
        domain: "expressive"
      },
      {
        name: "Formulated Sentences",
        description: "Assesses ability to create grammatically correct and semantically appropriate sentences",
        domain: "expressive"
      },
      {
        name: "Recalling Sentences",
        description: "Measures ability to repeat sentences of increasing length and complexity",
        domain: "expressive"
      },
      {
        name: "Pragmatics Profile",
        description: "Evaluates social communication skills in everyday contexts",
        domain: "pragmatic"
      }
    ],
    caveats: [
      "May not be culturally or linguistically appropriate for all populations",
      "Consider dialectal variations when interpreting results",
      "Should be used as part of a comprehensive assessment battery"
    ],
    references: [
      "Semel, E., Wiig, E. H., & Secord, W. A. (2013). Clinical Evaluation of Language Fundamentals–Fifth Edition (CELF-5). Bloomington, MN: NCS Pearson."
    ]
  },
  
  "gfta3": {
    id: "gfta3",
    name: "Goldman-Fristoe Test of Articulation - Third Edition (GFTA-3)",
    year: "2015",
    authors: ["Ronald Goldman", "Macalyne Fristoe"],
    targetPopulation: "Children and adolescents with suspected articulation disorders",
    targetAgeRange: "2-21 years",
    type: "quantitative",
    domains: ["articulation"],
    description: "Standardized assessment of articulation skills using single-word responses and conversational speech sample.",
    subtests: [
      {
        name: "Sounds-in-Words",
        description: "Assesses production of consonant sounds in initial, medial, and final word positions",
        domain: "articulation"
      },
      {
        name: "Sounds-in-Sentences",
        description: "Evaluates articulation in connected speech",
        domain: "articulation"
      }
    ],
    caveats: [
      "Does not assess phonological processes comprehensively",
      "Limited assessment of speech intelligibility in connected speech",
      "Consider dialectal and cultural variations when interpreting results"
    ],
    references: [
      "Goldman, R., & Fristoe, M. (2015). Goldman-Fristoe Test of Articulation–Third Edition (GFTA-3). Bloomington, MN: NCS Pearson."
    ]
  },
  
  "casl2": {
    id: "casl2",
    name: "Comprehensive Assessment of Spoken Language - Second Edition (CASL-2)",
    year: "2017",
    authors: ["Elizabeth Carrow-Woolfolk"],
    targetPopulation: "Children and adolescents with suspected language disorders",
    targetAgeRange: "3-21 years",
    type: "quantitative",
    domains: ["receptive", "expressive", "pragmatic"],
    description: "Comprehensive assessment of oral language skills across semantic, syntactic, pragmatic, and morphological domains.",
    subtests: [
      {
        name: "Comprehension of Basic Concepts",
        description: "Measures understanding of basic concepts and vocabulary",
        domain: "receptive"
      },
      {
        name: "Syntax Construction",
        description: "Assesses ability to formulate grammatically correct sentences",
        domain: "expressive"
      },
      {
        name: "Paragraph Comprehension",
        description: "Evaluates understanding of connected text",
        domain: "receptive"
      },
      {
        name: "Pragmatic Judgment",
        description: "Measures knowledge and use of appropriate language in social situations",
        domain: "pragmatic"
      },
      {
        name: "Inference",
        description: "Assesses ability to derive meaning from implicit information",
        domain: "receptive"
      }
    ],
    caveats: [
      "Administration can be lengthy depending on subtests selected",
      "Consider cultural and linguistic background when interpreting results",
      "May not be appropriate for students with significant cognitive or attention challenges"
    ],
    references: [
      "Carrow-Woolfolk, E. (2017). Comprehensive Assessment of Spoken Language–Second Edition (CASL-2). Torrance, CA: Western Psychological Services."
    ]
  }
};

/**
 * Informal Assessment Tools
 */
export const informalAssessmentTools: Record<string, AssessmentTool> = {
  "play_based_observation": {
    id: "play_based_observation",
    name: "Play-Based Observation Assessment",
    year: "N/A",
    authors: ["Various"],
    targetPopulation: "Children with suspected communication disorders",
    targetAgeRange: "Birth-7 years",
    type: "qualitative",
    domains: ["receptive", "expressive", "pragmatic", "articulation"],
    description: "Naturalistic observation of a child's communication during play activities to assess functional communication skills.",
    subtests: [
      {
        name: "Communication Functions",
        description: "Observes purpose and intent of communication attempts",
        domain: "pragmatic"
      },
      {
        name: "Social Interaction",
        description: "Assesses turn-taking, joint attention, and social engagement",
        domain: "pragmatic"
      },
      {
        name: "Language Comprehension",
        description: "Evaluates understanding of language during natural activities",
        domain: "receptive"
      },
      {
        name: "Expressive Language",
        description: "Examines vocabulary use, sentence structure, and narrative skills",
        domain: "expressive"
      }
    ],
    caveats: [
      "Lacks standardized scoring or norms",
      "Requires clinical expertise for interpretation",
      "May be influenced by environmental factors and familiarity with materials"
    ]
  },
  
  "language_sample_analysis": {
    id: "language_sample_analysis",
    name: "Language Sample Analysis",
    year: "N/A",
    authors: ["Various"],
    targetPopulation: "Children and adolescents with suspected language disorders",
    targetAgeRange: "2-21 years",
    type: "mixed",
    domains: ["expressive", "pragmatic"],
    description: "Collection and analysis of spontaneous language samples to assess naturalistic language use across contexts.",
    subtests: [
      {
        name: "Syntactic Analysis",
        description: "Examines sentence structure, complexity, and grammatical features",
        domain: "expressive"
      },
      {
        name: "Semantic Analysis",
        description: "Evaluates vocabulary diversity and word choice",
        domain: "expressive"
      },
      {
        name: "Pragmatic Analysis",
        description: "Assesses conversational skills, topic maintenance, and turn-taking",
        domain: "pragmatic"
      },
      {
        name: "Narrative Analysis",
        description: "Examines story structure, cohesion, and organization",
        domain: "expressive"
      }
    ],
    caveats: [
      "Time-intensive to collect, transcribe, and analyze",
      "Interpretation requires specialized training",
      "Sample may not represent full range of communication abilities",
      "Context can affect performance significantly"
    ]
  },
  
  "parent_interview": {
    id: "parent_interview",
    name: "Parent/Caregiver Interview",
    year: "N/A",
    authors: ["Various"],
    targetPopulation: "Children and adolescents with suspected communication disorders",
    targetAgeRange: "Birth-21 years",
    type: "qualitative",
    domains: ["receptive", "expressive", "pragmatic", "articulation", "voice", "fluency"],
    description: "Structured or semi-structured interview with caregivers to gather information about developmental history and communication across settings.",
    subtests: [
      {
        name: "Developmental History",
        description: "Gathers information about early development and milestones"
      },
      {
        name: "Current Communication Skills",
        description: "Assesses caregiver perception of strengths and needs across contexts"
      },
      {
        name: "Social Communication",
        description: "Examines pragmatic language skills in home and community settings",
        domain: "pragmatic"
      },
      {
        name: "Educational Impact",
        description: "Evaluates how communication affects learning and school participation"
      }
    ],
    caveats: [
      "Subject to reporter bias",
      "Accuracy depends on caregiver insight and recall",
      "Cultural factors may influence reporting and interpretation",
      "Should be supplemented with direct assessment"
    ]
  }
};

/**
 * Get all assessment tools (formal and informal)
 */
export function getAllAssessmentTools(): Record<string, AssessmentTool> {
  return {
    ...formalAssessmentTools,
    ...informalAssessmentTools
  };
}

/**
 * Get an assessment tool by ID
 */
export function getAssessmentToolById(id: string): AssessmentTool | undefined {
  return getAllAssessmentTools()[id];
}

/**
 * Get assessment tools by domain
 */
export function getAssessmentToolsByDomain(domain: string): AssessmentTool[] {
  return Object.values(getAllAssessmentTools())
    .filter(tool => tool.domains.includes(domain));
}

/**
 * Get assessment tools by type
 */
export function getAssessmentToolsByType(type: "quantitative" | "qualitative" | "mixed"): AssessmentTool[] {
  return Object.values(getAllAssessmentTools())
    .filter(tool => tool.type === type);
}