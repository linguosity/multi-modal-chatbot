'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { REPORT_COLORS } from '@/lib/styles/report-card-colors'
import InlineEditField from './inline-edit-field'

import type { StudentInfo } from '@/lib/export/report-to-export-data'

interface ReportHeaderCardProps {
  organizationName: string
  confidentialityNotice: string
  reportSubtitle: string
  student: StudentInfo
  evaluatorName: string
  evaluationDate: string
  reportDate: string
  onFieldChange: (field: string, value: string) => void
  onStudentFieldChange: (field: keyof StudentInfo, value: string) => void
  readOnly?: boolean
}

/**
 * Report header card matching the PDF export header block:
 * 1. Organization name (centered, navy, bold, uppercase)
 * 2. Confidentiality notice (centered, italic, muted)
 * 3. Title bar (navy background, white text)
 * 4. Student info grid (2-column table)
 * 5. Accent separator line
 */
export default function ReportHeaderCard({
  organizationName,
  confidentialityNotice,
  reportSubtitle,
  student,
  evaluatorName,
  evaluationDate,
  reportDate,
  onFieldChange,
  onStudentFieldChange,
  readOnly = false,
}: ReportHeaderCardProps) {
  // Build the info grid rows: [label, value, label, value]
  const gridRows: Array<{ label: string; value: string; field: keyof StudentInfo | string; isStudent: boolean }[]> = [
    [
      { label: 'Student:', value: student.name, field: 'name', isStudent: true },
      { label: 'Grade:', value: student.grade || '—', field: 'grade', isStudent: true },
    ],
  ]

  gridRows.push([
    { label: 'Birthday:', value: student.dateOfBirth || '—', field: 'dateOfBirth', isStudent: true },
    { label: 'Age:', value: student.age || '—', field: 'age', isStudent: true },
  ])

  gridRows.push([
    { label: 'Date of Evaluation:', value: evaluationDate, field: 'evaluationDate', isStudent: false },
    { label: 'Report Date:', value: reportDate, field: 'reportDate', isStudent: false },
  ])

  gridRows.push([
    { label: 'Primary Language:', value: student.primaryLanguage || '—', field: 'primaryLanguage', isStudent: true },
    { label: 'Eligibility:', value: student.eligibility || '—', field: 'eligibility', isStudent: true },
  ])

  gridRows.push([
    { label: 'Examiner:', value: evaluatorName || '—', field: 'evaluatorName', isStudent: false },
    { label: '', value: '', field: '', isStudent: false }, // empty right column
  ])

  return (
    <div className="mb-6">
      {/* Organization name */}
      <div className="text-center mb-0.5">
        <InlineEditField
          value={organizationName.toUpperCase()}
          onChange={(val) => onFieldChange('organizationName', val)}
          readOnly={readOnly}
          className="text-sm font-bold tracking-wider"
          viewClassName="text-sm font-bold tracking-wider"
        />
      </div>

      {/* Confidentiality notice */}
      {confidentialityNotice && (
        <div className="text-center mb-2">
          <InlineEditField
            value={confidentialityNotice}
            onChange={(val) => onFieldChange('confidentialityNotice', val)}
            readOnly={readOnly}
            className="text-[10px] italic"
            viewClassName="text-[10px] italic"
          />
        </div>
      )}

      {/* Title bar — navy background, white text */}
      <div
        className="text-center py-1.5 px-4 rounded-sm mb-3"
        style={{ backgroundColor: REPORT_COLORS.navy }}
      >
        <InlineEditField
          value={reportSubtitle}
          onChange={(val) => onFieldChange('reportSubtitle', val)}
          readOnly={readOnly}
          className="text-xs font-bold tracking-wide text-white"
          viewClassName="text-xs font-bold tracking-wide text-white"
          editClassName="text-xs font-bold tracking-wide text-white"
        />
      </div>

      {/* Student info grid — 2-column table */}
      <div className="mb-2">
        <table className="w-full text-[11px] leading-snug">
          <tbody>
            {gridRows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, cellIdx) => {
                  if (!cell.label && !cell.value) {
                    // Empty filler cells
                    return (
                      <React.Fragment key={cellIdx}>
                        <td className="py-0.5 px-1 w-[22%]" />
                        <td className="py-0.5 px-1" />
                      </React.Fragment>
                    )
                  }
                  return (
                    <React.Fragment key={cellIdx}>
                      <td
                        className="py-0.5 px-1 font-bold whitespace-nowrap"
                        style={{ color: REPORT_COLORS.navy, width: '22%' }}
                      >
                        {cell.label}
                      </td>
                      <td className="py-0.5 px-1">
                        <InlineEditField
                          value={cell.value}
                          onChange={(val) => {
                            if (cell.isStudent) {
                              onStudentFieldChange(cell.field as keyof StudentInfo, val)
                            } else {
                              onFieldChange(cell.field, val)
                            }
                          }}
                          readOnly={readOnly}
                          placeholder="—"
                          className="text-[11px]"
                          viewClassName="text-[11px]"
                          editClassName="text-[11px]"
                        />
                      </td>
                    </React.Fragment>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Accent separator line */}
      <div
        className="h-[2px] rounded-full mt-1 mb-4"
        style={{ backgroundColor: REPORT_COLORS.accent }}
      />
    </div>
  )
}
