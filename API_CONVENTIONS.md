# API Design and Implementation Conventions

This document outlines the conventions for designing and implementing APIs within this project. Adhering to these conventions will ensure consistency, maintainability, and ease of use for both API developers and consumers.

## 1. Naming Conventions

### Endpoint Paths
*   **Case:** Use `kebab-case` for all endpoint paths.
*   **Pluralization:** Use plural nouns for resources.
*   **Hierarchy:** Structure paths logically to represent resource hierarchy.
*   **Examples:**
    *   `/api/users`
    *   `/api/users/{userId}/reports`
    *   `/api/reports/{reportId}`
    *   `/api/auth/login`

### Request/Response Field Names
*   **Case:** Use `camelCase` for all field names in JSON request and response bodies. This aligns with common JavaScript/TypeScript practices.
*   **Clarity:** Field names should be descriptive and unambiguous.
*   **Examples:**
    ```json
    {
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "firstName": "John",
      "createdAt": "2023-10-27T10:00:00Z"
    }
    ```

## 2. Request/Response Formats

### Default Format
*   All request and response bodies **MUST** use `application/json` format.
*   Ensure the `Content-Type` header is set to `application/json` for requests with a body, and responses.

### Standard Success Response Structure
For consistency, success responses should generally follow this structure:

```json
{
  "status": "success",
  "data": {
    // Requested resource or operation result
  }
}
```
*   If returning a list of resources, `data` can be an array:
    ```json
    {
      "status": "success",
      "data": [
        { "id": "1", "name": "Item 1" },
        { "id": "2", "name": "Item 2" }
      ]
    }
    ```
*   For operations that do not naturally return data (e.g., successful DELETE, or some PUT operations), `data` can be `null` or an empty object `{}`. A `204 No Content` response might also be appropriate in some DELETE cases (see HTTP Status Codes).

### Standard Error Response Structure
Error responses **MUST** follow this structure:

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "A human-readable description of the error.",
    "details": [
      // Optional: Array of specific validation errors or further details
      // e.g., { "field": "fieldName", "issue": "Specific validation rule failed" }
    ]
  }
}
```
*   `code`: A unique string identifier for the type of error (e.g., `VALIDATION_ERROR`, `UNAUTHENTICATED`, `RESOURCE_NOT_FOUND`).
*   `message`: A clear, concise message explaining the error. Avoid exposing sensitive internal details.
*   `details`: (Optional) An array providing more specific information, especially useful for validation errors where multiple fields might be invalid.

### Common HTTP Status Codes
Use standard HTTP status codes to indicate the outcome of an API request:

*   **2xx - Success:**
    *   `200 OK`: General success for GET, PUT/PATCH (if entity is returned), or POST (if entity is returned but not newly created).
    *   `201 Created`: Successfully created a new resource (typically for POST). The response should include a `Location` header pointing to the newly created resource, and the resource itself in the body.
    *   `204 No Content`: Successfully processed the request but no content is returned (e.g., for DELETE operations, or PUT/PATCH if no content is returned).
*   **4xx - Client Errors:**
    *   `400 Bad Request`: The request is malformed, contains invalid syntax, or cannot be processed. Often used for validation errors (see Validation section).
    *   `401 Unauthorized`: Authentication is required and has failed or has not yet been provided. The client should authenticate.
    *   `403 Forbidden`: The authenticated user does not have permission to access the requested resource.
    *   `404 Not Found`: The requested resource could not be found.
    *   `405 Method Not Allowed`: The HTTP method used is not supported for this resource. Include an `Allow` header with supported methods.
    *   `409 Conflict`: The request could not be processed because of a conflict in the current state of the resource (e.g., trying to create a resource that already exists).
*   **5xx - Server Errors:**
    *   `500 Internal Server Error`: A generic error message for an unexpected condition on the server. Avoid sending detailed stack traces in the response; log them instead.
    *   `503 Service Unavailable`: The server is currently unable to handle the request due to temporary overloading or maintenance.

## 3. Authentication & Authorization

### Authentication
*   Authentication **MUST** be handled using Bearer tokens in the `Authorization` header.
    *   Example: `Authorization: Bearer <your_jwt_token>`
*   Tokens are typically JWTs provided by an authentication service (e.g., Supabase Auth).
*   API routes should verify the token's validity and extract user information.

### Authorization
*   Authorization (permission checking) **MUST** be performed after successful authentication.
*   Mechanisms:
    *   **Role-Based Access Control (RBAC):** If using Supabase, leverage its built-in roles and row-level security (RLS) policies where possible.
    *   **Custom Logic:** For more granular permissions, implement checks within the API route handlers. This might involve looking up user roles/permissions from the database.
*   Return `403 Forbidden` if an authenticated user lacks the necessary permissions.

## 4. HTTP Methods

Use HTTP methods semantically:

*   **`GET`**: Retrieve resources. Safe and idempotent.
    *   `GET /api/users`: Retrieve a list of users.
    *   `GET /api/users/{userId}`: Retrieve a specific user.
*   **`POST`**: Create new resources or trigger actions that are not idempotent.
    *   `POST /api/users`: Create a new user.
    *   `POST /api/reports/{reportId}/generate`: Trigger generation of a report.
*   **`PUT`**: Update an existing resource completely. Idempotent. The request body should contain the full updated representation of the resource.
    *   `PUT /api/users/{userId}`: Replace the entire user object.
*   **`PATCH`**: Partially update an existing resource. Not necessarily idempotent. The request body should contain only the fields to be updated.
    *   `PATCH /api/users/{userId}`: Update specific fields of a user (e.g., only email).
*   **`DELETE`**: Remove a resource. Idempotent.
    *   `DELETE /api/users/{userId}`: Delete a user.

## 5. Validation

### Library
*   **Zod** (`zod`) **MUST** be used for validating request bodies, query parameters, and path parameters. Zod schemas provide clear, type-safe validation.

### Error Reporting
*   If validation fails, the API **MUST** return an HTTP `400 Bad Request` status code.
*   The error response body **MUST** follow the standard error structure, with `code` typically set to `VALIDATION_ERROR`.
*   The `details` array in the error response should be populated with information about each validation failure. Zod's `error.flatten().fieldErrors` can be used to structure this.
    *   Example `details` entry for a Zod error:
        ```json
        {
          "field": "email",
          "issue": "Invalid email format"
        }
        ```

### Implementation
*   Define Zod schemas for all expected input.
*   Parse and validate input at the beginning of your API route handler.

```typescript
// Example in a Next.js API route
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = userSchema.parse(body);
    // ... process validatedData
    return Response.json({ status: "success", data: validatedData }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({
        status: "error",
        error: {
          code: "VALIDATION_ERROR",
          message: "Input validation failed.",
          details: Object.entries(error.flatten().fieldErrors).map(([field, issues]) => ({
            field,
            issue: issues.join(", "), // Or take the first issue
          })),
        }
      }, { status: 400 });
    }
    // ... other error handling
    return Response.json({
        status: "error",
        error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred." }
    }, { status: 500 });
  }
}
```

## 6. Error Handling

### Principles
*   Gracefully handle all potential errors within API routes.
*   Do not expose sensitive information (e.g., stack traces, raw database errors) to the client. Log these details on the server.
*   Use appropriate HTTP status codes and the standard error response format.

### Client Errors (4xx) vs. Server Errors (5xx)
*   **Client Errors:** Errors caused by invalid input or unauthorized requests from the client (e.g., validation errors, authentication failures, permission issues, resource not found). These should return a 4xx status code and a clear error message.
*   **Server Errors:** Errors occurring on the server due to unexpected issues (e.g., database connection errors, unhandled exceptions in code). These should return a 5xx status code. Log detailed information for debugging.

### Implementation
*   Use `try...catch` blocks to handle potential errors.
*   Catch specific error types (e.g., `z.ZodError`, errors from database clients) to provide more specific error responses.
*   Have a generic error handler for unexpected errors to ensure a 500 response with a standard message.

## 7. Versioning (Recommended)

While not immediately critical for all projects, API versioning is crucial for long-term maintainability, especially if breaking changes are anticipated.

*   **Strategy:** Use URI path versioning.
    *   Example: `/api/v1/users`, `/api/v2/users`
*   Introduce versioning when making breaking changes to an existing, deployed API.
*   Non-breaking changes (e.g., adding new optional fields to a response) generally do not require a new version.

## 8. Logging

Comprehensive logging is essential for debugging, monitoring, and security auditing.

### What to Log
*   **Critical Errors:** All unhandled exceptions, database errors, integration failures. Include stack traces and relevant context.
*   **Important Business Events:** Significant actions like user creation, order placement (if applicable), payment processing.
*   **API Request/Response (Selective & Sanitized):**
    *   Log incoming request metadata (method, path, IP address, user agent).
    *   Optionally log request/response bodies for debugging, but **MUST sanitize or exclude sensitive data** (passwords, API keys, PII in bodies).
    *   Consider logging validation errors.
*   **Authentication/Authorization Events:** Successful logins, failed login attempts, authorization failures.

### Format
*   **Structured Logging:** Use a structured logging format (e.g., JSON) where possible. This makes logs easier to parse, search, and analyze with log management tools.
    *   Example (JSON):
        ```json
        {
          "timestamp": "2023-10-27T10:05:00Z",
          "level": "error",
          "message": "Failed to process user creation",
          "requestId": "abc-123",
          "userId": "user-xyz",
          "error": {
            "message": "Database constraint violation",
            "stack": "..."
          },
          "source": "/api/users"
        }
        ```
*   **Context:** Include relevant context in logs, such as `requestId`, `userId` (if available), and the API endpoint involved.

### Tools
*   Use a capable logging library for your environment (e.g., Pino, Winston for Node.js). Next.js has built-in logging capabilities that can be extended.

## 9. Documentation

Clear API documentation is vital for both internal developers and external consumers (if any).

### Standard
*   **OpenAPI Specification (OAS):** Aim to document APIs using the OpenAPI Specification (formerly Swagger). This provides a machine-readable format for describing API endpoints, request/response schemas, authentication methods, etc.

### Generation & Maintenance
*   **Automated Tools:**
    *   For Next.js, tools like `next-swagger-doc` can help generate OpenAPI schemas from JSDoc comments or code annotations.
    *   Zod schemas used for validation can often be converted to OpenAPI schemas (e.g., using `zod-to-openapi` or similar libraries).
*   **Manual Documentation:** If full automation is not feasible, maintain a manually written OpenAPI document.
*   **Accessibility:** Ensure documentation is hosted in an easily accessible location for the team.
*   **Up-to-Date:** Documentation **MUST** be kept up-to-date with API changes. Integrate documentation updates into the development workflow.
*   **Content:** Documentation for each endpoint should include:
    *   HTTP method and path.
    *   Description of functionality.
    *   Path parameters, query parameters, request body schema (with field descriptions and validation rules).
    *   Response schemas for success and error states (with status codes).
    *   Authentication requirements.
    *   Example requests and responses.
