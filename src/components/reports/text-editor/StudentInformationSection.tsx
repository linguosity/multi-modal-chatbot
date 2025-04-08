// 🟦 FILE: StudentInformationSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

// Utility Imports (Verify paths and exports)
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';

// Custom Component Imports (Verify path and export type - named vs. default)
import { EditableCard } from '@/components/reports/EditableCard';

// Type Imports (Verify path)
import { ReportHeader } from '@/types/reportSchemas';

// UI Library Imports (Verify paths and named exports)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

// Lucide Icon Imports (Only needed for Calendar icon in DatePicker now)
import { Calendar as CalendarIcon } from 'lucide-react';


interface StudentInformationSectionProps {
  header: ReportHeader;
  onLockSection?: (id: string, locked: boolean) => void;
  onToggleSynthesis?: (id: string) => void;
  onSaveContent?: (id: string, content: string) => void;
}

export const StudentInformationSection: React.FC<StudentInformationSectionProps> = ({
  header,
  onLockSection,
  onToggleSynthesis,
  onSaveContent,
}) => {
  // Initialize state based on header data
  const [studentData, setStudentData] = useState({
    firstName: header.studentInformation.firstName || '',
    lastName: header.studentInformation.lastName || '',
    dob: header.studentInformation.DOB ? new Date(header.studentInformation.DOB) : undefined,
    grade: header.studentInformation.grade || '',
    homeLanguage: header.studentInformation.homeLanguage || '',
    evaluationDate: header.studentInformation.evaluationDate ? new Date(header.studentInformation.evaluationDate) : undefined,
    reportDate: header.studentInformation.reportDate ? new Date(header.studentInformation.reportDate) : undefined,
    parents: header.studentInformation.parents?.join(', ') || '',
    confidentialityStatement: header.confidentialityStatement || 'This report contains confidential information protected by FERPA.',
    school: header.studentInformation.school || '',
    teacher: header.studentInformation.teacher || '',
    evaluator: header.studentInformation.evaluator || '',
    caseManager: header.studentInformation.caseManager || '',
    eligibility: header.studentInformation.eligibility || '',
    secondaryEligibility: header.studentInformation.secondaryEligibility || '',
  });

  // Determine lock state for the student info card
  const isStudentInfoLocked = header.lockStatus?.studentInfo ?? true; // Default to locked

  // Update state if header data changes externally
  useEffect(() => {
    // Reset state based on potentially updated header prop
    setStudentData({
      firstName: header.studentInformation.firstName || '',
      lastName: header.studentInformation.lastName || '',
      dob: header.studentInformation.DOB ? new Date(header.studentInformation.DOB) : undefined,
      grade: header.studentInformation.grade || '',
      homeLanguage: header.studentInformation.homeLanguage || '',
      evaluationDate: header.studentInformation.evaluationDate ? new Date(header.studentInformation.evaluationDate) : undefined,
      reportDate: header.studentInformation.reportDate ? new Date(header.studentInformation.reportDate) : undefined,
      parents: header.studentInformation.parents?.join(', ') || '',
      confidentialityStatement: header.confidentialityStatement || 'This report contains confidential information protected by FERPA.',
      school: header.studentInformation.school || '',
      teacher: header.studentInformation.teacher || '',
      evaluator: header.studentInformation.evaluator || '',
      caseManager: header.studentInformation.caseManager || '',
      eligibility: header.studentInformation.eligibility || '',
      secondaryEligibility: header.studentInformation.secondaryEligibility || '',
    });
  }, [header]); // Dependency array ensures this runs when header changes


  // Handler to toggle lock state for this card
  const handleStudentInfoLockToggle = () => {
    onLockSection?.('student-info', !isStudentInfoLocked);
  };

  // Calculate age string from Date of Birth
  const calculateAge = (dob: Date | undefined): string => {
    if (!dob) return 'N/A';
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    let days = now.getDate() - dob.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    const yearStr = years > 0 ? `${years} year${years !== 1 ? 's' : ''}` : '';
    const monthStr = months > 0 ? `${months} month${months !== 1 ? 's' : ''}` : '';

    if (yearStr && monthStr) return `${yearStr}, ${monthStr}`;
    if (yearStr) return yearStr;
    if (monthStr) return monthStr;
    if (days >= 0) return `${days} day${days !== 1 ? 's' : ''}`; // Handle newborn case
    return 'N/A'; // Fallback
  };

  // Handle changes in any form field
  const handleFieldChange = (field: keyof typeof studentData, value: string | Date | undefined) => {
    setStudentData(prev => ({ ...prev, [field]: value }));
  };

  // Save the current state of student data
  const handleSaveStudentInfo = () => {
    const parentsArray = studentData.parents.split(',').map(p => p.trim()).filter(Boolean);
    const studentInfoJson = JSON.stringify({
      ...studentData,
      DOB: studentData.dob?.toISOString(),
      evaluationDate: studentData.evaluationDate?.toISOString(),
      reportDate: studentData.reportDate?.toISOString(),
      parents: parentsArray,
    });

    onSaveContent?.('student-info', studentInfoJson);
    onSaveContent?.('confidentiality', studentData.confidentialityStatement);
  };

  // --- Reusable Form Components (Minimalist Style) ---

  const DatePicker = ({ label, date, onChange }: { label: string; date?: Date; onChange: (date: Date | undefined) => void; }) => (
    <div className="mb-2"> {/* Adjusted margin */}
      {/* Label: Title Case, softer color, medium weight */}
      <Label className="block text-sm font-medium text-gray-500 mb-1">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal text-sm border-gray-300 hover:border-gray-400 focus:border-blue-500', // Use standard text color, adjusted borders
              !date && 'text-muted-foreground' // Keep placeholder style
            )}
          >
            {date ? format(date, 'PPP') : <span className="text-gray-400 italic">Pick a date</span>}
            {/* Keep calendar icon for date picker affordance */}
            <CalendarIcon className="ml-auto h-4 w-4 text-gray-500 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={onChange} disabled={(d) => d > new Date() || d < new Date('1900-01-01')} initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  );

  const TextField = ({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void; }) => (
    <div className="mb-2"> {/* Adjusted margin */}
      {/* Label: Title Case, softer color, medium weight */}
      <Label className="block text-sm font-medium text-gray-500 mb-1">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // Standard input styling, ensure good contrast and readability
        className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-9 w-full" // Adjusted height slightly
        placeholder="N/A"
      />
    </div>
  );

  const TextAreaField = ({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void; }) => (
     <div className="mb-2"> {/* Adjusted margin */}
       {/* Label: Title Case, softer color, medium weight */}
      <Label className="block text-sm font-medium text-gray-500 mb-1">{label}</Label>
      <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          // Standard textarea styling
          className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full"
          rows={3}
          placeholder="N/A"
        />
    </div>
  );


  // --- Reusable View Component (Minimalist Style) ---
  const InfoRow = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string; }) => (
    <div className={cn("mb-2", className)}> {/* Adjusted margin */}
      {/* Label: Title Case, softer color, medium weight */}
      <div className="text-sm font-medium text-gray-500 mb-0.5">{label}</div>
      {/* Value: Standard text color, slightly larger */}
      <div className="text-sm text-gray-800 break-words min-h-[1.25rem]"> {/* Ensure min-height for empty values */}
        {children || <span className="text-gray-400 italic">N/A</span>}
      </div>
    </div>
  );

  // --- Define Edit Component (4 Columns, Minimalist) ---
  const editComponent = (
    // Added small vertical gap to grid
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
        {/* Column 1 */}
        <div className="col-span-1">
            {/* Use Title Case for labels */}
            <TextField label="Student First Name" value={studentData.firstName} onChange={(val) => handleFieldChange('firstName', val)} />
            <TextField label="Student Last Name" value={studentData.lastName} onChange={(val) => handleFieldChange('lastName', val)} />
            <DatePicker label="Date of Birth" date={studentData.dob} onChange={(val) => handleFieldChange('dob', val)} />
            <TextField label="Grade" value={studentData.grade} onChange={(val) => handleFieldChange('grade', val)} />
            <TextField label="Primary Language" value={studentData.homeLanguage} onChange={(val) => handleFieldChange('homeLanguage', val)} />
        </div>
        {/* Column 2 */}
        <div className="col-span-1">
            <TextField label="School" value={studentData.school} onChange={(val) => handleFieldChange('school', val)} />
            <TextField label="Teacher" value={studentData.teacher} onChange={(val) => handleFieldChange('teacher', val)} />
            <TextField label="Evaluator" value={studentData.evaluator} onChange={(val) => handleFieldChange('evaluator', val)} />
            <TextField label="Case Manager" value={studentData.caseManager} onChange={(val) => handleFieldChange('caseManager', val)} />
        </div>
        {/* Column 3 */}
        <div className="col-span-1">
            <TextField label="Primary Eligibility" value={studentData.eligibility} onChange={(val) => handleFieldChange('eligibility', val)} />
            <TextField label="Secondary Eligibility" value={studentData.secondaryEligibility} onChange={(val) => handleFieldChange('secondaryEligibility', val)} />
            <DatePicker label="Evaluation Date" date={studentData.evaluationDate} onChange={(val) => handleFieldChange('evaluationDate', val)} />
            <DatePicker label="Report Date" date={studentData.reportDate} onChange={(val) => handleFieldChange('reportDate', val)} />
        </div>
        {/* Column 4 */}
        <div className="col-span-1">
            <TextField label="Parents/Guardians" value={studentData.parents} onChange={(val) => handleFieldChange('parents', val)} />
            <TextAreaField label="Confidentiality Statement" value={studentData.confidentialityStatement} onChange={(val) => handleFieldChange('confidentialityStatement', val)} />
        </div>
    </div>
  );

  // --- Define View Component (4 Columns, Minimalist) ---
  const viewComponent = (
    // Added small vertical gap to grid
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
        {/* Column 1 */}
        <div className="col-span-1">
            {/* Use Title Case for labels, removed icons */}
            <InfoRow label="Student Name">
                {`${studentData.firstName} ${studentData.lastName}`.trim() || null}
            </InfoRow>
            <InfoRow label="Date of Birth / Age">
                {formatDate(studentData.dob)} {studentData.dob && `(${calculateAge(studentData.dob)})`}
            </InfoRow>
             <InfoRow label="Grade">
                {studentData.grade}
            </InfoRow>
            <InfoRow label="Primary Language">
                {studentData.homeLanguage}
            </InfoRow>
        </div>
        {/* Column 2 */}
        <div className="col-span-1">
            <InfoRow label="School">
                {studentData.school}
            </InfoRow>
            <InfoRow label="Teacher">
                {studentData.teacher}
            </InfoRow>
             <InfoRow label="Evaluator">
                {studentData.evaluator}
            </InfoRow>
            <InfoRow label="Case Manager">
                {studentData.caseManager}
            </InfoRow>
        </div>
        {/* Column 3 */}
        <div className="col-span-1">
            <InfoRow label="Primary Eligibility">
                {studentData.eligibility}
            </InfoRow>
             <InfoRow label="Secondary Eligibility">
                {studentData.secondaryEligibility}
            </InfoRow>
            <InfoRow label="Evaluation Date">
                {formatDate(studentData.evaluationDate)}
            </InfoRow>
            <InfoRow label="Report Date">
                {formatDate(studentData.reportDate)}
            </InfoRow>
        </div>
        {/* Column 4 */}
        <div className="col-span-1">
            <InfoRow label="Parents/Guardians">
                {studentData.parents}
            </InfoRow>
            <InfoRow label="Confidentiality Statement">
                 {/* Keep italic for confidentiality statement value */}
                 <p className="text-xs text-gray-600 italic">{studentData.confidentialityStatement}</p>
            </InfoRow>
        </div>
    </div>
  );


  return (
    <div className="mb-6">
      {/* Use the updated view/edit components within the card */}
      <EditableCard
        id="student-info"
        title="Student Demographics & Information" // Keep title clear
        // Card styling remains minimal
        className="border border-gray-200 shadow-sm bg-white w-full rounded-lg overflow-hidden"
        headerClassName="bg-gray-50 px-4 py-2 border-b border-gray-200 text-base font-semibold text-gray-700" // Slightly adjust header text
        contentClassName="px-4 py-4" // Standard padding
        isLocked={isStudentInfoLocked}
        onLock={handleStudentInfoLockToggle}
        onToggleSynthesis={onToggleSynthesis ? () => onToggleSynthesis('student-info') : undefined}
        hasSynthesis={!!header.synthesis}
        color="blue" // Keep for potential use in EditableCard's buttons
        onSave={handleSaveStudentInfo}
        editComponent={editComponent}
        viewComponent={viewComponent}
      />
    </div>
  );
};

export default StudentInformationSection;
