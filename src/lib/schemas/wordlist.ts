import { z } from 'zod';

// Define word position types
export const WORD_POSITION_TYPES = {
  INITIAL: "initial",
  MEDIAL: "medial",
  FINAL: "final",
  ALL: "all"
} as const;

// Schema for word lists
export const WordListSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  
  // Target sound configuration
  targetSound: z.string().min(1, "Target sound is required"),
  wordPosition: z.enum([
    WORD_POSITION_TYPES.INITIAL,
    WORD_POSITION_TYPES.MEDIAL,
    WORD_POSITION_TYPES.FINAL,
    WORD_POSITION_TYPES.ALL
  ]),
  maxSyllables: z.number().int().min(1).max(5),
  excludedSounds: z.array(z.string()).optional(),
  
  // Generated content
  realWords: z.array(z.string()).optional(),
  nonsenseWords: z.array(z.string()).optional(),
  phrases: z.array(z.string()).optional(),
  sentences: z.array(z.string()).optional(),
  narrative: z.string().optional(),
  
  // Metadata
  title: z.string().min(1, "Title is required"),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  
  // Status
  status: z.enum([
    "draft", 
    "generated", 
    "completed"
  ]).default("draft"),
  
  // Tags for organization
  tags: z.array(z.string()).optional(),
});

// Export types
export type WordPositionType = keyof typeof WORD_POSITION_TYPES;
export type WordList = z.infer<typeof WordListSchema>;