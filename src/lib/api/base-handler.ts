import { NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client'
import { ZodSchema } from 'zod'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { safeJsonResponse } from './safe-json'
import {
  api,
  validateBody,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  type ApiResponse
} from './api-helpers'

export interface ApiContext {
  supabase: SupabaseClient
  user: User
  request: Request
}

export interface ApiHandlerConfig<TBody = any> {
  requireAuth?: boolean
  bodySchema?: ZodSchema<TBody>
  allowedMethods?: string[]
  rateLimit?: number
  // Legacy support
  validateSchema?: ZodSchema
}

// Legacy support - use api.ok/api.err instead
export function createApiResponse<T>(
  data?: T,
  message?: string,
  status = 200
): NextResponse {
  if (status < 400) {
    return safeJsonResponse({
      success: true,
      data,
      message
    }, { status })
  } else {
    return safeJsonResponse({
      success: false,
      error: message,
      message
    }, { status })
  }
}

export function createApiHandler<TBody = any>(config: ApiHandlerConfig<TBody> = {}) {
  const {
    requireAuth = true,
    bodySchema,
    validateSchema, // Legacy support
    allowedMethods
  } = config

  return function (handler: (context: ApiContext, body?: TBody) => Promise<NextResponse>) {
    return async function (request: Request): Promise<NextResponse> {
      try {
        // Method validation
        if (allowedMethods && !allowedMethods.includes(request.method)) {
          return api.err(`Method ${request.method} not allowed`, 405)
        }

        // Initialize Supabase
        const supabase = await createRouteSupabase()

        let user: User | null = null

        // Authentication check
        if (requireAuth) {
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

          if (authError || !authUser) {
            console.warn('Unauthorized API request:', {
              method: request.method,
              url: request.url,
              error: authError?.message
            })
            return api.unauthorized()
          }

          user = authUser
        }

        // Parse request body for POST/PUT requests
        let body = null
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            const contentType = request.headers.get('content-type')
            if (contentType?.includes('application/json')) {
              body = await request.json()
            } else if (contentType?.includes('multipart/form-data')) {
              body = await request.formData()
            }
          } catch (error) {
            return api.err('Invalid request body', 400)
          }

          // Schema validation (legacy support)
          if (validateSchema && body) {
            const validation = validateSchema.safeParse(body)
            if (!validation.success) {
              console.warn('Schema validation failed:', validation.error.flatten())
              return api.validationError(validation.error)
            }
            body = validation.data
          }

          // Enhanced schema validation
          if (bodySchema && body) {
            try {
              body = validateBody(body, bodySchema)
            } catch (error) {
              if (error instanceof ValidationError) {
                return api.validationError(error.zodError)
              }
              return api.err('Invalid request data', 400)
            }
          }
        }

        // Create context and call handler
        const context: ApiContext = {
          supabase,
          user: user!,
          request
        }

        return await handler(context, body)

      } catch (error) {
        console.error('API handler error:', {
          method: request.method,
          url: request.url,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        })

        // Handle specific error types
        if (error instanceof ValidationError) {
          return api.validationError(error.zodError)
        }

        if (error instanceof NotFoundError) {
          return api.notFound(error.message)
        }

        if (error instanceof UnauthorizedError) {
          return api.unauthorized(error.message)
        }

        return api.serverError()
      }
    }
  }
}