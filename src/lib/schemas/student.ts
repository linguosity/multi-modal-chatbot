import { z } from 'zod';

export const StudentSchema = z.object({
  // Basic information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  studentId: z.string().optional(),
  grade: z.string(),
  
  // Demographics
  gender: z.enum(["male", "female", "non-binary", "prefer not to say"]),
  languages: z.array(z.string()).min(1, "At least one language must be specified"),
  primaryLanguage: z.string(),
  
  // School information
  school: z.string().min(1, "School name is required"),
  teacher: z.string().optional(),
  district: z.string().optional(),
  
  // Educational program
  currentProgram: z.enum(["general education", "special education", "504", "speech-only", "other"]),
  specialEducationServices: z.array(z.string()).optional(),
  
  // Referral information
  referralSource: z.string().optional(),
  referralReason: z.string().optional(),
  referralDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  
  // Contact information
  parentGuardianName: z.string().optional(),
  parentGuardianEmail: z.string().email().optional(),
  parentGuardianPhone: z.string().optional(),
  
  // Medical information
  medicalDiagnoses: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  hearingStatus: z.string().optional(),
  visionStatus: z.string().optional(),
});

export type Student = z.infer<typeof StudentSchema>;