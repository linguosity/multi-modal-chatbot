import { renderDataPoints } from './renderDataPoints';

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

  // 3) If your section uses DataPointSchema “points”, render them
  if (Array.isArray(data?.points)) {
    const pointsHtml = renderDataPoints(data.points);
    out = out.replace('[[POINTS]]', pointsHtml); // token you place in templates
  }

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
