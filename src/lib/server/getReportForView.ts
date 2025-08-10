import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database, Json } from '@/types/supabase';
import { hydrateSection } from '@/lib/render/hydrateSection';
import { hasCircularReference, safeLog, safeClone } from '@/lib/safe-logger';
import type { Report, Section } from '@/types/report-types';

// Helper function to extract clean data from infinitely nested structured_data
function extractCleanStructuredData(corruptedData: any): Record<string, any> {
  if (!corruptedData || typeof corruptedData !== 'object') {
    return {};
  }
  
  const cleanData: Record<string, any> = {};
  
  // Extract top-level properties that aren't 'structured_data'
  for (const [key, value] of Object.entries(corruptedData)) {
    if (key !== 'structured_data' && value !== null && value !== undefined && value !== '') {
      // Only include non-empty values and avoid nested objects that might be corrupted
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

  const { data: reportData, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    console.error("❌ Database error:", error);
    return null;
  }

  if (!reportData) {
    console.error("❌ Report not found for ID:", reportId);
    return null;
  }

  console.log('📊 Raw report data from database:', {
    id: reportData.id,
    title: reportData.title,
    sectionsCount: Array.isArray(reportData.sections) ? reportData.sections.length : 0,
    sections: Array.isArray(reportData.sections) ? reportData.sections.map((s: any) => ({
      id: s.id,
      title: s.title,
      contentLength: s.content?.length || 0,
      contentPreview: s.content?.substring(0, 100) + (s.content && s.content.length > 100 ? '...' : ''),
      hasStructuredData: !!s.structured_data && Object.keys(s.structured_data || {}).length > 0
    })) : []
  });

  // Prefer row-based sections from report_sections as source of truth
  let rowSections: Array<{ id: string; title: string; section_type?: string | null; structured_data: any }> = [];
  try {
    const { data: rsData, error: rsError } = await supabase
      .from('report_sections')
      .select('id, title, section_type, structured_data')
      .eq('report_id', reportId);
    if (rsError) {
      console.warn('⚠️ Unable to fetch report_sections, falling back to embedded sections:', rsError.message);
    } else if (rsData) {
      rowSections = rsData as any[];
    }
  } catch (e) {
    console.warn('⚠️ Exception fetching report_sections, falling back to embedded sections');
  }

  // Build a map for embedded sections (to source content/order when available)
  const embeddedSections: any[] = Array.isArray(reportData.sections) ? (reportData.sections as any[]) : [];
  const embeddedIndexById = new Map<string, number>();
  const embeddedById = new Map<string, any>();
  embeddedSections.forEach((s: any, idx: number) => {
    if (s && s.id) {
      embeddedIndexById.set(s.id, idx);
      embeddedById.set(s.id, s);
    }
  });

  // Transform to frontend types using report_sections as canonical when present
  let transformedSections: Section[] = [];
  if (rowSections.length > 0) {
    transformedSections = rowSections.map((row, i) => {
      const matchingEmbedded = embeddedById.get(row.id);
      const order = embeddedIndexById.has(row.id) ? (embeddedIndexById.get(row.id) || 0) : i;
      return {
        id: row.id,
        report_id: reportData.id,
        sectionType: (row.section_type as any) || matchingEmbedded?.sectionType || matchingEmbedded?.section_type,
        title: row.title || matchingEmbedded?.title || 'Untitled Section',
        order,
        content: matchingEmbedded?.content || '',
        structured_data: row.structured_data || matchingEmbedded?.structured_data,
        hydratedHtml: matchingEmbedded?.hydratedHtml,
        studentBio: matchingEmbedded?.studentBio,
        isCompleted: matchingEmbedded?.isCompleted || false,
        isRequired: matchingEmbedded?.isRequired || false,
        isGenerated: matchingEmbedded?.isGenerated || false,
      } as Section;
    });
    // Sort by derived order for stable display
    transformedSections.sort((a, b) => (a.order || 0) - (b.order || 0));
  } else {
    // Fallback to embedded sections when report_sections are unavailable
    transformedSections = embeddedSections.map((s: any, idx: number) => ({
      id: s.id,
      report_id: s.report_id || reportData.id,
      sectionType: s.sectionType || s.section_type,
      title: s.title,
      order: s.order ?? idx,
      content: s.content,
      structured_data: s.structured_data,
      hydratedHtml: s.hydratedHtml,
      studentBio: s.studentBio,
      isCompleted: s.isCompleted || false,
      isRequired: s.isRequired || false,
      isGenerated: s.isGenerated || false,
    }));
  }

  // Transform the database response to match our frontend types
  const report: Report = {
    ...reportData,
    sections: transformedSections,
  };

  if (error) {
    console.error("❌ Database error:", error);
    throw error;
  }

  console.log("✅ Raw report fetched from database");
  
  // Check for circular references in raw data
  if (hasCircularReference(report)) {
    console.warn("⚠️ Circular reference detected in raw database report - will be handled safely");
    safeLog("Raw report structure:", {
      id: report.id,
      title: report.title,
      sectionsCount: report.sections?.length
    });
  } else {
    console.log("✅ Raw database report has no circular references");
  }

  // Check individual sections from database
  if (report.sections && Array.isArray(report.sections)) {
    console.log("🔍 Checking raw sections for circular references...");
    let circularRefsFound = 0;
    report.sections.forEach((section: Section, index: number) => {
      if (hasCircularReference(section)) {
        console.warn(`⚠️ Raw section ${index} has circular references`);
        circularRefsFound++;
      }
      if (section.structured_data && hasCircularReference(section.structured_data)) {
        console.warn(`⚠️ Raw section ${index} structured_data has circular references`);
        circularRefsFound++;
      }
    });
    
    if (circularRefsFound > 0) {
      console.log(`🔧 Found ${circularRefsFound} sections with circular references - will be handled safely`);
    }

    report.sections.sort((a, b) => a.order - b.order);
  } else {
    console.log("No sections to check or sort");
    report.sections = []; // Ensure sections is always an array
  }

  console.log("🔍 About to hydrate sections...");

  try {
    // Hydrate each section's HTML using structured_data + metadata (server-side)
    const hydratedSections = await Promise.all((report.sections || []).map(async (s: Section, index: number) => {
      console.log(`🔍 Hydrating section ${index}: ${s.title}`);
      
      try {
        // Create a safe copy of structured_data to avoid modifying the original
        let safeStructuredData = {};
        if (s.structured_data) {
          try {
            // Try safeClone first
            safeStructuredData = safeClone(s.structured_data);
            
            // Check if the data got corrupted (has numeric keys suggesting array corruption)
            const keys = Object.keys(safeStructuredData);
            const hasNumericKeys = keys.some(key => /^\d+$/.test(key));
            const hasMoreThan100Keys = keys.length > 100;
            const hasNestedStructuredData = (safeStructuredData as any).structured_data !== undefined;
            
            if (hasNumericKeys && hasMoreThan100Keys) {
              console.warn(`⚠️ Section ${index} structured_data appears corrupted (${keys.length} numeric keys), attempting cleanup`);
              safeStructuredData = extractCleanStructuredData(s.structured_data);
            } else if (hasNestedStructuredData) {
              console.warn(`⚠️ Section ${index} has nested structured_data, attempting cleanup`);
              safeStructuredData = extractCleanStructuredData(s.structured_data);
            } else if (hasCircularReference(safeStructuredData)) {
              console.warn(`⚠️ Section ${index} still has circular references after cloning, attempting cleanup`);
              safeStructuredData = extractCleanStructuredData(s.structured_data);
            } else {
              console.log(`🔍 Section ${index} structured_data keys after clone:`, Object.keys(safeStructuredData));
            }
          } catch (cloneError) {
            console.warn(`⚠️ Section ${index} structured_data could not be cloned safely, using empty object`);
            safeStructuredData = {};
          }
        } else {
          console.log(`🔍 Section ${index} has no structured_data`);
        }
        
        const hydrationInput = {
          html: s.content || '',
          data: safeStructuredData,
          reportMeta: report.metadata as Record<string, any> | undefined,
        };
        
        console.log(`🔍 Section ${index} hydration input:`, {
          htmlLength: (s.content || '').length,
          htmlPreview: (s.content || '').substring(0, 100) + ((s.content || '').length > 100 ? '...' : ''),
          dataKeys: Object.keys(safeStructuredData),
          hasReportMeta: !!report.metadata
        });
        
        let hydratedHtml;
        try {
          // Check if this section has actual user content (not just template placeholders)
          const hasUserContent = s.content && s.content.trim() !== '' && 
            !s.content.includes('{first_name}') && // Not just template content
            !s.content.includes('[Student Name]') &&
            s.content !== `<p><em>No content available for ${s.title}</em></p>`;
          
          // For sections with structured data that have specific renderers, prefer structured rendering
          const hasStructuredRenderer = (
            (s.sectionType === 'assessment_results' && (safeStructuredData as any).assessment_items && Array.isArray((safeStructuredData as any).assessment_items)) ||
            (s.sectionType === 'assessment_tools' && (safeStructuredData as any).tools && Array.isArray((safeStructuredData as any).tools)) ||
            (s.sectionType === 'validity_statement' && Object.keys(safeStructuredData).length > 0) ||
            (s.sectionType === 'recommendations' && Object.keys(safeStructuredData).length > 0)
          );
          
          if (hasUserContent) {
            // User has typed actual content - use it directly with minimal hydration
            console.log(`🔍 Section ${index} has user content, using direct content with hydration`);
            hydratedHtml = hydrateSection(hydrationInput);
          } else if (hasStructuredRenderer) {
            console.log(`🔍 Section ${index} (${s.sectionType}) has structured data, using structured rendering`);
            const { renderStructuredData } = await import('@/lib/report-renderer');
            hydratedHtml = renderStructuredData(safeStructuredData, s.sectionType);
          } else if (Object.keys(safeStructuredData).length > 0) {
            // Has structured data but no specific renderer - create basic display
            console.log(`🔍 Section ${index} has structured data but no specific renderer, creating basic display`);
            hydratedHtml = createBasicStructuredDataDisplay(safeStructuredData, s.title);
          } else {
            // No user content and no structured data - try hydration anyway in case it's a template
            hydratedHtml = hydrateSection(hydrationInput);
          }
          
          // Final fallback if still empty
          if (!hydratedHtml || hydratedHtml.trim() === '') {
            hydratedHtml = s.content || `<p><em>No content available for ${s.title}</em></p>`;
          }
        } catch (hydrationError) {
          console.error(`❌ Error during hydrateSection for section ${index}:`, hydrationError);
          // Fallback to original content if hydration fails
          hydratedHtml = s.content || `<p><em>Error hydrating section: ${s.title}</em></p>`;
        }
        
        const hydratedSection = {
          ...s, // Keep all existing fields
          structured_data: safeStructuredData, // Use the safe copy
          hydratedHtml,
        };
        
        return hydratedSection;
      } catch (hydrationError) {
        console.error(`❌ Error hydrating section ${index}:`, hydrationError);
        return {
          ...s, // Keep all existing fields
          structured_data: {}, // Empty object as fallback
          hydratedHtml: s.content || `<p><em>Error during hydration of section: ${s.title}</em></p>`,
        };
      }
    }));

    const finalReport = { ...report, sections: hydratedSections };
    
    // Final check for circular references
    if (hasCircularReference(finalReport)) {
      console.warn("⚠️ Final report still has circular references - this may cause serialization issues");
      safeLog("Final report structure:", {
        id: finalReport.id,
        title: finalReport.title,
        sectionsCount: finalReport.sections?.length
      });
    } else {
      console.log("✅ Final report has no circular references");
    }

    return finalReport;
    
  } catch (error) {
    console.error("❌ Error during section hydration:", error);
    throw error;
  }
}
