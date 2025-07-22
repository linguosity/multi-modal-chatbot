import { z } from 'zod';

// Template field types
export const TemplateFieldSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'select', 'checkbox', 'textarea']),
  label: z.string(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(), // For select fields
  required: z.boolean().default(false),
  defaultValue: z.string().optional(),
});

// Section template schema
export const SectionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  sectionType: z.string(),
  content: z.string(), // HTML content with placeholders
  fields: z.array(TemplateFieldSchema).optional(),
  category: z.enum(['standard', 'advanced', 'custom']).default('standard'),
});

// Template collection for a section type
export const SectionTemplateCollectionSchema = z.object({
  sectionType: z.string(),
  templates: z.array(SectionTemplateSchema),
});

export type TemplateField = z.infer<typeof TemplateFieldSchema>;
export type SectionTemplate = z.infer<typeof SectionTemplateSchema>;
export type SectionTemplateCollection = z.infer<typeof SectionTemplateCollectionSchema>;

// Built-in templates for common section types
export const BUILT_IN_TEMPLATES: Record<string, SectionTemplate[]> = {
  validity_statement: [
    {
      id: 'standard_validity',
      name: 'Standard Validity Statement',
      description: 'Standard validity statement with common factors',
      sectionType: 'validity_statement',
      content: `<p>The results of this evaluation are considered to be a <strong data-field="validity" data-options="valid,invalid">valid</strong> representation of <span data-field="student_name">[Student Name]</span>'s current speech and language skills.</p>

<p><span data-field="student_name">[Student Name]</span> was <strong data-field="cooperation" data-options="cooperative,uncooperative,partially cooperative">cooperative</strong> throughout the assessment and <strong data-field="understanding" data-options="appeared to understand,had difficulty understanding,inconsistently understood">appeared to understand</strong> task directions.</p>

<p data-field="factors_section" data-show-if="has_factors">The following factors may have affected test validity: <span data-field="validity_factors" data-type="checklist" data-options="attention difficulties,motivation issues,cultural/linguistic considerations,fatigue,environmental distractions">[Select factors]</span><span data-field="other_factors" data-show-if="other_selected">: <span data-field="other_description">[Describe other factors]</span></span>.</p>`,
      category: 'standard'
    },
    {
      id: 'simple_validity',
      name: 'Simple Validity Statement',
      description: 'Basic validity statement without factors',
      sectionType: 'validity_statement',
      content: `<p>The results of this evaluation are considered to be a valid representation of <span data-field="student_name">[Student Name]</span>'s current speech and language skills. <span data-field="student_name">[Student Name]</span> was cooperative throughout the assessment.</p>`,
      category: 'standard'
    }
  ],
  
  reason_for_referral: [
    {
      id: 'standard_referral',
      name: 'Standard Referral Reason',
      description: 'Standard reason for referral format',
      sectionType: 'reason_for_referral',
      content: `<p><span data-field="student_name">[Student Name]</span> was referred for a speech and language evaluation by <span data-field="referral_source">[Referral Source]</span> due to concerns regarding <span data-field="concerns">[Brief Description of Concerns]</span>.</p>

<p>This evaluation was conducted to determine if <span data-field="student_name">[Student Name]</span> demonstrates a speech or language disorder that adversely affects educational performance and requires special education services.</p>`,
      category: 'standard'
    }
  ],

  assessment_results: [
    {
      id: 'comprehensive_results',
      name: 'Comprehensive Assessment Results',
      description: 'Detailed assessment results with multiple domains',
      sectionType: 'assessment_results',
      content: `<h3>Standardized Test Results</h3>
<p data-field="standardized_tests">[Include test scores, percentile ranks, and interpretation for each test administered]</p>

<h3>Articulation/Phonology</h3>
<p data-field="articulation">[Include summary of articulation skills, error patterns, stimulability, and intelligibility]</p>

<h3>Language Skills</h3>
<h4>Receptive Language</h4>
<p data-field="receptive_language">[Describe receptive language abilities]</p>

<h4>Expressive Language</h4>
<p data-field="expressive_language">[Describe expressive language abilities including semantics, syntax, morphology, and pragmatics]</p>

<h3>Other Areas Assessed</h3>
<p data-field="other_areas">[Include results from other relevant areas such as voice, fluency, etc. if applicable]</p>`,
      category: 'standard'
    }
  ],

  recommendations: [
    {
      id: 'standard_recommendations',
      name: 'Standard Recommendations',
      description: 'Numbered list of recommendations',
      sectionType: 'recommendations',
      content: `<p>The following recommendations are made based on the results of this evaluation:</p>

<ol>
  <li data-field="recommendation_1">[Recommendation 1]</li>
  <li data-field="recommendation_2">[Recommendation 2]</li>
  <li data-field="recommendation_3">[Recommendation 3]</li>
</ol>

<p data-field="additional_notes">[Include specific recommendations for services, intervention targets, and progress monitoring]</p>`,
      category: 'standard'
    }
  ]
};

// Helper function to get templates for a section type
export function getTemplatesForSectionType(sectionType: string): SectionTemplate[] {
  return BUILT_IN_TEMPLATES[sectionType] || [];
}

// Helper function to extract field values from HTML content
export function extractFieldsFromTemplate(content: string): TemplateField[] {
  const fields: TemplateField[] = [];
  const fieldRegex = /data-field="([^"]+)"/g;
  let match;

  while ((match = fieldRegex.exec(content)) !== null) {
    const fieldId = match[1];
    if (!fields.find(f => f.id === fieldId)) {
      fields.push({
        id: fieldId,
        type: 'text',
        label: fieldId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        placeholder: `Enter ${fieldId.replace(/_/g, ' ')}...`,
        required: false
      });
    }
  }

  return fields;
}