// Discriminated union types for tree nodes
export type GroupNode = {
  kind: 'group';
  id: string;
  title: string;
  sectionTypeIds: string[];
};

export type SectionNode = {
  kind: 'section';
  id: string;
  name: string;
  default_title: string;
  ai_directive?: string;
};

export type TreeItem = {
  id: string;
  name: string;
  children?: TreeItem[];
  data: GroupNode | SectionNode; // Never undefined
};

// Helper type for template creation options
export type TemplateCreationMode = 'default' | 'scratch';