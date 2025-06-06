/**
 * Assessment Tools Module
 * Modularized assessment tools collection with improved organization
 */

// Types
export type { AssessmentTool, AssessmentToolsCollection, AssessmentDomain } from './types';

// Formal assessments
export { formalAssessmentTools } from './formal-assessments';

// Informal assessments  
export { informalAssessmentTools } from './informal-assessments';

// Utility functions
export {
  getAllAssessmentTools,
  getAssessmentToolById,
  getAssessmentToolsByDomain,
  getAssessmentToolsByType,
  getFormalAssessmentTools,
  getInformalAssessmentTools,
  searchAssessmentTools
} from './utils';

// Legacy interface compatibility (for gradual migration)
export interface AssessmentTool {
  id: string;
  name: string;
  year: string;
  authors: string[];
  targetPopulation: string;
  targetAgeRange: string;
  type: "quantitative" | "qualitative" | "mixed";
  domains: string[];
  description: string;
  subtests?: {
    name: string;
    description: string;
    domain?: string;
    scores?: {
      raw?: number;
      scaled?: number;
      standardScore?: number;
      percentile?: number;
      ageEquivalent?: string;
      interpretation?: string;
    }[];
  }[];
  results?: {
    summary: string;
    scores?: any;
  };
  caveats?: string[];
  references?: string[];
}