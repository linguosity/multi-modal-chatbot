// Define domain section structure
export interface DomainSection {
  isConcern: boolean;
  topicSentence: string;
  strengths: string[];
  needs: string[];
  impactStatement: string;
  lastUpdated?: string;
  assessmentTools?: string[]; // Domain-specific assessment tools list
}

// Define sections of the speech-language report
export interface ReportHeader {
  studentInformation: {
    firstName: string;
    lastName: string;
    DOB: string;
    reportDate: string;
    evaluationDate: string;
    parents: string[];
    homeLanguage: string;
  };
  reasonForReferral: string;
  confidentialityStatement: string;
}

export interface ReportBackground {
  studentDemographicsAndBackground: {
    educationalHistory: string;
  };
  healthReport: {
    medicalHistory: string;
    visionAndHearingScreening: string;
    medicationsAndAllergies: string;
  };
  earlyInterventionHistory: string;
  familyHistory: {
    familyStructure: string;
    languageAndCulturalBackground: string;
    socioeconomicFactors: string;
  };
  parentGuardianConcerns: string;
}

export interface ReportAssessmentResults {
  observations: {
    classroomObservations?: string;
    playBasedInformalObservations?: string;
    socialInteractionObservations?: string;
    [key: string]: string | undefined;
  };
  assessmentProceduresAndTools: {
    overviewOfAssessmentMethods: string;
    assessmentToolsUsed: string[]; // Store only the IDs of assessment tools
  };
  domains: {
    receptive: DomainSection;
    expressive: DomainSection;
    pragmatic: DomainSection;
    articulation: DomainSection;
    voice: DomainSection;
    fluency: DomainSection;
    [key: string]: DomainSection;
  };
}

export interface ReportConclusion {
  eligibility: {
    domains: {
      receptive: boolean;
      expressive: boolean;
      pragmatic: boolean;
      articulation: boolean;
      voice: boolean;
      fluency: boolean;
      [key: string]: boolean;
    };
    californiaEdCode: string;
  };
  conclusion: {
    summary: string;
  };
  recommendations: {
    services: {
      typeOfService: string;
      frequency: string;
      setting: string;
    };
    accommodations: string[];
    facilitationStrategies: string[];
  };
  parentFriendlyGlossary?: {
    terms: {
      [key: string]: string;
    };
  };
}

// The top-level report combining all sections
export interface SpeechLanguageReport {
  header: ReportHeader;
  background: ReportBackground;
  assessmentResults: ReportAssessmentResults;
  conclusion: ReportConclusion;
  metadata: {
    lastUpdated: string;
    version: number;
    createdBy?: string;
  };
}