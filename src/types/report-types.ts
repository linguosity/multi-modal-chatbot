
import { Database, Json } from './supabase';
import { StudentBio } from '@/lib/schemas/report';

export type Section = {
  id: string;
  report_id: string;
  sectionType: string;
  title: string;
  order: number;
  content: string | null;
  structured_data: Json | null;
  // New fields from clean schema
  extraction_confidence?: Json | null;
  source_refs?: Json | null;
  change_tracking?: Json | null;
  // Ephemeral fields (not persisted, computed during hydration)
  hydratedHtml?: string;
  renderSource?: 'server_prehydration' | 'client_hydration' | 'structured_renderer' | 'raw';
  studentBio?: StudentBio;
  isCompleted?: boolean;
  isRequired?: boolean;
  isGenerated?: boolean;
};

// Report metadata from the reports table + sections fetched separately from report_sections
export type Report = Database['public']['Tables']['reports']['Row'] & {
  sections: Section[];
};
