// Structured schemas for different section types

import type { FieldContract } from '@/types/field-contracts'

export interface FieldSchema extends FieldContract {
  key: string;
  label: string;
  type: 'string' | 'boolean' | 'number' | 'array' | 'object' | 'date' | 'checkbox' | 'select' | 'paragraph' | 'enum' | 'table';
  required?: boolean;
  options?: string[]; // For dropdown/select fields or enums
  placeholder?: string;
  children?: FieldSchema[]; // For nested objects or array item shape
  title?: string; // For object types that need a title
}

export interface SectionSchema {
  key: string;
  title: string;
  fields: FieldSchema[];
  prose_template?: string; // Template for generating natural language
}

// Legacy interface for backward compatibility
export interface StructuredSchema {
  sections: {
    key: string;
    title: string;
    fields: {
      key: string;
      label: string;
      type: 'string' | 'boolean' | 'number';
      required?: boolean;
      options?: string[]; // For dropdown/select fields
    }[];
  }[];
}

// Header Section
export const HEADER_SECTION: SectionSchema = {
  key: 'header',
  title: 'Student Information',
  prose_template: `{first_name} {last_name} - Speech and Language Evaluation\nDate of Birth: {date_of_birth} (Age: {age})\nStudent ID: {student_id}\nGrade: {grade}\nPrimary Language(s): {primary_languages}\nReport Date: {report_date}\nEvaluation Date(s): {evaluation_dates}\nEvaluator: {evaluator_name}, {evaluator_credentials}\nSchool: {school_name}\nEligibility Status: {eligibility_status}`,
  fields: [
    {
      key: 'first_name',
      label: 'First Name',
      type: 'string',
      placeholder: 'Enter student first name...',
      required: true
    },
    {
      key: 'last_name',
      label: 'Last Name',
      type: 'string',
      placeholder: 'Enter student last name...',
      required: true
    },
    {
      key: 'date_of_birth',
      label: 'Date of Birth',
      type: 'date',
      required: true
    },
    {
      key: 'age',
      label: 'Age',
      type: 'string',
      placeholder: 'Auto-calculated or enter manually...',
      // Demo: show computed mode badge (behind NEXT_PUBLIC_SHOW_PROVENANCE)
      mode: 'computed',
      compute: { fn: 'ageFromDOB', dependsOn: ['date_of_birth'] },
    },
    {
      key: 'student_id',
      label: 'Student ID',
      type: 'string',
      placeholder: 'Enter student ID number...',
      required: true
    },
    {
      key: 'grade',
      label: 'Grade',
      type: 'select',
      options: ['Pre-K', 'TK', 'K', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'],
      required: true
    },
    {
      key: 'primary_languages',
      label: 'Primary Language(s)',
      type: 'string',
      placeholder: 'English, Spanish, etc...',
      required: true
    },
    {
      key: 'report_date',
      label: 'Report Date',
      type: 'date',
      required: true
    },
    {
      key: 'evaluation_dates',
      label: 'Evaluation Date(s)',
      type: 'string',
      placeholder: 'Enter evaluation dates...',
      required: true
    },
    {
      key: 'evaluator_name',
      label: 'Evaluator Name',
      type: 'string',
      placeholder: 'Enter evaluator full name...',
      required: true,
      // Typically constant per user
      mode: 'locked'
    },
    {
      key: 'evaluator_credentials',
      label: 'Evaluator Credentials',
      type: 'string',
      placeholder: 'M.S., CCC-SLP, etc...',
      required: true,
      // Demo: locked field badge
      mode: 'locked'
    },
    {
      key: 'school_name',
      label: 'School Name',
      type: 'string',
      placeholder: 'Enter school name...',
      required: true,
      // Often constant per user
      mode: 'locked'
    },
    {
      key: 'eligibility_status',
      label: 'Eligibility Status',
      type: 'select',
      options: ['Eligible', 'Not Eligible', 'Pending', 'Re-evaluation Required', 'Initial Evaluation'],
      // Demo: AI-extracted badge + sample provenance chip
      mode: 'ai_extracted',
      source_refs: [
        { artifactId: 'sample.pdf', page: 3, confidence: 0.86, note: 'IEP page 3' }
      ]
    }
  ]
};

// New Section Schema Format
export const VALIDITY_STATEMENT_SECTION: SectionSchema = {
  key: 'validity_statement',
  title: 'Validity Statement',
  prose_template: `The results of this evaluation are considered to be a {is_valid} representation of [Student]'s current speech and language skills. [Student] was {student_cooperation.cooperative} throughout the assessment. {student_cooperation.understanding} {validity_factors.attention_issues} {validity_factors.motivation_problems} {validity_factors.cultural_considerations} {validity_factors.other}`,
  fields: [
    { 
      key: 'is_valid', 
      label: 'Results are', 
      type: 'boolean', 
      required: true 
    },
    {
      key: 'student_cooperation',
      label: 'Student Cooperation',
      type: 'object',
      children: [
        { key: 'cooperative', label: 'Cooperative', type: 'boolean', required: true },
        { key: 'understanding', label: 'Understanding notes', type: 'string', placeholder: 'Additional details about understanding...' },
        { key: 'custom_notes', label: 'Custom notes', type: 'string', placeholder: 'Any additional observations...' }
      ]
    },
    {
      key: 'validity_factors',
      label: 'Validity Factors',
      type: 'object',
      children: [
        { key: 'attention_issues', label: 'Attention issues', type: 'boolean' },
        { key: 'motivation_problems', label: 'Motivation problems', type: 'boolean' },
        { key: 'cultural_considerations', label: 'Cultural considerations', type: 'boolean' },
        { key: 'other', label: 'Other factors', type: 'string', placeholder: 'Describe other factors...' }
      ]
    }
  ]
};

export const ASSESSMENT_RESULTS_SECTION: SectionSchema = {
  key: 'assessment_results',
  title: 'Assessment Results',
  fields: [
    {
      key: 'assessment_items',
      label: 'Assessment Items',
      type: 'array',
      children: [
        {
          key: 'type',
          label: 'Type',
          type: 'select',
          options: ['Standardized Test', 'Informal Assessment', 'Observation', 'Interview'],
          required: true
        },
        {
          key: 'title',
          label: 'Title',
          type: 'string',
          placeholder: 'e.g., PLS-5, Classroom Observation, Parent Interview...',
          required: true
        },
        {
          key: 'completed',
          label: 'Completed',
          type: 'boolean',
        },
        {
          key: 'author',
          label: 'Author(s)',
          type: 'string',
          placeholder: 'Test author(s)...',
        },
        {
          key: 'year_published',
          label: 'Year Published',
          type: 'number',
          placeholder: 'Publication year...',
        },
        {
          key: 'target_population',
          label: 'Target Population',
          type: 'string',
          placeholder: 'Age range and population...',
        },
        {
          key: 'domains_assessed',
          label: 'Domains Assessed',
          type: 'array',
          options: ['Articulation', 'Receptive Language', 'Expressive Language', 'Pragmatic Language', 'Voice', 'Fluency'],
        },
        {
          key: 'standard_score',
          label: 'Standard Score',
          type: 'number',
          placeholder: 'Enter standard score...',
        },
        {
          key: 'percentile',
          label: 'Percentile Rank',
          type: 'number',
          placeholder: 'Enter percentile rank...',
        },
        {
          key: 'confidence_interval',
          label: 'Confidence Interval',
          type: 'number',
          placeholder: 'e.g., 90% CI: 85-95',
        },
        {
          key: 'qualitative_description',
          label: 'Qualitative Description',
          type: 'string',
          placeholder: 'e.g., Below Average, Average, Above Average...',
        },
        {
          key: 'examples_of_items',
          label: 'Examples of Items',
          type: 'string',
          placeholder: 'Describe specific test items or observations...',
        },
        {
          key: 'notes',
          label: 'Notes',
          type: 'string',
          placeholder: 'Any additional notes or observations...',
        },
      ]
    },
    {
      key: 'articulation_notes',
      label: 'Articulation Notes',
      type: 'string',
      placeholder: 'Summarize articulation findings...'
    },
    {
      key: 'receptive_language_notes',
      label: 'Receptive Language Notes',
      type: 'string',
      placeholder: 'Summarize receptive language findings...'
    },
    {
      key: 'expressive_language_notes',
      label: 'Expressive Language Notes',
      type: 'string',
      placeholder: 'Summarize expressive language findings...'
    },
    {
      key: 'pragmatic_language_notes',
      label: 'Pragmatic Language Notes',
      type: 'string',
      placeholder: 'Summarize pragmatic language findings...'
    },
    {
      key: 'voice_notes',
      label: 'Voice Notes',
      type: 'string',
      placeholder: 'Summarize voice findings...'
    },
    {
      key: 'fluency_notes',
      label: 'Fluency Notes',
      type: 'string',
      placeholder: 'Summarize fluency findings...'
    }
  ]
};

// Assessment Tools Section
export const ASSESSMENT_TOOLS_SECTION: SectionSchema = {
  key: 'assessment_tools',
  title: 'Assessment Tools',
  fields: [
    {
      key: 'tools',
      label: 'Tools',
      type: 'array',
      children: [
        { key: 'title', label: 'Title', type: 'string', required: true },
        { key: 'administered_date', label: 'Administered Date', type: 'date' },
        { key: 'completed', label: 'Completed', type: 'boolean' },
        { key: 'domains_assessed', label: 'Domains Assessed', type: 'array' },
        { key: 'notes', label: 'Notes', type: 'string' }
      ]
    }
  ]
};

// Language Sample Analysis Section
export const LANGUAGE_SAMPLE_SECTION: SectionSchema = {
  key: 'language_sample',
  title: 'Language Sample Analysis',
  prose_template: `Language sample was collected through {story_retell} and {play_sample}. A 50-utterance sample was {sample_obtained}. {sample_explanation}`,
  fields: [
    {
      key: 'story_retell',
      label: 'Story Retell Sample',
      type: 'string',
      placeholder: 'Describe the story retell sample and analysis...'
    },
    {
      key: 'play_sample',
      label: 'Play Sample',
      type: 'string',
      placeholder: 'Describe the play-based language sample and observations...'
    },
    {
      key: 'sample_obtained',
      label: '50-utterance sample obtained',
      type: 'boolean',
      required: true
    },
    {
      key: 'sample_explanation',
      label: 'If no, explanation',
      type: 'string',
      placeholder: 'Explain why a 50-utterance sample could not be obtained...'
    }
  ]
};

// Reason for Referral Section
export const REASON_FOR_REFERRAL_SECTION: SectionSchema = {
  key: 'reason_for_referral',
  title: 'Reason for Referral',
  prose_template: `{student_name} was referred for a speech and language evaluation by {referral_source} due to concerns regarding {primary_concerns}. Academic impact: {academic_impact}. {academic_impact_details}`,
  fields: [
    {
      key: 'referral_source',
      label: 'Referral Source',
      type: 'string',
      placeholder: 'Teacher, Parent, Self-referral, Other...',
      required: true
    },
    {
      key: 'primary_concerns',
      label: 'Primary Concerns',
      type: 'string',
      placeholder: 'Describe the main concerns that prompted the referral...',
      required: true
    },
    {
      key: 'academic_impact',
      label: 'Academic impact demonstrated',
      type: 'boolean',
      required: true
    },
    {
      key: 'academic_impact_details',
      label: 'Academic impact details',
      type: 'string',
      placeholder: 'Explain how communication difficulties impact academic performance...'
    }
  ]
};

// Parent Concern Section
export const PARENT_CONCERN_SECTION: SectionSchema = {
  key: 'parent_concern',
  title: 'Parent/Guardian Concerns',
  prose_template: `According to {parent_name}, their primary concerns include: Communication: {communication_concerns}. Social interaction: {social_concerns}. Academic: {academic_concerns}. Onset/Duration: {onset_duration}`,
  fields: [
    {
      key: 'parent_name',
      label: 'Parent/Guardian Name',
      type: 'string',
      placeholder: 'Name of parent or guardian providing information...'
    },
    {
      key: 'communication_concerns',
      label: 'Communication Concerns',
      type: 'string',
      placeholder: 'Describe parent concerns about speech and language...'
    },
    {
      key: 'social_concerns',
      label: 'Social Interaction Concerns',
      type: 'string',
      placeholder: 'Describe concerns about social communication...'
    },
    {
      key: 'academic_concerns',
      label: 'Academic Concerns',
      type: 'string',
      placeholder: 'Describe concerns about academic performance...'
    },
    {
      key: 'onset_duration',
      label: 'Onset/Duration',
      type: 'string',
      placeholder: 'When did concerns first arise? How long have they persisted?...'
    }
  ]
};

// Health and Developmental History Section
export const HEALTH_DEVELOPMENTAL_HISTORY_SECTION: SectionSchema = {
  key: 'health_developmental_history',
  title: 'Health and Developmental History',
  prose_template: `Birth/pregnancy complications: {birth_complications}. {birth_details} Developmental milestones: {milestones}. Medical conditions: {medical_conditions}. Medications: {medications}. Hearing/vision: {hearing_vision}`,
  fields: [
    {
      key: 'birth_complications',
      label: 'Birth/pregnancy complications',
      type: 'checkbox'
    },
    {
      key: 'birth_details',
      label: 'Birth complication details',
      type: 'string',
      placeholder: 'If yes, describe complications...'
    },
    {
      key: 'milestones',
      label: 'Developmental Milestones',
      type: 'string',
      placeholder: 'Describe achievement of developmental milestones...'
    },
    {
      key: 'medical_conditions',
      label: 'Medical Conditions',
      type: 'string',
      placeholder: 'List relevant medical conditions or diagnoses...'
    },
    {
      key: 'medications',
      label: 'Current Medications',
      type: 'string',
      placeholder: 'List current medications...'
    },
    {
      key: 'hearing_vision',
      label: 'Hearing/Vision Status',
      type: 'string',
      placeholder: 'Results of hearing and vision screenings...'
    }
  ]
};

// Family Background Section
export const FAMILY_BACKGROUND_SECTION: SectionSchema = {
  key: 'family_background',
  title: 'Family Background',
  prose_template: `Primary language(s) at home: {home_languages}. Family history of communication disorders: {family_history}. {family_history_details} Educational background: {parent_education}. Cultural considerations: {cultural_factors}`,
  fields: [
    {
      key: 'home_languages',
      label: 'Primary Language(s) at Home',
      type: 'string',
      placeholder: 'List languages spoken in the home...',
      required: true
    },
    {
      key: 'family_history',
      label: 'Family history of communication disorders',
      type: 'checkbox'
    },
    {
      key: 'family_history_details',
      label: 'Family history details',
      type: 'string',
      placeholder: 'If yes, describe family history...'
    },
    {
      key: 'parent_education',
      label: 'Educational Background of Parents',
      type: 'string',
      placeholder: 'Describe educational background of parents/caregivers...'
    },
    {
      key: 'cultural_factors',
      label: 'Cultural Considerations',
      type: 'string',
      placeholder: 'Describe relevant cultural or linguistic factors...'
    }
  ]
};

// Assessment Tools Section


// Eligibility Checklist Section
export const ELIGIBILITY_CHECKLIST_SECTION: SectionSchema = {
  key: 'eligibility_checklist',
  title: 'Eligibility Determination',
  prose_template: `California Education Code Section 56337 Eligibility Criteria:\n\nSpeech impairment criteria (Ed Code 56337(a)): {speech_criteria}. {speech_justification}\n\nLanguage impairment criteria (Ed Code 56337(b)): {language_criteria}. {language_justification}\n\nEducational impact demonstrated (Ed Code 56026.5): {educational_impact}. {educational_impact_details}\n\nAdverse effect on educational performance: {adverse_effect}. {adverse_effect_details}\n\nSpecial education services required: {services_required}. {services_justification}\n\nOverall eligibility determination: {overall_eligibility}`,
  fields: [
    {
      key: 'speech_criteria',
      label: 'Meets criteria for speech impairment (Ed Code 56337(a))',
      type: 'boolean',
      required: true
    },
    {
      key: 'speech_justification',
      label: 'Speech impairment justification',
      type: 'string',
      placeholder: 'Describe how speech disorder meets Ed Code 56337(a) criteria: articulation, voice, or fluency disorder that adversely affects educational performance...'
    },
    {
      key: 'language_criteria',
      label: 'Meets criteria for language impairment (Ed Code 56337(b))',
      type: 'boolean',
      required: true
    },
    {
      key: 'language_justification',
      label: 'Language impairment justification',
      type: 'string',
      placeholder: 'Describe how language disorder meets Ed Code 56337(b) criteria: receptive/expressive language disorder that adversely affects educational performance...'
    },
    {
      key: 'educational_impact',
      label: 'Educational impact demonstrated (Ed Code 56026.5)',
      type: 'boolean',
      required: true
    },
    {
      key: 'educational_impact_details',
      label: 'Educational impact details',
      type: 'string',
      placeholder: 'Describe specific ways the communication disorder impacts educational performance, academic achievement, or functional performance...',
      required: true
    },
    {
      key: 'adverse_effect',
      label: 'Adverse effect on educational performance',
      type: 'boolean',
      required: true
    },
    {
      key: 'adverse_effect_details',
      label: 'Adverse effect details',
      type: 'string',
      placeholder: 'Provide specific examples of how the disorder adversely affects the student\'s educational performance...',
      required: true
    },
    {
      key: 'services_required',
      label: 'Requires special education services',
      type: 'boolean',
      required: true
    },
    {
      key: 'services_justification',
      label: 'Services justification',
      type: 'string',
      placeholder: 'Explain why special education services are necessary to address the identified needs...',
      required: true
    },
    {
      key: 'overall_eligibility',
      label: 'Overall eligibility determination',
      type: 'select',
      options: ['Eligible for Speech/Language Services', 'Not Eligible - Does not meet criteria', 'Not Eligible - No adverse educational impact', 'Pending additional assessment'],
      required: true
    }
  ]
};

// Conclusion Section
export const CONCLUSION_SECTION: SectionSchema = {
  key: 'conclusion',
  title: 'Conclusion',
  prose_template: `Primary diagnosis: {primary_diagnosis}. Severity: {severity_level}. Prognosis: {prognosis}. Summary: {summary_statement}`,
  fields: [
    {
      key: 'primary_diagnosis',
      label: 'Primary Diagnosis',
      type: 'string',
      placeholder: 'State the primary diagnosis...',
      required: true
    },
    {
      key: 'severity_level',
      label: 'Severity Level',
      type: 'select',
      options: ['Mild', 'Moderate', 'Severe']
    },
    {
      key: 'prognosis',
      label: 'Prognosis',
      type: 'select',
      options: ['Excellent', 'Good', 'Fair', 'Poor']
    },
    {
      key: 'summary_statement',
      label: 'Summary Statement',
      type: 'string',
      placeholder: 'Provide a comprehensive summary of findings...',
      required: true
    }
  ]
};

// Recommendations Section
export const RECOMMENDATIONS_SECTION: SectionSchema = {
  key: 'recommendations',
  title: 'Recommendations',
  prose_template: `Service frequency: {service_frequency}. Session duration: {session_duration}. Service setting: {service_setting}. Goals/targets: {goals_targets}`,
  fields: [
    {
      key: 'service_frequency',
      label: 'Service Frequency',
      type: 'string',
      placeholder: '2x/week, 3x/week, etc...',
      required: true
    },
    {
      key: 'session_duration',
      label: 'Session Duration',
      type: 'string',
      placeholder: '30 minutes, 45 minutes, etc...',
      required: true
    },
    {
      key: 'service_setting',
      label: 'Service Setting',
      type: 'string',
      placeholder: 'Individual, Small group, Classroom...'
    },
    {
      key: 'goals_targets',
      label: 'Goals/Targets',
      type: 'string',
      placeholder: 'Describe specific intervention goals and targets...',
      required: true
    }
  ]
};

// Accommodations Section
export const ACCOMMODATIONS_SECTION: SectionSchema = {
  key: 'accommodations',
  title: 'Accommodations and Modifications',
  prose_template: `Testing accommodations: {testing_accommodations}. Classroom modifications: {classroom_modifications}. Assistive technology: {assistive_technology}. Other supports: {other_supports}`,
  fields: [
    {
      key: 'testing_accommodations',
      label: 'Testing Accommodations',
      type: 'array'
    },
    {
      key: 'classroom_modifications',
      label: 'Classroom Modifications',
      type: 'array'
    },
    {
      key: 'assistive_technology',
      label: 'Assistive Technology',
      type: 'string',
      placeholder: 'Describe recommended assistive technology...'
    },
    {
      key: 'other_supports',
      label: 'Other Supports',
      type: 'string',
      placeholder: 'Describe additional supports needed...'
    }
  ]
};

// Legacy schemas for backward compatibility
export const VALIDITY_STATEMENT_SCHEMA: StructuredSchema = {
  sections: [
    {
      key: 'student_cooperation',
      title: 'Student Cooperation',
      fields: [
        { key: 'cooperative', label: 'Cooperative', type: 'boolean', required: true },
        { key: 'understanding', label: 'Understanding', type: 'string' },
        { key: 'custom_notes', label: 'Custom notes', type: 'string' }
      ]
    },
    {
      key: 'validity_factors',
      title: 'Validity Factors',
      fields: [
        { key: 'attention_issues', label: 'Attention issues', type: 'boolean' },
        { key: 'motivation_problems', label: 'Motivation problems', type: 'boolean' },
        { key: 'cultural_considerations', label: 'Cultural considerations', type: 'boolean' },
        { key: 'other_factors', label: 'Other factors', type: 'string' }
      ]
    }
  ]
};

// Assessment Results Schema
export const ASSESSMENT_RESULTS_SCHEMA: StructuredSchema = {
  sections: [
    {
      key: 'standardized_tests',
      title: 'Standardized Test Results',
      fields: [
        { key: 'test_name', label: 'Test name', type: 'string', required: true },
        { key: 'standard_score', label: 'Standard score', type: 'number' },
        { key: 'percentile_rank', label: 'Percentile rank', type: 'number' },
        { key: 'interpretation', label: 'Interpretation', type: 'string' }
      ]
    },
    {
      key: 'articulation_phonology',
      title: 'Articulation/Phonology',
      fields: [
        { key: 'error_patterns', label: 'Error patterns', type: 'string' },
        { key: 'stimulability', label: 'Stimulability', type: 'string' },
        { key: 'intelligibility', label: 'Intelligibility', type: 'string' }
      ]
    },
    {
      key: 'language_skills',
      title: 'Language Skills',
      fields: [
        { key: 'receptive_language', label: 'Receptive language', type: 'string' },
        { key: 'expressive_language', label: 'Expressive language', type: 'string' },
        { key: 'semantics', label: 'Semantics', type: 'string' },
        { key: 'syntax', label: 'Syntax', type: 'string' },
        { key: 'pragmatic_language', label: 'Pragmatic language', type: 'string', placeholder: 'Pragmatic skills...' }
      ]
    },
    {
      key: 'voice',
      title: 'Voice Skills',
      type: 'object',
      children: [
        { key: 'vocal_quality', label: 'Vocal Quality', type: 'string', placeholder: 'Describe vocal quality (e.g., hoarse, breathy, clear)...', },
        { key: 'pitch', label: 'Pitch', type: 'string', placeholder: 'Describe pitch (e.g., appropriate, too high, too low)...', },
        { key: 'loudness', label: 'Loudness', type: 'string', placeholder: 'Describe loudness (e.g., appropriate, too loud, too soft)...', },
        { key: 'resonance', label: 'Resonance', type: 'string', placeholder: 'Describe resonance (e.g., hypernasal, hyponasal, oral)...', },
      ]
    },
    {
      key: 'fluency',
      title: 'Fluency Skills',
      type: 'object',
      children: [
        { key: 'stuttering_type', label: 'Type of Disfluency', type: 'string', placeholder: 'e.g., repetitions, prolongations, blocks...', },
        { key: 'frequency', label: 'Frequency', type: 'string', placeholder: 'Describe frequency of disfluencies...', },
        { key: 'duration', label: 'Duration', type: 'string', placeholder: 'Describe duration of disfluencies...', },
        { key: 'secondary_behaviors', label: 'Secondary Behaviors', type: 'string', placeholder: 'e.g., eye blinks, head nods, tension...', },
        { key: 'rate_of_speech', label: 'Rate of Speech', type: 'string', placeholder: 'e.g., appropriate, too fast, too slow...', },
      ]
    }
  ]
};

// Recommendations Schema
export const RECOMMENDATIONS_SCHEMA: StructuredSchema = {
  sections: [
    {
      key: 'service_recommendations',
      title: 'Service Recommendations',
      fields: [
        { key: 'frequency', label: 'Frequency', type: 'string', required: true },
        { key: 'duration', label: 'Duration', type: 'string', required: true },
        { key: 'setting', label: 'Setting', type: 'string' },
        { key: 'service_type', label: 'Service type', type: 'string' }
      ]
    },
    {
      key: 'intervention_targets',
      title: 'Intervention Targets',
      fields: [
        { key: 'primary_goals', label: 'Primary goals', type: 'string', required: true },
        { key: 'secondary_goals', label: 'Secondary goals', type: 'string' },
        { key: 'strategies', label: 'Strategies', type: 'string' }
      ]
    },
    {
      key: 'progress_monitoring',
      title: 'Progress Monitoring',
      fields: [
        { key: 'assessment_method', label: 'Assessment method', type: 'string' },
        { key: 'frequency', label: 'Frequency', type: 'string' },
        { key: 'criteria', label: 'Criteria', type: 'string' }
      ]
    }
  ]
};

// Import state eligibilities
import { stateEligibilities } from './schemas/state-eligibilities'

// Generate state-specific eligibility schema
export function generateStateEligibilitySchema(state: string = 'California'): SectionSchema {
  const stateData = stateEligibilities[state as keyof typeof stateEligibilities]
  
  if (!stateData) {
    // Fallback to California if state not found
    return ELIGIBILITY_CHECKLIST_SECTION
  }

  return {
    key: 'eligibility_checklist',
    title: `Eligibility Determination (${state})`,
    prose_template: `${state} Eligibility Criteria:\n\nDefinition: ${stateData.definition}\n\nEligibility Requirements: ${stateData.eligibility}\n\nSpeech impairment criteria: {speech_criteria}. {speech_justification}\n\nLanguage impairment criteria: {language_criteria}. {language_justification}\n\nEducational impact demonstrated: {educational_impact}. {educational_impact_details}\n\nAdverse effect on educational performance: {adverse_effect}. {adverse_effect_details}\n\nSpecial education services required: {services_required}. {services_justification}\n\nOverall eligibility determination: {overall_eligibility}`,
    fields: [
      {
        key: 'state_definition',
        label: `${state} Definition`,
        type: 'string',
        placeholder: stateData.definition,
        required: false
      },
      {
        key: 'speech_criteria',
        label: 'Meets criteria for speech impairment',
        type: 'boolean',
        required: true
      },
      {
        key: 'speech_justification',
        label: 'Speech impairment justification',
        type: 'string',
        placeholder: `Describe how speech disorder meets ${state} criteria...`
      },
      {
        key: 'language_criteria',
        label: 'Meets criteria for language impairment',
        type: 'boolean',
        required: true
      },
      {
        key: 'language_justification',
        label: 'Language impairment justification',
        type: 'string',
        placeholder: `Describe how language disorder meets ${state} criteria...`
      },
      {
        key: 'educational_impact',
        label: 'Educational impact demonstrated',
        type: 'boolean',
        required: true
      },
      {
        key: 'educational_impact_details',
        label: 'Educational impact details',
        type: 'string',
        placeholder: 'Describe specific ways the communication disorder impacts educational performance...',
        required: true
      },
      {
        key: 'adverse_effect',
        label: 'Adverse effect on educational performance',
        type: 'boolean',
        required: true
      },
      {
        key: 'adverse_effect_details',
        label: 'Adverse effect details',
        type: 'string',
        placeholder: 'Provide specific examples of how the disorder adversely affects educational performance...',
        required: true
      },
      {
        key: 'services_required',
        label: 'Requires special education services',
        type: 'boolean',
        required: true
      },
      {
        key: 'services_justification',
        label: 'Services justification',
        type: 'string',
        placeholder: 'Explain why special education services are necessary...',
        required: true
      },
      {
        key: 'overall_eligibility',
        label: 'Overall eligibility determination',
        type: 'select',
        options: ['Eligible for Speech/Language Services', 'Not Eligible - Does not meet criteria', 'Not Eligible - No adverse educational impact', 'Pending additional assessment'],
        required: true
      },
      ...(stateData.preschool ? [{
        key: 'preschool_considerations',
        label: 'Preschool considerations (if applicable)',
        type: 'string' as const,
        placeholder: stateData.preschool
      }] : [])
    ]
  }
}

// Get available states
export function getAvailableStates(): string[] {
  return Object.keys(stateEligibilities).sort()
}

// Create a default template structure using current structured schemas
export function createDefaultTemplate(): { name: string; sections: any[] } {
  return {
    name: "Default Template",
    sections: [
      {
        id: crypto.randomUUID(),
        title: "Student Information",
        sectionType: "heading",
        content: "",
        order: 1,
        isRequired: true,
        isGenerated: false,
        isCompleted: false,
        structured_data: {},
        generationPrompt: "Generate professional student information section for speech-language evaluation report.",
        lastUpdated: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Reason for Referral",
        sectionType: "reason_for_referral",
        content: "",
        order: 2,
        isRequired: true,
        isGenerated: false,
        isCompleted: false,
        structured_data: {},
        generationPrompt: "Generate reason for referral section based on provided information.",
        lastUpdated: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Health & Developmental History",
        sectionType: "health_developmental_history",
        content: "",
        order: 3,
        isRequired: true,
        isGenerated: false,
        isCompleted: false,
        structured_data: {},
        generationPrompt: "Generate health and developmental history section.",
        lastUpdated: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Family Background",
        sectionType: "family_background",
        content: "",
        order: 4,
        isRequired: true,
        isGenerated: false,
        isCompleted: false,
        structured_data: {},
        generationPrompt: "Generate family background section including language and cultural factors.",
        lastUpdated: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Parent Concern",
        sectionType: "parent_concern",
        content: "",
        order: 5,
        isRequired: true,
        isGenerated: false,
        isCompleted: false,
        structured_data: {},
        generationPrompt: "Generate parent/guardian concerns section.",
        lastUpdated: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Assessment Tools",
        sectionType: "assessment_tools",
        content: "",
        order: 6,
        isRequired: true,
        isGenerated: false,
        isCompleted: false,
        structured_data: {},
        generationPrompt: "List and describe assessment tools used in evaluation.",
        lastUpdated: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Assessment Results",
        sectionType: "assessment_results",
        content: "",
        order: 7,
        isRequired: true,
        isGenerated: false,
        isCompleted: false,
        structured_data: {},
        generationPrompt: "Generate comprehensive assessment results with scores and clinical interpretation.",
        lastUpdated: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Validity Statement",
        sectionType: "validity_statement",
        content: "",
        order: 8,
        isRequired: true,
        isGenerated: false,
        isCompleted: false,
        structured_data: {},
        generationPrompt: "Generate validity statement addressing test conditions and reliability.",
        lastUpdated: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Eligibility Checklist",
        sectionType: "eligibility_checklist",
        content: "",
        order: 9,
        isRequired: true,
        isGenerated: false,
        isCompleted: false,
        structured_data: {},
        generationPrompt: "Generate eligibility determination based on assessment results.",
        lastUpdated: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Conclusion",
        sectionType: "conclusion",
        content: "",
        order: 10,
        isRequired: true,
        isGenerated: false,
        isCompleted: false,
        structured_data: {},
        generationPrompt: "Generate conclusion with diagnosis, severity, and prognosis.",
        lastUpdated: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Recommendations",
        sectionType: "recommendations",
        content: "",
        order: 11,
        isRequired: true,
        isGenerated: false,
        isCompleted: false,
        structured_data: {},
        generationPrompt: "Generate specific recommendations for services and interventions.",
        lastUpdated: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        title: "Accommodations",
        sectionType: "accommodations",
        content: "",
        order: 12,
        isRequired: true,
        isGenerated: false,
        isCompleted: false,
        structured_data: {},
        generationPrompt: "Generate accommodations and modifications recommendations.",
        lastUpdated: new Date().toISOString()
      }
    ]
  };
}

// Get new section schema for section type
export function getSectionSchemaForType(sectionType: string, userState?: string): SectionSchema | null {
  switch (sectionType) {
    case 'header':
    case 'heading':
    case 'student_information':
      return HEADER_SECTION;
    case 'validity_statement':
      return VALIDITY_STATEMENT_SECTION;
    case 'assessment_results':
      return ASSESSMENT_RESULTS_SECTION;
    case 'language_sample':
      return LANGUAGE_SAMPLE_SECTION;
    case 'reason_for_referral':
      return REASON_FOR_REFERRAL_SECTION;
    case 'parent_concern':
      return PARENT_CONCERN_SECTION;
    case 'health_developmental_history':
      return HEALTH_DEVELOPMENTAL_HISTORY_SECTION;
    case 'family_background':
      return FAMILY_BACKGROUND_SECTION;

    case 'eligibility_checklist':
      return userState ? generateStateEligibilitySchema(userState) : ELIGIBILITY_CHECKLIST_SECTION;
    case 'conclusion':
      return CONCLUSION_SECTION;
    case 'recommendations':
      return RECOMMENDATIONS_SECTION;
    case 'accommodations':
      return ACCOMMODATIONS_SECTION;
    default:
      return null;
  }
}

// Legacy function for backward compatibility
export function getSchemaForSectionType(sectionType: string): StructuredSchema | null {
  switch (sectionType) {
    case 'validity_statement':
      return VALIDITY_STATEMENT_SCHEMA;
    case 'assessment_results':
      return ASSESSMENT_RESULTS_SCHEMA;
    case 'recommendations':
      return RECOMMENDATIONS_SCHEMA;
    default:
      return null;
  }
}

// Generate prose from structured data
export function generateProseFromStructuredData(data: any, schema: StructuredSchema): string {
  let prose = '';
  
  schema.sections.forEach(section => {
    const sectionData = data[section.key];
    if (!sectionData) return;
    
    prose += `**${section.title}**\n\n`;
    
    section.fields.forEach(field => {
      const value = sectionData[field.key];
      if (value !== undefined && value !== null && value !== '') {
        if (field.type === 'boolean') {
          prose += `${field.label}: ${value ? 'Yes' : 'No'}\n`;
        } else {
          prose += `${field.label}: ${value}\n`;
        }
      }
    });
    
    prose += '\n';
  });
  
  return prose;
}
