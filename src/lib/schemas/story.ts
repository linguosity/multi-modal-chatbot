import { z } from 'zod';

// Define narrative levels for type safety
export const NARRATIVE_LEVELS = {
  SEQUENCES: "sequences",
  PRIMITIVE_NARRATIVES: "primitive_narratives",
  CHAIN_NARRATIVES: "chain_narratives",
  FOCUSED_CHAINS: "focused_chains",
  TRUE_NARRATIVES: "true_narratives"
} as const;

// Schema for stories
export const StorySchema = z.object({
  id: z.string(),
  studentId: z.string(),
  userId: z.string(),
  
  // Basic information
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(), // For SEO/public sharing
  narrativeLevel: z.enum([
    NARRATIVE_LEVELS.SEQUENCES,
    NARRATIVE_LEVELS.PRIMITIVE_NARRATIVES,
    NARRATIVE_LEVELS.CHAIN_NARRATIVES,
    NARRATIVE_LEVELS.FOCUSED_CHAINS,
    NARRATIVE_LEVELS.TRUE_NARRATIVES
  ]),
  
  // Content sections
  narrative: z.string(),
  
  // Language information
  languages: z.array(z.string()).min(1, "At least one language must be specified"),
  dialect: z.string().optional(),
  
  // Metrics and analysis
  wordCount: z.number().int().optional(),
  gradeLevel: z.union([z.string(), z.number()]).optional(),
  subordinationIndex: z.number().optional(),
  
  // Target words
  targetWordList: z.array(z.string()).optional(), // Words from Listophonic app
  targetVocabulary: z.array(z.string()).optional(), // Manually selected words
  
  // Additional content
  preReadingActivities: z.string().optional(),
  vocabulary: z.array(
    z.object({
      word: z.string(),
      definition: z.string(),
      exampleSentence: z.string()
    })
  ).optional(),
  comprehensionQuestions: z.array(
    z.object({
      question: z.string(),
      level: z.string(),
      sampleAnswer: z.string()
    })
  ).optional(),
  images: z.array(
    z.object({
      url: z.string().optional(),
      context: z.string()
    })
  ).optional(),
  
  // Metadata
  createdAt: z.string(),
  updatedAt: z.string(),
  status: z.enum([
    "draft", 
    "generated", 
    "published"
  ]).default("draft"),
  studentAge: z.number().int().optional(),
  version: z.number().int().default(1), // For tracking revisions
  
  // Optional fields for future expansion
  tags: z.array(z.string()).optional(),
});

// Export types
export type NarrativeLevel = keyof typeof NARRATIVE_LEVELS;
export type Story = z.infer<typeof StorySchema>;