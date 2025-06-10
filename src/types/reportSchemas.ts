// FILE: src/types/reportSchemas.ts
// (Updated with markedDoneStatus and AssessmentTool definition)

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
    secondaryEligibility: z.string().optional(),
    school: z.string().optional(),
    teacher: z.string().optional(),
    evaluator: z.string().optional(),
    caseManager: z.string().optional(),
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
    reasonForReferral: z.string().optional(), // Often part of background now? Decide where it lives.
    confidentialityStatement: z.string().optional(), // Or part of conclusion? Decide.
    synthesis: z.string().optional(),
    isLocked: z.boolean().default(false),
    lockStatus: z.record(z.string(), z.boolean()).optional(),
    markedDoneStatus: z.record(z.string(), z.boolean()).optional(), // <<< ADDED markedDoneStatus >>>
});

/**
 * Section describing observed and assessed communication functioning (A single domain)
 */
export const FunctioningSectionSchema = z.object({
    isConcern: z.boolean().default(false),
    topicSentence: z.string().optional(),
    strengths: z.array(z.string()).default([]),
    needs: z.array(z.string()).default([]),
    impactStatement: z.string().optional(),
    assessmentTools: z.array(z.string()).optional(),
    synthesis: z.string().optional(),
    isLocked: z.boolean().default(false),
    // No lockStatus/markedDoneStatus needed here if parent handles per-domain status
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

/**
 * Top-level section for Present Levels, containing the functioning/domain data.
 */
export const PresentLevelsSchema = z.object({
    functioning: FunctioningSchema.optional(),
    synthesis: z.string().optional(),
    isLocked: z.boolean().default(false),
    lockStatus: z.record(z.string(), z.boolean()).optional(), // For locking entire functioning object?
    markedDoneStatus: z.object({ // <<< ADDED markedDoneStatus (nested) >>>
        functioning: z.record(z.string(), z.boolean()).optional() // Keys: 'receptive', 'expressive' etc.
    }).optional(),
});

/**
 * Assessment results observations sub-section
 */
export const AssessmentObservationsSchema = z.object({
    classroomObservations: z.string().optional(),
    playBasedInformalObservations: z.string().optional(),
    socialInteractionObservations: z.string().optional(),
    synthesis: z.string().optional(),
    isLocked: z.boolean().default(false),
    lockStatus: z.record(z.string(), z.boolean()).optional(), // e.g., lock individual observation cards
});

/**
 * Assessment procedures and tools sub-section
 */
export const AssessmentProceduresAndToolsSchema = z.object({
    overviewOfAssessmentMethods: z.string().optional(),
    assessmentIntegrityStatement: z.string().optional(),
    assessmentToolsUsed: z.array(z.string()).default([]), // List of tool IDs used
    synthesis: z.string().optional(),
    isLocked: z.boolean().default(false), // Lock for the "Methods" card
    lockStatus: z.record(z.string(), z.boolean()).optional(), // e.g., lockStatus.tools[toolId]
});


/**
 * Assessment results main section schema
 */
export const AssessmentResultsSchema = z.object({
    observations: AssessmentObservationsSchema.optional(),
    assessmentProceduresAndTools: AssessmentProceduresAndToolsSchema.optional(),
    synthesis: z.string().optional(),
    isLocked: z.boolean().default(false),
    lockStatus: z.record(z.string(), z.boolean()).optional(), // e.g., lockStatus.observations, lockStatus.assessmentProceduresAndTools
    markedDoneStatus: z.record(z.string(), z.boolean()).optional(), // <<< ADDED markedDoneStatus >>> (Keys: 'validityStatement', 'observation-xyz', 'tool-abc')
});


/**
 * Background information section schema
 */
export const BackgroundSchema = z.object({
    studentDemographicsAndBackground: z.object({ // Renamed for clarity? Or keep as educationalHistory? Let's keep it simple
        educationalHistory: z.string().optional(),
        synthesis: z.string().optional(),
        isLocked: z.boolean().default(false),
    }).optional(),
    healthReport: z.object({
        medicalHistory: z.string().optional(),
        visionAndHearingScreening: z.string().optional(),
        medicationsAndAllergies: z.string().optional(),
        synthesis: z.string().optional(),
        isLocked: z.boolean().default(false),
    }).optional(),
    earlyInterventionHistory: z.string().optional(),
    familyHistory: z.object({
        familyStructure: z.string().optional(),
        languageAndCulturalBackground: z.string().optional(),
        socioeconomicFactors: z.string().optional(),
        synthesis: z.string().optional(),
        isLocked: z.boolean().default(false),
    }).optional(),
    parentGuardianConcerns: z.string().optional(),
    synthesis: z.string().optional(), // Overall background synthesis
    isLocked: z.boolean().default(false), // Overall background lock
    lockStatus: z.record(z.string(), z.boolean()).optional(), // Locks for sub-cards like 'educationalHistory', 'healthInfo' etc.
    markedDoneStatus: z.record(z.string(), z.boolean()).optional(), // <<< ADDED markedDoneStatus >>> (Keys: 'educationalHistory', 'healthInfo', 'familyInfo', 'parentConcerns')
});

/**
 * Eligibility determination section schema
 */
export const EligibilityDeterminationSchema = z.object({
    domains: z.object({ // These booleans likely determine if the Ed code applies
        language: z.boolean().default(false),
        articulation: z.boolean().default(false),
        voice: z.boolean().default(false),
        fluency: z.boolean().default(false),
    }),
    eligibilityState: z.string().optional().default("CA"), // e.g., CA
    eligibilityStatement: z.string().optional(), // Final statement text
    applicableEdCodeText: z.string().optional(), // <<< ADDING THIS based on usage in ConclusionRecsSection >>> Text of the specific code if eligible
    isPreschool: z.boolean().optional(),
    synthesis: z.string().optional(),
    isLocked: z.boolean().default(false), // Lock for the overall eligibility determination/cards
    lockStatus: z.record(z.string(), z.boolean()).optional(), // Optional: For potential future sub-parts
});

/**
 * Conclusion summary sub-section schema
 */
export const ConclusionSummarySchema = z.object({
    summary: z.string().optional(),
    synthesis: z.string().optional(),
    isLocked: z.boolean().default(false),
});

/**
 * Recommendations sub-section schema
 */
export const RecommendationsSchema = z.object({
    services: z.object({
        typeOfService: z.string().optional(),
        frequency: z.string().optional(),
        setting: z.string().optional(),
    }).optional(),
    accommodations: z.array(z.string()).default([]),
    facilitationStrategies: z.array(z.string()).default([]),
    synthesis: z.string().optional(),
    isLocked: z.boolean().default(false),
});

/**
 * Glossary sub-section schema
 */
export const GlossarySchema = z.object({
    terms: z.record(z.string(), z.string()).default({}),
    isLocked: z.boolean().default(false),
});


/**
 * Final conclusions, recommendations, eligibility, and glossary section schema
 */
export const ConclusionSchema = z.object({
    eligibility: EligibilityDeterminationSchema.optional(),
    conclusion: ConclusionSummarySchema.optional(), // Renamed from 'summary' to avoid conflict
    recommendations: RecommendationsSchema.optional(),
    parentFriendlyGlossary: GlossarySchema.optional(),
    synthesis: z.string().optional(), // Synthesis for overall conclusion section
    isLocked: z.boolean().default(false), // Lock for overall conclusion section
    lockStatus: z.record(z.string(), z.boolean()).optional(), // Locks for sub-cards like 'summary', 'services', 'accommodations', 'glossary', 'eligibility'
    markedDoneStatus: z.record(z.string(), z.boolean()).optional(), // <<< ADDED markedDoneStatus >>> (Keys: 'conclusion-summary', 'services-recommendations', etc.)
});

/**
 * Metadata schema
 */
export const MetadataSchema = z.object({
    lastUpdated: z.string().optional(), // Should probably be default(new Date().toISOString()) but Zod needs careful handling for defaults on update
    version: z.number().default(1),
    // Removed cardStatus - using markedDoneStatus nested in sections now
});


// --- MAIN SPEECH LANGUAGE REPORT SCHEMA ---
export const SpeechLanguageReportSchema = z.object({
    header: HeaderSchema.optional(),
    background: BackgroundSchema.optional(),
    presentLevels: PresentLevelsSchema.optional(),
    assessmentResults: AssessmentResultsSchema.optional(),
    conclusion: ConclusionSchema.optional(),
    metadata: MetadataSchema.optional(),
    synthesis: z.string().optional(), // Overall report synthesis? Optional.
});

// --- Basic Assessment Tool Type (Expand as needed) ---
export const AssessmentToolSchema = z.object({
    id: z.string(), // Unique identifier
    name: z.string(), // Full name of the tool
    shortName: z.string().optional(), // Abbreviation (e.g., CELF-5)
    authors: z.array(z.string()).optional(),
    publisher: z.string().optional(),
    year: z.string().optional(), // Or number if preferred
    targetAgeRange: z.string().optional(), // e.g., "5:0-21:11"
    domains: z.array(z.string()).optional(), // List of domains it assesses
    description: z.string().optional(), // Brief description
    standardScores: z.object({ // Example structure for scores
        mean: z.number().optional(),
        stdDev: z.number().optional(),
    }).optional(),
    scoreTypes: z.array(z.string()).optional(), // e.g., ["Standard Score", "Percentile Rank", "Scaled Score"]
    isCore: z.boolean().optional(), // Is it a core part of standard battery?
    // Add any other relevant fields
});


// --- Inferred Types (Ensure all needed types are exported) ---
export type SpeechLanguageReport = z.infer<typeof SpeechLanguageReportSchema>;
export type StudentInformation = z.infer<typeof StudentInformationSchema>;
export type Header = z.infer<typeof HeaderSchema>;
export type Background = z.infer<typeof BackgroundSchema>;
export type FunctioningSection = z.infer<typeof FunctioningSectionSchema>;
export type Functioning = z.infer<typeof FunctioningSchema>;
export type PresentLevels = z.infer<typeof PresentLevelsSchema>;
export type AssessmentResults = z.infer<typeof AssessmentResultsSchema>;
export type EligibilityDetermination = z.infer<typeof EligibilityDeterminationSchema>;
export type ConclusionSummary = z.infer<typeof ConclusionSummarySchema>;
export type Recommendations = z.infer<typeof RecommendationsSchema>;
export type Glossary = z.infer<typeof GlossarySchema>;
export type Conclusion = z.infer<typeof ConclusionSchema>; // This now correctly exports the Conclusion type
export type Metadata = z.infer<typeof MetadataSchema>;
export type AssessmentTool = z.infer<typeof AssessmentToolSchema>; // Export AssessmentTool type


// --- NOTE regarding missing exports errors from previous steps ---
// - 'ReportConclusion' error: Use the exported 'Conclusion' type instead.
// - 'DomainSection' error: Use the exported 'FunctioningSection' type instead.
// - 'californiaEdCodes', 'preschoolEdCode': These seem like specific data constants,
//   not just types. They should be defined and exported from a relevant file
//   (e.g., '@/lib/eligibilityCodes.ts') or removed from imports if unused.
//   They are NOT defined within this Zod schema file.