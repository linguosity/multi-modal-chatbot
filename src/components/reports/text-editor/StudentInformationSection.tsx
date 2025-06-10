// FILE: src/components/reports/text-editor/StudentInformationSection.tsx
// (Correct and Complete - Works with EditableCard having Checkmark + Header Pencil (for Modal))
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils'; // Ensure this helper handles undefined/null/invalid dates gracefully
import { EditableCard } from '@/components/reports/EditableCard'; // Assuming path is correct
import { Header, StudentInformation } from '@/types/reportSchemas'; // Import both types
import { Dialog } from "@/components/ui/dialog"; // Assuming default Shadcn path
import { StudentInfoDialog } from './StudentInfoDialog'; // <<< MAKE SURE PATH IS CORRECT

// Define the props for this section component
interface StudentInformationSectionProps {
  header: Header | undefined | null; // Use Header type
  // Callbacks from the parent ReportEditor page
  onLockSection?: (id: string, locked: boolean) => void; // Optional locking
  onToggleSynthesis?: (id: string) => void; // For Synthesis button in EditableCard
  onSaveContent?: (id: string, content: StudentInformation) => void; // Saves updated student info object
  onToggleMarkedDone?: (id: string, isDone: boolean) => void; // For Checkmark button in EditableCard
}

export const StudentInformationSection: React.FC<StudentInformationSectionProps> = ({
  header,
  onLockSection, // Optional locking callback
  onToggleSynthesis,
  onSaveContent,
  onToggleMarkedDone // Pass for checkmark
}) => {
  // Test 1: Log the header prop to see what we're working with
  console.log('StudentInformationSection header:', header);
  console.log('StudentInformationSection studentInformation:', header?.studentInformation);
  
  // State to control the Dialog visibility
  const [isStudentInfoDialogOpen, setIsStudentInfoDialogOpen] = useState(false);

  // Test 2: Create a hard-coded minimal object to see if it renders properly
  const hardcodedStudentInfo = {
    firstName: 'Test',
    lastName: 'Student',
    DOB: '2020-01-01',
    parents: ['Parent 1', 'Parent 2'],
    homeLanguage: 'English',
    grade: '3rd',
    school: 'Test School',
    teacher: 'Ms. Teacher',
    evaluator: 'Dr. Evaluator'
  };
  
  // Extract student info, provide default empty object if null/undefined
  // Uncomment this line to use the hardcoded data for testing
  // const studentInfo = hardcodedStudentInfo;
  const studentInfo = header?.studentInformation ?? { firstName: '', lastName: '', parents: [], homeLanguage: '' };

  // Derive lock and done status from the header prop
  const isStudentInfoLocked = header?.lockStatus?.studentInfo ?? header?.isLocked ?? false;
  const isStudentInfoDone = header?.markedDoneStatus?.studentInfo ?? false;

  // Handler for saving data from the modal dialog
  const handleSaveFromDialog = useCallback((updatedInfo: StudentInformation) => {
    console.log('StudentInfoSection: Saving updated info from dialog');
    if (onSaveContent) {
      // Call parent's save function with 'studentInfo' identifier and the updated object
      onSaveContent('studentInfo', updatedInfo);
    }
  }, [onSaveContent]);

  // Handler for the checkmark button toggle
  const handleMarkDoneToggle = () => {
    if (onToggleMarkedDone) {
      // Use a consistent ID for this specific section
      onToggleMarkedDone('student-info', !isStudentInfoDone);
    }
  };

   // Handler for the lock toggle (if implemented)
   const handleLockToggle = () => {
     if (onLockSection) {
       // Use the specific key within the header's lockStatus object
       onLockSection('studentInfo', !isStudentInfoLocked);
     }
   };

  // Helper function to calculate age - FULL IMPLEMENTATION
  const calculateAge = (dobString: string | undefined): string => {
      if (!dobString) return '';
      try {
          const dob = new Date(dobString);
          // Add validation for invalid date object
          if (isNaN(dob.getTime())) return '';
          const now = new Date();
          let years = now.getFullYear() - dob.getFullYear();
          let months = now.getMonth() - dob.getMonth();
          let days = now.getDate() - dob.getDate();
          if (days < 0) {
              months--;
              const daysInLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
              days += daysInLastMonth;
          }
          if (months < 0) {
              years--;
              months += 12;
          }
          const yearStr = years > 0 ? `${years}yr` : '';
          const monthStr = months > 0 ? `${months}mo` : '';
          if (yearStr && monthStr) return `(${yearStr}, ${monthStr})`;
          if (yearStr) return `(${yearStr})`;
          if (monthStr) return `(${monthStr})`;
          if (days >= 0 && years === 0 && months === 0) return `(${days}d)`;
          return '';
      } catch (e) {
          console.error("Error calculating age:", e);
          return '';
      }
  };

  // Reusable component for displaying information rows - FULL IMPLEMENTATION
  const InfoRow = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string; }) => (
    <div className={cn("mb-1.5", className)}>
      <div className="text-xs font-medium text-gray-500 mb-0.5">{label}</div>
      <div className="text-sm text-gray-800 break-words min-h-[1.25rem]">
        {/* Use em dash '—' for empty/null/undefined values */}
        {children || <span className="text-gray-400 italic">—</span>}
      </div>
    </div>
  );

  // Component defining the structured view of student information - FULL IMPLEMENTATION
  const viewComponent = (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">
        <InfoRow label="Student Name">{`${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim() || null}</InfoRow>
        <InfoRow label="DOB / Age">{formatDate(studentInfo.DOB)} {calculateAge(studentInfo.DOB)}</InfoRow>
        <InfoRow label="Grade">{studentInfo.grade || null}</InfoRow>
        <InfoRow label="Primary Language">{studentInfo.homeLanguage || null}</InfoRow>
        <InfoRow label="School">{studentInfo.school || null}</InfoRow>
        <InfoRow label="Teacher">{studentInfo.teacher || null}</InfoRow>
        <InfoRow label="Evaluator">{studentInfo.evaluator || null}</InfoRow>
        <InfoRow label="Case Manager">{studentInfo.caseManager || null}</InfoRow>
        <InfoRow label="Primary Eligibility">{studentInfo.eligibility || null}</InfoRow>
        <InfoRow label="Secondary Eligibility">{studentInfo.secondaryEligibility || null}</InfoRow>
        <InfoRow label="Evaluation Date">{formatDate(studentInfo.evaluationDate)}</InfoRow>
        <InfoRow label="Report Date">{formatDate(studentInfo.reportDate)}</InfoRow>
        <InfoRow label="Parents/Guardians" className="sm:col-span-2 md:col-span-3">{studentInfo.parents?.join(', ') || null}</InfoRow>
        {/* Optional: Add back confidentiality if needed */}
        {/* <InfoRow label="Confidentiality Statement" className="sm:col-span-2 md:col-span-3"><p className="text-xs text-gray-600 italic">{header?.confidentialityStatement}</p></InfoRow> */}
    </div>
  );


  return (
      // Dialog component manages the modal's open/closed state
       <Dialog open={isStudentInfoDialogOpen} onOpenChange={setIsStudentInfoDialogOpen}>
         <div className="mb-6">
             {/* Test 3: Raw view of student info data outside of components */}
             <div className="bg-yellow-50 p-3 mb-4 border border-yellow-300 rounded">
                <h3 className="font-bold text-sm mb-2">Debug: Raw Student Info Data</h3>
                <pre className="text-xs overflow-auto max-h-32">
                  {JSON.stringify(studentInfo, null, 2)}
                </pre>
             </div>
           
             {/* EditableCard displays the information and provides header controls */}
             <EditableCard
                 id="student-info" // Unique ID for this card instance
                 title="Student Demographics & Information"
                 viewComponent={viewComponent} // Pass the structured view
                 // Styling props
                 className="border border-gray-200 shadow-sm bg-white w-full rounded-lg overflow-hidden"
                 headerClassName="bg-gray-50 px-4 py-2 border-b border-gray-200 text-base font-semibold text-gray-700"
                 contentClassName="px-4 py-4"
                 // State props
                 isLocked={isStudentInfoLocked}
                 hasSynthesis={!!header?.synthesis}
                 synthesisContent={header?.synthesis || ""}
                 isMarkedDone={isStudentInfoDone} // Controls checkmark state and potentially styling
                 // Callback props for header buttons
                 onToggleMarkedDone={handleMarkDoneToggle} // Enables Checkmark button
                 onToggleSynthesis={onToggleSynthesis ? () => onToggleSynthesis('student-info') : undefined} // Enables Synthesis button
                 onEditClick={() => setIsStudentInfoDialogOpen(true)} // Enables Header Pencil button and makes it open the modal
             />
            
             {/* The Dialog Content itself - rendered conditionally by Dialog */}
             {/* Test 3: Temporarily comment out Dialog to see if it's causing issues */}
             {/* 
             <StudentInfoDialog
                 initialData={studentInfo} // Data to populate the dialog form
                 onSave={handleSaveFromDialog} // Callback when dialog saves
                 onClose={() => setIsStudentInfoDialogOpen(false)} // Explicit way to close dialog if needed inside it
             />
             */}
         </div>
       </Dialog>
  );
};

export default StudentInformationSection;