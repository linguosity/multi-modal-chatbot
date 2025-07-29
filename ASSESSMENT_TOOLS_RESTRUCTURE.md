# Assessment Tools Section Restructure

## Overview
Updated the Assessment Tools section to provide a more structured approach that differentiates between formal and informal assessments with specific metadata for each type, as requested.

## Changes Made

### 1. Schema Structure Update (`src/lib/structured-schemas.ts`)

**Before:**
```typescript
fields: [
  { key: 'standardized_tests', label: 'Standardized Assessments', type: 'array' },
  { key: 'informal_assessments', label: 'Informal Assessments', type: 'array' },
  { key: 'observation_contexts', label: 'Observation Contexts', type: 'array' }
]
```

**After:**
```typescript
fields: [
  {
    key: 'formal_assessments',
    label: 'Formal Assessment Tools',
    type: 'array',
    children: [
      { key: 'tool_name', label: 'Tool Name', type: 'string', required: true },
      { key: 'acronym', label: 'Acronym', type: 'string' },
      { key: 'authors', label: 'Author(s)', type: 'string' },
      { key: 'year_published', label: 'Year Published', type: 'number' },
      { key: 'target_population', label: 'Target Population', type: 'string' },
      { key: 'purpose', label: 'Purpose of Use', type: 'string' }
    ]
  },
  {
    key: 'informal_assessments',
    label: 'Informal Assessment Tools',
    type: 'array',
    children: [
      { key: 'tool_name', label: 'Tool Name', type: 'string', required: true },
      { key: 'tool_description', label: 'What is this tool?', type: 'string' },
      { key: 'typical_use', label: 'Typical Use', type: 'string' },
      { key: 'specific_use_case', label: 'Specific Use Case', type: 'string' },
      { key: 'target_population', label: 'Who is it used for?', type: 'string' }
    ]
  },
  {
    key: 'observation_contexts',
    label: 'Observation Contexts',
    type: 'array',
    children: [
      { key: 'context_name', label: 'Context/Setting', type: 'string', required: true },
      { key: 'context_description', label: 'Description', type: 'string' },
      { key: 'duration', label: 'Duration', type: 'string' },
      { key: 'focus_areas', label: 'Focus Areas', type: 'string' }
    ]
  }
]
```

### 2. Specialized AssessmentToolsEditor Component (`src/components/AssessmentToolsEditor.tsx`)

Created a comprehensive editor that handles all three types of assessment tools:

#### **Formal Assessments**
- **Tool Name** (required) - Full name of the assessment tool
- **Acronym** - e.g., PLS-5, CELF-5, GFTA-3
- **Authors** - Author names
- **Year Published** - Publication year
- **Target Population** - Age range, population characteristics
- **Purpose of Use** - What this tool is designed to assess

#### **Informal Assessments**
- **Tool Name** (required) - Name or description of the informal tool
- **What is this tool?** - Describe what this informal assessment tool is
- **Typical Use** - What is this tool typically used for?
- **Specific Use Case** - How was it used in this specific evaluation?
- **Who is it used for?** - Target population or age group

#### **Observation Contexts**
- **Context/Setting** (required) - e.g., Classroom, Playground, Therapy room
- **Description** - Describe the observation context and what was observed
- **Duration** - How long was the observation?
- **Focus Areas** - What specific behaviors or skills were observed?

### 3. UI Features

#### **Collapsible Sections**
- Each assessment type (Formal, Informal, Observation) is in its own collapsible section
- Shows count of items in each section
- Color-coded add buttons (Blue for Formal, Green for Informal, Purple for Observation)

#### **Individual Item Management**
- Each assessment tool/context is displayed in its own card
- Clear labeling with item numbers and names
- Individual remove buttons for each item
- Add buttons for each section type

#### **Field-Level Highlighting**
- Each input field is wrapped with `FieldHighlight` for AI update tracking
- Proper field paths like `formal_assessments.0.tool_name`
- Integration with the existing feedback system

#### **Responsive Design**
- Grid layouts that adapt to screen size
- Proper spacing and visual hierarchy
- Accessible form controls

### 4. Integration with DynamicStructuredBlock

Added special handling for the assessment_tools section:
- Detects when rendering assessment tools fields
- Renders the comprehensive `AssessmentToolsEditor` for the first field (`formal_assessments`)
- Hides the other fields (`informal_assessments`, `observation_contexts`) since they're handled by the editor
- Maintains proper data flow and field highlighting

## Data Structure Examples

### Formal Assessment Example:
```json
{
  "formal_assessments": [
    {
      "tool_name": "Preschool Language Scales - Fifth Edition",
      "acronym": "PLS-5",
      "authors": "Zimmerman, Steiner, & Pond",
      "year_published": 2011,
      "target_population": "Birth through 7 years, 11 months",
      "purpose": "Assesses developmental language skills in auditory comprehension and expressive communication"
    }
  ]
}
```

### Informal Assessment Example:
```json
{
  "informal_assessments": [
    {
      "tool_name": "Language Sample Analysis",
      "tool_description": "Spontaneous language sample collected during play-based activities",
      "typical_use": "Analyzing natural language production, MLU, grammatical complexity",
      "specific_use_case": "Collected 50-utterance sample during structured play to assess expressive language skills",
      "target_population": "Preschool and school-age children"
    }
  ]
}
```

### Observation Context Example:
```json
{
  "observation_contexts": [
    {
      "context_name": "General Education Classroom",
      "context_description": "Observed student during morning circle time and literacy activities",
      "duration": "30 minutes",
      "focus_areas": "Peer interaction, following directions, participation in group activities"
    }
  ]
}
```

## Benefits

1. **Structured Data Collection** - Clear fields for all relevant assessment tool metadata
2. **Professional Documentation** - Captures author, publication year, and purpose information
3. **Differentiated Assessment Types** - Separate handling for formal vs informal tools
4. **AI-Friendly Structure** - Clear field paths for AI to populate specific information
5. **User-Friendly Interface** - Organized, collapsible sections with intuitive controls
6. **Field-Level Highlighting** - Integration with the feedback system for AI updates

This restructure provides a comprehensive framework for documenting assessment tools that meets professional standards while maintaining usability and AI integration capabilities.