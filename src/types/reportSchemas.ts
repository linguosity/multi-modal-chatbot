import { z } from "zod";

/**
 * Schema for the header section of a report
 */
export const StudentInformationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  DOB: z.string().optional(),
  reportDate: z.string().optional(),
  evaluationDate: z.string().optional(),
  parents: z.array(z.string()).default([]),
  homeLanguage: z.string().default("English"),
});

/**
 * Schema for reason for referral
 */
export const ReferralSchema = z.object({
  reasonForReferral: z.string().optional(),
  confidentialityStatement: z.string().optional(),
});

/**
 * Header schema containing student information and referral info
 */
export const HeaderSchema = z.object({
  studentInformation: StudentInformationSchema,
  reasonForReferral: z.string().optional(),
  confidentialityStatement: z.string().optional(),
});

/**
 * Schema for a language domain section
 */
export const DomainSectionSchema = z.object({
  isConcern: z.boolean().default(false),
  topicSentence: z.string().optional(),
  strengths: z.array(z.string()).default([]),
  needs: z.array(z.string()).default([]),
  impactStatement: z.string().optional(),
  assessmentTools: z.array(z.string()).optional(),
});

/**
 * Schema for domain sections in the report
 */
export const DomainsSchema = z.object({
  receptive: DomainSectionSchema.optional(),
  expressive: DomainSectionSchema.optional(),
  pragmatic: DomainSectionSchema.optional(),
  articulation: DomainSectionSchema.optional(),
  voice: DomainSectionSchema.optional(),
  fluency: DomainSectionSchema.optional(),
});

/**
 * Schema for assessment results section
 */
export const AssessmentResultsSchema = z.object({
  observations: z.object({
    classroomObservations: z.string().optional(),
    playBasedInformalObservations: z.string().optional(),
    socialInteractionObservations: z.string().optional(),
  }).optional(),
  assessmentProceduresAndTools: z.object({
    overviewOfAssessmentMethods: z.string().optional(),
    assessmentToolsUsed: z.array(z.string()).default([]),
  }).optional(),
  domains: DomainsSchema.optional(),
});

/**
 * Schema for conclusion and recommendations
 */
export const ConclusionSchema = z.object({
  eligibility: z.object({
    domains: z.object({
      receptive: z.boolean().default(false),
      expressive: z.boolean().default(false),
      pragmatic: z.boolean().default(false),
      articulation: z.boolean().default(false),
      voice: z.boolean().default(false),
      fluency: z.boolean().default(false),
    }),
    californiaEdCode: z.string().optional(),
  }).optional(),
  conclusion: z.object({
    summary: z.string().optional(),
  }).optional(),
  recommendations: z.object({
    services: z.object({
      typeOfService: z.string().optional(),
      frequency: z.string().optional(),
      setting: z.string().optional(),
    }).optional(),
    accommodations: z.array(z.string()).default([]),
    facilitationStrategies: z.array(z.string()).default([]),
  }).optional(),
  parentFriendlyGlossary: z.object({
    terms: z.record(z.string(), z.string()).default({}),
  }).optional(),
});

/**
 * Complete Speech-Language Report schema
 */
export const SpeechLanguageReportSchema = z.object({
  header: HeaderSchema,
  background: z.object({
    studentDemographicsAndBackground: z.object({
      educationalHistory: z.string().optional(),
    }).optional(),
    healthReport: z.object({
      medicalHistory: z.string().optional(),
      visionAndHearingScreening: z.string().optional(),
      medicationsAndAllergies: z.string().optional(),
    }).optional(),
    earlyInterventionHistory: z.string().optional(),
    familyHistory: z.object({
      familyStructure: z.string().optional(),
      languageAndCulturalBackground: z.string().optional(),
      socioeconomicFactors: z.string().optional(),
    }).optional(),
    parentGuardianConcerns: z.string().optional(),
  }).optional(),
  assessmentResults: AssessmentResultsSchema,
  conclusion: ConclusionSchema,
  metadata: z.object({
    lastUpdated: z.string().optional(),
    version: z.number().default(1),
  }).optional(),
});

/**
 * Type inference for the schema
 */
export type SpeechLanguageReport = z.infer<typeof SpeechLanguageReportSchema>;
export type StudentInformation = z.infer<typeof StudentInformationSchema>;
export type DomainSection = z.infer<typeof DomainSectionSchema>;
export type Domains = z.infer<typeof DomainsSchema>;
export type AssessmentResults = z.infer<typeof AssessmentResultsSchema>;
export type Conclusion = z.infer<typeof ConclusionSchema>;

/**
 * Example usage:
 * 
 * // Validate a report
 * try {
 *   const validReport = SpeechLanguageReportSchema.parse(reportData);
 *   // Safe to use validReport
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     console.error("Validation errors:", error.errors);
 *   }
 * }
 * 
 * // Safe parse (returns success/error object instead of throwing)
 * const result = SpeechLanguageReportSchema.safeParse(reportData);
 * if (result.success) {
 *   const validData = result.data;
 *   // Use validData safely
 * } else {
 *   console.error(result.error.errors);
 * }
 */