import { z } from 'zod';

// Schema for standardized test results
export const StandardizedTestSchema = z.object({
  testName: z.string(),
  dateAdministered: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  
  // Score types
  scores: z.array(z.object({
    type: z.enum([
      "standard score", 
      "scaled score", 
      "percentile", 
      "age equivalent", 
      "grade equivalent",
      "raw score",
      "t-score",
      "z-score",
      "other"
    ]),
    value: z.string(),
    subtest: z.string().optional(),
    notes: z.string().optional(),
  })),
  
  // Qualitative interpretation
  interpretation: z.string().optional(),
});

// Schema for informal assessment results
export const InformalAssessmentSchema = z.object({
  type: z.enum([
    "observation", 
    "language sample", 
    "criterion-referenced", 
    "dynamic assessment",
    "parent interview",
    "teacher interview",
    "curriculum-based",
    "other"
  ]),
  dateAdministered: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  description: z.string(),
  results: z.string(),
  interpretation: z.string().optional(),
});

// Schema for a speech sound sample
export const SpeechSampleSchema = z.object({
  sampleType: z.enum(["single words", "sentences", "connected speech", "other"]),
  dateCollected: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  phonemes: z.array(z.object({
    target: z.string(),
    position: z.enum(["initial", "medial", "final", "all"]),
    production: z.string().optional(),
    accuracy: z.number().min(0).max(100).optional(),
    stimulable: z.boolean().optional(),
  })),
  processes: z.array(z.object({
    process: z.string(),
    examples: z.array(z.string()).optional(),
    frequency: z.enum(["rarely", "sometimes", "frequently", "always"]).optional(),
  })).optional(),
  intelligibility: z.object({
    singleWords: z.number().min(0).max(100).optional(),
    connectedSpeech: z.number().min(0).max(100).optional(),
    familiar: z.number().min(0).max(100).optional(),
    unfamiliar: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
});

// Schema for language sample
export const LanguageSampleSchema = z.object({
  sampleType: z.enum(["conversation", "narrative", "expository", "other"]),
  dateCollected: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  context: z.string(),
  measures: z.object({
    mlu: z.number().optional(),
    totalUtterances: z.number().optional(),
    totalWords: z.number().optional(),
    ndr: z.number().optional(), // Number of Different Roots
    percentGrammaticalUtterances: z.number().min(0).max(100).optional(),
    otherMeasures: z.record(z.string(), z.string()).optional(),
  }).optional(),
  transcription: z.string().optional(),
  analysis: z.string().optional(),
  notes: z.string().optional(),
});

// Combined assessment schema
export const AssessmentSchema = z.object({
  // General assessment information
  assessmentType: z.enum(["initial", "annual", "triennial", "exit", "progress", "other"]),
  assessmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  evaluator: z.string(),
  
  // Background information
  background: z.object({
    reason: z.string(),
    history: z.string().optional(),
    previousServices: z.string().optional(),
    medicalRelevant: z.string().optional(),
    developmentalRelevant: z.string().optional(),
  }),
  
  // Assessment components
  standardizedTests: z.array(StandardizedTestSchema).optional(),
  informalAssessments: z.array(InformalAssessmentSchema).optional(),
  speechSamples: z.array(SpeechSampleSchema).optional(),
  languageSamples: z.array(LanguageSampleSchema).optional(),
  
  // Observations
  observations: z.object({
    classroom: z.string().optional(),
    structured: z.string().optional(),
    unstructured: z.string().optional(),
    other: z.string().optional(),
  }).optional(),
  
  // Summary and recommendations
  summary: z.string(),
  strengths: z.array(z.string()).optional(),
  areas: z.array(z.string()).optional(),
  recommendations: z.array(z.string()),
  
  // Eligibility considerations
  eligibility: z.object({
    considerationsDiscussed: z.boolean().default(false),
    adverseEffect: z.string().optional(),
    evaluationMethods: z.string().optional(),
  }).optional(),
});

export type Assessment = z.infer<typeof AssessmentSchema>;
export type StandardizedTest = z.infer<typeof StandardizedTestSchema>;
export type InformalAssessment = z.infer<typeof InformalAssessmentSchema>;
export type SpeechSample = z.infer<typeof SpeechSampleSchema>;
export type LanguageSample = z.infer<typeof LanguageSampleSchema>;