import { DomainSection, SpeechLanguageReport } from '@/types/reportTypes';

// ====================
// SECTION FORMATTING UTILITIES
// ====================

/**
 * Formats a section key to a readable display form
 * e.g., "parentConcern" → "Parent Concern"
 */
export const formatSectionName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

/**
 * Maps common section keys to their proper display names
 */
export const SECTION_DISPLAY_NAMES: Record<string, string> = {
  parentConcern: 'Parent/Guardian Concerns',
  receptiveLanguage: 'Receptive Language',
  expressiveLanguage: 'Expressive Language',
  pragmaticLanguage: 'Pragmatic/Social Language',
  articulation: 'Articulation/Phonology',
  fluency: 'Fluency',
  voice: 'Voice',
  assessmentData: 'Assessment Data',
  conclusion: 'Conclusion',
  recommendations: 'Recommendations',
};

/**
 * Gets the display name for a section key
 */
export const getSectionDisplayName = (key: string): string => {
  return SECTION_DISPLAY_NAMES[key] || formatSectionName(key);
};

// ====================
// SECTION CHANGE DETECTION
// ====================

/**
 * Determines whether a section has changed compared to a previous version
 */
export const hasSectionChanged = (
  section: string | undefined, 
  previousSection: string | undefined
): boolean => {
  if ((!section && previousSection) || (section && !previousSection)) {
    return true;
  }
  
  if (!section && !previousSection) {
    return false;
  }
  
  return section !== previousSection;
};

/**
 * Get a list of sections that have changed between two section objects
 */
export const getChangedSections = (
  newSections: Record<string, string | undefined>,
  oldSections: Record<string, string | undefined>
): string[] => {
  const changedKeys: string[] = [];
  
  Object.keys(newSections).forEach(key => {
    if (hasSectionChanged(newSections[key], oldSections[key])) {
      changedKeys.push(key);
    }
  });
  
  Object.keys(oldSections).forEach(key => {
    if (!newSections.hasOwnProperty(key) && oldSections[key]) {
      changedKeys.push(key);
    }
  });
  
  return changedKeys;
};

// ====================
// REPORT DATA PROCESSING
// ====================

/**
 * Normalize input data from various sources (text, PDF, audio)
 */
export async function normalizeInput(input: any): Promise<string> {
  if (typeof input === 'string') {
    return input;
  } else if (input.text) {
    return input.text;
  } else if (input.pdfData) {
    return input.pdfData;
  }
  return JSON.stringify(input);
}

/**
 * Safe deep clone utility that preserves the proper report structure
 */
export function safeCloneReport(report: SpeechLanguageReport): SpeechLanguageReport {
  if (!report) return createReportSkeleton();
  
  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(report);
    }
    
    const { SpeechLanguageReportSchema } = require('@/types/reportSchemas');
    return SpeechLanguageReportSchema.parse(report);
  } catch (error) {
    console.warn("Using JSON for cloning due to error:", error);
    return JSON.parse(JSON.stringify(report));
  }
}

// ====================
// REPORT CREATION & VALIDATION
// ====================

/**
 * Create a default report skeleton that adheres to the SpeechLanguageReport schema
 */
export function createReportSkeleton(): SpeechLanguageReport {
  return {
    header: {
      studentInformation: {
        firstName: "",
        lastName: "",
        DOB: "",
        reportDate: "",
        evaluationDate: "",
        parents: [],
        homeLanguage: "English",
        grade: "",
        eligibility: "",
        secondaryEligibility: "",
        school: "",
        teacher: "",
        evaluator: "",
        caseManager: "",
      },
      reasonForReferral: "",
      confidentialityStatement: "",
      synthesis: "",
      isLocked: false,
      lockStatus: {},
      markedDoneStatus: {},
    },
    background: {
      studentDemographicsAndBackground: {
        educationalHistory: "",
        synthesis: "",
        isLocked: false,
      },
      healthReport: {
        medicalHistory: "",
        visionAndHearingScreening: "",
        medicationsAndAllergies: "",
        synthesis: "",
        isLocked: false,
      },
      earlyInterventionHistory: "",
      familyHistory: {
        familyStructure: "",
        languageAndCulturalBackground: "",
        socioeconomicFactors: "",
        synthesis: "",
        isLocked: false,
      },
      parentGuardianConcerns: "",
      synthesis: "",
      isLocked: false,
      lockStatus: {},
      markedDoneStatus: {},
    },
    presentLevels: {
      functioning: {
        receptive: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: [],
          synthesis: "",
          isLocked: false,
        },
        expressive: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: [],
          synthesis: "",
          isLocked: false,
        },
        pragmatic: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: [],
          synthesis: "",
          isLocked: false,
        },
        articulation: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: [],
          synthesis: "",
          isLocked: false,
        },
        voice: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: [],
          synthesis: "",
          isLocked: false,
        },
        fluency: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: "",
          assessmentTools: [],
          synthesis: "",
          isLocked: false,
        },
      },
      synthesis: "",
      isLocked: false,
      lockStatus: {},
      markedDoneStatus: {
        functioning: {},
      },
    },
    assessmentResults: {
      observations: {
        classroomObservations: "",
        playBasedInformalObservations: "",
        socialInteractionObservations: "",
        synthesis: "",
        isLocked: false,
        lockStatus: {},
      },
      assessmentProceduresAndTools: {
        overviewOfAssessmentMethods: "",
        assessmentIntegrityStatement: "",
        assessmentToolsUsed: [],
        synthesis: "",
        isLocked: false,
        lockStatus: {},
      },
      synthesis: "",
      isLocked: false,
      lockStatus: {},
      markedDoneStatus: {},
    },
    conclusion: {
      eligibility: {
        domains: {
          receptive: false,
          expressive: false,
          pragmatic: false,
          articulation: false,
          voice: false,
          fluency: false,
        },
        eligibilityState: "CA",
        eligibilityStatement: "",
        applicableEdCodeText: "",
        isPreschool: false,
        synthesis: "",
        isLocked: false,
        lockStatus: {},
      },
      conclusion: {
        summary: "",
        synthesis: "",
        isLocked: false,
      },
      recommendations: {
        services: {
          typeOfService: "",
          frequency: "",
          setting: "",
        },
        accommodations: [],
        facilitationStrategies: [],
        synthesis: "",
        isLocked: false,
      },
      parentFriendlyGlossary: {
        terms: {},
        isLocked: false,
      },
      synthesis: "",
      isLocked: false,
      lockStatus: {},
      markedDoneStatus: {},
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      version: 1,
    },
    synthesis: "",
  };
}

/**
 * Create a validated report that ensures all required fields are present
 */
export function createValidatedReport(): SpeechLanguageReport {
  try {
    const { SpeechLanguageReportSchema } = require('@/types/reportSchemas');
    const skeleton = createReportSkeleton();
    const validatedReport = SpeechLanguageReportSchema.parse(skeleton);
    return validatedReport;
  } catch (error) {
    console.error("Failed to validate report schema:", error);
    return createReportSkeleton();
  }
}

/**
 * Utility function to validate any report against the schema
 */
export function validateReportShape(report: any): SpeechLanguageReport | null {
  try {
    if (!report) return null;
    
    const { SpeechLanguageReportSchema } = require('@/types/reportSchemas');
    const validatedReport = SpeechLanguageReportSchema.parse(report);
    return validatedReport;
  } catch (error) {
    console.error("Invalid report structure:", error);
    return null;
  }
}

// ====================
// DOMAIN SECTION MANAGEMENT
// ====================

/**
 * Update a specific domain section with new data
 */
export function updateDomainSection(
  report: SpeechLanguageReport,
  domain: string,
  updates: Partial<DomainSection>
): SpeechLanguageReport {
  const updatedReport = safeCloneReport(report);
  
  if (!updatedReport.presentLevels) {
    updatedReport.presentLevels = { functioning: {}, isLocked: false, lockStatus: {}, markedDoneStatus: { functioning: {} } };
  }
  
  if (!updatedReport.presentLevels.functioning) {
    updatedReport.presentLevels.functioning = {};
  }
  
  if (!updatedReport.presentLevels.functioning[domain]) {
    updatedReport.presentLevels.functioning[domain] = {
      isConcern: false,
      topicSentence: '',
      strengths: [],
      needs: [],
      impactStatement: '',
      assessmentTools: [],
      synthesis: '',
      isLocked: false
    };
  }
  
  const domainObj = updatedReport.presentLevels.functioning[domain];
  
  if (updates.isConcern !== undefined) {
    domainObj.isConcern = updates.isConcern;
  }
  
  if (updates.topicSentence) {
    domainObj.topicSentence = updates.topicSentence;
  }
  
  if (updates.strengths && updates.strengths.length > 0) {
    domainObj.strengths = [
      ...(domainObj.strengths || []),
      ...updates.strengths
    ];
  }
  
  if (updates.needs && updates.needs.length > 0) {
    domainObj.needs = [
      ...(domainObj.needs || []),
      ...updates.needs
    ];
  }
  
  if (updates.impactStatement) {
    domainObj.impactStatement = updates.impactStatement;
  }
  
  if (updates.assessmentTools && updates.assessmentTools.length > 0) {
    domainObj.assessmentTools = [
      ...(domainObj.assessmentTools || []),
      ...updates.assessmentTools
    ];
  }
  
  if (updates.isConcern !== undefined) {
    if (!updatedReport.conclusion) {
      updatedReport.conclusion = { 
        eligibility: { domains: {}, eligibilityState: "CA", isLocked: false },
        isLocked: false
      };
    }
    
    if (!updatedReport.conclusion.eligibility) {
      updatedReport.conclusion.eligibility = { domains: {}, eligibilityState: "CA", isLocked: false };
    }
    
    if (!updatedReport.conclusion.eligibility.domains) {
      updatedReport.conclusion.eligibility.domains = {};
    }
    
    updatedReport.conclusion.eligibility.domains[domain] = updates.isConcern;
  }
  
  if (!updatedReport.metadata) {
    updatedReport.metadata = { version: 1, lastUpdated: new Date().toISOString() };
  } else {
    updatedReport.metadata.lastUpdated = new Date().toISOString();
    updatedReport.metadata.version = (updatedReport.metadata.version || 0) + 1;
  }
  
  return updatedReport;
}

/**
 * @deprecated Use updateDomainSection instead
 */
export function updateDomainSectionLegacy(
  report: SpeechLanguageReport,
  domain: string,
  updates: Partial<DomainSection>
): SpeechLanguageReport {
  console.warn("DEPRECATED: Using legacy domain structure. Update to use presentLevels.functioning");
  
  const ensureLegacyStructure = (report: SpeechLanguageReport) => {
    const updatedReport = { ...report };
    
    if (!updatedReport.assessmentResults) {
      updatedReport.assessmentResults = { domains: {}, observations: {}, assessmentProceduresAndTools: { assessmentToolsUsed: [] } };
    }
    
    if (!updatedReport.assessmentResults.domains) {
      updatedReport.assessmentResults.domains = {};
    }
    
    return updatedReport;
  };
  
  const updatedReport = ensureLegacyStructure(report);
  
  if (!updatedReport.assessmentResults.domains[domain]) {
    updatedReport.assessmentResults.domains[domain] = {
      isConcern: false,
      topicSentence: '',
      strengths: [],
      needs: [],
      impactStatement: ''
    };
  }
  
  if (updates.isConcern !== undefined) {
    updatedReport.assessmentResults.domains[domain].isConcern = updates.isConcern;
  }
  
  if (updates.topicSentence) {
    updatedReport.assessmentResults.domains[domain].topicSentence = updates.topicSentence;
  }
  
  if (updates.strengths && updates.strengths.length > 0) {
    updatedReport.assessmentResults.domains[domain].strengths = [
      ...(updatedReport.assessmentResults.domains[domain].strengths || []),
      ...updates.strengths
    ];
  }
  
  if (updates.needs && updates.needs.length > 0) {
    updatedReport.assessmentResults.domains[domain].needs = [
      ...(updatedReport.assessmentResults.domains[domain].needs || []),
      ...updates.needs
    ];
  }
  
  if (updates.impactStatement) {
    updatedReport.assessmentResults.domains[domain].impactStatement = updates.impactStatement;
  }
  
  if (updates.isConcern !== undefined) {
    if (!updatedReport.conclusion) updatedReport.conclusion = { eligibility: { domains: {} } };
    if (!updatedReport.conclusion.eligibility) updatedReport.conclusion.eligibility = { domains: {} };
    if (!updatedReport.conclusion.eligibility.domains) updatedReport.conclusion.eligibility.domains = {};
    
    updatedReport.conclusion.eligibility.domains[domain] = updates.isConcern;
  }
  
  if (!updatedReport.metadata) updatedReport.metadata = { version: 1, lastUpdated: new Date().toISOString() };
  updatedReport.metadata.lastUpdated = new Date().toISOString();
  updatedReport.metadata.version = (updatedReport.metadata.version || 0) + 1;
  
  return updatedReport;
}