import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ReportBackground } from '@/types/reportTypes';

interface BackgroundSectionProps {
  background: ReportBackground;
}

/**
 * Component for displaying background information including educational, health, and family info
 */
export const BackgroundSection: React.FC<BackgroundSectionProps> = ({ background }) => {
  return (
    <div className="mb-8">
      <h3 className="text-base font-semibold text-blue-700 mb-3 pb-1 border-b border-blue-200">Background Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card id="educational-history" className="border border-blue-100 shadow-sm bg-blue-50/30">
          <CardHeader className="py-2 px-3 bg-blue-50">
            <CardTitle className="text-sm font-medium text-blue-800">Educational History</CardTitle>
          </CardHeader>
          <CardContent className="p-3 text-xs">
            <p>{background.studentDemographicsAndBackground.educationalHistory}</p>
          </CardContent>
        </Card>
        
        <Card id="health-info" className="border border-blue-100 shadow-sm bg-blue-50/30">
          <CardHeader className="py-2 px-3 bg-blue-50">
            <CardTitle className="text-sm font-medium text-blue-800">Health Information</CardTitle>
          </CardHeader>
          <CardContent className="p-3 text-xs">
            <p><strong>Medical History:</strong> {background.healthReport.medicalHistory}</p>
            <p><strong>Vision/Hearing:</strong> {background.healthReport.visionAndHearingScreening}</p>
          </CardContent>
        </Card>
        
        <Card id="family-info" className="border border-blue-100 shadow-sm bg-blue-50/30">
          <CardHeader className="py-2 px-3 bg-blue-50">
            <CardTitle className="text-sm font-medium text-blue-800">Family Information</CardTitle>
          </CardHeader>
          <CardContent className="p-3 text-xs">
            <p><strong>Structure:</strong> {background.familyHistory.familyStructure}</p>
            <p><strong>Language Background:</strong> {background.familyHistory.languageAndCulturalBackground}</p>
          </CardContent>
        </Card>
        
        <Card id="parent-concerns" className="border border-blue-100 shadow-sm bg-blue-50/30">
          <CardHeader className="py-2 px-3 bg-blue-50">
            <CardTitle className="text-sm font-medium text-blue-800">Parent/Guardian Concerns</CardTitle>
          </CardHeader>
          <CardContent className="p-3 text-xs">
            <p>{background.parentGuardianConcerns}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BackgroundSection;