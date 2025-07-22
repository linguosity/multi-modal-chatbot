import { Report, ReportSection, REPORT_SECTION_TYPES } from './schemas/report';

type ReportSectionType = keyof typeof REPORT_SECTION_TYPES;

type SectionVariant = 'kv' | 'prose+points' | 'points';

interface SectionRenderSpec {
  variant: SectionVariant;
  fieldOrder?: string[];
  computed?: Record<string, (report: Report) => string>;
}

export const SECTION_RENDER_CONFIG: Record<ReportSectionType, SectionRenderSpec> = {
  [REPORT_SECTION_TYPES.HEADING]: {
    variant: 'kv',
    fieldOrder: ['studentName', 'dob', 'evaluationDate', 'chronologicalAge', 'grade', 'eligibility', 'reportId'],
    computed: {
      chronologicalAge: (report) => {
        if (!report.fields?.dob || !report.fields?.evaluationDate) return '';
        const dob = new Date(report.fields.dob as string);
        const evalDate = new Date(report.fields.evaluationDate as string);
        let age = evalDate.getFullYear() - dob.getFullYear();
        const m = evalDate.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && evalDate.getDate() < dob.getDate())) {
          age--;
        }
        return age.toString();
      }
    }
  },
  [REPORT_SECTION_TYPES.REASON_FOR_REFERRAL]: { variant: 'prose+points' },
  [REPORT_SECTION_TYPES.HEALTH_DEVELOPMENTAL_HISTORY]: { variant: 'prose+points' },
  [REPORT_SECTION_TYPES.FAMILY_BACKGROUND]: { variant: 'prose+points' },
  [REPORT_SECTION_TYPES.PARENT_CONCERN]: { variant: 'prose+points' },
  [REPORT_SECTION_TYPES.VALIDITY_STATEMENT]: { variant: 'prose+points' },
  [REPORT_SECTION_TYPES.ASSESSMENT_TOOLS]: { variant: 'prose+points' },
  [REPORT_SECTION_TYPES.ASSESSMENT_RESULTS]: { variant: 'prose+points' },
  [REPORT_SECTION_TYPES.LANGUAGE_SAMPLE]: { variant: 'prose+points' },
  [REPORT_SECTION_TYPES.ELIGIBILITY_CHECKLIST]: { variant: 'prose+points' },
  [REPORT_SECTION_TYPES.CONCLUSION]: { variant: 'prose+points' },
  [REPORT_SECTION_TYPES.RECOMMENDATIONS]: { variant: 'prose+points' },
  [REPORT_SECTION_TYPES.ACCOMMODATIONS]: { variant: 'prose+points' },
  [REPORT_SECTION_TYPES.OTHER]: { variant: 'points' }
};

export function renderTemplate(content: string, ctx: Record<string, string>): string {
  return content.replace(/\[([^\]]+)\]/g, (_, key) => ctx[key.trim()] ?? `[${key}]`);
}

export const labelForKey = (key: string): string => {
  const labels: Record<string, string> = {
    studentName: 'Student Name',
    dob: 'Date of Birth',
    evaluationDate: 'Evaluation Date',
    chronologicalAge: 'Chronological Age',
    grade: 'Grade',
    eligibility: 'Eligibility',
    reportId: 'Report ID'
  };
  return labels[key] || key;
};

export const inputTypeForKey = (key: string): string => {
  const types: Record<string, string> = {
    dob: 'date',
    evaluationDate: 'date'
  };
  return types[key] || 'text';
};

export const isComputed = (key: string, spec: SectionRenderSpec): boolean => {
  return !!spec.computed && key in spec.computed;
};
