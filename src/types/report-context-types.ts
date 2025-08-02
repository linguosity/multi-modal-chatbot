
import { Report, Section } from './report-types';

export interface ReportContextType {
  report: Report | null;
  handleSave: (updatedReport: Report) => Promise<void>;
  handleDelete: () => Promise<void>;
  updateSectionData: (sectionId: string, newStructuredData: any, newContent: string) => void;
  refreshReport: () => Promise<void>;
  setReport: (report: Report) => void;
  showJson: boolean;
  setShowJson: (show: boolean) => void;
  showJson: boolean;
  setShowJson: (show: boolean) => void;
}
