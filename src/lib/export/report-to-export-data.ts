/**
 * Shared export data transformer
 * Converts Report data (from DB or seed) into a standardized export format
 * used by both PDF and DOCX renderers.
 */

import { seedReports } from '@/lib/seed'

// ── Export interfaces ──────────────────────────────────────────────

export interface ExportSubsection {
  heading: string
  content: string
}

export interface ExportSection {
  title: string
  sectionType: string
  order: number
  /** Plain-text content (HTML stripped) */
  content: string
  /** Subsections parsed from ### headings in content */
  subsections: ExportSubsection[]
}

export interface StudentInfo {
  name: string
  id?: string
  grade?: string
  dateOfBirth?: string
  age?: string
  primaryLanguage?: string
  eligibility?: string
}

export interface ExportReportData {
  title: string
  reportType: string
  reportSubtitle: string
  organizationName: string
  confidentialityNotice: string
  student: StudentInfo
  evaluatorName: string
  evaluationDate: string
  reportDate: string
  sections: ExportSection[]
}

// ── Utilities ──────────────────────────────────────────────────────

/** Strip HTML tags and decode common entities */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/?(p|div|li|ul|ol|h[1-6]|blockquote|pre|code|em|strong|span|a|table|tr|td|th|thead|tbody)[^>]*>/gi, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Parse content that contains ### headings into subsections.
 */
export function parseContentSections(rawContent: string): {
  mainContent: string
  subsections: ExportSubsection[]
} {
  const content = stripHtml(rawContent)
  const lines = content.split('\n')
  const subsections: ExportSubsection[] = []
  let mainContent = ''
  let currentHeading = ''
  let currentBody: string[] = []

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,4}\s+(.+)$/)
    if (headingMatch) {
      if (currentHeading) {
        subsections.push({
          heading: currentHeading,
          content: currentBody.join('\n').trim(),
        })
      }
      currentHeading = headingMatch[1].trim()
      currentBody = []
    } else if (currentHeading) {
      currentBody.push(line)
    } else {
      mainContent += line + '\n'
    }
  }

  if (currentHeading) {
    subsections.push({
      heading: currentHeading,
      content: currentBody.join('\n').trim(),
    })
  }

  return { mainContent: mainContent.trim(), subsections }
}

/** Format report type for display */
function formatReportType(type: string): string {
  const types: Record<string, string> = {
    initial: 'Initial Eligibility Evaluation',
    annual: 'Annual Review',
    triennial: 'Triennial Evaluation',
    progress: 'Progress Report',
    exit: 'Exit Report',
    consultation: 'Consultation Report',
    other: 'Report',
  }
  return types[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ── Roman numeral helper ───────────────────────────────────────────

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
export function toRoman(n: number): string {
  return ROMAN[n - 1] || String(n)
}

// ── Main transformers ──────────────────────────────────────────────

export function transformReportForExport(report: {
  title?: string
  studentName?: string
  student_name?: string
  studentId?: string
  student_id?: string
  type?: string
  evaluatorId?: string
  evaluator_id?: string
  createdAt?: string
  created_at?: string
  metadata?: Record<string, unknown> | null
  sections?: Array<{
    title: string
    sectionType?: string
    section_type?: string
    order: number
    content?: string | null
  }>
}): ExportReportData {
  const sections = (report.sections || [])
    .sort((a, b) => a.order - b.order)
    .filter((s) => s.content && s.content.trim().length > 0)
    .map((s) => {
      const { mainContent, subsections } = parseContentSections(s.content || '')
      return {
        title: s.title,
        sectionType: s.sectionType || s.section_type || 'other',
        order: s.order,
        content: mainContent,
        subsections,
      }
    })

  const dateStr = report.createdAt || report.created_at || new Date().toISOString()
  const bio = (report.metadata as Record<string, unknown>)?.studentBio as Record<string, string> | undefined

  return {
    title: report.title || 'Untitled Report',
    reportType: formatReportType(report.type || 'other'),
    reportSubtitle: 'Speech and Language ' + formatReportType(report.type || 'other').toUpperCase(),
    organizationName: 'Linguosity',
    confidentialityNotice: 'Confidential Information — For Professional Use Only',
    student: {
      name: report.studentName || report.student_name || 'Unknown Student',
      id: report.studentId || report.student_id || undefined,
      grade: bio?.grade || undefined,
      dateOfBirth: bio?.dateOfBirth || undefined,
      age: bio?.age || undefined,
      primaryLanguage: bio?.primaryLanguages || undefined,
      eligibility: bio?.eligibilityStatus || undefined,
    },
    evaluatorName: report.evaluatorId || report.evaluator_id || '',
    evaluationDate: formatDate(dateStr),
    reportDate: formatDate(new Date().toISOString()),
    sections,
  }
}

export function transformSingleSectionForExport(params: {
  narrative: string
  sectionTitle: string
  reportId?: string
}): ExportReportData {
  const { mainContent, subsections } = parseContentSections(params.narrative)

  return {
    title: params.sectionTitle,
    reportType: '',
    reportSubtitle: '',
    organizationName: 'Linguosity',
    confidentialityNotice: '',
    student: { name: '' },
    evaluatorName: '',
    evaluationDate: formatDate(new Date().toISOString()),
    reportDate: formatDate(new Date().toISOString()),
    sections: [
      {
        title: params.sectionTitle,
        sectionType: 'other',
        order: 1,
        content: mainContent,
        subsections,
      },
    ],
  }
}

export function transformSeedForExport(): ExportReportData {
  const seedReport = seedReports[0]
  if (!seedReport) throw new Error('No seed report available')
  const data = transformReportForExport(seedReport)
  // Enrich with mock student bio for test
  data.student.grade = '3rd Grade'
  data.student.age = '8;6'
  data.student.primaryLanguage = 'English'
  data.student.eligibility = 'TBD'
  data.evaluatorName = 'Brandon Brewer, M.A. CCC-SLP'
  return data
}
