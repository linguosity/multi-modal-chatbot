import { NextRequest, NextResponse } from 'next/server'
import { cleanupCorruptedStructuredData, identifyCorruptedSections } from '@/lib/cleanup-corrupted-data'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'identify'

    if (action === 'identify') {
      // Just identify corrupted sections without fixing them
      const corruptedSections = await identifyCorruptedSections()
      
      return NextResponse.json({
        success: true,
        action: 'identify',
        corruptedSections,
        message: `Found ${corruptedSections.length} corrupted sections`
      })
    } else if (action === 'cleanup') {
      // Actually fix the corrupted data
      const report = await cleanupCorruptedStructuredData()
      
      return NextResponse.json({
        success: true,
        action: 'cleanup',
        report,
        message: `Cleaned ${report.cleanedSections} out of ${report.corruptedSections} corrupted sections`
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use ?action=identify or ?action=cleanup'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Cleanup API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // POST endpoint for cleanup with additional options
  try {
    const body = await request.json()
    const { action = 'cleanup', dryRun = false } = body

    if (action === 'cleanup') {
      if (dryRun) {
        // Dry run - just identify what would be cleaned
        const corruptedSections = await identifyCorruptedSections()
        return NextResponse.json({
          success: true,
          dryRun: true,
          corruptedSections,
          message: `Dry run: Would clean ${corruptedSections.length} corrupted sections`
        })
      } else {
        // Actually perform cleanup
        const report = await cleanupCorruptedStructuredData()
        return NextResponse.json({
          success: true,
          dryRun: false,
          report,
          message: `Cleaned ${report.cleanedSections} out of ${report.corruptedSections} corrupted sections`
        })
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('Cleanup POST API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}