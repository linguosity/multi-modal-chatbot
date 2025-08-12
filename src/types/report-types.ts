
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
  hydratedHtml?: string;
  // Ephemeral provenance for debugging; not persisted
  renderSource?: 'server_prehydration' | 'client_hydration' | 'structured_renderer' | 'raw';
  studentBio?: StudentBio;
  isCompleted?: boolean;
  isRequired?: boolean;
  isGenerated?: boolean;
};

export type Report = Omit<Database['public']['Tables']['reports']['Row'], 'sections'> & {
  sections: Section[];
};
