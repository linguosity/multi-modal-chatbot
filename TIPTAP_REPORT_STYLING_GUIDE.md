# Professional Tiptap Report Styling Guide

## 🎯 **Overview**
This guide provides comprehensive styling strategies to transform Tiptap-formatted reports from basic HTML output into polished, professional documents that look like real clinical reports.

## 📋 **Current State Analysis**

### **What We Have**
- Basic Tiptap HTML generation with `generateHTML`
- Simple prose styling with Tailwind typography
- Custom CSS for headers (uppercase, letter-spacing)
- Print-friendly page breaks
- Server-side rendering with hydrated HTML

### **What We Need**
- **Professional typography** with clinical report aesthetics
- **Student information table** with organized data presentation
- **Enhanced section styling** with proper hierarchy
- **Clinical data formatting** (test scores, dates, observations)
- **Consistent spacing and layout** throughout the document
- **Print optimization** for professional output

## 🎨 **Professional Report Styling Strategy**

### **1. Typography Hierarchy**

#### **Document Structure**
```css
.report-container {
  font-family: 'Inter', 'Times New Roman', serif;
  font-size: 12pt;
  line-height: 1.6;
  color: #1a1a1a;
  max-width: 8.5in; /* Letter width minus margins */
  margin: 0 auto;
  background: white;
}
```

#### **Header Styling (Clinical Standard)**
```css
/* Main Report Title */
.report-title {
  font-size: 16pt;
  font-weight: 600;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 2em;
  border-bottom: 2px solid #2563eb;
  padding-bottom: 0.5em;
}

/* Section Headers */
.section-header {
  font-size: 14pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 2em;
  margin-bottom: 1em;
  border-bottom: 1px solid #d1d5db;
  padding-bottom: 0.3em;
}

/* Subsection Headers */
.subsection-header {
  font-size: 12pt;
  font-weight: 600;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  color: #374151;
}
```

### **2. Student Information Table**

#### **Professional Data Presentation**
```css
.student-info-table {
  width: 100%;
  border-collapse: collapse;
  margin: 2em 0;
  font-size: 11pt;
  background: #f9fafb;
  border: 1px solid #d1d5db;
}

.student-info-table th {
  background: #f3f4f6;
  font-weight: 600;
  text-align: left;
  padding: 0.75em 1em;
  border-bottom: 1px solid #d1d5db;
  width: 25%;
}

.student-info-table td {
  padding: 0.75em 1em;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: top;
}

.student-info-table tr:last-child td {
  border-bottom: none;
}
```

### **3. Clinical Content Formatting**

#### **Assessment Results Styling**
```css
/* Test Score Tables */
.assessment-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 11pt;
}

.assessment-table th {
  background: #1f2937;
  color: white;
  font-weight: 600;
  padding: 0.5em;
  text-align: center;
  font-size: 10pt;
}

.assessment-table td {
  padding: 0.5em;
  text-align: center;
  border: 1px solid #d1d5db;
}

.assessment-table .test-name {
  text-align: left;
  font-weight: 500;
}

/* Score Interpretation Colors */
.score-above-average { background: #dcfce7; color: #166534; }
.score-average { background: #fef3c7; color: #92400e; }
.score-below-average { background: #fee2e2; color: #dc2626; }
```

#### **Clinical Observations**
```css
.clinical-observation {
  background: #f8fafc;
  border-left: 4px solid #3b82f6;
  padding: 1em;
  margin: 1em 0;
  font-style: italic;
}

.clinical-note {
  background: #fffbeb;
  border: 1px solid #fbbf24;
  border-radius: 0.25rem;
  padding: 0.75em;
  margin: 0.5em 0;
  font-size: 11pt;
}
```

### **4. List and Content Styling**

#### **Professional Lists**
```css
.tiptap ul {
  list-style-type: disc;
  margin-left: 1.5em;
  margin-bottom: 1em;
}

.tiptap ol {
  list-style-type: decimal;
  margin-left: 1.5em;
  margin-bottom: 1em;
}

.tiptap li {
  margin-bottom: 0.5em;
  line-height: 1.6;
}

/* Recommendation Lists */
.recommendations-list {
  counter-reset: recommendation;
}

.recommendations-list li {
  counter-increment: recommendation;
  margin-bottom: 1em;
  position: relative;
  padding-left: 2em;
}

.recommendations-list li::before {
  content: counter(recommendation) ".";
  position: absolute;
  left: 0;
  font-weight: 600;
  color: #2563eb;
}
```

### **5. Print Optimization**

#### **Page Break Management**
```css
@media print {
  .report-container {
    max-width: none;
    margin: 0;
  }
  
  .section-header {
    page-break-after: avoid;
  }
  
  .student-info-table,
  .assessment-table {
    page-break-inside: avoid;
  }
  
  .clinical-observation,
  .clinical-note {
    page-break-inside: avoid;
  }
}
```

## 🔧 **Implementation Strategy**

### **1. Enhanced Tiptap Extensions Configuration**

```typescript
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
      HTMLAttributes: {
        1: { class: 'section-header' },
        2: { class: 'subsection-header' },
        3: { class: 'minor-header' }
      }
    },
    paragraph: {
      HTMLAttributes: { class: 'report-paragraph' }
    },
    bulletList: {
      HTMLAttributes: { class: 'report-list' }
    },
    orderedList: {
      HTMLAttributes: { class: 'report-ordered-list' }
    }
  }),
  Table.configure({
    HTMLAttributes: { class: 'assessment-table' }
  }),
  TableRow,
  TableHeader.configure({
    HTMLAttributes: { class: 'assessment-header' }
  }),
  TableCell.configure({
    HTMLAttributes: { class: 'assessment-cell' }
  })
]
```

### **2. Student Information Component**

```typescript
interface StudentInfo {
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  age?: string
  grade?: string
  studentId?: string
  primaryLanguages?: string
  eligibilityStatus?: string
  evaluationDate?: string
  evaluator?: string
}

function StudentInfoTable({ studentInfo }: { studentInfo: StudentInfo }) {
  const rows = [
    { label: 'Student Name', value: `${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim() },
    { label: 'Date of Birth', value: studentInfo.dateOfBirth },
    { label: 'Age', value: studentInfo.age },
    { label: 'Grade', value: studentInfo.grade },
    { label: 'Student ID', value: studentInfo.studentId },
    { label: 'Primary Language(s)', value: studentInfo.primaryLanguages },
    { label: 'Eligibility Status', value: studentInfo.eligibilityStatus },
    { label: 'Evaluation Date', value: studentInfo.evaluationDate },
    { label: 'Evaluator', value: studentInfo.evaluator }
  ].filter(row => row.value) // Only show rows with values

  return (
    <table className="student-info-table">
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            <th>{row.label}</th>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### **3. Enhanced Section Rendering**

```typescript
function renderSection(section: any) {
  // Generate HTML from Tiptap JSON
  const html = generateHTML(section.content, extensions)
  
  // Process structured data if available
  const structuredContent = section.structured_data 
    ? renderStructuredData(section.structured_data, section.sectionType)
    : ''
  
  return `
    <section class="report-section">
      <h2 class="section-header">${section.title}</h2>
      ${structuredContent}
      <div class="tiptap">${html}</div>
    </section>
  `
}
```

### **4. Structured Data Rendering**

```typescript
function renderStructuredData(data: any, sectionType: string) {
  switch (sectionType) {
    case 'assessment_results':
      return renderAssessmentResults(data)
    case 'validity_statement':
      return renderValidityStatement(data)
    case 'recommendations':
      return renderRecommendations(data)
    default:
      return renderGenericStructuredData(data)
  }
}

function renderAssessmentResults(data: any) {
  if (!data.assessment_items || !Array.isArray(data.assessment_items)) {
    return ''
  }
  
  return `
    <table class="assessment-table">
      <thead>
        <tr>
          <th class="test-name">Assessment Tool</th>
          <th>Standard Score</th>
          <th>Percentile</th>
          <th>Qualitative Description</th>
          <th>Date Administered</th>
        </tr>
      </thead>
      <tbody>
        ${data.assessment_items.map((item: any) => `
          <tr>
            <td class="test-name">${item.tool_name || 'N/A'}</td>
            <td class="${getScoreClass(item.standard_score)}">${item.standard_score || 'N/A'}</td>
            <td class="${getScoreClass(item.percentile)}">${item.percentile || 'N/A'}</td>
            <td>${item.qualitative_description || 'N/A'}</td>
            <td>${item.administration_date || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

function getScoreClass(score: number): string {
  if (!score) return ''
  if (score >= 115) return 'score-above-average'
  if (score >= 85) return 'score-average'
  return 'score-below-average'
}
```

## 📊 **Missing Components to Build**

### **1. Enhanced Report Header**
- School letterhead/logo area
- Report type and date prominently displayed
- Evaluator credentials and contact information

### **2. Clinical Data Visualizations**
- Score profile charts for standardized tests
- Progress tracking tables
- Comparison charts (if applicable)

### **3. Professional Formatting Elements**
- Page numbering for multi-page reports
- Footer with evaluation date and evaluator
- Signature lines for required approvals
- Confidentiality statements

### **4. Interactive Elements (for digital viewing)**
- Collapsible sections for long reports
- Hover tooltips for technical terms
- Quick navigation menu
- Print-optimized view toggle

### **5. Accessibility Enhancements**
- Proper heading hierarchy for screen readers
- Alt text for any charts or images
- High contrast mode support
- Keyboard navigation support

## 🎯 **Next Steps**

1. **Implement student information table** with professional styling
2. **Enhance section rendering** with structured data support
3. **Add assessment results tables** with score interpretation colors
4. **Create print stylesheet** for professional output
5. **Test with real report data** to ensure all content types render correctly
6. **Add responsive design** for tablet and mobile viewing
7. **Implement accessibility features** for compliance

This guide provides the foundation for transforming basic Tiptap output into professional clinical reports that meet industry standards for speech-language pathology documentation.