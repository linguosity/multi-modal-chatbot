import { renderDataPoints } from './renderDataPoints';
import { hasCircularReference } from '@/lib/safe-logger';

type Input = {
  html: string;
  data: Record<string, any>;
  reportMeta?: Record<string, any>;
};

const tokenMapFromMeta = (meta: any = {}) => {
  // Support both meta.studentBio and meta.metadata.studentBio shapes
  const bio = meta?.studentBio || meta?.metadata?.studentBio || {};
  const first = bio.firstName || '';
  const last = bio.lastName || '';
  const fullName = `${first} ${last}`.trim();

  return {
    '[Student Name]': fullName || '[Student Name]',
    '[Evaluation Date]': meta?.evaluationDate || meta?.createdAt
      ? new Date(meta?.evaluationDate || meta?.createdAt).toLocaleDateString()
      : '[Evaluation Date]',
    // add more global tokens as needed…
  };
};

function isPrimitive(v: any) {
  return (
    typeof v === 'string' ||
    typeof v === 'number' ||
    typeof v === 'boolean'
  );
}

function summarizeObject(obj: any): string {
  if (!obj || typeof obj !== 'object') return String(obj ?? '');
  // Prefer common display fields
  const name = obj.title || obj.tool_name || obj.name || obj.label;
  if (name) {
    const score = obj.standard_score ?? obj.score ?? undefined;
    return score !== undefined ? `${name} (${score})` : String(name);
  }
  // Shallow key: value for primitives
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (isPrimitive(v)) parts.push(`${k.replace(/_/g, ' ')}: ${v}`);
  }
  return parts.length ? parts.join(', ') : JSON.stringify(obj);
}

function formatValueForPlaceholder(value: any, fieldName?: string): string {
  // Booleans → Yes/No
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  // Nullish/empty
  if (value === undefined || value === null) return '';
  // Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    // Primitives: join
    if (value.every(isPrimitive)) return value.join(', ');
    // Objects: try to summarize
    // Special case: assessment items-like arrays
    if (
      fieldName && /assessment[_-]?items?/i.test(fieldName) &&
      value.every(v => typeof v === 'object')
    ) {
      return value
        .map((it: any) => summarizeObject(it))
        .join('; ');
    }
    return value.map(v => (typeof v === 'object' ? summarizeObject(v) : String(v))).join('; ');
  }
  // Objects
  if (typeof value === 'object') {
    return summarizeObject(value);
  }
  // Default to string
  return String(value);
}

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
      try {
        const kind = Array.isArray(value) ? 'array' : typeof value
        if (kind === 'array') {
          const sample = (value as any[]).slice(0,3).map((it) => (typeof it === 'object' ? (it?.title || (it as any)?.tool_name || (it as any)?.name || '[obj]') : String(it)))
          console.log(`🧩 hydrateSection: placeholder {${fieldName}} value=array sample=`, sample)
        } else {
          console.log(`🧩 hydrateSection: placeholder {${fieldName}} type=${kind}`)
        }
      } catch {}
      
      // Handle special cases and provide fallbacks
      if (value === undefined || value === null || value === '') {
        // Try alternative field names or provide contextual defaults
        switch (fieldName) {
          case 'student_name': {
            const first = getPath(data, 'first_name') || getPath(reportMeta, 'studentBio.firstName') || '';
            const last = getPath(data, 'last_name') || getPath(reportMeta, 'studentBio.lastName') || '';
            value = `${first} ${last}`.trim();
            break;
          }
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
            value = getPath(data, 'school_name') || getPath(data, 'schoolName') || getPath(reportMeta, 'schoolName') || '';
            break;
          case 'referral_source':
            value = getPath(data, 'referral_source') || getPath(data, 'referralSource') || getPath(data, 'referred_by') || getPath(data, 'referral_by') || '';
            break;
          case 'grade':
          case 'grade_level':
            value = getPath(data, 'grade') || getPath(data, 'grade_level') || '';
            break;
          case 'teacher_name':
            value = getPath(data, 'teacher_name') || getPath(data, 'teacherName') || getPath(data, 'referring_teacher') || '';
            break;
          case 'diagnosis':
            value = getPath(data, 'diagnosis') || getPath(data, 'diagnosis_codes') || getPath(data, 'eligibility_category') || '';
            break;
          case 'age':
          case 'chronological_age':
            value = getPath(data, 'age') || getPath(data, 'chronological_age') || '';
            break;
          case 'eligibility_status':
            value = getPath(data, 'eligibility_status') || getPath(reportMeta, 'eligibilityStatus') || '';
            break;
        }
      }

      if (value !== undefined && value !== null && value !== '') {
        const formatted = formatValueForPlaceholder(value, fieldName)
        try { console.log(`🧩 hydrateSection: formatted {${fieldName}} ->`, formatted.substring(0,120)) } catch {}
        return escapeHtml(formatted);
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
      return escapeHtml(formatValueForPlaceholder(v ?? fallback ?? ''));
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

  // 5) Clean up orphaned prepositions and connectors after placeholder replacement
  // When placeholders resolve to empty strings, they leave behind broken grammar
  out = out
    // Clean up orphaned connectors (prepositions, conjunctions, articles) when followed by punctuation or end of content
    .replace(/\s+(by|for|from|to|at|in|of|with|due to|regarding|because of|as per|according to)\s*(?=[.,;!?\s]|$)/gi, ' ')
    // Clean up double spaces
    .replace(/\s{2,}/g, ' ')
    // Clean up space before punctuation
    .replace(/\s+([.,;:!?])/g, '$1')
    // Clean up leading/trailing spaces in paragraphs
    .replace(/>\s+/g, '>')
    .replace(/\s+</g, '<');

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
