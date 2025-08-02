
import { Database, Json } from './supabase';

export type Section = {
  id: string;
  report_id: string;
  sectionType: string;
  title: string;
  order: number;
  content: string | null;
  structured_data: Json | null;
  isCompleted?: boolean;
};

export type Report = Omit<Database['public']['Tables']['reports']['Row'], 'sections'> & {
  sections: Section[];
};
