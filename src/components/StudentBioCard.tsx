'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Edit3, Check, X } from 'lucide-react'
import { useReport } from '@/lib/context/ReportContext'

interface StudentBioData {
  firstName: string
  lastName: string
  dateOfBirth: string
  age: string
  studentId: string
  grade: string
  primaryLanguages: string
  eligibilityStatus: string
}

/**
 * Compact student metadata card. The read view is a borderless two-column
 * definition list — bold labels on the left, regular-weight values on the
 * right, generous row spacing. The "database admin panel" gridlines and
 * gray header cells have been retired.
 */
export function StudentBioCard() {
  const { report, handleSave } = useReport()
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showMigrationWarning, setShowMigrationWarning] = useState(false)
  const [editData, setEditData] = useState<StudentBioData>({
    firstName: 'Student',
    lastName: 'Name',
    dateOfBirth: '',
    age: '',
    studentId: '',
    grade: '',
    primaryLanguages: 'English',
    eligibilityStatus: 'Pending',
  })

  useEffect(() => {
    if (!report) return
    const studentInfoSection = report.sections.find(
      (section) => section.title === 'Student Information',
    )
    let bioData: StudentBioData = {
      firstName: 'Student',
      lastName: 'Name',
      dateOfBirth: '',
      age: '',
      studentId: '',
      grade: '',
      primaryLanguages: 'English',
      eligibilityStatus: 'Pending',
    }
    if (report.metadata?.studentBio) {
      bioData = { ...bioData, ...(report.metadata.studentBio as StudentBioData) }
    } else if (studentInfoSection?.structured_data) {
      const sd = studentInfoSection.structured_data as Record<string, string>
      bioData = {
        ...bioData,
        firstName: sd.first_name || bioData.firstName,
        lastName: sd.last_name || bioData.lastName,
        dateOfBirth: sd.date_of_birth || bioData.dateOfBirth,
        age: sd.age || bioData.age,
        studentId: sd.student_id || bioData.studentId,
        grade: sd.grade || bioData.grade,
        primaryLanguages:
          sd.primary_languages || sd.home_languages || bioData.primaryLanguages,
        eligibilityStatus: sd.eligibility_status || bioData.eligibilityStatus,
      }
    } else {
      const saved = localStorage.getItem(`studentBio_${report.id}`)
      if (saved) {
        try {
          bioData = { ...bioData, ...JSON.parse(saved) }
        } catch {
          /* ignore */
        }
      }
    }
    setEditData(bioData)
  }, [report])

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    [],
  )

  const handleSaveBio = async () => {
    if (!report) return
    localStorage.setItem(`studentBio_${report.id}`, JSON.stringify(editData))
    const idx = report.sections.findIndex((s) => s.title === 'Student Information')
    const updatedSections = [...report.sections]
    if (idx !== -1) {
      updatedSections[idx] = {
        ...updatedSections[idx],
        structured_data: {
          ...updatedSections[idx].structured_data,
          first_name: editData.firstName,
          last_name: editData.lastName,
          date_of_birth: editData.dateOfBirth,
          age: editData.age,
          student_id: editData.studentId,
          grade: editData.grade,
          primary_languages: editData.primaryLanguages,
          eligibility_status: editData.eligibilityStatus,
        },
      }
    }
    const updatedReport = {
      ...report,
      metadata: { ...report.metadata, studentBio: editData },
      sections: updatedSections,
    }
    try {
      await handleSave(updatedReport)
      setIsEditing(false)
      setIsOpen(false)
      setShowMigrationWarning(false)
    } catch (err) {
      if (err instanceof Error && (err.message.includes('metadata') || err.message.includes('PGRST204'))) {
        setShowMigrationWarning(true)
      }
      setIsEditing(false)
      setIsOpen(false)
    }
  }

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return ''
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age.toString()
  }

  const handleDateChange = (date: string) => {
    setEditData({ ...editData, dateOfBirth: date, age: calculateAge(date) })
  }

  // ── Compact display ────────────────────────────────────────────────────
  const displayName =
    [editData.lastName, editData.firstName].filter(Boolean).join(', ').trim() || 'Student name'
  const displayMeta = [
    editData.grade ? `Grade ${editData.grade}` : null,
    editData.age ? `Age ${editData.age}` : null,
    editData.primaryLanguages || null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="relative">
      {showMigrationWarning && (
        <div className="mb-3 rounded border border-[#d7a495] bg-[#faf0eb] px-3 py-2 text-[13px] text-[#8a4a30]">
          Student bio saved locally — the <code className="font-mono text-[12px]">metadata</code> column
          isn&rsquo;t available yet for permanent storage.{' '}
          <button
            onClick={() => setShowMigrationWarning(false)}
            className="underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded border border-[#d0cec6] bg-[var(--card-surface)] px-4 py-3 text-left transition-colors hover:border-[#9a9a9a]"
      >
        <div className="min-w-0">
          <div
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-[16px] leading-tight text-[#111] truncate"
          >
            {displayName}
          </div>
          <div className="mt-0.5 text-[12px] text-[#6b6b6b] truncate">
            {editData.studentId ? `${editData.studentId}` : 'No student ID'}
            {displayMeta ? ` · ${displayMeta}` : ''}
          </div>
        </div>
        <Edit3 className="size-4 text-[#9a9a9a]" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-40 w-[420px] rounded border border-[#d0cec6] bg-[var(--card-surface)] p-5 shadow-[6px_6px_0_rgba(17,17,17,0.06)]">
          <div className="mb-3 flex items-center justify-between">
            <h3
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-[17px] leading-tight text-[#111]"
            >
              Student information
            </h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-[12px] text-[#6b6b6b] hover:text-[#111]"
              >
                Edit
              </button>
            ) : null}
          </div>

          {/* Borderless definition list — bold labels left, values right. */}
          <dl className="grid grid-cols-[140px_1fr] gap-y-3.5 text-[13.5px]">
            <Row label="First name" editing={isEditing}>
              {isEditing ? (
                <TextInput
                  value={editData.firstName}
                  onChange={(v) => setEditData({ ...editData, firstName: v })}
                />
              ) : (
                editData.firstName || <Empty />
              )}
            </Row>
            <Row label="Last name" editing={isEditing}>
              {isEditing ? (
                <TextInput
                  value={editData.lastName}
                  onChange={(v) => setEditData({ ...editData, lastName: v })}
                />
              ) : (
                editData.lastName || <Empty />
              )}
            </Row>
            <Row label="Date of birth" editing={isEditing}>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.dateOfBirth}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className={inputCls}
                />
              ) : editData.dateOfBirth ? (
                new Date(editData.dateOfBirth).toLocaleDateString()
              ) : (
                <Empty />
              )}
            </Row>
            <Row label="Age" editing={isEditing}>
              {editData.age || <Empty />}
            </Row>
            <Row label="Student ID" editing={isEditing}>
              {isEditing ? (
                <TextInput
                  value={editData.studentId}
                  onChange={(v) => setEditData({ ...editData, studentId: v })}
                  placeholder="e.g. SM-2024-001"
                />
              ) : editData.studentId ? (
                <span className="font-mono text-[12.5px]">{editData.studentId}</span>
              ) : (
                <Empty />
              )}
            </Row>
            <Row label="Grade" editing={isEditing}>
              {isEditing ? (
                <select
                  value={editData.grade}
                  onChange={(e) => setEditData({ ...editData, grade: e.target.value })}
                  className={inputCls}
                >
                  <option value="">—</option>
                  <option value="Pre-K">Pre-K</option>
                  <option value="TK">TK</option>
                  <option value="K">K</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={`${i + 1}`}>
                      Grade {i + 1}
                    </option>
                  ))}
                </select>
              ) : (
                editData.grade || <Empty />
              )}
            </Row>
            <Row label="Language(s)" editing={isEditing}>
              {isEditing ? (
                <TextInput
                  value={editData.primaryLanguages}
                  onChange={(v) => setEditData({ ...editData, primaryLanguages: v })}
                />
              ) : (
                editData.primaryLanguages || <Empty />
              )}
            </Row>
            <Row label="Eligibility" editing={isEditing}>
              {isEditing ? (
                <select
                  value={editData.eligibilityStatus}
                  onChange={(e) =>
                    setEditData({ ...editData, eligibilityStatus: e.target.value })
                  }
                  className={inputCls}
                >
                  <option value="Pending">Pending</option>
                  <option value="Eligible">Eligible</option>
                  <option value="Not Eligible">Not Eligible</option>
                  <option value="Re-evaluation Required">Re-evaluation Required</option>
                </select>
              ) : (
                <EligibilityBadge value={editData.eligibilityStatus} />
              )}
            </Row>
          </dl>

          <div className="mt-5 flex justify-end gap-2 border-t border-dashed border-[#d0cec6] pt-4">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center gap-1 rounded px-3 py-1 text-[13px] text-[#6b6b6b] hover:text-[#111]"
                >
                  <X className="size-3" /> Cancel
                </button>
                <button
                  onClick={handleSaveBio}
                  className="inline-flex items-center gap-1 rounded bg-terracotta px-3 py-1 text-[13px] font-medium text-white hover:opacity-90"
                >
                  <Check className="size-3" /> Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsOpen(false)}
                className="rounded px-3 py-1 text-[13px] text-[#6b6b6b] hover:text-[#111]"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Definition-list row + tiny helpers ───────────────────────────────────

const inputCls =
  'w-full rounded border border-[#d0cec6] bg-white px-2 py-1 text-[13px] focus:border-terracotta focus:outline-none focus:ring-0'

function Row({
  label,
  editing: _editing,
  children,
}: {
  label: string
  editing: boolean
  children: React.ReactNode
}) {
  return (
    <>
      <dt className="font-medium text-[#3a3a3a]">{label}</dt>
      <dd className="text-[#111]">{children}</dd>
    </>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    />
  )
}

function Empty() {
  return <span className="text-[#9a9a9a]">—</span>
}

function EligibilityBadge({ value }: { value: string }) {
  const v = (value || '').toLowerCase()
  const tone =
    v === 'eligible'
      ? 'border-[#8eb397] bg-[#e8f0df] text-[#4e6a52]'
      : v === 'not eligible'
        ? 'border-[#d7a495] bg-[#faf0eb] text-[#8a4a30]'
        : v.includes('re-eval')
          ? 'border-[#d4b86b] bg-[#fef9e7] text-[#7a6135]'
          : 'border-[#d0cec6] bg-[#efece4] text-[#3a3a3a]'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11.5px] ${tone}`}>
      {value || 'Pending'}
    </span>
  )
}
