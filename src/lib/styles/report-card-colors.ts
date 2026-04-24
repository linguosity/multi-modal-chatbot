/**
 * Shared color palette for report cards and PDF/DOCX renderers.
 * Single source of truth — both the React WYSIWYG cards and the
 * export renderers import from here.
 */

export const REPORT_COLORS = {
  navy: '#1B365D',
  accent: '#2E75B6',
  headerBg: '#D6E4F0',
  light: '#F2F6FA',
  border: '#B8C9DB',
  text: '#222222',
  muted: '#555555',
  white: '#FFFFFF',
} as const

/** Same palette without # prefix (for docx.js which expects bare hex) */
export const REPORT_COLORS_RAW = {
  navy: '1B365D',
  accent: '2E75B6',
  headerBg: 'D6E4F0',
  light: 'F2F6FA',
  border: 'B8C9DB',
  text: '222222',
  muted: '555555',
  white: 'FFFFFF',
} as const

export type ReportColorKey = keyof typeof REPORT_COLORS
