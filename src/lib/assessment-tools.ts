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

/**
 * Informal Assessment Tools
 */
export const informalAssessmentTools: Record<string, AssessmentTool> = {
 "classroom_observation": {
    id: "classroom_observation",
    name: "Classroom Observation Assessment",
    year: "N/A",
    authors: ["Various"],
    targetPopulation: "School-age children with suspected communication disorders",
    targetAgeRange: "4-21 years",
    type: "qualitative",
    domains: ["receptive", "expressive", "pragmatic", "articulation", "voice", "fluency"],
    description: "Systematic observation of a student's communication skills within the classroom environment.",
    subtests: [
      {
        name: "Participation Patterns",
        description: "Observes level and quality of participation in classroom activities",
        domain: "pragmatic"
      },
      {
        name: "Peer Interactions",
        description: "Evaluates communication with classmates during structured and unstructured activities",
        domain: "pragmatic"
      },
      {
        name: "Teacher Interactions",
        description: "Assesses responses to teacher questions and directions",
        domain: "receptive"
      },
      {
        name: "Academic Language Use",
        description: "Examines use of curriculum-specific vocabulary and language structures",
        domain: "expressive"
      }
    ],
    caveats: [
      "Limited observation time may not capture full range of abilities",
      "Classroom dynamics may affect performance",
      "Should be supplemented with standardized assessment",
      "Observer presence may affect student behavior"
    ]
  },
  
  "dynamic_assessment": {
    id: "dynamic_assessment",
    name: "Dynamic Assessment Protocol",
    year: "N/A",
    authors: ["Various"],
    targetPopulation: "Children and adolescents from culturally and linguistically diverse backgrounds",
    targetAgeRange: "3-21 years",
    type: "qualitative",
    domains: ["receptive", "expressive", "pragmatic"],
    description: "Process-oriented assessment that examines learning potential through test-teach-retest methods.",
    subtests: [
      {
        name: "Mediated Learning Experience",
        description: "Evaluates response to clinician scaffolding and instruction",
        domain: "receptive"
      },
      {
        name: "Task Modifiability",
        description: "Assesses the amount of support needed to complete language tasks successfully",
        domain: "expressive"
      },
      {
        name: "Transfer of Skills",
        description: "Examines ability to apply newly learned skills to novel situations",
        domain: "expressive"
      }
    ],
    caveats: [
      "Not standardized; interpretation requires clinical expertise",
      "Time-intensive administration",
      "May be difficult to quantify results for eligibility decisions",
      "Limited research on predictive validity"
    ]
  },
  
  "narrative_assessment": {
    id: "narrative_assessment",
    name: "Narrative Assessment Protocol",
    year: "N/A",
    authors: ["Various"],
    targetPopulation: "Children and adolescents with suspected language disorders",
    targetAgeRange: "4-18 years",
    type: "mixed",
    domains: ["expressive", "pragmatic"],
    description: "Elicitation and analysis of storytelling abilities to assess narrative competence.",
    subtests: [
      {
        name: "Story Grammar",
        description: "Evaluates inclusion and organization of key narrative elements",
        domain: "expressive"
      },
      {
        name: "Cohesion",
        description: "Assesses use of linguistic devices to connect ideas",
        domain: "expressive"
      },
      {
        name: "Character Development",
        description: "Examines references to and development of characters throughout narrative",
        domain: "expressive"
      },
      {
        name: "Perspective Taking",
        description: "Evaluates ability to represent multiple viewpoints and mental states",
        domain: "pragmatic"
      }
    ],
    caveats: [
      "Cultural differences in narrative structure must be considered",
      "Performance affected by familiarity with story content and format",
      "Quantification methods vary widely",
      "Limited normative data for comparison"
    ]
  },
  
  "curriculum_based_assessment": {
    id: "curriculum_based_assessment",
    name: "Curriculum-Based Language Assessment",
    year: "N/A",
    authors: ["Various"],
    targetPopulation: "School-age children with suspected language disorders",
    targetAgeRange: "5-21 years",
    type: "mixed",
    domains: ["receptive", "expressive", "pragmatic"],
    description: "Assessment of language skills within the context of academic curriculum and classroom demands.",
    subtests: [
      {
        name: "Vocabulary Knowledge",
        description: "Assesses understanding and use of curriculum-specific vocabulary",
        domain: "receptive"
      },
      {
        name: "Following Directions",
        description: "Evaluates ability to understand and follow classroom instructions",
        domain: "receptive"
      },
      {
        name: "Reading Comprehension",
        description: "Assesses understanding of written material at grade level",
        domain: "receptive"
      },
      {
        name: "Written Expression",
        description: "Evaluates ability to compose grade-appropriate written work",
        domain: "expressive"
      },
      {
        name: "Oral Presentations",
        description: "Assesses ability to plan and deliver information orally",
        domain: "expressive"
      }
    ],
    caveats: [
      "Lacks standardization across curricula",
      "May not identify underlying processing deficits",
      "Interpretations vary across educational settings",
      "May be influenced by teaching methods and exposure"
    ]
  },
  
  "discourse_analysis": {
    id: "discourse_analysis",
    name: "Discourse Analysis Protocol",
    year: "N/A",
    authors: ["Various"],
    targetPopulation: "Children, adolescents, and adults with suspected language disorders",
    targetAgeRange: "8-adult",
    type: "qualitative",
    domains: ["expressive", "pragmatic"],
    description: "Detailed analysis of extended language use across different discourse genres (conversation, narrative, expository, persuasive).",
    subtests: [
      {
        name: "Macrostructure Analysis",
        description: "Examines overall organization and structure of discourse",
        domain: "expressive"
      },
      {
        name: "Microstructure Analysis",
        description: "Evaluates word and sentence level features (lexical diversity, syntax)",
        domain: "expressive"
      },
      {
        name: "Cohesion Analysis",
        description: "Assesses linguistic devices that connect ideas across sentences",
        domain: "expressive"
      },
      {
        name: "Coherence Analysis",
        description: "Examines logical flow and relevance of ideas throughout discourse",
        domain: "pragmatic"
      },
      {
        name: "Genre-Specific Features",
        description: "Evaluates characteristics unique to specific discourse types",
        domain: "expressive"
      }
    ],
    caveats: [
      "Complex and time-consuming to administer and analyze",
      "Few established protocols or normative data",
      "Requires specialized training in discourse analysis",
      "Cultural and linguistic variations affect interpretation"
    ]
  },
  
  "functional_communication_assessment": {
    id: "functional_communication_assessment",
    name: "Functional Communication Assessment",
    year: "N/A",
    authors: ["Various"],
    targetPopulation: "Individuals with significant communication disorders or AAC needs",
    targetAgeRange: "All ages",
    type: "qualitative",
    domains: ["receptive", "expressive", "pragmatic"],
    description: "Assessment of communication effectiveness in daily activities and across natural environments.",
    subtests: [
      {
        name: "Communication Needs Inventory",
        description: "Identifies priority communication functions across environments",
        domain: "pragmatic"
      },
      {
        name: "Partner Interaction Analysis",
        description: "Evaluates communication exchanges with familiar partners",
        domain: "pragmatic"
      },
      {
        name: "Environmental Inventory",
        description: "Assesses communication demands and opportunities across settings",
        domain: "pragmatic"
      },
      {
        name: "Symbol Assessment",
        description: "Evaluates ability to understand and use various symbol systems",
        domain: "receptive"
      },
      {
        name: "Access Assessment",
        description: "Determines optimal physical methods for communication",
        domain: "expressive"
      }
    ],
    caveats: [
      "Lacks standardized administration procedures",
      "Requires observations across multiple settings",
      "Time-intensive to complete thoroughly",
      "Interpretations may vary among professionals"
    ]
  },
  
  "phonological_process_analysis": {
    id: "phonological_process_analysis",
    name: "Informal Phonological Process Analysis",
    year: "N/A",
    authors: ["Various"],
    targetPopulation: "Children with suspected phonological disorders",
    targetAgeRange: "2-9 years",
    type: "mixed",
    domains: ["articulation"],
    description: "Systematic analysis of error patterns in spontaneous and elicited speech samples.",
    subtests: [
      {
        name: "Syllable Structure Processes",
        description: "Identifies patterns that simplify syllable structure (e.g., cluster reduction)",
        domain: "articulation"
      },
      {
        name: "Substitution Processes",
        description: "Analyzes systematic replacement of sounds or sound classes",
        domain: "articulation"
      },
      {
        name: "Assimilation Processes",
        description: "Evaluates patterns where sounds become more like neighboring sounds",
        domain: "articulation"
      },
      {
        name: "Process Consistency",
        description: "Examines consistency of error patterns across contexts",
        domain: "articulation"
      },
      {
        name: "Stimulability Assessment",
        description: "Determines ability to produce error sounds with models or cues",
        domain: "articulation"
      }
    ],
    caveats: [
      "Analysis methods vary across clinicians",
      "Limited standardization of analysis procedures",
      "Requires phonetic transcription skills",
      "Must consider dialectal and developmental variations"
    ]
  },
  
  "pragmatic_rating_scale": {
    id: "pragmatic_rating_scale",
    name: "Informal Pragmatic Rating Scale",
    year: "N/A",
    authors: ["Various"],
    targetPopulation: "Children and adolescents with suspected social communication disorders",
    targetAgeRange: "3-21 years",
    type: "qualitative",
    domains: ["pragmatic"],
    description: "Rating scale or checklist for evaluating social communication behaviors across contexts.",
    subtests: [
      {
        name: "Conversational Skills",
        description: "Assesses turn-taking, topic maintenance, and repair strategies",
        domain: "pragmatic"
      },
      {
        name: "Nonverbal Communication",
        description: "Evaluates eye contact, facial expression, and body language",
        domain: "pragmatic"
      },
      {
        name: "Social Awareness",
        description: "Measures understanding of social rules and expectations",
        domain: "pragmatic"
      },
      {
        name: "Communication Intent",
        description: "Assesses range and appropriateness of communication functions",
        domain: "pragmatic"
      },
      {
        name: "Narrative Skills",
        description: "Evaluates ability to share experiences and tell stories appropriately",
        domain: "pragmatic"
      }
    ],
    caveats: [
      "Subjective ratings require clinical expertise",
      "Limited standardization across different scales",
      "Cultural norms affect interpretation of pragmatic behaviors",
      "Observation context may impact performance"
    ]
  },
  
  "literacy_skills_assessment": {
    id: "literacy_skills_assessment",
    name: "Informal Literacy Skills Assessment",
    year: "N/A",
    authors: ["Various"],
    targetPopulation: "Children with language disorders at risk for literacy difficulties",
    targetAgeRange: "4-12 years",
    type: "mixed",
    domains: ["receptive", "expressive"],
    description: "Evaluation of foundational literacy skills that connect to oral language development.",
    subtests: [
      {
        name: "Phonological Awareness",
        description: "Assesses ability to identify and manipulate sounds in words",
        domain: "receptive"
      },
      {
        name: "Print Concepts",
        description: "Evaluates understanding of book handling and print conventions",
        domain: "receptive"
      },
      {
        name: "Letter-Sound Knowledge",
        description: "Measures ability to connect letters with corresponding sounds",
        domain: "receptive"
      },
      {
        name: "Decoding Skills",
        description: "Assesses ability to apply phonics knowledge to read words",
        domain: "receptive"
      },
      {
        name: "Written Language Samples",
        description: "Analyzes spelling patterns and written expression",
        domain: "expressive"
      }
    ],
    caveats: [
      "Not comprehensive enough for full literacy evaluation",
      "Should be used in collaboration with educational professionals",
      "Limited standardization of informal measures",
      "Must consider educational exposure and opportunities"
    ]
  },
  
  "multilingual_assessment": {
    id: "multilingual_assessment",
    name: "Informal Multilingual Assessment Protocol",
    year: "N/A",
    authors: ["Various"],
    targetPopulation: "Multilingual children with suspected language disorders",
    targetAgeRange: "2-18 years",
    type: "qualitative",
    domains: ["receptive", "expressive", "pragmatic", "articulation"],
    description: "Culturally and linguistically responsive assessment protocols for evaluating communication skills across languages.",
    subtests: [
      {
        name: "Language Use Patterns",
        description: "Documents language exposure, use, and proficiency across contexts",
        domain: "expressive"
      },
      {
        name: "Cross-Linguistic Analysis",
        description: "Compares skills across languages to identify patterns",
        domain: "expressive"
      },
      {
        name: "Dynamic Assessment",
        description: "Uses test-teach-retest methods to evaluate learning potential",
        domain: "receptive"
      },
      {
        name: "Parent/Teacher Report",
        description: "Gathers information about communication skills from multiple sources",
        domain: "pragmatic"
      },
      {
        name: "Language Sampling",
        description: "Collects and analyzes naturalistic samples in multiple languages",
        domain: "expressive"
      }
    ],
    caveats: [
      "Requires knowledge of typical development across languages",
      "Limited standardization across cultural groups",
      "May require interpreter assistance",
      "Time-intensive to administer comprehensively"
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