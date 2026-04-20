import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database, Json } from '@/types/supabase';
import { hydrateSection } from '@/lib/render/hydrateSection';
import { hasCircularReference, safeClone } from '@/lib/safe-logger';
import { buildReidentifier } from '@/lib/pii/reidentify';
import type { Report, Section } from '@/types/report-types';

// Helper function to extract clean data from infinitely nested structured_data
function extractCleanStructuredData(corruptedData: any): Record<string, any> {
  if (!corruptedData || typeof corruptedData !== 'object') {
    return {};
  }

  const cleanData: Record<string, any> = {};

  for (const [key, value] of Object.entries(corruptedData)) {
    if (key !== 'structured_data' && value !== null && value !== undefined && value !== '') {
      if (typeof value !== 'object' || Array.isArray(value)) {
        cleanData[key] = value;
      }
    }
  }

  return cleanData;
}

// Helper function to create a basic HTML display from structured data
function createBasicStructuredDataDisplay(data: Record<string, any>, sectionTitle: string): string {
  const entries = Object.entries(data).filter(([key, value]) =>
    value !== null && value !== undefined && value !== ''
  );

  if (entries.length === 0) {
    return `<p><em>No data available for ${sectionTitle}</em></p>`;
  }

  let html = '<div class="structured-data-display">';

  for (const [key, value] of entries) {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    let displayValue = '';

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        displayValue = value.length > 0 ? value.join(', ') : 'None specified';
      } else {
        displayValue = JSON.stringify(value, null, 2);
      }
    } else {
      displayValue = String(value);
    }

    html += `<p><strong>${label}:</strong> ${displayValue}</p>`;
  }

  html += '</div>';
  return html;
}

export async function getReportForView(reportId: string): Promise<Report | null> {
  console.log('🔍 getReportForView called for reportId:', reportId);

  const supabase = await createSupabaseServerClient();

  // Fetch report metadata (no sections column exists)
  const { data: reportData, error: reportError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (reportError || !reportData) {
    console.error("❌ Database error or report not found:", reportError);
    return null;
  }

  // Fetch sections from report_sections — sole source of truth
  const { data: sectionRows, error: sectionsError } = await supabase
    .from('report_sections')
    .select('*')
    .eq('report_id', reportId)
    .order('order', { ascending: true });

  if (sectionsError) {
    console.error("❌ Error fetching report_sections:", sectionsError);
  }

  // Transform DB rows to frontend Section type
  const sectionsRaw: Section[] = (sectionRows || []).map((row) => ({
    id: row.id,
    report_id: row.report_id,
    sectionType: row.section_type,
    title: row.title,
    order: row.order,
    content: row.content,
    structured_data: row.structured_data,
    extraction_confidence: row.extraction_confidence,
    source_refs: row.source_refs,
    change_tracking: row.change_tracking,
    isCompleted: row.is_completed,
    isRequired: row.is_required,
    isGenerated: row.is_generated,
  }));

  // ── PII re-identification (design review §10) ───────────────────────────
  // Tokens live in the DB after Claude wrote them back; swap to real values
  // before the view renders. Noop if no mappings / table missing.
  const reidentifier = await buildReidentifier(supabase, reportId);
  const sections: Section[] = reidentifier.size() > 0
    ? sectionsRaw.map((s) => ({
        ...s,
        content: typeof s.content === 'string' ? reidentifier.reidentifyString(s.content) : s.content,
        structured_data: reidentifier.reidentifyDeep(s.structured_data as Json) as Section['structured_data'],
      }))
    : sectionsRaw;
  const reidentifiedMetadata = reidentifier.size() > 0 && reportData.metadata
    ? reidentifier.reidentifyDeep(reportData.metadata as Json)
    : reportData.metadata;

  console.log(`📊 Report ${reportData.id}: ${sections.length} sections from report_sections (re-identified: ${reidentifier.size()} tokens)`);

  // Combine into Report object
  const report: Report = {
    ...reportData,
    metadata: reidentifiedMetadata,
    sections,
  };

  // Hydrate each section's HTML using structured_data + metadata (server-side)
  try {
    const hydratedSections = await Promise.all(sections.map(async (s: Section, index: number) => {
      try {
        // Create a safe copy of structured_data
        let safeStructuredData: Record<string, any> = {};
        if (s.structured_data) {
          try {
            safeStructuredData = safeClone(s.structured_data) as Record<string, any>;

            const keys = Object.keys(safeStructuredData);
            const hasNumericKeys = keys.some(key => /^\d+$/.test(key));
            const hasMoreThan100Keys = keys.length > 100;
            const hasNestedStructuredData = (safeStructuredData as any).structured_data !== undefined;

            if ((hasNumericKeys && hasMoreThan100Keys) || hasNestedStructuredData) {
              console.warn(`⚠️ Section ${index} structured_data appears corrupted, cleaning`);
              safeStructuredData = extractCleanStructuredData(s.structured_data);
            } else if (hasCircularReference(safeStructuredData)) {
              console.warn(`⚠️ Section ${index} circular refs in structured_data, cleaning`);
              safeStructuredData = extractCleanStructuredData(s.structured_data);
            }
          } catch {
            safeStructuredData = {};
          }
        }

        const hydrationInput = {
          html: s.content || '',
          data: safeStructuredData,
          reportMeta: reportData.metadata as Record<string, any> | undefined,
        };

        let hydratedHtml: string | undefined;
        let renderSource: 'server_prehydration' | 'client_hydration' | 'structured_renderer' | 'raw' = 'raw';

        const normalizeType = (t?: string | null, title?: string) => {
          const tnorm = (t || '').toString().trim().toLowerCase();
          if (tnorm) return tnorm;
          const name = (title || '').toString().trim().toLowerCase();
          switch (name) {
            case 'assessment results': return 'assessment_results';
            case 'assessment tools': return 'assessment_tools';
            case 'validity statement': return 'validity_statement';
            case 'recommendations': return 'recommendations';
            case 'student information': return 'student_information';
            case 'eligibility checklist': return 'eligibility_checklist';
            default: return tnorm;
          }
        };
        const effectiveType = normalizeType(s.sectionType, s.title);

        try {
          const hasUserContent = s.content && s.content.trim() !== '' &&
            !s.content.includes('{first_name}') &&
            !s.content.includes('[Student Name]') &&
            s.content !== `<p><em>No content available for ${s.title}</em></p>`;

          const hasStructuredRenderer = (
            (effectiveType === 'assessment_results' && (safeStructuredData as any).assessment_items && Array.isArray((safeStructuredData as any).assessment_items)) ||
            (effectiveType === 'assessment_tools' && (safeStructuredData as any).tools && Array.isArray((safeStructuredData as any).tools)) ||
            (effectiveType === 'validity_statement' && Object.keys(safeStructuredData).length > 0) ||
            (effectiveType === 'recommendations' && Object.keys(safeStructuredData).length > 0)
          );

          if (hasStructuredRenderer) {
            const { renderStructuredData } = await import('@/lib/report-renderer');
            hydratedHtml = renderStructuredData(safeStructuredData, effectiveType, { report });
            renderSource = 'structured_renderer';
          } else if (hasUserContent) {
            hydratedHtml = hydrateSection(hydrationInput);
            renderSource = 'server_prehydration';
          } else if (Object.keys(safeStructuredData).length > 0) {
            hydratedHtml = createBasicStructuredDataDisplay(safeStructuredData, s.title);
            renderSource = 'structured_renderer';
          } else {
            hydratedHtml = hydrateSection(hydrationInput);
            renderSource = 'server_prehydration';
          }

          if (!hydratedHtml || hydratedHtml.trim() === '') {
            hydratedHtml = s.content || `<p><em>No content available for ${s.title}</em></p>`;
            renderSource = 'raw';
          }
        } catch (hydrationError) {
          console.error(`❌ Error hydrating section ${index}:`, hydrationError);
          hydratedHtml = s.content || `<p><em>Error hydrating section: ${s.title}</em></p>`;
          renderSource = 'raw';
        }

        return {
          ...s,
          structured_data: safeStructuredData,
          hydratedHtml,
          renderSource,
        };
      } catch (err) {
        console.error(`❌ Error processing section ${index}:`, err);
        return {
          ...s,
          structured_data: {},
          hydratedHtml: s.content || `<p><em>Error during hydration of section: ${s.title}</em></p>`,
          renderSource: 'raw' as const,
        };
      }
    }));

    return { ...report, sections: hydratedSections };
  } catch (error) {
    console.error("❌ Error during section hydration:", error);
    throw error;
  }
}
