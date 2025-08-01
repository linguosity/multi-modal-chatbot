// lib/render/renderDataPoints.ts
// Supports: string OR { heading?: string, points: DataPoint[] }

// Track visited objects to prevent infinite recursion
const visitedObjects = new WeakSet();

export function renderDataPoints(points: any[]): string {
  // Clear visited objects for each top-level call
  visitedObjects.clear();
  return `<ul>${points.map(node => renderNode(node, 0)).join('')}</ul>`;
}

function renderNode(node: any, depth: number = 0): string {
  // Prevent infinite recursion by limiting depth
  if (depth > 10) {
    console.warn('Maximum recursion depth reached in renderDataPoints');
    return '<li>[Maximum depth reached]</li>';
  }
  
  if (typeof node === 'string') return `<li>${escape(node)}</li>`;
  
  // Check for circular references
  if (visitedObjects.has(node)) {
    console.warn('Circular reference detected in renderDataPoints');
    return '<li>[Circular reference detected]</li>';
  }
  
  // Mark this object as visited
  visitedObjects.add(node);
  
  try {
    const head = node.heading ? `<strong>${escape(node.heading)}</strong>` : '';
    const prose = node.prose_template ? `<div>${escape(node.prose_template)}</div>` : '';
    const kids = node.points?.length ? `<ul>${node.points.map((child: any) => renderNode(child, depth + 1)).join('')}</ul>` : '';
    return `<li>${head}${prose}${kids}</li>`;
  } finally {
    // Remove from visited set after processing
    visitedObjects.delete(node);
  }
}

function escape(s: string) {
  return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]!));
}
