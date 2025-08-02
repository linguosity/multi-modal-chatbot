'use client';
import React, { Fragment } from 'react';
import { useReport } from '@/lib/context/ReportContext';
import { renderStructuredData, formatDate } from '@/lib/report-renderer';

interface StudentInfo {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  age?: string;
  grade?: string;
  studentId?: string;
  primaryLanguages?: string;
  eligibilityStatus?: string;
}

interface ReportViewProps {
  report: {
    id: string;
    title: string;
    type: string;
    sections: Array<{
      id: string;
      title: string;
      sectionType: string;
      hydratedHtml: string;
      structured_data?: Record<string, any>;
    }>;
    metadata?: {
      studentBio?: StudentInfo;
    };
    evaluatorId?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

function StudentInfoTable({ studentInfo, evaluationDate, evaluator }: { 
  studentInfo: StudentInfo; 
  evaluationDate?: string;
  evaluator?: string;
}) {
  const rows = [
    {
      label: 'Student Name',
      value: (() => {
        const lastName = studentInfo.lastName || '';
        const firstName = studentInfo.firstName || '';
        if (lastName && firstName) {
          return `${lastName}, ${firstName}`;
        } else if (lastName) {
          return lastName;
        } else if (firstName) {
          return firstName;
        }
        return 'N/A';
      })()
    },
    { label: 'Date of Birth', value: studentInfo.dateOfBirth || 'N/A' },
    { label: 'Age', value: studentInfo.age || 'N/A' },
    { label: 'Grade', value: studentInfo.grade || 'N/A' },
    { label: 'Student ID', value: studentInfo.studentId || 'N/A' },
    { label: 'Primary Language(s)', value: studentInfo.primaryLanguages || 'N/A' },
    { label: 'Eligibility Status', value: studentInfo.eligibilityStatus || 'N/A' },
    { label: 'Evaluation Date', value: evaluationDate || 'N/A' },
    { label: 'Evaluator', value: evaluator || 'N/A' }
  ];

  // Split into 4 columns (2 rows of 4 columns each, then remaining rows)
  const firstRow = rows.slice(0, 4);
  const secondRow = rows.slice(4, 8);
  const remainingRows = rows.slice(8);

  return (
    <div className="student-info-section">
      <table className="student-info-table">
        <tbody>
          <tr>
            {firstRow.map((row, index) => (
              <Fragment key={index}>
                <th>{row.label}</th>
                <td>{row.value}</td>
              </Fragment>
            ))}
          </tr>
          <tr>
            {secondRow.map((row, index) => (
              <Fragment key={index}>
                <th>{row.label}</th>
                <td>{row.value}</td>
              </Fragment>
            ))}
          </tr>
          {remainingRows.map((row, index) => (
            <tr key={`remaining-${index}`}>
              <th colSpan={2}>{row.label}</th>
              <td colSpan={6}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



export default function ReportView() { // Removed props
  const { report } = useReport(); // Use the hook to get the report

  if (!report) {
    return <div>Loading report...</div>; // Or some other loading state
  }

  // Extract student info with same priority as StudentBioCard
  const studentInfoSection = report.sections.find(section => 
    section.title === 'Student Information'
  );
  
  console.log('🔍 ReportView - Found student info section:', !!studentInfoSection);
  console.log('🔍 ReportView - Student info section data:', studentInfoSection);
  console.log('🔍 ReportView - Report metadata:', report.metadata);
  console.log('🔍 ReportView - All sections:', report.sections.map(s => ({ title: s.title, section_type: s.section_type })));
  
  // Use same priority logic as StudentBioCard
  let studentInfo: StudentInfo = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    age: '',
    grade: '',
    studentId: '',
    primaryLanguages: '',
    eligibilityStatus: ''
  };

  // First priority: metadata.studentBio
  if (report.metadata?.studentBio) {
    const bio = report.metadata.studentBio;
    studentInfo = {
      firstName: bio.firstName || '',
      lastName: bio.lastName || '',
      dateOfBirth: bio.dateOfBirth || '',
      age: bio.age || '',
      grade: bio.grade || '',
      studentId: bio.studentId || '',
      primaryLanguages: bio.primaryLanguages || '',
      eligibilityStatus: bio.eligibilityStatus || ''
    };
    console.log('🔍 ReportView - Using metadata.studentBio:', studentInfo);
  }
  // Second priority: section structured_data
  else if (studentInfoSection?.structured_data) {
    const rawStudentData = studentInfoSection.structured_data as Record<string, any>;
    const safeStudentData = typeof rawStudentData === 'object' && rawStudentData !== null ? rawStudentData : {};
    
    studentInfo = {
      firstName: safeStudentData.first_name || '',
      lastName: safeStudentData.last_name || '',
      dateOfBirth: safeStudentData.date_of_birth || '',
      age: safeStudentData.age || '',
      grade: safeStudentData.grade || '',
      studentId: safeStudentData.student_id || '',
      primaryLanguages: safeStudentData.primary_languages || safeStudentData.home_languages || '',
      eligibilityStatus: safeStudentData.eligibility_status || ''
    };
    console.log('🔍 ReportView - Using section structured_data:', studentInfo);
  }
  
  // Get evaluation date and evaluator info
  let evaluationDate = '';
  let evaluator = '';
  
  if (studentInfoSection?.structured_data) {
    const rawStudentData = studentInfoSection.structured_data as Record<string, any>;
    const safeStudentData = typeof rawStudentData === 'object' && rawStudentData !== null ? rawStudentData : {};
    
    evaluationDate = formatDate(safeStudentData.evaluation_dates || safeStudentData.report_date || report.created_at);
    evaluator = safeStudentData.evaluator_name ? 
      `${safeStudentData.evaluator_name}${safeStudentData.evaluator_credentials ? ', ' + safeStudentData.evaluator_credentials : ''}` : 
      report.evaluator_id || '';
  } else {
    // Fallback to report-level data
    evaluationDate = formatDate(report.created_at);
    evaluator = report.evaluator_id || '';
  }
  
  // Debug: Log what we extracted
  console.log('🔍 ReportView - Final student info:', studentInfo);
  console.log('🔍 ReportView - Evaluation date:', evaluationDate);
  console.log('🔍 ReportView - Evaluator:', evaluator);
  
  return (
    <div className="report-container">
            <style jsx global>{`
        /* Professional Report Styling */
        .report-container {
          font-family: 'Inter', 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #1a1a1a;
          max-width: 8.5in;
          margin: 0 auto;
          background: white;
          padding: 1rem;
        }

        /* Print Styles */
        @page {
          size: letter;
          margin: 0.75in;
        }

        @media print {
          .report-container {
            max-width: none;
            margin: 0;
            padding: 0;
          }
          
          .section-header {
            page-break-after: avoid;
          }
          
          .student-info-table,
          .assessment-table {
            page-break-inside: avoid;
          }
        }

        /* Typography Hierarchy */
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

        .report-subtitle {
          font-size: 12pt;
          text-align: center;
          color: #6b7280;
          margin-bottom: 2em;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .section-header {
          font-size: 14pt;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2em;
          margin-bottom: 1em;
          border-bottom: 1px solid #d1d5db;
          padding-bottom: 0.3em;
          page-break-after: avoid;
        }

        .subsection-header {
          font-size: 12pt;
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.75em;
          color: #374151;
        }

        /* Student Information Table */
        .student-info-section {
          margin: 2em 0;
          page-break-inside: avoid;
        }

        .student-info-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11pt;
          background: #f9fafb;
          border: 1px solid #d1d5db;
        }

        .student-info-table th {
          background: #f3f4f6;
          font-weight: 600;
          text-align: left;
          padding: 0.75em 1em;
          border: 1px solid #d1d5db;
          width: 12.5%;
          vertical-align: top;
        }

        .student-info-table td {
          padding: 0.75em 1em;
          border: 1px solid #e5e7eb;
          vertical-align: top;
          width: 12.5%;
        }

        /* Assessment Results Table */
        .assessment-results-table {
          margin: 1em 0;
          page-break-inside: avoid;
        }

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
          border: 1px solid #374151;
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
        .score-above-average { 
          background: #dcfce7; 
          color: #166534; 
          font-weight: 600;
        }
        .score-average { 
          background: #fef3c7; 
          color: #92400e; 
          font-weight: 600;
        }
        .score-below-average { 
          background: #fee2e2; 
          color: #dc2626; 
          font-weight: 600;
        }

        /* Report Section Styling */
        .report-section {
          margin-bottom: 2em;
          page-break-inside: avoid;
        }

        .report-section:not(:last-child) {
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 1.5em;
        }

        /* Enhanced Prose Styling */
        .tiptap {
          font-size: 12pt;
          line-height: 1.6;
        }

        .tiptap p {
          margin-bottom: 1em;
          text-align: justify;
        }

        .tiptap h1, .tiptap h2, .tiptap h3 {
          page-break-after: avoid;
        }

        .tiptap h3 {
          font-size: 12pt;
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.75em;
          color: #374151;
        }

        .tiptap h4 {
          font-size: 11pt;
          font-weight: 600;
          margin-top: 1em;
          margin-bottom: 0.5em;
          color: #4b5563;
        }

        .tiptap ul, .tiptap ol {
          margin-left: 1.5em;
          margin-bottom: 1em;
        }

        .tiptap li {
          margin-bottom: 0.5em;
          line-height: 1.6;
        }

        .tiptap strong {
          font-weight: 600;
        }

        .tiptap em {
          font-style: italic;
        }

        /* Clinical Notes and Observations */
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

        /* Structured Data Components */
        .validity-statement {
          background: #f0f9ff;
          border-left: 4px solid #0ea5e9;
          padding: 1em;
          margin: 1em 0;
        }

        .recommendations-section,
        .service-details,
        .goals-section,
        .accommodations-section {
          margin: 1.5em 0;
        }

        .recommendations-list {
          counter-reset: recommendation;
          list-style: none;
          padding-left: 0;
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

        .goals-list,
        .accommodations-list {
          list-style-type: disc;
          margin-left: 1.5em;
        }

        .goals-list li,
        .accommodations-list li {
          margin-bottom: 0.5em;
        }

        /* Section Dividers */
        .section-divider {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2em 0;
          page-break-after: avoid;
        }

        /* Data Field Highlighting */
        [data-field] {
          background: #fef3c7;
          padding: 0.1em 0.3em;
          border-radius: 0.2em;
          font-weight: 500;
        }

        /* Remove highlighting for print */
        @media print {
          [data-field] {
            background: transparent;
            padding: 0;
          }
        }
      `}</style>

      {/* Report Header */}
      <header className="report-header">
        <h1 className="report-title">{report.title}</h1>
        <p className="report-subtitle">{report.type?.toUpperCase()} EVALUATION</p>
      </header>

      {/* Student Information Table */}
      <StudentInfoTable 
        studentInfo={studentInfo} 
        evaluationDate={evaluationDate}
        evaluator={evaluator}
      />

      {/* Report Sections */}
      {report.sections
        .filter(section => section.title !== 'Student Information') // Skip the dedicated student info section
        .map((section, index) => (
        <Fragment key={index}>
          {index > 0 && <hr className="section-divider" />}
          <section className="report-section">
            <h2 className="section-header">{section.title}</h2>
            
            {/* Render HTML content from server */}
            <div
              className="tiptap"
              dangerouslySetInnerHTML={{
                __html: section.hydratedHtml || (section.structured_data ? renderStructuredData(section.structured_data, section.sectionType) : '')
              }}
            />
          </section>
        </Fragment>
      ))}
    </div>
  );
}