'use client'

import React, { useState, useRef, useEffect } from 'react'
import { User, Edit3, Check, X, Calendar, GraduationCap, Globe, Hash } from 'lucide-react'
import { useReport } from '@/lib/context/ReportContext'
import { StudentBio } from '@/lib/schemas/report'

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

export function StudentBioCard() {
  const { report, handleSave } = useReport()
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showMigrationWarning, setShowMigrationWarning] = useState(false)
  const [editData, setEditData] = useState<StudentBioData>({
    firstName: 'Student',
    lastName: 'Name',
    dateOfBirth: '',
    age: '',
    studentId: '', // User-generated school ID, not report UUID
    grade: '',
    primaryLanguages: 'English',
    eligibilityStatus: 'Pending'
  })

  // Initialize editData from report metadata or localStorage when report loads
  useEffect(() => {
    if (report) {
      // Try to get from report metadata first
      if (report.metadata?.studentBio) {
        const bio = report.metadata.studentBio
        setEditData({
          firstName: bio.firstName || 'Student',
          lastName: bio.lastName || 'Name',
          dateOfBirth: bio.dateOfBirth || '',
          age: bio.age || '',
          studentId: bio.studentId || '',
          grade: bio.grade || '',
          primaryLanguages: bio.primaryLanguages || 'English',
          eligibilityStatus: bio.eligibilityStatus || 'Pending'
        })
      } else {
        // Fallback to localStorage if metadata not available
        const storageKey = `studentBio_${report.id}`
        const savedBio = localStorage.getItem(storageKey)
        if (savedBio) {
          try {
            const bio = JSON.parse(savedBio)
            setEditData({
              firstName: bio.firstName || 'Student',
              lastName: bio.lastName || 'Name',
              dateOfBirth: bio.dateOfBirth || '',
              age: bio.age || '',
              studentId: bio.studentId || '',
              grade: bio.grade || '',
              primaryLanguages: bio.primaryLanguages || 'English',
              eligibilityStatus: bio.eligibilityStatus || 'Pending'
            })
          } catch (e) {
            console.error('Failed to parse saved student bio:', e)
          }
        }
      }
    }
  }, [report])
  
  const cardRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      if (!isEditing) {
        setIsHovered(false)
      }
    }, 200)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setIsHovered(true)
  }

  const handleSaveBio = async () => {
    if (!report) return
    
    // Always save to localStorage as backup
    const storageKey = `studentBio_${report.id}`
    localStorage.setItem(storageKey, JSON.stringify(editData))
    
    // Update the report with student bio data
    const updatedReport = {
      ...report,
      metadata: {
        ...report.metadata,
        studentBio: editData
      }
    }
    
    try {
      await handleSave(updatedReport)
      console.log('✅ Student bio saved successfully')
      setIsEditing(false)
      setIsHovered(false)
      setShowMigrationWarning(false)
    } catch (error) {
      console.error('Failed to save student bio to database:', error)
      console.log('✅ Student bio saved to localStorage as fallback')
      // Show migration warning if it's a metadata column issue
      if (error instanceof Error && (error.message.includes('metadata') || error.message.includes('PGRST204'))) {
        setShowMigrationWarning(true)
      }
      // Still close editing mode since we saved to localStorage
      setIsEditing(false)
      setIsHovered(false)
    }
  }

  const handleCancel = () => {
    // Reset to original data
    setIsEditing(false)
    setIsHovered(false)
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
    setEditData({
      ...editData,
      dateOfBirth: date,
      age: calculateAge(date)
    })
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      {/* Migration Warning */}
      {showMigrationWarning && (
        <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-orange-600 mt-0.5">⚠️</div>
            <div className="flex-1">
              <p className="text-sm text-orange-800 font-medium">Database Update Required</p>
              <p className="text-xs text-orange-700 mt-1">
                Student bio saved locally, but database needs updating for permanent storage.
              </p>
              <button
                onClick={() => setShowMigrationWarning(false)}
                className="text-xs text-orange-600 hover:text-orange-800 mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Compact Bio Display */}
      <div
        ref={cardRef}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 rounded-full p-2">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-blue-900 text-base truncate">
              {editData.firstName} {editData.lastName}
            </div>
            <div className="text-sm text-blue-700 mt-1">
              {editData.studentId && (
                <span className="font-mono bg-blue-100 px-2 py-0.5 rounded text-xs mr-2">
                  ID: {editData.studentId}
                </span>
              )}
              {editData.grade ? `Grade ${editData.grade}` : 'Grade --'} • {editData.age ? `Age ${editData.age}` : 'Age --'}
            </div>
          </div>
          <Edit3 className="h-3 w-3 text-blue-600 opacity-60" />
        </div>
      </div>

      {/* Expanded Hover Card */}
      {isHovered && (
        <div
          className="absolute top-0 left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Student Information</h3>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {/* Name */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.firstName}
                    onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-sm text-gray-900">{editData.firstName}</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.lastName}
                    onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-sm text-gray-900">{editData.lastName}</div>
                )}
              </div>
            </div>

            {/* DOB & Age */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.dateOfBirth}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-sm text-gray-900">
                    {editData.dateOfBirth ? new Date(editData.dateOfBirth).toLocaleDateString() : '--'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Age</label>
                <div className="text-sm text-gray-900">{editData.age || '--'}</div>
              </div>
            </div>

            {/* Student ID & Grade */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <Hash className="h-3 w-3 inline mr-1" />
                  Student ID
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.studentId}
                    onChange={(e) => setEditData({ ...editData, studentId: e.target.value })}
                    placeholder="e.g. 12345678 or SM-2024-001"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                ) : (
                  <div className="text-sm text-gray-900 font-mono">{editData.studentId || '--'}</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <GraduationCap className="h-3 w-3 inline mr-1" />
                  Grade
                </label>
                {isEditing ? (
                  <select
                    value={editData.grade}
                    onChange={(e) => setEditData({ ...editData, grade: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="Pre-K">Pre-K</option>
                    <option value="TK">TK</option>
                    <option value="K">K</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={`${i + 1}`}>{i + 1}st/nd/rd/th</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-gray-900">{editData.grade || '--'}</div>
                )}
              </div>
            </div>

            {/* Languages & Eligibility */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Globe className="h-3 w-3 inline mr-1" />
                Primary Language(s)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.primaryLanguages}
                  onChange={(e) => setEditData({ ...editData, primaryLanguages: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <div className="text-sm text-gray-900">{editData.primaryLanguages}</div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Eligibility Status</label>
              {isEditing ? (
                <select
                  value={editData.eligibilityStatus}
                  onChange={(e) => setEditData({ ...editData, eligibilityStatus: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Eligible">Eligible</option>
                  <option value="Not Eligible">Not Eligible</option>
                  <option value="Re-evaluation Required">Re-evaluation Required</option>
                </select>
              ) : (
                <div className="text-sm text-gray-900">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                    editData.eligibilityStatus === 'Eligible' ? 'bg-green-100 text-green-800' :
                    editData.eligibilityStatus === 'Not Eligible' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {editData.eligibilityStatus}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 rounded"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
              <button
                onClick={handleSaveBio}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded"
              >
                <Check className="h-3 w-3" />
                Save
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}