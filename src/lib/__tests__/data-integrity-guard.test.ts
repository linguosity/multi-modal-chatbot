import { DataIntegrityGuard, validateAndCleanFieldUpdate, type FieldUpdate } from '../data-integrity-guard'

describe('DataIntegrityGuard', () => {
  let guard: DataIntegrityGuard

  beforeEach(() => {
    guard = new DataIntegrityGuard()
  })

  describe('validateFieldPath', () => {
    test('should reject null or undefined field paths', () => {
      expect(guard.validateFieldPath(null as any)).toEqual({
        isValid: false,
        error: 'Field path cannot be null, undefined, or empty',
        code: 'INVALID_FIELD_PATH'
      })

      expect(guard.validateFieldPath(undefined as any)).toEqual({
        isValid: false,
        error: 'Field path cannot be null, undefined, or empty',
        code: 'INVALID_FIELD_PATH'
      })
    })

    test('should reject empty field paths', () => {
      expect(guard.validateFieldPath('')).toEqual({
        isValid: false,
        error: 'Field path cannot be null, undefined, or empty',
        code: 'INVALID_FIELD_PATH'
      })

      expect(guard.validateFieldPath('   ')).toEqual({
        isValid: false,
        error: 'Field path "   " is forbidden. Cannot nest structured_data inside itself.',
        code: 'FORBIDDEN_FIELD_PATH',
        suggestion: 'Use specific field paths like "assessment_results.test_scores.wisc_v.verbal_iq"'
      })
    })

    test('should reject structured_data field paths', () => {
      const testCases = [
        'structured_data',
        'structured_data.test',
        'structured_data.nested.field'
      ]

      testCases.forEach(fieldPath => {
        const result = guard.validateFieldPath(fieldPath)
        expect(result.isValid).toBe(false)
        expect(result.code).toBe('FORBIDDEN_FIELD_PATH')
        expect(result.error).toContain('Cannot nest structured_data inside itself')
      })
    })

    test('should accept valid field paths', () => {
      const validPaths = [
        'assessment_results.wisc_scores.verbal_iq',
        'student_info.age',
        'recommendations.service_frequency',
        'test_scores.0.score',
        'background.medical_history'
      ]

      validPaths.forEach(path => {
        expect(guard.validateFieldPath(path)).toEqual({ isValid: true })
      })
    })

    test('should reject malformed field paths', () => {
      const result = guard.validateFieldPath('field..empty.segment')
      expect(result.isValid).toBe(false)
      expect(result.code).toBe('MALFORMED_FIELD_PATH')
    })
  })

  describe('validateUpdate', () => {
    test('should validate complete field updates', () => {
      const validUpdate: FieldUpdate = {
        section_id: '123e4567-e89b-12d3-a456-426614174000',
        field_path: 'assessment_results.test_score',
        value: 85,
        merge_strategy: 'replace',
        confidence: 0.9
      }

      expect(guard.validateUpdate(validUpdate)).toEqual({ isValid: true })
    })

    test('should reject invalid section IDs', () => {
      const invalidUpdate: FieldUpdate = {
        section_id: 'invalid-uuid',
        field_path: 'test.field',
        value: 'test',
        merge_strategy: 'replace'
      }

      const result = guard.validateUpdate(invalidUpdate)
      expect(result.isValid).toBe(false)
      expect(result.code).toBe('INVALID_SECTION_ID')
    })

    test('should reject invalid merge strategies', () => {
      const invalidUpdate: FieldUpdate = {
        section_id: '123e4567-e89b-12d3-a456-426614174000',
        field_path: 'test.field',
        value: 'test',
        merge_strategy: 'invalid' as any
      }

      const result = guard.validateUpdate(invalidUpdate)
      expect(result.isValid).toBe(false)
      expect(result.code).toBe('INVALID_MERGE_STRATEGY')
    })

    test('should reject invalid confidence scores', () => {
      const invalidUpdate: FieldUpdate = {
        section_id: '123e4567-e89b-12d3-a456-426614174000',
        field_path: 'test.field',
        value: 'test',
        merge_strategy: 'replace',
        confidence: 1.5
      }

      const result = guard.validateUpdate(invalidUpdate)
      expect(result.isValid).toBe(false)
      expect(result.code).toBe('INVALID_CONFIDENCE_SCORE')
    })
  })

  describe('cleanCorruptedData', () => {
    test('should detect and clean Russian-doll patterns', () => {
      const corruptedData = {
        age: "41",
        grade: "TK",
        structured_data: {
          age: "",
          grade: "",
          structured_data: {
            age: ""
          }
        }
      }

      const result = guard.cleanCorruptedData(corruptedData)
      
      expect(result.wasCorrupted).toBe(true)
      expect(result.issuesFound).toContain('Russian-doll structured_data nesting detected')
      expect(result.cleanedData).not.toHaveProperty('structured_data')
      expect(result.cleanedData.age).toBe("41")
      expect(result.cleanedData.grade).toBe("TK")
      expect(result.cleanupActions).toContain('Removed nested structured_data keys')
    })

    test('should detect excessive numeric keys', () => {
      const corruptedData: any = {
        validField: 'test'
      }
      
      // Add 150 numeric keys to simulate corruption
      for (let i = 0; i < 150; i++) {
        corruptedData[i.toString()] = `value${i}`
      }

      const result = guard.cleanCorruptedData(corruptedData)
      
      expect(result.wasCorrupted).toBe(true)
      expect(result.issuesFound.some(issue => issue.includes('Excessive numeric keys'))).toBe(true)
      expect(result.cleanedData.validField).toBe('test')
      // Should remove numeric keys > 100
      expect(Object.keys(result.cleanedData).filter(key => /^\d+$/.test(key) && parseInt(key) > 100)).toHaveLength(0)
    })

    test('should handle clean data without issues', () => {
      const cleanData = {
        age: "25",
        grade: "5th",
        test_scores: {
          math: 85,
          reading: 92
        }
      }

      const result = guard.cleanCorruptedData(cleanData)
      
      expect(result.wasCorrupted).toBe(false)
      expect(result.issuesFound).toHaveLength(0)
      expect(result.cleanedData).toEqual(cleanData)
    })
  })

  describe('preventCircularReferences', () => {
    test('should remove circular references', () => {
      const obj: any = { name: 'test' }
      obj.self = obj // Create circular reference

      const cleaned = guard.preventCircularReferences(obj)
      
      expect(cleaned.name).toBe('test')
      expect(cleaned.self).toBe('[Circular Reference Removed]')
    })

    test('should prevent structured_data nesting', () => {
      const data = {
        field1: 'value1',
        nested: {
          structured_data: {
            field2: 'value2'
          }
        }
      }

      const cleaned = guard.preventCircularReferences(data)
      
      expect(cleaned.field1).toBe('value1')
      expect(cleaned.nested).toBeDefined()
      expect(cleaned.nested.structured_data).toBeUndefined()
    })
  })
})

describe('validateAndCleanFieldUpdate', () => {
  test('should validate and clean field updates', () => {
    const update: FieldUpdate = {
      section_id: '123e4567-e89b-12d3-a456-426614174000',
      field_path: 'test.field',
      value: {
        data: 'test',
        structured_data: {
          nested: 'should be removed'
        }
      },
      merge_strategy: 'replace'
    }

    const result = validateAndCleanFieldUpdate(update)
    
    expect(result.isValid).toBe(true)
    expect(result.cleanedUpdate).toBeDefined()
    expect(result.cleanedUpdate!.value.data).toBe('test')
    expect(result.cleanedUpdate!.value.structured_data).toBeUndefined()
  })

  test('should reject invalid updates', () => {
    const invalidUpdate: FieldUpdate = {
      section_id: 'invalid',
      field_path: 'structured_data.test',
      value: 'test',
      merge_strategy: 'replace'
    }

    const result = validateAndCleanFieldUpdate(invalidUpdate)
    
    expect(result.isValid).toBe(false)
    expect(result.error).toBeDefined()
  })
})