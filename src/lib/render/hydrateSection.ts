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

  // 2) Replace <span data-field="..."> with structured_data values
  //    (simple string replace—no DOM on the server)
  out = out.replace(
    /<span\s+data-field="([^"]+)"[^>]*>(.*?)<\/span>/g,
    (_m, field, fallback) => {
      const v = getPath(data, field); // e.g., "standardized_tests"
      return escapeHtml(String(v ?? fallback ?? ''));
    }
  );

  // 3) If your section uses DataPointSchema "points", render them
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