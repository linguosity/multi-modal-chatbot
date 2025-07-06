'use client'

import { useReport } from '@/lib/context/ReportContext';
import { slpReportSectionGroups } from '@/lib/report-groups';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const colors = ['#E57373', '#81C784', '#64B5F6', '#FFD54F', '#9575CD'];

export function ColorSettings() {
  const { report, setReport } = useReport();

  const handleGroupColorChange = (groupSectionTypes: string[], color: string) => {
    setReport(prevReport => {
      if (!prevReport) return null;
      const updatedSections = prevReport.sections.map(section =>
        groupSectionTypes.includes(section.sectionType) ? { ...section, borderColor: color } : section
      );
      return { ...prevReport, sections: updatedSections };
    });
  };

  if (!report) return null;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Section Colors (Simplified)</h2>
      <p>This is a simplified version to debug the build error.</p>
    </div>
  );
}