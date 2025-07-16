import { TreeItem, GroupNode, SectionNode } from '@/types/tree-types';
import { ReportTemplate } from '@/lib/schemas/report-template';

// Safe helper that never returns undefined
export function ensureSection(
  id: string,
  lookup: Record<string, SectionNode>
): SectionNode {
  console.log(`🔍 ensureSection: Looking up section ID "${id}"`);
  
  const found = lookup[id];
  if (found) {
    console.log(`✅ ensureSection: Found section "${found.default_title}"`);
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
  
  console.log(`⚠️ ensureSection: Created fallback section "${fallback.default_title}" for ID "${id}"`);
  return fallback;
}

// Convert template to tree structure safely
export function templateToTree(
  template: ReportTemplate,
  sectionLookup: Record<string, SectionNode>
): TreeItem[] {
  console.log('🌳 templateToTree: Converting template to tree structure');
  console.log('📋 Template groups:', template.groups.length);
  console.log('🔍 Available sections in lookup:', Object.keys(sectionLookup).length);
  
  const treeItems = template.groups.map(group => {
    console.log(`📁 Processing group: "${group.title}" with ${group.sectionTypeIds.length} sections`);
    
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
    
    console.log(`✅ Created group "${group.title}" with ${groupNode.children?.length} children`);
    return groupNode;
  });
  
  console.log('🎯 templateToTree: Conversion complete, created', treeItems.length, 'groups');
  return treeItems;
}

// Create section lookup from API data
export function createSectionLookup(apiSections: unknown[]): Record<string, SectionNode> {
  console.log('🗂️ createSectionLookup: Processing', apiSections.length, 'sections from API');
  
  const lookup: Record<string, SectionNode> = {};
  
  apiSections.forEach(section => {
    const sectionNode: SectionNode = {
      kind: 'section',
      id: section.id,
      name: section.name || section.default_title,
      default_title: section.default_title || section.name,
      ai_directive: section.ai_directive
    };
    
    lookup[section.id] = sectionNode;
    console.log(`📝 Added section "${sectionNode.default_title}" with ID "${section.id}"`);
  });
  
  console.log('✅ createSectionLookup: Created lookup with', Object.keys(lookup).length, 'sections');
  return lookup;
}

// Smart section finder for default template creation
export function findSectionByName(
  searchNames: string[],
  sectionLookup: Record<string, SectionNode>
): SectionNode | null {
  console.log(`🔎 findSectionByName: Searching for [${searchNames.join(', ')}]`);
  
  const sections = Object.values(sectionLookup);
  const found = sections.find(section => 
    searchNames.some(name => 
      section.name?.toLowerCase().includes(name.toLowerCase()) ||
      section.default_title?.toLowerCase().includes(name.toLowerCase())
    )
  );
  
  if (found) {
    console.log(`✅ findSectionByName: Found "${found.default_title}" for search [${searchNames.join(', ')}]`);
  } else {
    console.log(`❌ findSectionByName: No match found for [${searchNames.join(', ')}]`);
  }
  
  return found || null;
}