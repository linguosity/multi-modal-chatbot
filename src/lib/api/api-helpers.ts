import { NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'

// Standard API response types
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  details?: any
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

// API response helpers for consistent formatting
export const api = {
  ok: <T>(data: T, message?: string, status = 200): NextResponse<ApiSuccessResponse<T>> => {
    return NextResponse.json({
      success: true,
      data,
      message
    }, { status })
  },

  err: (error: string, status = 400, details?: any): NextResponse<ApiErrorResponse> => {
    return NextResponse.json({
      success: false,
      error,
      details
    }, { status })
  },

  created: <T>(data: T, message?: string): NextResponse<ApiSuccessResponse<T>> => {
    return api.ok(data, message, 201)
  },

  notFound: (resource = 'Resource'): NextResponse<ApiErrorResponse> => {
    return api.err(`${resource} not found`, 404)
  },

  unauthorized: (message = 'Unauthorized'): NextResponse<ApiErrorResponse> => {
    return api.err(message, 401)
  },

  forbidden: (message = 'Forbidden'): NextResponse<ApiErrorResponse> => {
    return api.err(message, 403)
  },

  serverError: (message = 'Internal server error'): NextResponse<ApiErrorResponse> => {
    return api.err(message, 500)
  },

  validationError: (error: ZodError): NextResponse<ApiErrorResponse> => {
    return api.err('Validation failed', 400, error.flatten())
  }
}

// Enhanced validation helper
export function validateBody<T>(body: unknown, schema: ZodSchema<T>): T {
  const result = schema.safeParse(body)
  if (!result.success) {
    throw new ValidationError(result.error)
  }
  return result.data
}

// Custom error classes for better error handling
export class ValidationError extends Error {
  constructor(public zodError: ZodError) {
    super('Validation failed')
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

// Database column constants pattern
export function createColumnConstant<T extends Record<string, any>>(
  columns: readonly (keyof T)[]
) {
  return {
    columns,
    select: columns.join(', '),
    type: {} as Pick<T, typeof columns[number]>
  }
}

// Type-safe database operations
export interface DatabaseConfig<T> {
  tableName: string
  columns: readonly (keyof T)[]
  userIdField?: keyof T
}

export function createDatabaseHelpers<T extends Record<string, any>>(
  config: DatabaseConfig<T>
) {
  const columnSelect = config.columns.join(', ')
  
  return {
    columns: config.columns,
    select: columnSelect,
    tableName: config.tableName,
    userIdField: config.userIdField,
    
    // Type-safe query builder helpers
    buildSelectQuery: (supabase: any, userId?: string) => {
      let query = supabase
        .from(config.tableName)
        .select(columnSelect)
      
      if (config.userIdField && userId) {
        query = query.eq(config.userIdField, userId)
      }
      
      return query
    },
    
    buildInsertQuery: (supabase: any, data: Partial<T>, userId?: string) => {
      const insertData = { ...data }
      if (config.userIdField && userId) {
        insertData[config.userIdField] = userId
      }
      
      return supabase
        .from(config.tableName)
        .insert(insertData)
        .select(columnSelect)
        .single()
    }
  }
}