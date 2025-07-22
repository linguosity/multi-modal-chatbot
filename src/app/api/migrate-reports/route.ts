import { NextResponse } from 'next/server'
import { createRouteSupabase } from '@/lib/supabase/route-handler-client';
import { migrateReportToRichText } from '@/utils/migrate-reports';

export async function POST(request: Request) {
  const supabase = await createRouteSupabase();

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    // Fetch all reports for the user
    const { data: reports, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id);

    if (fetchError) {
      throw new Error(`Failed to fetch reports: ${fetchError.message}`);
    }

    if (!reports || reports.length === 0) {
      return NextResponse.json({ 
        message: 'No reports found to migrate',
        migratedCount: 0 
      });
    }

    let migratedCount = 0;
    const migrationResults = [];

    // Migrate each report
    for (const report of reports) {
      // Check if report needs migration (has sections with points)
      const needsMigration = report.sections?.some((section: any) => 
        section.points && section.points.length > 0
      );

      if (needsMigration) {
        console.log(`Migrating report: ${report.id} - ${report.title}`);
        
        // Migrate the report
        const migratedReport = migrateReportToRichText(report);
        
        // Update in database
        const { error: updateError } = await supabase
          .from('reports')
          .update({
            sections: migratedReport.sections,
            updated_at: migratedReport.updatedAt
          })
          .eq('id', report.id);

        if (updateError) {
          console.error(`Failed to update report ${report.id}:`, updateError);
          migrationResults.push({
            reportId: report.id,
            title: report.title,
            status: 'error',
            error: updateError.message
          });
        } else {
          migratedCount++;
          migrationResults.push({
            reportId: report.id,
            title: report.title,
            status: 'success'
          });
        }
      } else {
        migrationResults.push({
          reportId: report.id,
          title: report.title,
          status: 'skipped',
          reason: 'No points to migrate'
        });
      }
    }

    return NextResponse.json({
      message: `Migration completed. ${migratedCount} reports migrated.`,
      migratedCount,
      totalReports: reports.length,
      results: migrationResults
    });

  } catch (error) {
    console.error('Migration error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 500 }
    );
  }
}

// GET endpoint to check migration status
export async function GET() {
  const supabase = await createRouteSupabase();

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    // Check how many reports need migration
    const { data: reports, error } = await supabase
      .from('reports')
      .select('id, title, sections')
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }

    const reportsNeedingMigration = reports?.filter(report => 
      report.sections?.some((section: any) => 
        section.points && section.points.length > 0
      )
    ) || [];

    return NextResponse.json({
      totalReports: reports?.length || 0,
      reportsNeedingMigration: reportsNeedingMigration.length,
      needsMigration: reportsNeedingMigration.length > 0,
      reportsToMigrate: reportsNeedingMigration.map(r => ({
        id: r.id,
        title: r.title
      }))
    });

  } catch (error) {
    console.error('Migration check error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to check migration status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 500 }
    );
  }
}