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
        if (typeof value === 'string') return value
        if (typeof value === 'number' || typeof value === 'boolean') return String(value)
        return value
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

