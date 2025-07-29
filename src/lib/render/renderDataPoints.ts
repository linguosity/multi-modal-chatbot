// lib/render/renderDataPoints.ts
// Supports: string OR { heading?: string, points: DataPoint[] }
export function renderDataPoints(points: any[]): string {
  return `<ul>${points.map(renderNode).join('')}</ul>`;
}
function renderNode(node: any): string {
  if (typeof node === 'string') return `<li>${escape(node)}</li>`;
  const head = node.heading ? `<strong>${escape(node.heading)}</strong>` : '';
  const prose = node.prose_template ? `<div>${escape(node.prose_template)}</div>` : '';
  const kids = node.points?.length ? `<ul>${node.points.map(renderNode).join('')}</ul>` : '';
  return `<li>${head}${prose}${kids}</li>`;
}
function escape(s: string) {
  return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!));
}
