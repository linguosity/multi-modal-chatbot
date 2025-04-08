// FILE: reportSchema.ts (Refactored for Present Levels + Assessment Tools Structure)
// THIS IS THE FILE YOU SHOULD EDIT

import { z } from "zod";

/**
 * Basic student info captured at the beginning of the report
 */
export const StudentInformationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  DOB: z.string().optional(),
  reportDate: z.string().optional(),
  evaluationDate: z.string().optional(),
  parents: z.array(z.string()).default([]),
  homeLanguage: z.string().default("English"),
  grade: z.string().optional(),
  eligibility: z.string().optional(),
  secondaryEligibility: z.string().optional(), // Add if needed
  school: z.string().optional(),
  teacher: z.string().optional(),
  evaluator: z.string().optional(),
  caseManager: z.string().optional(), // ✅ New
});

/**
 * Basic intake/referral reasoning
 */
export const ReferralSchema = z.object({
  reasonForReferral: z.string().optional(),
  confidentialityStatement: z.string().optional(),
});

/**
 * Top-level header section
 */
export const HeaderSchema = z.object({
  studentInformation: StudentInformationSchema,
  reasonForReferral: z.string().optional(),
  confidentialityStatement: z.string().optional(),
  // Add lock/synthesis directly if needed, or extend a base schema later
  synthesis: z.string().optional(),
  isLocked: z.boolean().default(false),
  lockStatus: z.record(z.string(), z.boolean()).optional(), // For sub-parts like demographics/referral
});

/**
 * Section describing observed and assessed communication functioning (A single domain)
 * This remains the definition for ONE domain's data.
 */
export const FunctioningSectionSchema = z.object({
  isConcern: z.boolean().default(false),
  topicSentence: z.string().optional(),
  strengths: z.array(z.string()).default([]),
  needs: z.array(z.string()).default([]),
  impactStatement: z.string().optional(),
  assessmentTools: z.array(z.string()).optional(), // Domain-specific tools
  synthesis: z.string().optional(), // AI-generated summary of section
  isLocked: z.boolean().default(false), // Lock status for this specific domain card
});

/**
 * Object containing all communication domains/areas ("functioning")
 */
export const FunctioningSchema = z.object({
  receptive: FunctioningSectionSchema.optional(),
  expressive: FunctioningSectionSchema.optional(),
  pragmatic: FunctioningSectionSchema.optional(),
  articulation: FunctioningSectionSchema.optional(),
  voice: FunctioningSectionSchema.optional(),
  fluency: FunctioningSectionSchema.optional(),
});

// <<< NEW SCHEMA for the Present Levels Section >>>
/**
 * Top-level section for Present Levels, containing the functioning/domain data.
 */
export const PresentLevelsSchema = z.object({
  functioning: FunctioningSchema.optional(),
  synthesis: z.string().optional(), // Synthesis for the overall Present Levels section
  isLocked: z.boolean().default(false), // Lock status for the entire Present Levels section
  lockStatus: z.record(z.string(), z.boolean()).optional(), // If needed to lock specific aspects within PL (e.g., the whole functioning object)
});
// <<< END NEW SCHEMA >>>

// <<< REFACTORED SCHEMA for Assessment Results (Tools/Observations ONLY) >>>
/**
 * Assessment procedures and observations.
 * 'functioning' (domains) has been MOVED to PresentLevelsSchema.
 */
export const AssessmentResultsSchema = z.object({
  observations: z.object({
    classroomObservations: z.string().optional(),
    playBasedInformalObservations: z.string().optional(),
    socialInteractionObservations: z.string().optional(),
    synthesis: z.string().optional(),
    isLocked: z.boolean().default(false),
    lockStatus: z.record(z.string(), z.boolean()).optional(), // To lock individual observation cards
  }).optional(),
  assessmentProceduresAndTools: z.object({
    overviewOfAssessmentMethods: z.string().optional(), // Content for "Validity Statement" or "Assessment Methods" card
    assessmentToolsUsed: z.array(z.string()).default([]), // List of tool IDs used
    synthesis: z.string().optional(),
    isLocked: z.boolean().default(false), // Lock for the "Assessment Methods" card
    lockStatus: z.record(z.string(), z.boolean()).optional(), // To lock individual tool cards (e.g., lockStatus.tools[toolId])
  }).optional(),
  // functioning: REMOVED FROM HERE
  synthesis: z.string().optional(), // Synthesis for the overall Assessment Tools section
  isLocked: z.boolean().default(false), // Lock status for the entire Assessment Tools section
  lockStatus: z.record(z.string(), z.boolean()).optional(), // If needed (e.g., lockStatus.observations, lockStatus.assessmentProceduresAndTools)
});
// <<< END REFACTORED SCHEMA >>>

/**
 * Background information section schema
 */
export const BackgroundSchema = z.object({
    studentDemographicsAndBackground: z.object({
      educationalHistory: z.string().optional(),
      synthesis: z.string().optional(),
      isLocked: z.boolean().default(false),
      // lockStatus: z.record(z.string(), z.boolean()).optional(), // Example if needed
    }).optional(),
    healthReport: z.object({
      medicalHistory: z.string().optional(),
      visionAndHearingScreening: z.string().optional(),
      medicationsAndAllergies: z.string().optional(),
      synthesis: z.string().optional(),
      isLocked: z.boolean().default(false),
      // lockStatus: z.record(z.string(), z.boolean()).optional(), // Example if needed
    }).optional(),
    earlyInterventionHistory: z.string().optional(), // Can wrap in object if needs lock/synthesis
    familyHistory: z.object({
      familyStructure: z.string().optional(),
      languageAndCulturalBackground: z.string().optional(),
      socioeconomicFactors: z.string().optional(),
      synthesis: z.string().optional(),
      isLocked: z.boolean().default(false),
     // lockStatus: z.record(z.string(), z.boolean()).optional(), // Example if needed
    }).optional(),
    parentGuardianConcerns: z.string().optional(), // Can wrap in object if needs lock/synthesis
    synthesis: z.string().optional(), // Overall background synthesis
    isLocked: z.boolean().default(false), // Overall background lock
    lockStatus: z.record(z.string(), z.boolean()).optional(), // To lock sub-parts like educationalHistory, healthInfo etc.
});


/**
 * Final conclusions and educational implications section schema
 */
export const ConclusionSchema = z.object({
  eligibility: z.object({
    domains: z.object({ // Eligibility status per domain
      language: z.boolean().default(false), // Consolidated Language category
      articulation: z.boolean().default(false),
      voice: z.boolean().default(false),
      fluency: z.boolean().default(false),
    }),
    californiaEdCode: z.string().optional(),
    isPreschool: z.boolean().optional(),
    synthesis: z.string().optional(),
    isLocked: z.boolean().default(false),
    // lockStatus: z.record(z.string(), z.boolean()).optional(), // Example if needed
  }).optional(),
  conclusion: z.object({ // The summary part
    summary: z.string().optional(),
    synthesis: z.string().optional(),
    isLocked: z.boolean().default(false),
    // lockStatus: z.record(z.string(), z.boolean()).optional(), // Example if needed
  }).optional(),
  recommendations: z.object({
    services: z.object({
      typeOfService: z.string().optional(),
      frequency: z.string().optional(),
      setting: z.string().optional(),
    }).optional(),
    accommodations: z.array(z.string()).default([]),
    facilitationStrategies: z.array(z.string()).default([]),
    synthesis: z.string().optional(),
    isLocked: z.boolean().default(false),
    // lockStatus: z.record(z.string(), z.boolean()).optional(), // Example if needed
  }).optional(),
  parentFriendlyGlossary: z.object({
    terms: z.record(z.string(), z.string()).default({}),
    isLocked: z.boolean().default(false), // Lock for glossary card
    // synthesis: z.string().optional(), // Synthesis for glossary?
    // lockStatus: z.record(z.string(), z.boolean()).optional(), // Example if needed
  }).optional(),
  synthesis: z.string().optional(), // Overall conclusion synthesis
  isLocked: z.boolean().default(false), // Overall conclusion lock
  lockStatus: z.record(z.string(), z.boolean()).optional(), // To lock sub-parts like eligibility, summary etc.
});

/**
 * Metadata schema
 */
 export const MetadataSchema = z.object({
    lastUpdated: z.string().optional(),
    version: z.number().default(1),
    // cardStatus: z.record(z.string(), z.boolean()).optional(), // For 'marked done' feature if needed
 });


// <<< MAIN SPEECH LANGUAGE REPORT SCHEMA (Refactored Structure) >>>
export const SpeechLanguageReportSchema = z.object({
  header: HeaderSchema.optional(),
  background: BackgroundSchema.optional(),
  presentLevels: PresentLevelsSchema.optional(),         // <<< ADDED Present Levels
  assessmentResults: AssessmentResultsSchema.optional(), // <<< UPDATED Assessment Results (Tools/Obs only)
  conclusion: ConclusionSchema.optional(),
  metadata: MetadataSchema.optional(),
  synthesis: z.string().optional(), // Overall report synthesis (optional)
});
// <<< END MAIN SCHEMA >>>


// --- Inferred Types ---
// Make sure to export all necessary types inferred from the schemas.

export type SpeechLanguageReport = z.infer<typeof SpeechLanguageReportSchema>;
export type StudentInformation = z.infer<typeof StudentInformationSchema>;
export type Header = z.infer<typeof HeaderSchema>;
export type Background = z.infer<typeof BackgroundSchema>;
export type FunctioningSection = z.infer<typeof FunctioningSectionSchema>; // Represents one domain
export type Functioning = z.infer<typeof FunctioningSchema>; // Object containing all domains
export type PresentLevels = z.infer<typeof PresentLevelsSchema>;         // <<< ADDED Type
export type AssessmentResults = z.infer<typeof AssessmentResultsSchema>; // <<< UPDATED Type (Tools/Obs only)
export type Conclusion = z.infer<typeof ConclusionSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;

// You might still need the AssessmentTool type definition if it's used elsewhere.
// Define or import it as needed.
export type AssessmentTool = {
    id: string;
    name: string;
    year?: string;
    authors?: string[];
    targetPopulation?: string;
    targetAgeRange?: string;
    type?: 'quantitative' | 'qualitative' | 'mixed';
    domains?: string[];
    description?: string;
};

// NOTE: The separate `reportTypes.ts` file with `interface` definitions is likely
// no longer needed and can potentially be removed to avoid maintaining two sources.
// Rely on these inferred types exported from the Zod schema file.