export type Story = {
  id: string;
  user_id: string;
  student_id?: string;
  title: string;
  narrative_level: string;
  narrative: string;
  languages: string[];
  target_vocabulary: string[];
  pre_reading_activities?: string;
  vocabulary?: any[];
  comprehension_questions?: any[];
  images?: any[];
  student_age?: number;
  word_count?: number;
  status: 'draft' | 'generated' | 'published';
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      stories: {
        Row: Story;
        Insert: Omit<Story, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Story, 'id' | 'created_at' | 'updated_at'>>;
      };
      // Add other tables here as needed
    };
  };
};