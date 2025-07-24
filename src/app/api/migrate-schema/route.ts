import { NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client'

export async function POST() {
  const supabase = await createRouteSupabase()

  try {
    // Check if metadata column already exists
    const { data: columns, error: columnError } = await supabase
      .rpc('get_table_columns', { table_name: 'reports' })
    
    if (columnError) {
      console.log('Could not check columns, proceeding with migration attempt')
    } else if (columns?.some((col: any) => col.column_name === 'metadata')) {
      return NextResponse.json({
        success: true,
        message: 'Metadata column already exists',
        alreadyExists: true
      })
    }

    // Add metadata column to reports table
    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.reports 
        ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
        
        CREATE INDEX IF NOT EXISTS idx_reports_metadata 
        ON public.reports USING GIN (metadata);
      `
    })

    if (migrationError) {
      // Try alternative approach using direct SQL
      const { error: altError } = await supabase
        .from('reports')
        .select('metadata')
        .limit(1)

      if (altError && altError.message?.includes('metadata')) {
        return NextResponse.json({
          success: false,
          error: 'Migration failed - metadata column needs to be added manually',
          details: migrationError.message,
          sqlToRun: `
            ALTER TABLE public.reports 
            ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
            
            CREATE INDEX idx_reports_metadata 
            ON public.reports USING GIN (metadata);
          `
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Schema migration completed successfully'
    })

  } catch (error) {
    console.error('Schema migration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Schema migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      sqlToRun: `
        ALTER TABLE public.reports 
        ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        
        CREATE INDEX idx_reports_metadata 
        ON public.reports USING GIN (metadata);
      `
    }, { status: 500 })
  }
}

export async function GET() {
  const supabase = await createRouteSupabase()

  try {
    // Check if metadata column exists by trying to select it
    const { error } = await supabase
      .from('reports')
      .select('metadata')
      .limit(1)

    return NextResponse.json({
      metadataColumnExists: !error || !error.message?.includes('metadata'),
      error: error?.message
    })

  } catch (error) {
    return NextResponse.json({
      metadataColumnExists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}