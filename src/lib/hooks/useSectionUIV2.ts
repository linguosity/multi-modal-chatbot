'use client'

import { useSearchParams } from 'next/navigation'

/**
 * Resolves whether the new split-pane Section UI v2 should render.
 *
 * Resolution order:
 *   1. `?ui=v2` query param → force on
 *   2. `?ui=v1` query param → force off (lets reviewers pin v1 too)
 *   3. `NEXT_PUBLIC_SECTION_UI_V2 === 'true'` env → on
 *   4. Default → off
 *
 * Keeping this in a hook (rather than a top-level constant) lets the env
 * value still be the deployment-wide default while reviewers toggle per
 * tab via the query string without rebuilding.
 */
export function useSectionUIV2(): boolean {
  const params = useSearchParams()
  const override = params?.get('ui')
  if (override === 'v2') return true
  if (override === 'v1') return false
  return process.env.NEXT_PUBLIC_SECTION_UI_V2 === 'true'
}
