import type { AssessmentTool, AssessmentToolsCollection } from './types';

/**
 * Informal Assessment Tools Collection
 * Non-standardized clinical observations and qualitative measures
 */
export const informalAssessmentTools: AssessmentToolsCollection = {
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