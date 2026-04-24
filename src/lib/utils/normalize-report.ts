// Normalizes report and section objects to consistent property names/shapes.
// - Ensures section.structured_data exists as an object
// - Maps section_type -> sectionType (camelCase)
// - Fixes accidental control/whitespace variants like "structured_data\n"
// - Moves structuredData -> structured_data if encountered
// Iterative and shallow; does not recurse deep into structured_data.

type AnyObject = Record<string, any>

function normalizeSection(section: AnyObject): AnyObject {
  if (!section || typeof section !== 'object') return section

  const out: AnyObject = { ...section }

  // First pass: fix keys that include control characters or stray whitespace
  for (const key of Object.keys(out)) {
    const fixed = key.replace(/[\r\n\t]/g, '').trim()
    if (fixed !== key) {
      if (out[fixed] === undefined) {
        out[fixed] = out[key]
      }
      try { delete out[key] } catch {}
    }
  }

  // Map section_type -> sectionType
  if (out.sectionType == null && out.section_type != null) {
    out.sectionType = out.section_type
    try { delete out.section_type } catch {}
  }

  // Prefer structured_data; move from structuredData if needed
  if (out.structured_data == null && out.structuredData != null) {
    out.structured_data = out.structuredData
    try { delete out.structuredData } catch {}
  }

  // Ensure structured_data exists and is an object
  if (out.structured_data == null || typeof out.structured_data !== 'object') {
    out.structured_data = {}
  }

  return out
}

export function normalizeReport(report: AnyObject | null | undefined): AnyObject | null {
  if (!report || typeof report !== 'object') return report ?? null

  const out: AnyObject = { ...report }

  // Normalize sections array
  if (Array.isArray(out.sections)) {
    out.sections = out.sections.map((s: AnyObject) => normalizeSection(s))
  }

  return out
}

export type { AnyObject as NormalizedAny }

