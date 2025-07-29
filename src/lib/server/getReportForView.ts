import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import { hydrateSection } from '@/lib/render/hydrateSection';

export async function getReportForView(reportId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: report, error } = await supabase
    .from('reports')
    .select(`id, title, type, metadata, sections`)
    .eq('id', reportId)
    .single();

  if (error) throw error;

  report.sections.sort((a, b) => a.order - b.order);

  // Hydrate each section’s HTML using structured_data + metadata (server-side)
  const hydratedSections = report.sections.map(s => ({
    ...s,
    hydratedHtml: hydrateSection({
      html: s.content,
      data: s.structured_data ?? {},
      reportMeta: report.metadata ?? {},
    })
  }));

  return { ...report, sections: hydratedSections };
}