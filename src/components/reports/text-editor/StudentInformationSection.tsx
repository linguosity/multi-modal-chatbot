import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ReportHeader } from '@/types/reportTypes';

interface StudentInformationSectionProps {
  header: ReportHeader;
}

/**
 * Component for displaying student information and referral reason
 */
export const StudentInformationSection: React.FC<StudentInformationSectionProps> = ({ header }) => {
  return (
    <div className="mb-8">
      <h3 className="text-base font-semibold text-purple-700 mb-3 pb-1 border-b border-purple-200">Student Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card id="demographics" className="border border-purple-100 shadow-sm bg-purple-50/30">
          <CardHeader className="py-2 px-3 bg-purple-50">
            <CardTitle className="text-sm font-medium text-purple-800">Demographics</CardTitle>
          </CardHeader>
          <CardContent className="p-3 text-xs">
            <p><strong>Name:</strong> {header.studentInformation.firstName} {header.studentInformation.lastName}</p>
            <p><strong>DOB:</strong> {header.studentInformation.DOB}</p>
            <p><strong>Evaluation Date:</strong> {header.studentInformation.evaluationDate}</p>
            <p><strong>Home Language:</strong> {header.studentInformation.homeLanguage}</p>
          </CardContent>
        </Card>
        
        <Card id="referral" className="border border-purple-100 shadow-sm bg-purple-50/30">
          <CardHeader className="py-2 px-3 bg-purple-50">
            <CardTitle className="text-sm font-medium text-purple-800">Referral Reason</CardTitle>
          </CardHeader>
          <CardContent className="p-3 text-xs">
            <p>{header.reasonForReferral}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentInformationSection;