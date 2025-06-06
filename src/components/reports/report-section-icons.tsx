import React from 'react';
import {
  FileText,
  ClipboardCheck,
  BookOpen,
  Users,
  MessageCircle,
  CheckCircle,
  Stethoscope,
  BarChart3,
  ScrollText,
  ListChecks,
  FileText2,
  LightbulbIcon,
  Settings,
  User,
  Pen,
  Briefcase,
  Brain,
  SpeechIcon,
  Mic,
  HelpCircle,
  HeartPulse,
  Family,
  School,
  GraduationCap,
  Calendar,
  Clock,
  MessageSquareQuote,
  BarChart,
  BarChart2
} from 'lucide-react';

import { REPORT_SECTION_TYPES } from '@/lib/schemas/report';

// Icon size can be adjusted globally
const iconSize = { width: 18, height: 18 };

// Map of section types to corresponding icons
export const REPORT_SECTION_ICONS: Record<string, React.ReactNode> = {
  [REPORT_SECTION_TYPES.HEADING]: <FileText {...iconSize} />,
  [REPORT_SECTION_TYPES.REASON_FOR_REFERRAL]: <ClipboardCheck {...iconSize} />,
  [REPORT_SECTION_TYPES.HEALTH_DEVELOPMENTAL_HISTORY]: <HeartPulse {...iconSize} />,
  [REPORT_SECTION_TYPES.FAMILY_BACKGROUND]: <Users {...iconSize} />,
  [REPORT_SECTION_TYPES.PARENT_CONCERN]: <MessageCircle {...iconSize} />,
  [REPORT_SECTION_TYPES.VALIDITY_STATEMENT]: <CheckCircle {...iconSize} />,
  [REPORT_SECTION_TYPES.ASSESSMENT_TOOLS]: <Stethoscope {...iconSize} />,
  [REPORT_SECTION_TYPES.ASSESSMENT_RESULTS]: <BarChart3 {...iconSize} />,
  [REPORT_SECTION_TYPES.LANGUAGE_SAMPLE]: <MessageSquareQuote {...iconSize} />,
  [REPORT_SECTION_TYPES.ELIGIBILITY_CHECKLIST]: <ListChecks {...iconSize} />,
  [REPORT_SECTION_TYPES.CONCLUSION]: <ScrollText {...iconSize} />,
  [REPORT_SECTION_TYPES.RECOMMENDATIONS]: <LightbulbIcon {...iconSize} />,
  [REPORT_SECTION_TYPES.ACCOMMODATIONS]: <Settings {...iconSize} />,
  [REPORT_SECTION_TYPES.OTHER]: <HelpCircle {...iconSize} />
};

// Additional specialized icons for assessment subsections
export const ASSESSMENT_SUBSECTION_ICONS: Record<string, React.ReactNode> = {
  // For articulation assessments
  articulation: <Mic {...iconSize} />,
  
  // For language assessments
  language: <SpeechIcon {...iconSize} />,
  
  // For cognitive assessments
  cognitive: <Brain {...iconSize} />,
  
  // For educational impact
  education: <School {...iconSize} />,
  
  // For academic achievement
  academic: <GraduationCap {...iconSize} />,
  
  // For language sample specific cards
  sampleInfo: <Calendar {...iconSize} />,
  metrics: <BarChart {...iconSize} />,
  transcription: <MessageSquareQuote {...iconSize} />
};

// Function to get the icon for a section
export function getSectionIcon(sectionType: string): React.ReactNode {
  return REPORT_SECTION_ICONS[sectionType] || <FileText {...iconSize} />;
}

// Function to get an assessment subsection icon
export function getAssessmentSubsectionIcon(subsectionType: string): React.ReactNode {
  return ASSESSMENT_SUBSECTION_ICONS[subsectionType] || <Stethoscope {...iconSize} />;
}