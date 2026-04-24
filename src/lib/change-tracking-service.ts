/**
 * Stub for the change-tracking service. The richer implementation lived
 * on a branch that's since been cleaned up; only the dynamic-import
 * shape is used from structured-change-tracker. Returning a minimal
 * object keeps that import boundary honest without bringing real
 * persistence back online until it's asked for.
 */
export interface ChangeTrackingService {
  // Placeholder — real methods fill in as callers emerge.
  readonly stubbed: true
}

let instance: ChangeTrackingService | null = null

export function getChangeTrackingService(): ChangeTrackingService {
  if (!instance) instance = { stubbed: true }
  return instance
}
