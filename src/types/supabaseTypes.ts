import type { SpeechLanguageReport } from './reportSchemas'

export type SpeechLanguageReportRow = {
  id: string;
  user_id: string;
  report: SpeechLanguageReport;
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
      speech_language_reports: {
        Row: SpeechLanguageReportRow;
        Insert: {
          user_id: string;
          report: SpeechLanguageReport;
        };
        Update: Partial<{
          report: SpeechLanguageReport;
        }>;
      };
    };
  };
};