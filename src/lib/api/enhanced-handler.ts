import { NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client'
import { ZodSchema } from 'zod'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { 
  api, 
  validateBody, 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError,
  type ApiResponse 
} from './api-helpers'

export interface EnhancedApiContext {
  supabase: SupabaseClient
  user: User
  request: Request
}

export interface EnhancedApiHandlerConfig<TBody = any> {
  requireAuth?: boolean
  bodySchema?: ZodSchema<TBody>
  allowedMethods?: string[]
  rateLimit?: number
}

/**
 * Enhanced API handler with type-safe validation and consistent error handling
 */
export function createEnhancedApiHandler<TBody = any>(
  config: EnhancedApiHandlerConfig<TBody> = {}
) {
  const {
    requireAuth = true,
    bodySchema,
    allowedMethods
  } = config

  return function (
    handler: (context: EnhancedApiContext, body?: TBody) => Promise<NextResponse>
  ) {
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

        // Parse and validate request body
        let body: TBody | undefined

        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            const contentType = request.headers.get('content-type')
            let rawBody: unknown

            if (contentType?.includes('application/json')) {
              rawBody = await request.json()
            } else if (contentType?.includes('multipart/form-data')) {
              rawBody = await request.formData()
            }

            // Type-safe validation with Zod
            if (bodySchema && rawBody) {
              body = validateBody(rawBody, bodySchema)
            } else {
              body = rawBody as TBody
            }
          } catch (error) {
            if (error instanceof ValidationError) {
              return api.validationError(error.zodError)
            }
            return api.err('Invalid request body', 400)
          }
        }

        // Create context and call handler
        const context: EnhancedApiContext = {
          supabase,
          user: user!,
          request
        }

        return await handler(context, body)

      } catch (error) {
        console.error('Enhanced API handler error:', {
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

/**
 * Type-safe API handler with database helpers
 */
export function createTypedApiHandler<TBody, TResponse>(config: {
  bodySchema?: ZodSchema<TBody>
  responseSchema?: ZodSchema<TResponse>
  requireAuth?: boolean
  allowedMethods?: string[]
  tableName?: string
  columns?: readonly string[]
}) {
  return createEnhancedApiHandler<TBody>({
    requireAuth: config.requireAuth,
    bodySchema: config.bodySchema,
    allowedMethods: config.allowedMethods
  })
}