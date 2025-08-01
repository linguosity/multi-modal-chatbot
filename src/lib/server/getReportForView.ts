import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database, Json } from '@/types/supabase';
import { hydrateSection } from '@/lib/render/hydrateSection';
import { hasCircularReference, safeLog, safeClone } from '@/lib/safe-logger';
import type { Report, Section } from '@/types/report-types';

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
  console.log("🔍 getReportForView: Starting fetch for report ID:", reportId);
  
  const supabase = await createSupabaseServerClient();

  const { data: reportData, error } = await supabase
    .from('reports')
    .select(`id, title, type, metadata, sections`)
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

  const report: Report = {
    ...reportData,
    sections: (reportData.sections as unknown as Section[]) || [],
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
    const hydratedSections = (report.sections || []).map((s: Section, index: number) => {
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
            
            if (hasNumericKeys && hasMoreThan100Keys) {
              console.warn(`⚠️ Section ${index} structured_data appears corrupted (${keys.length} numeric keys), using empty object`);
              safeStructuredData = {};
            } else if (hasCircularReference(safeStructuredData)) {
              console.warn(`⚠️ Section ${index} still has circular references after cloning, using empty object`);
              safeStructuredData = {};
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
          reportMeta: report.metadata ?? {},
        };
        
        console.log(`🔍 Section ${index} hydration input:`, {
          htmlLength: (s.content || '').length,
          dataKeys: Object.keys(safeStructuredData),
          hasReportMeta: !!report.metadata
        });
        
        let hydratedHtml;
        try {
          hydratedHtml = hydrateSection(hydrationInput);
          
          // If the hydrated HTML is empty but we have structured data, create a basic display
          if ((!hydratedHtml || hydratedHtml.trim() === '') && Object.keys(safeStructuredData).length > 0) {
            console.log(`🔍 Section ${index} has no content but has structured data, creating basic display`);
            hydratedHtml = createBasicStructuredDataDisplay(safeStructuredData, s.title);
          } else if (!hydratedHtml || hydratedHtml.trim() === '') {
            hydratedHtml = `<p><em>No content available for ${s.title}</em></p>`;
          }
        } catch (hydrationError) {
          console.error(`❌ Error during hydrateSection for section ${index}:`, hydrationError);
          // Fallback to original content if hydration fails
          hydratedHtml = s.content || `<p><em>Error hydrating section: ${s.title}</em></p>`;
        }
        
        const hydratedSection = {
          id: s.id,
          title: s.title,
          sectionType: s.section_type,
          order: s.order,
          content: s.content,
          structured_data: safeStructuredData, // Use the safe copy
          hydratedHtml
        };
        
        return hydratedSection;
      } catch (hydrationError) {
        console.error(`❌ Error hydrating section ${index}:`, hydrationError);
        return {
          id: s.id,
          title: s.title,
          sectionType: s.section_type,
          order: s.order,
          content: s.content,
          structured_data: {}, // Empty object as fallback
          hydratedHtml: s.content || `<p><em>Error during hydration of section: ${s.title}</em></p>`
        };
      }
    });

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