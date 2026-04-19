import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const root = process.cwd()
    const p = path.join(root, 'test_input', 'notes.log')
    const content = await fs.readFile(p, 'utf8')
    return NextResponse.json({
      success: true,
      file: { name: 'notes.log', path: 'test_input/notes.log', size: content.length },
      text: content,
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

