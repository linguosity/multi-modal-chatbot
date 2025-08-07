
import { Report, Section } from './report-types';

import type { Json } from '@/lib/types/json'

export interface ReportContextType {
  report: Report | null;
  handleSave: (updatedReport: Report) => Promise<void>;
  handleDelete: () => Promise<void>;
  updateSectionData: (sectionId: string, newStructuredData: Json, newContent: string) => void;
  refreshReport: () => Promise<void>;
  setReport: (report: Report) => void;
  showJson: boolean;
  setShowJson: (show: boolean) => void;
  loading: boolean;
}
