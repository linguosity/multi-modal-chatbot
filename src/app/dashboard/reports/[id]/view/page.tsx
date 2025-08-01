// src/app/dashboard/reports/[id]/view/page.tsx
import { getReportForView } from '@/lib/server/getReportForView';
import ReportView from './ReportView';
import { safeLog, hasCircularReference } from '@/lib/safe-logger';

// Safe clone function that breaks circular references with depth limiting
function safeClone(obj: any, depth = 0, maxDepth = 10): any {
  // Prevent infinite recursion by limiting depth
  if (depth > maxDepth) {
    return '[Max Depth Reached]';
  }
  
  // Handle primitives
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Use try-catch to handle any issues with object access
  try {
    if (Array.isArray(obj)) {
      return obj.map(item => safeClone(item, depth + 1, maxDepth));
    }
    
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        try {
          result[key] = safeClone(obj[key], depth + 1, maxDepth);
        } catch (error) {
          result[key] = '[Error accessing property]';
        }
      }
    }
    
    return result;
  } catch (error) {
    return '[Error cloning object]';
  }
}

type Params = { id: string };

export default async function Page({
  params                      // 👈 promise
}: {
  params: Promise<Params>;    // 👈 note Promise
}) {
  const { id } = await params;          // 👈 await it
  
  console.log("🔍 Step 1: About to fetch report for ID:", id);
  
  try {
    const report = await getReportForView(id);
    
    // Handle case where report is null (database error, not found, etc.)
    if (!report) {
      console.error("❌ Report is null - likely database error or not found");
      return (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Report Not Found</h1>
          <p className="text-gray-600 mb-4">
            The requested report could not be found or there was a database connection issue.
          </p>
          <p className="text-sm text-gray-500">
            Report ID: {id}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      );
    }
    
    console.log("🔍 Step 2: Report fetched successfully");
    console.log("🔍 Step 3: Checking for circular references in report...");
    
    if (hasCircularReference(report)) {
      console.error("❌ CIRCULAR REFERENCE DETECTED in report object!");
      safeLog("Report structure:", {
        id: report.id,
        title: report.title,
        sectionsCount: report.sections?.length,
        hasMetadata: !!report.metadata
      });
    } else {
      console.log("✅ No circular references detected in main report object");
    }
    
    // Check individual sections for circular references
    if (report.sections) {
      report.sections.forEach((section: any, index: number) => {
        if (hasCircularReference(section)) {
          console.error(`❌ CIRCULAR REFERENCE DETECTED in section ${index} (${section.title})`);
        }
      });
    }
    
    console.log("🔍 Step 4: About to render ReportView component");
    
    // Debug: Log first section to see what data we have
    if (report.sections && report.sections.length > 0) {
      const firstSection = report.sections[0];
      console.log("🔍 Debug - First section data:");
      console.log("  - Title:", firstSection.title);
      console.log("  - Content length:", firstSection.content?.length || 0);
      console.log("  - HydratedHtml length:", firstSection.hydratedHtml?.length || 0);
      const structuredDataKeys = Object.keys(firstSection.structured_data || {});
      console.log("  - Structured data keys count:", structuredDataKeys.length);
      if (structuredDataKeys.length < 20) {
        console.log("  - Structured data keys:", structuredDataKeys);
      } else {
        console.log("  - Structured data keys (first 10):", structuredDataKeys.slice(0, 10));
      }
      console.log("  - HydratedHtml preview:", firstSection.hydratedHtml?.substring(0, 200) + "...");
    }
    
    // Create a safe, minimal report object to pass as props
    // structured_data should now be safe after fixing the hydration process
    const safeSections = report.sections?.map((section: any, index: number) => ({
      id: section.id,
      title: section.title,
      sectionType: section.sectionType,
      hydratedHtml: section.hydratedHtml,
      // structured_data should now be clean from the server
      structured_data: section.structured_data || {},
      index: index
    })) || [];
    
    const safeReport = {
      id: report.id,
      title: report.title,
      type: report.type,
      sectionsCount: report.sections?.length || 0,
      metadata: report.metadata,
      sections: safeSections,
    };
    
    console.log("🔍 Debug - Report metadata:", report.metadata);
    console.log("🔍 Debug - Total sections:", safeSections.length);
    
    return <ReportView report={safeReport} />;
    
  } catch (error) {
    console.error("❌ Error in report view page:", error);
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Report</h1>
        <p className="text-gray-600">
          Failed to load report. Check console for details.
        </p>
      </div>
    );
  }
}