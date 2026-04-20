import { NextRequest } from 'next/server'
import { subscribeProgress } from '@/lib/server/progress-stream'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ operationId: string }> }) {
  const { operationId } = await params
  if (!operationId) {
    return new Response('Missing operationId', { status: 400 })
  }
  return subscribeProgress(operationId)
}

