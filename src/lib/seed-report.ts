// FILE: seed-report.ts (Corrected Structure)

// Assuming types are imported correctly based on the Zod schema file
// e.g., import { SpeechLanguageReport } from '@/types/reportSchemas';
// For simplicity here, assuming the import path used previously was correct for this file too
import { SpeechLanguageReport } from "@/types/reportTypes"; // or '@/types/reportSchemas' depending on your setup

// === EMPTY REPORT - Corrected Structure ===
export const EMPTY_REPORT: SpeechLanguageReport = {
  header: {
    studentInformation: {
      firstName: "", lastName: "", DOB: "", reportDate: "", evaluationDate: "", parents: [], homeLanguage: ""
    },
    reasonForReferral: "", confidentialityStatement: ""
    // Add isLocked, synthesis, lockStatus if needed based on HeaderSchema
  },
  background: {
    studentDemographicsAndBackground: { educationalHistory: "" },
    healthReport: { medicalHistory: "", visionAndHearingScreening: "", medicationsAndAllergies: "" },
    earlyInterventionHistory: "",
    familyHistory: { familyStructure: "", languageAndCulturalBackground: "", socioeconomicFactors: "" },
    parentGuardianConcerns: ""
    // Add isLocked, synthesis, lockStatus if needed based on BackgroundSchema
  },
  // <<< NEW: presentLevels section initialized >>>
  presentLevels: {
    functioning: {
      // Initialize all domains as empty objects matching FunctioningSectionSchema defaults
      receptive: { isConcern: false, topicSentence: "", strengths: [], needs: [], impactStatement: "", assessmentTools: [], synthesis: "", isLocked: false },
      expressive: { isConcern: false, topicSentence: "", strengths: [], needs: [], impactStatement: "", assessmentTools: [], synthesis: "", isLocked: false },
      pragmatic: { isConcern: false, topicSentence: "", strengths: [], needs: [], impactStatement: "", assessmentTools: [], synthesis: "", isLocked: false },
      articulation: { isConcern: false, topicSentence: "", strengths: [], needs: [], impactStatement: "", assessmentTools: [], synthesis: "", isLocked: false },
      voice: { isConcern: false, topicSentence: "", strengths: [], needs: [], impactStatement: "", assessmentTools: [], synthesis: "", isLocked: false },
      fluency: { isConcern: false, topicSentence: "", strengths: [], needs: [], impactStatement: "", assessmentTools: [], synthesis: "", isLocked: false }
    }
    // Add isLocked, synthesis, lockStatus if needed based on PresentLevelsSchema
  },
  // <<< CORRECTED: assessmentResults now ONLY has observations and tools/procedures >>>
  assessmentResults: {
    observations: {
      classroomObservations: "", playBasedInformalObservations: "", socialInteractionObservations: ""
      // Add isLocked, synthesis, lockStatus if needed based on sub-schema
    },
    assessmentProceduresAndTools: {
      overviewOfAssessmentMethods: "", assessmentToolsUsed: []
       // Add isLocked, synthesis, lockStatus if needed based on sub-schema
    }
    // 'domains' key is REMOVED from here
     // Add isLocked, synthesis, lockStatus if needed based on AssessmentResultsSchema
  },
  conclusion: {
    eligibility: {
      domains: { language: false, articulation: false, voice: false, fluency: false },
      californiaEdCode: ""
       // Add isLocked, synthesis, lockStatus if needed based on sub-schema
    },
    conclusion: { summary: "" }, // Add isLocked, synthesis, lockStatus if needed based on sub-schema
    recommendations: {
      services: { typeOfService: "", frequency: "", setting: "" },
      accommodations: [], facilitationStrategies: []
       // Add isLocked, synthesis, lockStatus if needed based on sub-schema
    },
    parentFriendlyGlossary: { terms: {} } // Add isLocked, synthesis, lockStatus if needed based on sub-schema
    // Add isLocked, synthesis, lockStatus if needed based on ConclusionSchema
  },
  metadata: {
    // lastUpdated: new Date().toISOString(), // Often set dynamically
    version: 1
  }
};

// === SAMPLE REPORT - Corrected Structure ===
export const SAMPLE_REPORT: SpeechLanguageReport = {
  header: {
    studentInformation: { firstName: "Sample", lastName: "Student", DOB: "2018-05-15", reportDate: "2024-03-15", evaluationDate: "2024-03-10", parents: ["Parent Name"], homeLanguage: "English" },
    reasonForReferral: "Teacher referral due to concerns about articulation and language skills",
    confidentialityStatement: "This report contains confidential information...",
    synthesis: "This is a speech-language assessment for Sample Student, a 6-year-old referred by their teacher due to speech and language concerns.",
    isLocked: false
  },
  background: {
    studentDemographicsAndBackground: { educationalHistory: "Currently enrolled in 1st grade at Sample Elementary", synthesis: "Student is in first grade at Sample Elementary School with no prior educational concerns noted.", isLocked: false },
    healthReport: { medicalHistory: "No significant medical history reported", visionAndHearingScreening: "Passed school screening on 2023-09-15", medicationsAndAllergies: "None reported", synthesis: "Student has no significant medical history and passed recent vision and hearing screenings with no concerns.", isLocked: false },
    earlyInterventionHistory: "No previous speech services",
    familyHistory: { familyStructure: "Lives with both parents and younger sibling", languageAndCulturalBackground: "English is the primary language spoken at home", socioeconomicFactors: "", synthesis: "Student lives in a supportive family environment with parents and a younger sibling, with English as the primary language at home.", isLocked: false },
    parentGuardianConcerns: "Parents report difficulty understanding child's speech at times",
    synthesis: "Sample has a typical medical history with no prior interventions. The family speaks English at home, and parents are concerned about speech intelligibility.",
    isLocked: false
  },
  // <<< NEW: presentLevels section with functioning data >>>
  presentLevels: {
    functioning: { // <<< Moved domains object here, renamed to 'functioning' >>>
      receptive: {
        isConcern: false, topicSentence: 'Student demonstrates age-appropriate receptive language skills.', strengths: ['Follows 2-step directions consistently'], needs: [], impactStatement: "",
        assessmentTools: ["CELF-5 Receptive Language Index"], synthesis: "Sample shows typical receptive language development with ability to follow directions.", isLocked: false
      },
      expressive: {
        isConcern: true, topicSentence: 'Student shows mild deficits in expressive language.', strengths: ['Uses simple sentences to communicate needs'], needs: ['Difficulty with complex sentence structures', 'Limited vocabulary for academic concepts'], impactStatement: "Expressive language difficulties impact the student's ability to fully participate in classroom discussions",
        assessmentTools: ["CELF-5 Expressive Language Index"], synthesis: "Sample demonstrates significant expressive language challenges, particularly with complex structures and vocabulary.", isLocked: false
      },
      pragmatic: {
        isConcern: false, topicSentence: '', strengths: [], needs: [], impactStatement: "", assessmentTools: [], synthesis: "", isLocked: false
      },
      articulation: {
        isConcern: true, topicSentence: 'Student presents with multiple articulation errors affecting intelligibility.', strengths: [], needs: ['Produces /s/ and /z/ with lateral distortion', 'Fronting of velar sounds /k/ and /g/'], impactStatement: 'These errors significantly impact intelligibility in the classroom.',
        assessmentTools: ["GFTA-3"], synthesis: "Sample has multiple articulation errors that significantly impact speech intelligibility, requiring intervention.", isLocked: false
      },
      voice: {
        isConcern: false, topicSentence: "", strengths: [], needs: [], impactStatement: "", assessmentTools: [], synthesis: "", isLocked: false
      },
      fluency: {
        isConcern: false, topicSentence: "", strengths: [], needs: [], impactStatement: "", assessmentTools: [], synthesis: "", isLocked: false
      }
    }
    // Add top-level isLocked/synthesis for presentLevels if needed
  },
  // <<< CORRECTED: assessmentResults ONLY has observations and tools/procedures >>>
  assessmentResults: {
    observations: {
      classroomObservations: "Student needs repetition of directions in large group setting", playBasedInformalObservations: "Engages well in structured play activities", socialInteractionObservations: "Initiates interactions with peers appropriately",
      synthesis: "Observations indicate Sample performs better in structured settings and can engage with peers, but has difficulty with complex directions.", isLocked: false
    },
    assessmentProceduresAndTools: {
      overviewOfAssessmentMethods: "A combination of standardized tests, language samples, and observations were used", assessmentToolsUsed: ["CELF-5", "GFTA-3"],
      synthesis: "A comprehensive assessment was conducted using both formal and informal measures to evaluate all language domains.", isLocked: false
    }
    // 'domains' / 'functioning' key is REMOVED from here
  },
  conclusion: {
    eligibility: {
      domains: { receptive: false, expressive: true, pragmatic: false, articulation: true, voice: false, fluency: false },
      californiaEdCode: "Student meets eligibility criteria for speech or language impairment under California Ed Code Section 56333",
      synthesis: "Student qualifies for speech-language services based on assessment results showing significant deficits in articulation and expressive language.", isLocked: false
    },
    conclusion: {
      summary: "Based on assessment results and clinical observations, student demonstrates significant speech sound production errors and expressive language deficits that adversely affect educational performance.",
      synthesis: "In summary, Sample has significant speech and language deficits that qualify for services and impact classroom performance.", isLocked: false
    },
    recommendations: {
      services: { typeOfService: "Direct speech-language therapy", frequency: "2x weekly for 30 minutes", setting: "Pull-out and classroom-based" },
      accommodations: ["Preferential seating", "Visual supports for instruction"],
      facilitationStrategies: ["Allow extended time for verbal responses", "Provide language models"],
      synthesis: "Recommendation for direct services twice weekly focusing on articulation and language, with classroom accommodations to support learning.", isLocked: false
    },
    parentFriendlyGlossary: {
      terms: { "Articulation": "The physical production of speech sounds", "Phonological Process": "Error patterns in speech sound production" },
      synthesis: "Key speech therapy terms explained in parent-friendly language to help understand the report.", isLocked: false
    }
  },
  metadata: {
    lastUpdated: "2024-03-16T00:00:00.000Z",
    version: 1
  }
};