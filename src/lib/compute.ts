// Simple compute utilities for computed Field Modes

export function ageFromDOB(dob: string | Date, asOf: Date = new Date()): number | null {
  try {
    const d = dob instanceof Date ? dob : new Date(dob)
    if (isNaN(d.getTime())) return null
    let age = asOf.getFullYear() - d.getFullYear()
    const m = asOf.getMonth() - d.getMonth()
    if (m < 0 || (m === 0 && asOf.getDate() < d.getDate())) {
      age--
    }
    return age
  } catch {
    return null
  }
}

export type ComputeRegistry = Record<string, (...args: any[]) => any>

export const computeRegistry: ComputeRegistry = {
  ageFromDOB,
}

