import { FieldSchema, SectionSchema } from './structured-schemas'
import { StructuredFieldPathResolver } from './field-path-resolver'

const resolver = new StructuredFieldPathResolver()

export function coerceValueToSchema(value: any, fieldSchema: FieldSchema): any {
  const type = fieldSchema.type

  try {
    switch (type) {
      case 'number': {
        if (typeof value === 'number') return value
        if (typeof value === 'string') {
          const n = Number(value.replace(/[^0-9.+-]/g, ''))
          return isNaN(n) ? value : n
        }
        return value
      }
      case 'boolean':
      case 'checkbox': {
        if (typeof value === 'boolean') return value
        if (typeof value === 'number') return value !== 0
        if (typeof value === 'string') {
          const v = value.trim().toLowerCase()
          if (['true', 'yes', 'y'].includes(v)) return true
          if (['false', 'no', 'n'].includes(v)) return false
        }
        return value
      }
      case 'date': {
        // Keep as ISO-like string if parseable; otherwise leave unchanged
        if (value instanceof Date) return value.toISOString().slice(0, 10)
        if (typeof value === 'string') {
          const d = new Date(value)
          return isNaN(d.getTime()) ? value : d.toISOString().slice(0, 10)
        }
        return value
      }
      case 'array': {
        if (Array.isArray(value)) return value
        if (typeof value === 'string') {
          // Split on commas for convenience
          return value.split(',').map(v => v.trim()).filter(Boolean)
        }
        // Wrap single primitives as array
        return [value]
      }
      case 'select':
      case 'enum': {
        const raw = typeof value === 'string'
          ? value
          : (typeof value === 'number' || typeof value === 'boolean')
            ? String(value)
            : value
        if (typeof raw !== 'string') return raw
        const opts = fieldSchema.options
        if (!opts || opts.length === 0) return raw
        // Exact match wins.
        if (opts.includes(raw)) return raw
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
        const target = norm(raw)
        if (!target) return raw
        // Case- and punctuation-insensitive match (e.g. "questionnaire" ↔ "Questionnaire").
        const ci = opts.find(o => norm(o) === target)
        if (ci) return ci
        // Bidirectional substring (e.g. "Parent Q" ↔ "Parent/Caregiver Report",
        // "questionnaires" ↔ "Questionnaire"). Picks the shortest option that
        // matches, which biases toward the most specific allowed entry.
        const includes = opts
          .map(o => ({ o, n: norm(o) }))
          .filter(({ n }) => n.includes(target) || target.includes(n))
          .sort((a, b) => a.n.length - b.n.length)
        if (includes.length > 0) return includes[0].o
        return raw
      }
      case 'object':
        // Leave objects as-is; upstream merge strategy should handle shape
        return value
      case 'string':
      case 'paragraph':
      default:
        if (value == null) return value
        return typeof value === 'string' ? value : JSON.stringify(value)
    }
  } catch {
    return value
  }
}

export function validatePathAgainstSchema(sectionSchema: SectionSchema | undefined | null, fieldPath: string) {
  if (!sectionSchema) {
    return { isValid: true, fieldSchema: undefined as FieldSchema | undefined, errors: [] as string[] }
  }
  const result = resolver.validateFieldPathDetailed(fieldPath, sectionSchema)
  return { isValid: result.isValid, fieldSchema: result.fieldSchema || undefined, errors: result.errors }
}

