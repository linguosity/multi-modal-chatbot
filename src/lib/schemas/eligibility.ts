import { z } from 'zod';

// California Education Code for Speech and Language Eligibility Schema
export const CaliforniaEligibilitySchema = z.object({
  // Articulation Disorder
  articulationDisorder: z.object({
    isEligible: z.boolean().default(false),
    criteria: z.array(z.object({
      description: z.string(),
      isMet: z.boolean().default(false),
      evidence: z.string().optional(),
    })).default([
      {
        description: "The pupil displays reduced intelligibility or an inability to use the speech mechanism which significantly interferes with communication and attracts adverse attention.",
        isMet: false,
      },
      {
        description: "The pupil demonstrates one or more phonemic/phonological disorders, including but not limited to multiple phoneme errors, distortions, substitutions, and/or omissions.",
        isMet: false,
      },
      {
        description: "The disorder adversely affects educational performance.",
        isMet: false,
      },
      {
        description: "The disorder is not due primarily to unfamiliarity with English or dialectical differences.",
        isMet: false,
      }
    ]),
    notes: z.string().optional(),
  }),

  // Language Disorder
  languageDisorder: z.object({
    isEligible: z.boolean().default(false),
    criteria: z.array(z.object({
      description: z.string(),
      isMet: z.boolean().default(false),
      evidence: z.string().optional(),
    })).default([
      {
        description: "The pupil scores at least 1.5 standard deviations below the mean, or below the 7th percentile, for his or her chronological age or developmental level on two or more standardized tests in one or more of the following areas: morphology, syntax, semantics, or pragmatics.",
        isMet: false,
      },
      {
        description: "The pupil displays inappropriate or inadequate usage of expressive or receptive language as measured by a representative spontaneous or elicited language sample of a minimum of 50 utterances.",
        isMet: false,
      },
      {
        description: "The disorder adversely affects educational performance.",
        isMet: false,
      },
      {
        description: "The disorder is not due primarily to unfamiliarity with English or dialectical differences.",
        isMet: false,
      }
    ]),
    notes: z.string().optional(),
  }),

  // Fluency Disorder
  fluencyDisorder: z.object({
    isEligible: z.boolean().default(false),
    criteria: z.array(z.object({
      description: z.string(),
      isMet: z.boolean().default(false),
      evidence: z.string().optional(),
    })).default([
      {
        description: "The pupil demonstrates an abnormal rate of speaking, speech interruptions, repetitions, prolongations, hesitations, and/or blocks that are inappropriate for the pupil's age and speech situation.",
        isMet: false,
      },
      {
        description: "The disorder adversely affects educational performance.",
        isMet: false,
      }
    ]),
    notes: z.string().optional(),
  }),

  // Voice Disorder
  voiceDisorder: z.object({
    isEligible: z.boolean().default(false),
    criteria: z.array(z.object({
      description: z.string(),
      isMet: z.boolean().default(false),
      evidence: z.string().optional(),
    })).default([
      {
        description: "The pupil has an abnormal voice quality, pitch, loudness, resonance, and/or duration which is inappropriate for the pupil's age and gender.",
        isMet: false,
      },
      {
        description: "The disorder adversely affects educational performance.",
        isMet: false,
      },
      {
        description: "The disorder is not the result of a temporary physical condition such as allergies, colds, or abnormal tonsils or adenoids.",
        isMet: false,
      },
      {
        description: "There is medical documentation that voice therapy is not contraindicated.",
        isMet: false,
      }
    ]),
    notes: z.string().optional(),
  }),
});

export type CaliforniaEligibility = z.infer<typeof CaliforniaEligibilitySchema>;