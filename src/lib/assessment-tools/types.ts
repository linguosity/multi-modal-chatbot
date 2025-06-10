/**
 * Assessment Tool Types and Interfaces
 */

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

export type AssessmentToolsCollection = Record<string, AssessmentTool>;
export type AssessmentDomain = "receptive" | "expressive" | "pragmatic" | "articulation" | "voice" | "fluency";