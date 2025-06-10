import type { AssessmentTool, AssessmentDomain } from './types';
import { formalAssessmentTools } from './formal-assessments';
import { informalAssessmentTools } from './informal-assessments';

/**
 * Get all assessment tools (formal and informal)
 */
export function getAllAssessmentTools(): Record<string, AssessmentTool> {
  return {
    ...formalAssessmentTools,
    ...informalAssessmentTools
  };
}

/**
 * Get an assessment tool by ID
 */
export function getAssessmentToolById(id: string): AssessmentTool | undefined {
  return getAllAssessmentTools()[id];
}

/**
 * Get assessment tools by domain
 */
export function getAssessmentToolsByDomain(domain: AssessmentDomain): AssessmentTool[] {
  return Object.values(getAllAssessmentTools())
    .filter(tool => tool.domains.includes(domain));
}

/**
 * Get assessment tools by type
 */
export function getAssessmentToolsByType(type: "quantitative" | "qualitative" | "mixed"): AssessmentTool[] {
  return Object.values(getAllAssessmentTools())
    .filter(tool => tool.type === type);
}

/**
 * Get formal assessment tools only
 */
export function getFormalAssessmentTools(): AssessmentTool[] {
  return Object.values(formalAssessmentTools);
}

/**
 * Get informal assessment tools only
 */
export function getInformalAssessmentTools(): AssessmentTool[] {
  return Object.values(informalAssessmentTools);
}

/**
 * Search assessment tools by name or description
 */
export function searchAssessmentTools(query: string): AssessmentTool[] {
  const searchTerm = query.toLowerCase();
  return Object.values(getAllAssessmentTools())
    .filter(tool => 
      tool.name.toLowerCase().includes(searchTerm) ||
      tool.description.toLowerCase().includes(searchTerm) ||
      tool.domains.some(domain => domain.toLowerCase().includes(searchTerm))
    );
}