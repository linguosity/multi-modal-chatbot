// Field contracts to control AI integration and provenance
// Kept separate to avoid circular imports; imported by schema/types as needed

export type FieldMode = 'manual' | 'computed' | 'ai_extracted' | 'ai_summarized' | 'locked'

export interface RegionBBox {
  x: number
  y: number
  width: number
  height: number
}

export interface SourceRef {
  artifactId: string // id or filename of the source artifact
  page?: number // for PDFs/images
  timestamp?: { startSec: number; endSec: number } // for audio/video
  region?: RegionBBox // bounding box on a page/image
  selector?: string // optional CSS/XPath-like selector for HTML docs
  confidence?: number // 0..1
  note?: string // brief note for UI
}

export interface FieldValidators {
  // In addition to FieldSchema.required
  regex?: string
  min?: number
  max?: number
  enum?: string[]
}

export type RenderStyle = 'inline' | 'table_cell' | 'paragraph'

export interface ComputeSpec {
  fn: string // e.g., "ageFromDOB"
  dependsOn?: string[] // keys this field depends on
}

export interface FieldContract {
  mode?: FieldMode
  source_refs?: SourceRef[]
  validators?: FieldValidators
  render?: RenderStyle
  compute?: ComputeSpec
  prompt?: string // concise, field-level instruction for AI
  red_flags?: string[] // keywords that should trigger review
  provenance_confidence?: number // aggregate confidence 0..1
}

