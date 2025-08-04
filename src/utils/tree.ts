import { TreeItem, GroupNode, SectionNode } from '@/types/tree-types';
import { z } from 'zod';
import { ReportTemplateSchema, ReportSectionGroupSchema } from '@/lib/schemas/report-template';

type ReportTemplate = z.infer<typeof ReportTemplateSchema>;
type ReportSectionGroup = z.infer<typeof ReportSectionGroupSchema>;

// Safe helper that never returns undefined
export function ensureSection(
  id: string,
  lookup: Record<string, SectionNode>
): SectionNode {
  const found = lookup[id];
  if (found) {
    return found;
  }
  
  // Create fallback section
  const fallback: SectionNode = {
    kind: 'section',
    id,
    name: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    default_title: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    ai_directive: 'Generate content for this section based on the provided context.'
  };
  
  return fallback;
}

// Convert template to tree structure safely
export function templateToTree(
  template: ReportTemplate,
  sectionLookup: Record<string, SectionNode>
): TreeItem[] {
  const treeItems = template.groups.map(group => {
    const groupNode: TreeItem = {
      id: group.id,
      name: group.title,
      data: { 
        kind: 'group', 
        id: group.id, 
        title: group.title, 
        sectionTypeIds: group.sectionTypeIds 
      } as GroupNode,
      children: group.sectionTypeIds.map(sectionId => {
        const section = ensureSection(sectionId, sectionLookup);
        return {
          id: section.id,
          name: section.default_title,
          data: section
        };
      })
    };
    
    return groupNode;
  });
  
  return treeItems;
}

// Type for API section data
interface ApiSection {
  id: string;
  name?: string;
  default_title?: string;
  ai_directive?: string;
}

// Create section lookup from API data
export function createSectionLookup(apiSections: ApiSection[]): Record<string, SectionNode> {
  const lookup: Record<string, SectionNode> = {};
  
  apiSections.forEach((section: ApiSection) => {
    const sectionNode: SectionNode = {
      kind: 'section',
      id: section.id,
      name: section.name || section.default_title || section.id,
      default_title: section.default_title || section.name || section.id,
      ai_directive: section.ai_directive
    };
    
    lookup[section.id] = sectionNode;
  });
  
  return lookup;
}

// Smart section finder for default template creation
export function findSectionByName(
  searchNames: string[],
  sectionLookup: Record<string, SectionNode>
): SectionNode | null {
  const sections = Object.values(sectionLookup);
  const found = sections.find(section => 
    searchNames.some(name => 
      section.name?.toLowerCase().includes(name.toLowerCase()) ||
      section.default_title?.toLowerCase().includes(name.toLowerCase())
    )
  );
  
  return found || null;
}