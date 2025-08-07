import { renderDataPoints } from './renderDataPoints';
import { hasCircularReference } from '@/lib/safe-logger';

type Input = {
  html: string;
  data: Record<string, any>;
  reportMeta?: Record<string, any>;
};

const tokenMapFromMeta = (meta: any = {}) => ({
  '[Student Name]': meta?.studentBio?.firstName
    ? `${meta.studentBio.firstName} ${meta.studentBio.lastName ?? ''}`.trim()
    : '[Student Name]',
  '[Evaluation Date]': meta?.evaluationDate ?? '[Evaluation Date]',
  // add more global tokens as needed…
});

export function hydrateSection({ html, data, reportMeta }: Input) {
  console.log("🔍 hydrateSection: Starting hydration");
  console.log("🔍 Input HTML length:", html?.length || 0);
  console.log("🔍 Input data keys:", Object.keys(data || {}));
  
  // If no HTML content, return empty
  if (!html || html.trim() === '') {
    console.log("🔍 No HTML content to hydrate");
    return '';
  }
  
  // Check for circular references in inputs
  if (hasCircularReference(data)) {
    console.error("❌ Circular reference detected in section data");
    return html || '[Error: Circular reference in section data]';
  }
  
  if (hasCircularReference(reportMeta)) {
    console.error("❌ Circular reference detected in report metadata");
    return html || '[Error: Circular reference in report metadata]';
  }
  
  let out = html;

  // 1) Replace simple tokens like [Student Name]
  const tokens = tokenMapFromMeta(reportMeta);
  for (const [key, val] of Object.entries(tokens)) {
    out = out.replaceAll(key, String(val ?? key));
  }

  // 2) Replace curly brace placeholders like {first_name}, {last_name}, etc.
  out = out.replace(
    /\{([^}]+)\}/g,
    (_match, fieldName) => {
      let value = getPath(data, fieldName);
      
      // Handle special cases and provide fallbacks
      if (value === undefined || value === null || value === '') {
        // Try alternative field names or provide contextual defaults
        switch (fieldName) {
          case 'first_name':
            value = getPath(data, 'firstName') || getPath(reportMeta, 'studentBio.firstName') || '';
            break;
          case 'last_name':
            value = getPath(data, 'lastName') || getPath(reportMeta, 'studentBio.lastName') || '';
            break;
          case 'date_of_birth':
            value = getPath(data, 'dateOfBirth') || getPath(reportMeta, 'studentBio.dateOfBirth') || '';
            break;
          case 'student_id':
            value = getPath(data, 'studentId') || getPath(reportMeta, 'studentBio.studentId') || '';
            break;
          case 'primary_languages':
            value = getPath(data, 'primaryLanguages') || getPath(data, 'home_languages') || '';
            break;
          case 'report_date':
          case 'evaluation_dates':
            value = getPath(data, 'evaluation_dates') || getPath(data, 'report_date') || 
                   (reportMeta?.createdAt ? new Date(reportMeta.createdAt).toLocaleDateString() : '');
            break;
          case 'evaluator_name':
            value = getPath(data, 'evaluator_name') || getPath(reportMeta, 'evaluatorName') || '';
            break;
          case 'evaluator_credentials':
            value = getPath(data, 'evaluator_credentials') || getPath(reportMeta, 'evaluatorCredentials') || '';
            break;
          case 'school_name':
            value = getPath(data, 'school_name') || getPath(reportMeta, 'schoolName') || '';
            break;
          case 'eligibility_status':
            value = getPath(data, 'eligibility_status') || getPath(reportMeta, 'eligibilityStatus') || '';
            break;
        }
      }
      
      if (value !== undefined && value !== null && value !== '') {
        return escapeHtml(String(value));
      }
      
      // Return empty string for missing data instead of showing placeholder
      return '';
    }
  );

  // 3) Replace <span data-field="..."> with structured_data values
  //    (simple string replace—no DOM on the server)
  out = out.replace(
    /<span\s+data-field="([^"]+)"[^>]*>(.*?)<\/span>/g,
    (_m, field, fallback) => {
      const v = getPath(data, field); // e.g., "standardized_tests"
      return escapeHtml(String(v ?? fallback ?? ''));
    }
  );

  // 4) If your section uses DataPointSchema "points", render them
  if (Array.isArray(data?.points)) {
    console.log("🔍 hydrateSection: Rendering data points");
    
    // Check for circular references in points data
    if (hasCircularReference(data.points)) {
      console.error("❌ Circular reference detected in data points");
      out = out.replace('[[POINTS]]', '[Error: Circular reference in data points]');
    } else {
      try {
        const pointsHtml = renderDataPoints(data.points);
        out = out.replace('[[POINTS]]', pointsHtml); // token you place in templates
      } catch (error) {
        console.error("❌ Error rendering data points:", error);
        out = out.replace('[[POINTS]]', '[Error rendering data points]');
      }
    }
  }

  console.log("✅ hydrateSection: Hydration completed");
  console.log("🔍 Output HTML length:", out?.length || 0);
  console.log("🔍 Output preview:", out?.substring(0, 100) + (out?.length > 100 ? '...' : ''));
  return out;
}

// helpers
function getPath(obj: any, path: string) {
  return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
}
function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}