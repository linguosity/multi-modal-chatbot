/**
 * DOCX Renderer using docx.js
 * Generates professional SLP assessment report Word documents matching
 * the clinical template style (compact info grid, roman-numeral sections,
 * lettered subsections, shaded tables, confidentiality notice).
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Footer,
  PageNumber,
  NumberFormat,
  Tab,
  TabStopType,
  TabStopPosition,
  Header,
  Packer,
  BorderStyle,
  convertInchesToTwip,
  ShadingType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
} from 'docx'

import type { ExportReportData, ExportSection, ExportSubsection } from './report-to-export-data'
import { toRoman } from './report-to-export-data'
import { REPORT_COLORS_RAW } from '@/lib/styles/report-card-colors'

// ── Color palette (no # prefix for docx.js, from shared module) ──────

const C = {
  ...REPORT_COLORS_RAW,
}

// ── Shared text helpers ──────────────────────────────────────────────

const BODY_SIZE = 21 // 10.5pt in half-points
const SMALL_SIZE = 18 // 9pt
const FONT = 'Calibri'

function bodyRun(text: string, opts?: Partial<{ bold: boolean; italics: boolean; color: string }>): TextRun {
  return new TextRun({
    text,
    size: BODY_SIZE,
    font: FONT,
    color: opts?.color ?? C.text,
    bold: opts?.bold ?? false,
    italics: opts?.italics ?? false,
  })
}

// ── Header block (replaces cover page) ───────────────────────────────

function buildHeaderBlock(data: ExportReportData): Paragraph[] {
  const items: Paragraph[] = []

  // Organization name
  items.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: data.organizationName.toUpperCase(),
          size: 26,
          bold: true,
          color: C.navy,
          font: FONT,
        }),
      ],
    })
  )

  // Confidentiality notice
  if (data.confidentialityNotice) {
    items.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [
          new TextRun({
            text: data.confidentialityNotice,
            size: 17,
            italics: true,
            color: C.muted,
            font: FONT,
          }),
        ],
      })
    )
  }

  // Report title bar (navy background, white text)
  items.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      shading: { type: ShadingType.CLEAR, fill: C.navy },
      children: [
        new TextRun({
          text: `  ${data.reportSubtitle || data.reportType.toUpperCase()}  `,
          size: 24,
          bold: true,
          color: C.white,
          font: FONT,
        }),
      ],
    })
  )

  return items
}

// ── Student info grid (2-column table) ───────────────────────────────

function buildInfoGrid(data: ExportReportData): Table {
  const rows: [string, string, string?, string?][] = []

  rows.push(['Student:', data.student.name, 'Grade:', data.student.grade || '—'])
  if (data.student.dateOfBirth || data.student.age) {
    rows.push(['Birthday:', data.student.dateOfBirth || '—', 'Age:', data.student.age || '—'])
  }
  rows.push(['Date of Evaluation:', data.evaluationDate, 'Report Date:', data.reportDate])
  if (data.student.primaryLanguage || data.student.eligibility) {
    rows.push(['Primary Language:', data.student.primaryLanguage || '—', 'Eligibility:', data.student.eligibility || '—'])
  }
  rows.push(['Examiner:', data.evaluatorName || '—'])

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: C.white },
    bottom: { style: BorderStyle.NONE, size: 0, color: C.white },
    left: { style: BorderStyle.NONE, size: 0, color: C.white },
    right: { style: BorderStyle.NONE, size: 0, color: C.white },
  }

  function labelCell(text: string): TableCell {
    return new TableCell({
      borders: noBorder,
      verticalAlign: VerticalAlign.CENTER,
      width: { size: 22, type: WidthType.PERCENTAGE },
      children: [
        new Paragraph({
          spacing: { before: 30, after: 30 },
          children: [
            new TextRun({
              text,
              size: 19,
              bold: true,
              color: C.navy,
              font: FONT,
            }),
          ],
        }),
      ],
    })
  }

  function valueCell(text: string, widthPct = 28): TableCell {
    return new TableCell({
      borders: noBorder,
      verticalAlign: VerticalAlign.CENTER,
      width: { size: widthPct, type: WidthType.PERCENTAGE },
      children: [
        new Paragraph({
          spacing: { before: 30, after: 30 },
          children: [
            new TextRun({
              text,
              size: 19,
              color: C.text,
              font: FONT,
            }),
          ],
        }),
      ],
    })
  }

  const tableRows = rows.map((row) => {
    const cells: TableCell[] = [labelCell(row[0]), valueCell(row[1])]
    if (row[2] !== undefined) {
      cells.push(labelCell(row[2]))
      cells.push(valueCell(row[3] || '—'))
    } else {
      // Empty cells for alignment
      cells.push(labelCell(''))
      cells.push(valueCell(''))
    }
    return new TableRow({ children: cells })
  })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  })
}

// ── Section heading (roman numeral, shaded bar) ──────────────────────

function buildSectionHeading(section: ExportSection, index: number): Paragraph {
  const roman = toRoman(index + 1)
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: index === 0 ? 120 : 320, after: 160 },
    shading: { type: ShadingType.CLEAR, fill: C.headerBg },
    children: [
      new TextRun({
        text: `${roman}. ${section.title.toUpperCase()}`,
        size: 24,
        bold: true,
        color: C.navy,
        font: FONT,
      }),
    ],
  })
}

// ── Body paragraphs ──────────────────────────────────────────────────

function buildParagraphs(text: string): Paragraph[] {
  if (!text) return []
  return text.split('\n\n').filter(Boolean).map((para) => {
    const trimmed = para.trim()
    // Detect numbered list items
    const listMatch = trimmed.match(/^(\d+)\.\s+(.+)/s)
    if (listMatch) {
      return new Paragraph({
        spacing: { after: 100 },
        indent: { left: convertInchesToTwip(0.25) },
        children: [
          new TextRun({
            text: `${listMatch[1]}. `,
            bold: true,
            size: BODY_SIZE,
            color: C.text,
            font: FONT,
          }),
          new TextRun({
            text: listMatch[2],
            size: BODY_SIZE,
            color: C.text,
            font: FONT,
          }),
        ],
      })
    }
    return new Paragraph({
      spacing: { after: 120 },
      alignment: AlignmentType.JUSTIFIED,
      children: [bodyRun(trimmed)],
    })
  })
}

// ── Subsection (lettered, with shaded content box) ───────────────────

function buildSubsection(sub: ExportSubsection, letterIndex: number): Paragraph[] {
  const letter = String.fromCharCode(65 + letterIndex)
  const items: Paragraph[] = []

  // Subsection heading: "A. Heading"
  items.push(
    new Paragraph({
      spacing: { before: 200, after: 80 },
      children: [
        new TextRun({
          text: `${letter}. `,
          bold: true,
          size: 22,
          color: C.navy,
          font: FONT,
        }),
        new TextRun({
          text: sub.heading,
          bold: true,
          italics: true,
          size: 22,
          color: C.navy,
          font: FONT,
        }),
      ],
    })
  )

  // Content paragraphs in a shaded box (indented with left border + fill)
  const contentParas = sub.content.split('\n\n').filter(Boolean)
  if (contentParas.length > 0) {
    for (const p of contentParas) {
      items.push(
        new Paragraph({
          spacing: { after: 80 },
          indent: { left: convertInchesToTwip(0.2) },
          shading: { type: ShadingType.CLEAR, fill: C.light },
          border: {
            left: { style: BorderStyle.SINGLE, size: 2, color: C.border },
          },
          children: [
            new TextRun({
              text: p.trim(),
              size: 20,
              color: C.text,
              font: FONT,
            }),
          ],
        })
      )
    }
  }

  return items
}

// ── Build full section content ───────────────────────────────────────

function buildSectionContent(data: ExportReportData): Paragraph[] {
  const content: Paragraph[] = []

  data.sections.forEach((section, index) => {
    // Section heading bar
    content.push(buildSectionHeading(section, index))

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

// ── Accent line separator ────────────────────────────────────────────

function buildSeparator(): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 280 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accent },
    },
    children: [],
  })
}

// ── Public API ────────────────────────────────────────────────────────

export async function generateDOCX(data: ExportReportData): Promise<Buffer> {
  const isFullReport = data.sections.length > 1

  const doc = new Document({
    creator: data.organizationName,
    title: data.title,
    description: `${data.reportType} for ${data.student.name}`,

    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: BODY_SIZE,
            color: C.text,
          },
          paragraph: {
            spacing: { line: 290 }, // ~1.45 line spacing
          },
        },
        heading1: {
          run: {
            font: FONT,
            size: 24,
            bold: true,
            color: C.navy,
          },
        },
        heading2: {
          run: {
            font: FONT,
            size: 22,
            bold: true,
            color: C.navy,
          },
        },
      },
    },

    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.6),
              right: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.7),
              left: convertInchesToTwip(0.75),
            },
            pageNumbers: {
              start: 1,
              formatType: NumberFormat.DECIMAL,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                tabStops: [
                  { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
                ],
                spacing: { after: 60 },
                border: {
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: C.border },
                },
                children: [
                  new TextRun({
                    text: data.student.name || data.title,
                    size: SMALL_SIZE,
                    color: C.muted,
                    font: FONT,
                  }),
                  new TextRun({ children: [new Tab()] }),
                  new TextRun({
                    text: data.evaluationDate,
                    size: SMALL_SIZE,
                    color: C.muted,
                    font: FONT,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                tabStops: [
                  { type: TabStopType.CENTER, position: Math.round(TabStopPosition.MAX / 2) },
                  { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
                ],
                children: [
                  new TextRun({
                    text: `Generated by ${data.organizationName}`,
                    size: 16,
                    color: C.muted,
                    font: FONT,
                  }),
                  new TextRun({ children: [new Tab()] }),
                  new TextRun({
                    children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: C.muted,
                    font: FONT,
                  }),
                  new TextRun({ children: [new Tab()] }),
                ],
              }),
            ],
          }),
        },
        children: [
          ...(isFullReport ? buildHeaderBlock(data) : []),
          ...(isFullReport ? [buildInfoGrid(data)] : []),
          ...(isFullReport ? [buildSeparator()] : []),
          ...buildSectionContent(data),
        ],
      },
    ],
  })

  const buffer = await Packer.toBuffer(doc)
  return Buffer.from(buffer)
}
