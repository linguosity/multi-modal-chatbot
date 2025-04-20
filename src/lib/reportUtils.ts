import { DomainSection, SpeechLanguageReport } from '@/types/reportTypes';

/**
 * Normalize input data from various sources (text, PDF, audio)
 * @param input - Input data in various formats
 */
export async function normalizeInput(input: any): Promise<string> {
  // Handle different input formats
  if (typeof input === 'string') {
    return input;
  } else if (input.text) {
    return input.text;
  } else if (input.pdfData) {
    // Return the base64 PDF data - Claude will process it with its document capability
    return input.pdfData;
  }
  return JSON.stringify(input);
}

/**
 * Create a default report skeleton that adheres to the SpeechLanguageReport schema
 * This function creates a fully compliant report with all required fields and default values
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
        parents: [], // Schema default is []
        homeLanguage: "English", // Schema default is "English", not empty string
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
      isLocked: false, // Required by schema with default false
      lockStatus: {}, // Required by schema
      markedDoneStatus: {}, // Required by schema
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
      lockStatus: {}, // Required by schema
      markedDoneStatus: {}, // Required by schema
    },
    // Moving domain data from assessmentResults to presentLevels
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
      lockStatus: {}, // Required by schema
      markedDoneStatus: {
        functioning: {}, // For domains
      },
    },
    assessmentResults: {
      observations: {
        classroomObservations: "",
        playBasedInformalObservations: "",
        socialInteractionObservations: "",
        synthesis: "",
        isLocked: false,
        lockStatus: {}, // For individual observation cards
      },
      assessmentProceduresAndTools: {
        overviewOfAssessmentMethods: "",
        assessmentIntegrityStatement: "",
        assessmentToolsUsed: [], // IDs of assessment tools
        synthesis: "",
        isLocked: false,
        lockStatus: {}, // For individual tool cards
      },
      synthesis: "",
      isLocked: false,
      lockStatus: {}, // Required by schema
      markedDoneStatus: {}, // Required by schema
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
        eligibilityState: "CA", // Schema default is "CA"
        eligibilityStatement: "", // From schema
        applicableEdCodeText: "", // From schema
        isPreschool: false, // From schema
        synthesis: "",
        isLocked: false,
        lockStatus: {}, // Optional for future sub-parts
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
      lockStatus: {}, // Required by schema
      markedDoneStatus: {}, // Required by schema
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      version: 1,
    },
    synthesis: "", // Overall report synthesis (optional)
  };
}

/**
 * Create a validated report that ensures all required fields are present
 * and defaults are applied according to the schema
 */
export function createValidatedReport(): SpeechLanguageReport {
  try {
    // Import the schema to validate
    const { SpeechLanguageReportSchema } = require('@/types/reportSchemas');
    
    // Create a skeleton report
    const skeleton = createReportSkeleton();
    
    // Validate and parse using Zod schema (applies defaults)
    const validatedReport = SpeechLanguageReportSchema.parse(skeleton);
    return validatedReport;
  } catch (error) {
    console.error("Failed to validate report schema:", error);
    // Fallback to skeleton if schema validation fails
    return createReportSkeleton();
  }
}

/**
 * Utility function to validate any report against the schema
 * Returns the validated report with defaults applied, or null if invalid
 */
export function validateReportShape(report: any): SpeechLanguageReport | null {
  try {
    if (!report) return null;
    
    // Import the schema to validate
    const { SpeechLanguageReportSchema } = require('@/types/reportSchemas');
    
    // Validate using Zod schema
    const validatedReport = SpeechLanguageReportSchema.parse(report);
    return validatedReport;
  } catch (error) {
    console.error("Invalid report structure:", error);
    return null;
  }
}

/**
 * Safe deep clone utility that preserves the proper report structure
 * This is a safer alternative to JSON.parse(JSON.stringify())
 */
export function safeCloneReport(report: SpeechLanguageReport): SpeechLanguageReport {
  if (!report) return createReportSkeleton();
  
  try {
    // Option 1: Use structuredClone if available (modern browsers)
    if (typeof structuredClone === 'function') {
      return structuredClone(report);
    }
    
    // Option 2: Use Zod to validate and parse (applies defaults to missing fields)
    const { SpeechLanguageReportSchema } = require('@/types/reportSchemas');
    return SpeechLanguageReportSchema.parse(report);
  } catch (error) {
    // Fallback to careful JSON methods if other approaches fail
    console.warn("Using JSON for cloning due to error:", error);
    return JSON.parse(JSON.stringify(report));
  }
}

/**
 * Deep merge utility function for properly merging nested objects and arrays
 */
export function deepMerge(target: any, source: any): any {
  // Handle edge cases
  if (!source || typeof source !== 'object') return source;
  if (!target || typeof target !== 'object') return { ...source };
  
  // Create a new object to avoid mutating the original
  const result = { ...target };
  
  Object.keys(source).forEach(key => {
    const targetValue = result[key];
    const sourceValue = source[key];
    
    // Handle arrays - prefer source arrays over target arrays
    if (Array.isArray(sourceValue)) {
      result[key] = [...sourceValue]; // Create a new array to prevent reference issues
    }
    // Recursively merge objects (but not arrays)
    else if (
      typeof sourceValue === 'object' && 
      sourceValue !== null && 
      typeof targetValue === 'object' && 
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    }
    // For primitives or new objects, use the source value
    else {
      result[key] = sourceValue;
    }
  });
  
  return result;
}

/**
 * Update a specific domain section with new data
 * Updated to use presentLevels.functioning structure per schema
 */
export function updateDomainSection(
  report: SpeechLanguageReport,
  domain: string,
  updates: Partial<DomainSection>
): SpeechLanguageReport {
  // Use safe clone instead of spread operator
  const updatedReport = safeCloneReport(report);
  
  // Ensure the path exists
  if (!updatedReport.presentLevels) {
    updatedReport.presentLevels = { functioning: {}, isLocked: false, lockStatus: {}, markedDoneStatus: { functioning: {} } };
  }
  
  if (!updatedReport.presentLevels.functioning) {
    updatedReport.presentLevels.functioning = {};
  }
  
  // Initialize domain if it doesn't exist
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
  
  // Update specific fields
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
  
  // Also update the eligibility status if this is an area of concern
  if (updates.isConcern !== undefined) {
    // Ensure the eligibility path exists
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
  
  // Update metadata
  if (!updatedReport.metadata) {
    updatedReport.metadata = { version: 1, lastUpdated: new Date().toISOString() };
  } else {
    updatedReport.metadata.lastUpdated = new Date().toISOString();
    updatedReport.metadata.version = (updatedReport.metadata.version || 0) + 1;
  }
  
  return updatedReport;
}

/**
 * DEPRECATED: This function uses the old structure (assessmentResults.domains)
 * Use updateDomainSection instead which uses presentLevels.functioning
 * This is kept for backward compatibility during migration
 */
export function updateDomainSectionLegacy(
  report: SpeechLanguageReport,
  domain: string,
  updates: Partial<DomainSection>
): SpeechLanguageReport {
  console.warn("DEPRECATED: Using legacy domain structure. Update to use presentLevels.functioning");
  
  // Helper function to ensure report has the legacy structure
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
  
  // Initialize domain if it doesn't exist
  if (!updatedReport.assessmentResults.domains[domain]) {
    updatedReport.assessmentResults.domains[domain] = {
      isConcern: false,
      topicSentence: '',
      strengths: [],
      needs: [],
      impactStatement: ''
    };
  }
  
  // Update specific fields
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
  
  // Also update the eligibility status if this is an area of concern
  if (updates.isConcern !== undefined) {
    if (!updatedReport.conclusion) updatedReport.conclusion = { eligibility: { domains: {} } };
    if (!updatedReport.conclusion.eligibility) updatedReport.conclusion.eligibility = { domains: {} };
    if (!updatedReport.conclusion.eligibility.domains) updatedReport.conclusion.eligibility.domains = {};
    
    updatedReport.conclusion.eligibility.domains[domain] = updates.isConcern;
  }
  
  // Update metadata
  if (!updatedReport.metadata) updatedReport.metadata = { version: 1, lastUpdated: new Date().toISOString() };
  updatedReport.metadata.lastUpdated = new Date().toISOString();
  updatedReport.metadata.version = (updatedReport.metadata.version || 0) + 1;
  
  return updatedReport;
}