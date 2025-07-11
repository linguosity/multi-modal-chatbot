import { z } from 'zod';

export const ReportSectionTypeSchema = z.object({
  id: z.string().uuid(), // Unique ID for the section type (e.g., "reason_for_referral")
  name: z.string(), // Display name (e.g., "Reason for Referral")
  default_title: z.string(), // Add this field
  ai_directive: z.string().optional(), // New field for instructions
  // Add any other properties relevant to a section type (e.g., default content, validation rules)
});

export const ReportSectionGroupSchema = z.object({
  id: z.string().uuid(), // Unique ID for the group
  title: z.string(), // Display title (e.g., "Initial Information & Background")
  sectionTypeIds: z.array(z.string().uuid()), // Array of sectionType IDs belonging to this group
});

export const ReportTemplateSchema = z.object({
  id: z.string().uuid().optional(), // Optional for new templates
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  groups: z.array(ReportSectionGroupSchema),
  // Add metadata like user_id, created_at, updated_at
  user_id: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Define a comprehensive list of all available section types
export const ALL_REPORT_SECTION_TYPES = z.array(ReportSectionTypeSchema);