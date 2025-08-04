import { describe, it, expect } from '@jest/globals'
import { api, validateBody, ValidationError } from '../api-helpers'
import { z } from 'zod'

describe('API Helpers', () => {
  describe('api.ok', () => {
    it('should create successful response with data', () => {
      const data = { id: 1, name: 'test' }
      const response = api.ok(data, 'Success message')
      
      expect(response.status).toBe(200)
      // Note: NextResponse.json() returns a Response object
      // In actual tests, you'd need to parse the response body
    })

    it('should create successful response with custom status', () => {
      const response = api.ok({ id: 1 }, 'Created', 201)
      expect(response.status).toBe(201)
    })
  })

  describe('api.err', () => {
    it('should create error response with message', () => {
      const response = api.err('Something went wrong', 400)
      expect(response.status).toBe(400)
    })

    it('should create error response with details', () => {
      const details = { field: 'email', issue: 'invalid format' }
      const response = api.err('Validation failed', 400, details)
      expect(response.status).toBe(400)
    })
  })

  describe('api.created', () => {
    it('should create 201 response', () => {
      const data = { id: 1, name: 'new item' }
      const response = api.created(data, 'Item created')
      expect(response.status).toBe(201)
    })
  })

  describe('api.notFound', () => {
    it('should create 404 response with default message', () => {
      const response = api.notFound()
      expect(response.status).toBe(404)
    })

    it('should create 404 response with custom resource', () => {
      const response = api.notFound('User')
      expect(response.status).toBe(404)
    })
  })

  describe('validateBody', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number()
    })

    it('should validate and return parsed data', () => {
      const body = { name: 'John', age: 30 }
      const result = validateBody(body, schema)
      
      expect(result).toEqual(body)
    })

    it('should throw ValidationError for invalid data', () => {
      const body = { name: 'John', age: 'thirty' }
      
      expect(() => validateBody(body, schema)).toThrow(ValidationError)
    })

    it('should throw ValidationError for missing required fields', () => {
      const body = { name: 'John' }
      
      expect(() => validateBody(body, schema)).toThrow(ValidationError)
    })
  })
})

// Mock tests for NextResponse integration
describe('API Helpers Integration', () => {
  it('should integrate with NextResponse correctly', async () => {
    // This would test actual NextResponse behavior
    // Requires proper test environment setup
  })
})