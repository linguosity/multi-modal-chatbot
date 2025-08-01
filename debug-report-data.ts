// Quick debug script to check what's in the database
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function debugReportData() {
  const supabase = await createSupabaseServerClient();
  
  // Get the report that's causing issues
  const reportId = '15ae0f1d-0976-42ce-8076-52295277e443';
  
  const { data: reportData, error } = await supabase
    .from('reports')
    .select(`id, title, type, metadata, sections`)
    .eq('id', reportId)
    .single();

  if (error) {
    console.error("Database error:", error);
    return;
  }

  console.log("Report data:");
  console.log("- ID:", reportData.id);
  console.log("- Title:", reportData.title);
  console.log("- Type:", reportData.type);
  console.log("- Metadata keys:", Object.keys(reportData.metadata || {}));
  console.log("- Sections count:", (reportData.sections as any[])?.length || 0);
  
  if (reportData.sections && Array.isArray(reportData.sections)) {
    (reportData.sections as any[]).forEach((section, index) => {
      console.log(`\nSection ${index}:`);
      console.log("- ID:", section.id);
      console.log("- Title:", section.title);
      console.log("- Type:", section.section_type);
      console.log("- Content length:", section.content?.length || 0);
      console.log("- Content preview:", section.content?.substring(0, 100) + "...");
      console.log("- Structured data keys:", Object.keys(section.structured_data || {}));
      console.log("- Structured data preview:", JSON.stringify(section.structured_data, null, 2).substring(0, 200) + "...");
    });
  }
}

debugReportData().catch(console.error);