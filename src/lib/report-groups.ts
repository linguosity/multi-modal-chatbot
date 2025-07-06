export interface SlpReportSectionGroup {
  title: string;
  sectionTypes: string[];
}

export const slpReportSectionGroups: SlpReportSectionGroup[] = [
  {
    title: "Initial Information & Background",
    sectionTypes: [
      "reason_for_referral",
      "parent_concern",
      "health_developmental_history",
      "family_background",
    ],
  },
  {
    title: "Assessment Findings",
    sectionTypes: [
      "assessment_tools",
      "assessment_results",
      "language_sample",
      "validity_statement",
    ],
  },
  {
    title: "Summary, Eligibility & Recommendations",
    sectionTypes: [
      "eligibility_checklist",
      "conclusion",
      "recommendations",
      "accommodations",
    ],
  },
];