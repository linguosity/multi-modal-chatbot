/**
 * PDF Renderer using pdfmake
 * Generates professional SLP assessment report PDFs matching
 * the clinical template style (compact info grid, roman-numeral sections,
 * lettered subsections, shaded tables, confidentiality notice).
 */

import type { ExportReportData, ExportSection, ExportSubsection } from './report-to-export-data'
import { toRoman } from './report-to-export-data'
import { REPORT_COLORS } from '@/lib/styles/report-card-colors'

/**
 * pdfmake ships as CommonJS. Its vfs_fonts.js does:
 *   module.exports = vfs   (the font map object)
 * but also tries to auto-register via window.pdfMake which doesn't exist in Node.
 * We must manually assign pdfMake.vfs after importing both modules.
 */
async function getPdfMake() {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

  // Dynamic import wraps CJS default export
  const pdfMakeModule: any = await import('pdfmake/build/pdfmake')
  const pdfMake = pdfMakeModule.default ?? pdfMakeModule

  // vfs_fonts.js → module.exports = { "Roboto-Regular.ttf": "...", ... }
  // Dynamic import may wrap this as { default: vfsObj } or just vfsObj
  const pdfFontsModule: any = await import('pdfmake/build/vfs_fonts')

  // Try every known shape the import can resolve to
  const vfs: Record<string, string> | undefined =
    // Shape 1: direct default export is the vfs map
    (typeof pdfFontsModule?.default === 'object' && pdfFontsModule.default?.['Roboto-Regular.ttf']
      ? pdfFontsModule.default
      : undefined) ??
    // Shape 2: module itself is the vfs map (rare, some bundlers)
    (typeof pdfFontsModule === 'object' && pdfFontsModule?.['Roboto-Regular.ttf']
      ? pdfFontsModule
      : undefined) ??
    // Shape 3: nested under pdfMake.vfs (browser-like)
    pdfFontsModule?.pdfMake?.vfs ??
    pdfFontsModule?.default?.pdfMake?.vfs

  if (vfs) {
    pdfMake.vfs = vfs
  }

  // Final check — if still missing, try CJS require as last resort
  if (!pdfMake.vfs?.['Roboto-Regular.ttf']) {
    try {
      const cjsVfs = require('pdfmake/build/vfs_fonts')
      if (cjsVfs?.['Roboto-Regular.ttf']) {
        pdfMake.vfs = cjsVfs
      } else if (cjsVfs?.default?.['Roboto-Regular.ttf']) {
        pdfMake.vfs = cjsVfs.default
      }
    } catch {
      // swallow — will throw below if still unresolved
    }
  }

  if (!pdfMake.vfs?.['Roboto-Regular.ttf']) {
    throw new Error(
      'pdfmake fonts not loaded. Ensure pdfmake is installed: npm install pdfmake'
    )
  }

  /* eslint-enable */
  return pdfMake
}

// ── Colors (from shared palette) ────────────────────────────────────

const C = {
  ...REPORT_COLORS,
}

// ── Reusable styles ────────────────────────────────────────────────

const BODY = { fontSize: 10.5, color: C.text, lineHeight: 1.45 }
const SMALL = { fontSize: 9, color: C.muted }

// ── Header block (replaces cover page) ─────────────────────────────

function buildHeaderBlock(data: ExportReportData): object[] {
  const items: object[] = []

  // Organization name
  items.push({
    text: data.organizationName.toUpperCase(),
    fontSize: 13,
    bold: true,
    color: C.navy,
    alignment: 'center' as const,
    margin: [0, 0, 0, 2] as [number, number, number, number],
  })

  // Confidentiality notice
  if (data.confidentialityNotice) {
    items.push({
      text: data.confidentialityNotice,
      fontSize: 8.5,
      italics: true,
      color: C.muted,
      alignment: 'center' as const,
      margin: [0, 0, 0, 8] as [number, number, number, number],
    })
  }

  // Report title bar
  items.push({
    table: {
      widths: ['*'],
      body: [[{
        text: data.reportSubtitle || data.reportType.toUpperCase(),
        fontSize: 12,
        bold: true,
        color: C.white,
        alignment: 'center' as const,
        fillColor: C.navy,
        margin: [0, 6, 0, 6] as [number, number, number, number],
      }]],
    },
    layout: 'noBorders',
    margin: [0, 0, 0, 10] as [number, number, number, number],
  })

  // Student info grid (2-column table like the real template)
  const infoRows: object[][] = []

  const addRow = (l1: string, v1: string, l2?: string, v2?: string) => {
    const row: object[] = [
      { text: l1, bold: true, fontSize: 9.5, color: C.navy, border: [false, false, false, false] },
      { text: v1 || '—', fontSize: 9.5, color: C.text, border: [false, false, false, false] },
    ]
    if (l2 !== undefined) {
      row.push({ text: l2, bold: true, fontSize: 9.5, color: C.navy, border: [false, false, false, false] })
      row.push({ text: v2 || '—', fontSize: 9.5, color: C.text, border: [false, false, false, false] })
    } else {
      row.push({ text: '', border: [false, false, false, false] })
      row.push({ text: '', border: [false, false, false, false] })
    }
    infoRows.push(row)
  }

  addRow('Student:', data.student.name, 'Grade:', data.student.grade || '—')
  if (data.student.dateOfBirth || data.student.age) {
    addRow('Birthday:', data.student.dateOfBirth || '—', 'Age:', data.student.age || '—')
  }
  addRow('Date of Evaluation:', data.evaluationDate, 'Report Date:', data.reportDate)
  if (data.student.primaryLanguage || data.student.eligibility) {
    addRow('Primary Language:', data.student.primaryLanguage || '—', 'Eligibility:', data.student.eligibility || '—')
  }
  addRow('Examiner:', data.evaluatorName || '—')

  items.push({
    table: {
      widths: [110, '*', 80, '*'],
      body: infoRows,
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingTop: () => 2,
      paddingBottom: () => 2,
      paddingLeft: () => 4,
      paddingRight: () => 4,
    },
    margin: [0, 0, 0, 4] as [number, number, number, number],
  })

  // Thin separator line
  items.push({
    canvas: [{
      type: 'line',
      x1: 0, y1: 0,
      x2: 468, y2: 0, // ~6.5in content width
      lineWidth: 1.5,
      lineColor: C.accent,
    }],
    margin: [0, 6, 0, 14] as [number, number, number, number],
  })

  return items
}

// ── Section heading (roman numeral style) ──────────────────────────

function buildSectionHeading(section: ExportSection, index: number): object[] {
  const roman = toRoman(index + 1)
  return [
    {
      table: {
        widths: ['*'],
        body: [[{
          text: `${roman}. ${section.title.toUpperCase()}`,
          fontSize: 12,
          bold: true,
          color: C.navy,
          fillColor: C.headerBg,
          margin: [8, 5, 8, 5] as [number, number, number, number],
          border: [false, false, false, false],
        }]],
      },
      layout: 'noBorders',
      margin: [0, index === 0 ? 0 : 16, 0, 8] as [number, number, number, number],
    },
  ]
}

// ── Body paragraphs ────────────────────────────────────────────────

function buildParagraphs(text: string): object[] {
  if (!text) return []
  return text.split('\n\n').filter(Boolean).map((para) => {
    const trimmed = para.trim()
    // Detect numbered list items (1. Item, 2. Item...)
    const listMatch = trimmed.match(/^(\d+)\.\s+(.+)/s)
    if (listMatch) {
      return {
        text: [
          { text: `${listMatch[1]}. `, bold: true, ...BODY },
          { text: listMatch[2], ...BODY },
        ],
        margin: [16, 0, 0, 5] as [number, number, number, number],
        lineHeight: 1.45,
      }
    }
    return {
      text: trimmed,
      ...BODY,
      alignment: 'justify' as const,
      margin: [0, 0, 0, 6] as [number, number, number, number],
    }
  })
}

// ── Subsection (lettered, with shaded content box) ─────────────────

function buildSubsection(sub: ExportSubsection, letterIndex: number): object[] {
  const letter = String.fromCharCode(65 + letterIndex) // A, B, C...
  const items: object[] = []

  // Subsection heading
  items.push({
    text: [
      { text: `${letter}. `, bold: true, fontSize: 11, color: C.navy },
      { text: sub.heading, bold: true, italics: true, fontSize: 11, color: C.navy },
    ],
    margin: [0, 10, 0, 4] as [number, number, number, number],
  })

  // Content in a light shaded box
  const contentParas = sub.content.split('\n\n').filter(Boolean)
  if (contentParas.length > 0) {
    items.push({
      table: {
        widths: ['*'],
        body: [[{
          stack: contentParas.map((p) => ({
            text: p.trim(),
            fontSize: 10,
            color: C.text,
            lineHeight: 1.4,
            margin: [0, 0, 0, 4] as [number, number, number, number],
          })),
          fillColor: C.light,
          margin: [8, 6, 8, 6] as [number, number, number, number],
          border: [true, true, true, true],
        }]],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => C.border,
        vLineColor: () => C.border,
        paddingTop: () => 0,
        paddingBottom: () => 0,
        paddingLeft: () => 0,
        paddingRight: () => 0,
      },
      margin: [12, 0, 0, 4] as [number, number, number, number],
    })
  }

  return items
}

// ── Build full section content ─────────────────────────────────────

function buildSectionContent(data: ExportReportData): object[] {
  const content: object[] = []

  data.sections.forEach((section, index) => {
    // Section heading bar
    content.push(...buildSectionHeading(section, index))

    // Main content paragraphs
    if (section.content) {
      content.push(...buildParagraphs(section.content))
    }

    // Subsections with letter labels
    section.subsections.forEach((sub, subIdx) => {
      content.push(...buildSubsection(sub, subIdx))
    })
  })

  return content
}

// ── Public API ──────────────────────────────────────────────────────

export async function generatePDF(data: ExportReportData): Promise<Buffer> {
  const pdfMake = await getPdfMake()

  const isFullReport = data.sections.length > 1

  const docDefinition = {
    pageSize: 'LETTER' as const,
    pageMargins: [54, 40, 54, 50] as [number, number, number, number], // 0.75in sides, tighter top/bottom

    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: `Generated by ${data.organizationName}`,
          ...SMALL,
          alignment: 'left' as const,
          margin: [54, 0, 0, 0] as [number, number, number, number],
        },
        {
          text: `Page ${currentPage} of ${pageCount}`,
          ...SMALL,
          alignment: 'right' as const,
          margin: [0, 0, 54, 0] as [number, number, number, number],
        },
      ],
    }),

    content: [
      ...(isFullReport ? buildHeaderBlock(data) : []),
      ...buildSectionContent(data),
    ],

    defaultStyle: {
      font: 'Roboto',
      fontSize: 10.5,
      color: C.text,
    },
  }

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const pdfDoc = pdfMake.createPdf(docDefinition)
      pdfDoc.getBuffer((buffer: Uint8Array) => {
        resolve(Buffer.from(buffer))
      })
    } catch (err) {
      reject(err)
    }
  })
}
