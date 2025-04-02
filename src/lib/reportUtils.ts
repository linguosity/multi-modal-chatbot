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
 * Create a default report skeleton if none exists
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
        homeLanguage: ""
      },
      reasonForReferral: "",
      confidentialityStatement: ""
    },
    background: {
      studentDemographicsAndBackground: {
        educationalHistory: ""
      },
      healthReport: {
        medicalHistory: "",
        visionAndHearingScreening: "",
        medicationsAndAllergies: ""
      },
      earlyInterventionHistory: "",
      familyHistory: {
        familyStructure: "",
        languageAndCulturalBackground: "",
        socioeconomicFactors: ""
      },
      parentGuardianConcerns: ""
    },
    assessmentResults: {
      observations: {
        classroomObservations: "",
        playBasedInformalObservations: "",
        socialInteractionObservations: ""
      },
      assessmentProceduresAndTools: {
        overviewOfAssessmentMethods: "",
        assessmentToolsUsed: [] // IDs of assessment tools
      },
      domains: {
        receptive: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: ""
        },
        expressive: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: ""
        },
        pragmatic: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: ""
        },
        articulation: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: ""
        },
        voice: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: ""
        },
        fluency: {
          isConcern: false,
          topicSentence: "",
          strengths: [],
          needs: [],
          impactStatement: ""
        }
      }
    },
    conclusion: {
      eligibility: {
        domains: {
          receptive: false,
          expressive: false,
          pragmatic: false,
          articulation: false,
          voice: false,
          fluency: false
        },
        californiaEdCode: ""
      },
      conclusion: {
        summary: ""
      },
      recommendations: {
        services: {
          typeOfService: "",
          frequency: "",
          setting: ""
        },
        accommodations: [],
        facilitationStrategies: []
      },
      parentFriendlyGlossary: {
        terms: {}
      }
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      version: 1
    }
  };
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
 */
export function updateDomainSection(
  report: SpeechLanguageReport,
  domain: string,
  updates: Partial<DomainSection>
): SpeechLanguageReport {
  const updatedReport = { ...report };
  
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
    updatedReport.conclusion.eligibility.domains[domain] = updates.isConcern;
  }
  
  // Update metadata
  updatedReport.metadata.lastUpdated = new Date().toISOString();
  updatedReport.metadata.version += 1;
  
  return updatedReport;
}