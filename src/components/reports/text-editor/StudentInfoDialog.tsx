// FILE: src/components/reports/text-editor/StudentInfoDialog.tsx (NEW FILE)

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button"; // Import buttonVariants
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea"; // Import if using for parents/other fields
import {
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { StudentInformation } from '@/types/reportSchemas'; // Import type from your schema file
import { cn } from '@/lib/utils';

interface StudentInfoDialogProps {
    // Use Partial to allow potentially incomplete initial data
    studentInfo: Partial<StudentInformation> | undefined | null;
    onSave: (updatedInfo: StudentInformation) => void; // Callback with the full updated object
    onClose: () => void; // Callback to close the dialog
}

// Helper to create a default empty student info object matching the type
const createDefaultStudentInfo = (): StudentInformation => ({
    firstName: '',
    lastName: '',
    DOB: '',
    reportDate: '',
    evaluationDate: '',
    parents: [],
    homeLanguage: '',
    grade: '',
    eligibility: '',
    secondaryEligibility: '',
    school: '',
    teacher: '',
    evaluator: '',
    caseManager: '',
});

export const StudentInfoDialog: React.FC<StudentInfoDialogProps> = ({ studentInfo, onSave, onClose }) => {
    // Initialize form state with current data or defaults
    // Ensure all keys from the type exist in the state
    const [formData, setFormData] = useState<StudentInformation>(
        () => ({ ...createDefaultStudentInfo(), ...(studentInfo || {}) }) // Merge defaults with passed info
    );

    // Update form data if the prop changes (e.g., on initial load after skeleton)
    useEffect(() => {
        // Reset form state when the input prop changes, merging with defaults
        setFormData({ ...createDefaultStudentInfo(), ...(studentInfo || {}) });
    }, [studentInfo]); // Rerun effect if studentInfo prop changes

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Special handling for parents array (simple comma-separated example)
        if (name === 'parents') {
            setFormData(prev => ({ ...prev, [name]: value.split(',').map(p => p.trim()).filter(p => p) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSaveClick = (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission
        // Add Zod validation here before saving if desired:
        // const result = StudentInformationSchema.safeParse(formData);
        // if (!result.success) { /* Handle validation errors */ return; }
        onSave(formData); // Pass the complete formData object
        // onClose(); // DialogClose button handles closing, or call onClose here if preferred
    };

    return (
        // DialogContent is rendered conditionally by the parent Dialog's open state
        <DialogContent className="sm:max-w-[650px]"> {/* Adjust width as needed */}
            <DialogHeader>
                <DialogTitle>Edit Student Information</DialogTitle>
                <DialogDescription>
                    Update the student's demographic and background details.
                </DialogDescription>
            </DialogHeader>
            {/* Use a form for semantic correctness and onSubmit handling */}
            <form onSubmit={handleSaveClick}>
                {/* Use overflow-y-auto for scrollable content if form is long */}
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                    {/* Grid for two columns of fields */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                         {/* Column 1 */}
                         <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" name="firstName" value={formData.firstName || ''} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" name="lastName" value={formData.lastName || ''} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="DOB">Date of Birth</Label>
                            <Input id="DOB" name="DOB" type="date" value={formData.DOB || ''} onChange={handleChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="grade">Grade</Label>
                            <Input id="grade" name="grade" value={formData.grade || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="school">School</Label>
                            <Input id="school" name="school" value={formData.school || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="teacher">Teacher</Label>
                            <Input id="teacher" name="teacher" value={formData.teacher || ''} onChange={handleChange} />
                        </div>


                         {/* Column 2 */}
                        <div className="space-y-2">
                            <Label htmlFor="parents">Parent(s)/Guardian(s)</Label>
                             {/* Simple comma-separated input for parents array */}
                            <Input id="parents" name="parents" value={formData.parents?.join(', ') || ''} onChange={handleChange} placeholder="e.g., Jane Doe, John Smith" />
                            <p className="text-xs text-muted-foreground">Separate multiple names with commas.</p>
                            {/* Alternative: Use Textarea for one parent per line */}
                            {/* <Textarea id="parents" name="parents" value={formData.parents?.join('\n') || ''} onChange={handleParentTextareaChange} placeholder="Enter one name per line" /> */}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="homeLanguage">Home Language</Label>
                            <Input id="homeLanguage" name="homeLanguage" value={formData.homeLanguage || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reportDate">Report Date</Label>
                            <Input id="reportDate" name="reportDate" type="date" value={formData.reportDate || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="evaluationDate">Evaluation Date(s)</Label>
                            <Input id="evaluationDate" name="evaluationDate" value={formData.evaluationDate || ''} onChange={handleChange} placeholder="e.g., MM/DD/YYYY, MM/DD/YYYY"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="evaluator">Evaluator</Label>
                            <Input id="evaluator" name="evaluator" value={formData.evaluator || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="caseManager">Case Manager</Label>
                            <Input id="caseManager" name="caseManager" value={formData.caseManager || ''} onChange={handleChange} />
                        </div>
                         {/* Add Eligibility / Secondary Eligibility if needed here */}
                         <div className="space-y-2">
                             <Label htmlFor="eligibility">Eligibility Category</Label>
                             <Input id="eligibility" name="eligibility" value={formData.eligibility || ''} onChange={handleChange} />
                         </div>
                         <div className="space-y-2">
                             <Label htmlFor="secondaryEligibility">Secondary Eligibility</Label>
                             <Input id="secondaryEligibility" name="secondaryEligibility" value={formData.secondaryEligibility || ''} onChange={handleChange} />
                         </div>
                    </div>
                </div>
                <DialogFooter className="mt-4">
                    {/* === Workaround: Use asChild with native button + variants === */}
                    <DialogClose asChild>
                        <button
                            type="button" // Add type="button"
                            className={cn(buttonVariants({ variant: "outline" }))} // Apply variants
                        >
                            Cancel
                        </button>
                    </DialogClose>
                    {/* ========================================================== */}

                    {/* Save Changes Button (uses custom Button component - likely fine) */}
                    <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
};

export default StudentInfoDialog;