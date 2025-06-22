import { supabase } from './client';
import type { SpeechLanguageReport } from '@/types/reportSchemas';

/**
 * Save a speech language report to Supabase. If a report ID is provided
 * it updates the existing row, otherwise it simply resolves without action.
 * Creation of new reports should include a user ID which is not handled here.
 */
export async function saveReport(report: SpeechLanguageReport, reportId?: string) {
  if (!reportId) return;
  const { error } = await supabase
    .from('speech_language_reports')
    .update({ report, updated_at: new Date().toISOString() })
    .eq('id', reportId);
  if (error) {
    throw new Error(error.message);
  }
}
