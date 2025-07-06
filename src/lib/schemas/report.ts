import { z } from 'zod';

// Define standard section types for reports
export const REPORT_SECTION_TYPES = {
  HEADING: "heading",
  REASON_FOR_REFERRAL: "reason_for_referral",
  HEALTH_DEVELOPMENTAL_HISTORY: "health_developmental_history",
  FAMILY_BACKGROUND: "family_background",
  PARENT_CONCERN: "parent_concern",
  VALIDITY_STATEMENT: "validity_statement",
  ASSESSMENT_TOOLS: "assessment_tools",
  ASSESSMENT_RESULTS: "assessment_results",
  LANGUAGE_SAMPLE: "language_sample",
  ELIGIBILITY_CHECKLIST: "eligibility_checklist",
  CONCLUSION: "conclusion",
  RECOMMENDATIONS: "recommendations",
  ACCOMMODATIONS: "accommodations",
  OTHER: "other"
} as const;

// Schema for report sections
export const ReportSectionSchema = z.object({
  id: z.string(),
  sectionType: z.enum([
    REPORT_SECTION_TYPES.HEADING,
    REPORT_SECTION_TYPES.REASON_FOR_REFERRAL,
    REPORT_SECTION_TYPES.HEALTH_DEVELOPMENTAL_HISTORY,
    REPORT_SECTION_TYPES.FAMILY_BACKGROUND,
    REPORT_SECTION_TYPES.PARENT_CONCERN,
    REPORT_SECTION_TYPES.VALIDITY_STATEMENT,
    REPORT_SECTION_TYPES.ASSESSMENT_TOOLS,
    REPORT_SECTION_TYPES.ASSESSMENT_RESULTS,
    REPORT_SECTION_TYPES.LANGUAGE_SAMPLE,
    REPORT_SECTION_TYPES.ELIGIBILITY_CHECKLIST,
    REPORT_SECTION_TYPES.CONCLUSION,
    REPORT_SECTION_TYPES.RECOMMENDATIONS,
    REPORT_SECTION_TYPES.ACCOMMODATIONS,
    REPORT_SECTION_TYPES.OTHER
  ]),
  title: z.string(),
  content: z.string(),
  order: z.number().int(),
  isRequired: z.boolean().default(true),
  isGenerated: z.boolean().default(false),
  generationPrompt: z.string().optional(),
  lastUpdated: z.string().optional(),
  dataSource: z.string().optional(), // Reference to data that can populate this section
  icon: z.string().optional(),
  borderColor: z.string().optional(),
});

// Schema for report templates
export const ReportTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum([
    "initial",
    "annual",
    "triennial",
    "progress",
    "exit",
    "consultation",
    "other"
  ]),
  sections: z.array(ReportSectionSchema),
  defaultSections: z.array(z.string()), // Array of section IDs that are default for this template
  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Schema for complete reports
export const ReportSchema = z.object({
  id: z.string(),
  templateId: z.string().optional(),

  // Basic information
  title: z.string(),
  studentName: z.string().optional(),
  studentId: z.string().optional(),
  type: z.enum([
    "initial",
    "annual",
    "triennial",
    "progress",
    "exit",
    "consultation",
    "other"
  ]),

  // Dates and status
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  status: z.enum([
    "draft",
    "in_progress",
    "review",
    "completed",
    "archived"
  ]).default("draft"),

  // People involved
  studentId: z.string().optional(),
  evaluatorId: z.string().optional(),

  // Content
  sections: z.array(ReportSectionSchema),

  // Additional metadata
  tags: z.array(z.string()).optional(),
  finalizedDate: z.string().optional(),
  printVersion: z.string().optional(),

  // Related data
  relatedAssessmentIds: z.array(z.string()).optional(),
  relatedEligibilityIds: z.array(z.string()).optional(),
});

// Default section templates that can be used across reports
export const DEFAULT_SECTIONS = {
  // Heading section template
  HEADING: {
    id: "heading",
    sectionType: REPORT_SECTION_TYPES.HEADING,
    title: "Header",
    content: `[Student Name] Speech and Language Evaluation\nDate: [Evaluation Date]\nEvaluator: [Evaluator Name], [Credentials]\nSchool: [School Name]`,
    order: 1,
    isRequired: true,
    isGenerated: true,
    generationPrompt: "Generate a professional heading for a speech and language evaluation report including the student's name, evaluation date, evaluator name and credentials, and school name."
  },

  // Reason for Referral section template
  REASON_FOR_REFERRAL: {
    id: "reason_for_referral",
    sectionType: REPORT_SECTION_TYPES.REASON_FOR_REFERRAL,
    title: "Reason for Referral",
    content: `[Student] was referred for a speech and language evaluation by [Referral Source] due to concerns regarding [Brief Description of Concerns]. This evaluation was conducted to determine if [Student] demonstrates a speech or language disorder that adversely affects educational performance and requires special education services.`,
    order: 2,
    isRequired: true,
    isGenerated: true,
    generationPrompt: "Generate a concise reason for referral paragraph explaining who referred the student, what concerns prompted the referral, and the purpose of the evaluation."
  },

  // Health and Developmental History section template
  HEALTH_DEVELOPMENTAL_HISTORY: {
    id: "health_developmental_history",
    sectionType: REPORT_SECTION_TYPES.HEALTH_DEVELOPMENTAL_HISTORY,
    title: "Health and Developmental History",
    content: `According to information provided by [Source], [Student]'s health and developmental history includes: [Relevant developmental milestones, health conditions, previous diagnoses, etc.]. [Include relevant hearing and vision screening results if available].`,
    order: 3,
    isRequired: true,
    isGenerated: true,
    generationPrompt: "Generate a comprehensive health and developmental history section that summarizes relevant medical conditions, developmental milestones, and previous diagnoses that may impact speech and language development."
  },

  // Family Background section template
  FAMILY_BACKGROUND: {
    id: "family_background",
    sectionType: REPORT_SECTION_TYPES.FAMILY_BACKGROUND,
    title: "Family Background",
    content: `[Student] lives with [family members] and [describe home language environment]. [Include any relevant family history of speech, language, or learning difficulties if appropriate].`,
    order: 4,
    isRequired: true,
    isGenerated: true,
    generationPrompt: "Generate a family background section. Extract details about the student's living situation (e.g., who they live with, family members present) and home language environment from the unstructured notes. Include any relevant family history of speech, language, or learning difficulties if mentioned."
  },

  // Parent Concern section template
  PARENT_CONCERN: {
    id: "parent_concern",
    sectionType: REPORT_SECTION_TYPES.PARENT_CONCERN,
    title: "Parent/Guardian Concerns",
    content: `According to [Parent/Guardian], their primary concerns include [list specific concerns]. They report that [Student] [describe impact of difficulties at home and in community settings].`,
    order: 5,
    isRequired: true,
    isGenerated: true,
    generationPrompt: "Generate a parent/guardian concerns section that accurately reflects parental reports about the student's communication difficulties and their impact at home and in the community."
  },

  // Validity Statement section template
  VALIDITY_STATEMENT: {
    id: "validity_statement",
    sectionType: REPORT_SECTION_TYPES.VALIDITY_STATEMENT,
    title: "Validity Statement",
    content: `The results of this evaluation are considered to be a valid representation of [Student]'s current speech and language skills. [Student] was cooperative throughout the assessment and appeared to understand task directions. [Include any factors that may have affected test validity, such as attention, motivation, or cultural/linguistic factors].`,
    order: 6,
    isRequired: true,
    isGenerated: true,
    generationPrompt: "Generate a validity statement that confirms whether the assessment results are valid and describes any factors that may have affected test performance, such as attention, motivation, or cultural/linguistic considerations."
  },

  // Assessment Tools section template
  ASSESSMENT_TOOLS: {
    id: "assessment_tools",
    sectionType: REPORT_SECTION_TYPES.ASSESSMENT_TOOLS,
    title: "Assessment Tools",
    content: `The following assessment tools were used in this evaluation:\n\n1. [Test Name] - [Brief description of what the test measures]\n2. [Test Name] - [Brief description of what the test measures]\n3. [Other assessment procedures, such as language sample, observation, interview, etc.]`,
    order: 7,
    isRequired: true,
    isGenerated: true,
    generationPrompt: "Generate an assessment tools section. List and briefly describe each formal and informal assessment measure used in the evaluation. Crucially, if the unstructured notes describe any assessment procedures (e.g., 'language sample analysis', 'oral mechanism exam', 'clinical observation', 'parent/caregiver interview', 'questionnaire', 'survey', 'classroom observation'), infer and list them here, even if no formal test names are explicitly given."
  },

  // Assessment Results section template
  ASSESSMENT_RESULTS: {
    id: "assessment_results",
    sectionType: REPORT_SECTION_TYPES.ASSESSMENT_RESULTS,
    title: "Assessment Results",
    content: `### Standardized Test Results\n[Include test scores, percentile ranks, and interpretation for each test administered]\n\n### Articulation/Phonology\n[Include summary of articulation skills, error patterns, stimulability, and intelligibility]\n\n### Language\n[Include summary of receptive and expressive language skills, including semantics, syntax, morphology, and pragmatics]\n\n### Other Areas Assessed\n[Include results from other relevant areas such as voice, fluency, etc. if applicable]`,
    order: 8,
    isRequired: true,
    isGenerated: true,
    generationPrompt: "Generate a comprehensive assessment results section that presents and interprets standardized test scores and describes the student's performance in relevant speech and language domains."
  },

  // Language Sample section template
  LANGUAGE_SAMPLE: {
    id: "language_sample",
    sectionType: REPORT_SECTION_TYPES.LANGUAGE_SAMPLE,
    title: "Language Sample Analysis",
    content: `Date: [Date of language sample]\nSetting: [Description of context]\n\n### Language Sample Metrics\n[Include quantitative measures such as MLU, TTR, number of different words, etc.]\n\n### Syntactic Structures\n[Describe the types of sentences used, grammatical forms present/absent, and error patterns]\n\n### Pragmatic Skills\n[Document turn-taking, topic maintenance, conversational repair, etc.]\n\n### Transcription\n[Include the actual transcription or excerpts of the language sample]`,
    order: 9,
    isRequired: false,
    isGenerated: false
  },

  // Eligibility Checklist section template
  ELIGIBILITY_CHECKLIST: {
    id: "eligibility_checklist",
    sectionType: REPORT_SECTION_TYPES.ELIGIBILITY_CHECKLIST,
    title: "Eligibility Determination",
    content: `Based on the results of this evaluation, [Student] [does/does not] meet the eligibility criteria for speech or language impairment according to [relevant educational code or regulations].\n\n### Eligibility Criteria:\n\n1. [Criterion 1] - [Met/Not Met]\n2. [Criterion 2] - [Met/Not Met]\n3. [Criterion 3] - [Met/Not Met]\n\n[Provide rationale for each determination]`,
    order: 10,
    isRequired: true,
    isGenerated: true,
    generationPrompt: "Generate an eligibility determination section that states whether the student meets criteria for speech-language services and explicitly addresses each eligibility criterion, indicating whether it is met and providing supporting evidence."
  },

  // Conclusion section template
  CONCLUSION: {
    id: "conclusion",
    sectionType: REPORT_SECTION_TYPES.CONCLUSION,
    title: "Conclusion",
    content: `[Student] demonstrates [strengths and weaknesses] in the area of [specify speech/language domains]. These difficulties [do/does not] adversely affect [his/her/their] educational performance as evidenced by [describe educational impact]. Based on the results of this evaluation, [Student] [does/does not] qualify for speech and language services.`,
    order: 11,
    isRequired: true,
    isGenerated: true,
    generationPrompt: "Generate a conclusion paragraph that summarizes the student's speech and language profile, educational impact, and eligibility determination."
  },

  // Recommendations section template
  RECOMMENDATIONS: {
    id: "recommendations",
    sectionType: REPORT_SECTION_TYPES.RECOMMENDATIONS,
    title: "Recommendations",
    content: `The following recommendations are made based on the results of this evaluation:\n\n1. [Recommendation 1]\n2. [Recommendation 2]\n3. [Recommendation 3]\n\n[Include specific recommendations for services, intervention targets, and progress monitoring]`,
    order: 12,
    isRequired: true,
    isGenerated: true,
    generationPrompt: "Generate specific recommendations for the student based on assessment results, including service delivery recommendations, intervention targets, and progress monitoring approaches."
  },

  // Accommodations section template
  ACCOMMODATIONS: {
    id: "accommodations",
    sectionType: REPORT_SECTION_TYPES.ACCOMMODATIONS,
    title: "Accommodations and Modifications",
    content: `The following accommodations and modifications are recommended to support [Student]'s communication needs in the educational setting:\n\n1. [Accommodation 1]\n2. [Accommodation 2]\n3. [Accommodation 3]\n\n[Include specific classroom strategies, environmental modifications, and instructional accommodations]`,
    order: 13,
    isRequired: true,
    isGenerated: true,
    generationPrompt: "Generate a list of specific accommodations and modifications that teachers and other staff can implement to support the student's communication needs in various educational settings."
  }
};

// Export types
export type ReportSectionType = keyof typeof REPORT_SECTION_TYPES;
export type ReportSection = z.infer<typeof ReportSectionSchema>;
export type ReportTemplate = z.infer<typeof ReportTemplateSchema>;
export type Report = z.infer<typeof ReportSchema>;