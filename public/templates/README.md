# DOCX Export for Linguosity Reports

This document provides instructions for using the DOCX export feature in Linguosity.

## Creating a Template

1. First, create a basic DOCX template file:
   - Use Microsoft Word or another word processor
   - Structure your document with headings, paragraphs, styles, etc. as desired
   - Add placeholders using the `{placeholder}` syntax where dynamic content should be inserted
   - Save as `basic-template.docx` in the `/public/templates/` directory

2. Use the template generator:
   - Visit `/templates/template.html` in your browser
   - Click the "Generate Template" button
   - The system will create a properly formatted `report-template.docx` file

## Template Syntax

The template uses docxtemplater syntax:

- Simple variables: `{header.studentInformation.fullName}`
- Lists (with loops): 
  ```
  {#assessmentResults.domains.receptive.strengthsList}
  - {text}
  {/assessmentResults.domains.receptive.strengthsList}
  ```

### Advanced Syntax Options

#### Paragraph Loops
To create multiple paragraphs from a list:
```
{-w:p users}{name}{/}
```

#### Custom Delimiters
If you need to include { or } characters in your document:
```
{=<% %>=}
<%first_name%>
<%={ }=%>
```

## Available Data Fields

The following fields are available for use in your template:

### Student Information
- `{header.studentInformation.fullName}`
- `{header.studentInformation.firstName}`
- `{header.studentInformation.lastName}`
- `{header.studentInformation.DOB}`
- `{header.studentInformation.reportDate}`
- `{header.studentInformation.evaluationDate}`
- `{header.studentInformation.parentsString}`
- `{header.studentInformation.homeLanguage}`

### Report Sections
- `{header.reasonForReferral}`
- `{header.confidentialityStatement}`
- `{background.studentDemographicsAndBackground.educationalHistory}`
- `{background.healthReport.medicalHistory}`
- `{background.healthReport.visionAndHearingScreening}`
- `{background.healthReport.medicationsAndAllergies}`
- `{background.earlyInterventionHistory}`
- `{background.familyHistory.familyStructure}`
- `{background.familyHistory.languageAndCulturalBackground}`
- `{background.familyHistory.socioeconomicFactors}`
- `{background.parentGuardianConcerns}`

### Observations
- `{assessmentResults.observations.classroomObservations}`
- `{assessmentResults.observations.playBasedInformalObservations}`
- `{assessmentResults.observations.socialInteractionObservations}`

### Domains
For each domain (receptive, expressive, pragmatic, articulation, voice, fluency):
- `{assessmentResults.domains.DOMAIN.topicSentence}`
- `{assessmentResults.domains.DOMAIN.impactStatement}`
- Lists (with loop syntax):
  ```
  {#assessmentResults.domains.DOMAIN.strengthsList}
  - {text}
  {/assessmentResults.domains.DOMAIN.strengthsList}
  
  {#assessmentResults.domains.DOMAIN.needsList}
  - {text}
  {/assessmentResults.domains.DOMAIN.needsList}
  ```

### Conclusion
- `{conclusion.eligibility.californiaEdCode}`
- `{conclusion.conclusion.summary}`
- `{conclusion.recommendations.services.typeOfService}`
- `{conclusion.recommendations.services.frequency}`
- `{conclusion.recommendations.services.setting}`
- Lists (with loop syntax):
  ```
  {#conclusion.recommendations.accommodationsList}
  - {text}
  {/conclusion.recommendations.accommodationsList}
  
  {#conclusion.recommendations.facilitationStrategiesList}
  - {text}
  {/conclusion.recommendations.facilitationStrategiesList}
  ```

## Using the Export Button

Once your template is set up, you can export reports by clicking the "Export DOCX" button on the report interface. The system will:

1. Load the template
2. Replace all placeholders with actual data from the report
3. Generate a downloadable DOCX file
4. Automatically name the file based on student information and current date

## LAS Assessment Report Template

We've added a specialized template for LAS (Language Assessment Scale) reports:

1. The template file is located at `/public/templates/las-assessment-report-template.docx`
2. This template uses the same tag syntax shown above
3. To export using this template, use the `ExportLASReportButton` component:
   ```jsx
   import { ExportLASReportButton } from '@/components/reports/ExportLASReportButton';
   
   <ExportLASReportButton reportData={reportData} />
   ```
4. The system will format dates, convert arrays to bullet points, and handle other special formatting needs

### Additional LAS Template Fields

The LAS template formatter adds these convenience fields:

- `{studentFullName}` - Combines first and last name
- `{studentDOB}` - Formats the date of birth nicely
- `{studentParents}` - Formats the parents array as a comma-separated string
- `{evaluationDate}` - Formats the evaluation date
- `{reportDate}` - Formats the report date
- `{#assessmentToolsList}` - For listing all assessment tools

### Modifying the LAS Template

1. Open the template file in MS Word
2. Add or adjust tags as needed following the syntax above
3. Save the file back to the `/public/templates/` directory
4. The formatter in `las-report-generator.js` may need updates if you add new fields

### Troubleshooting Template Errors

#### Issue: "Failed to fetch template: 404"
This means the template file wasn't found at the expected location.
- Make sure `report-template.docx` exists in `/public/templates/`
- You can run `node src/lib/fix-template-errors.js` to create a basic template
- Or use the simple template in `simple-report-template.txt` as a starting point

#### Issue: "Unclosed tag"
If your template contains regular text with curly braces, docxtemplater will try to interpret it as a template tag.

To fix this:

1. Visit `/templates/fix-las-template.html` for detailed instructions
2. Option 1: Escape braces with a backslash: `\{Section Title\}`
3. Option 2: Use custom delimiters: `{=<% %>=}` then `<%tag%>` instead of `{tag}`

### Available Templates

The system includes several template options:

1. **report-template.docx** - Main template used by ExportDocxButton
2. **las-assessment-report-template.docx** - LAS Assessment Report template
3. **las-assessment-report-template-fixed.docx** - Fixed version of the LAS template
4. **simple-report-template.txt** - Simple text-based template for reference

### Temporary Workaround

Due to issues with the DOCX template processing, we've implemented a temporary workaround:

1. The "Export as HTML" button now exports a simple HTML file instead of a DOCX
2. This provides the report content in a usable format while the template issues are being fixed
3. To restore DOCX export, you'll need to:
   - Create a proper DOCX template without problematic formatting
   - Update the `las-report-generator.js` file to use docxtemplater again

To create a new template from scratch:

1. Start with `simple-report-template.txt` as a reference
2. Create a new DOCX file in Microsoft Word with your desired formatting
3. Add tags as described in this document
4. Test thoroughly with the export function