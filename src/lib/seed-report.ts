// FILE: seed-report.ts
import 'dotenv/config'; // 👈 ADD THIS LINE
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { SAMPLE_REPORT } from '@/types/sampleReportData'
import { Database } from '@/types/supabaseTypes'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function seed() {
  const reportId = uuidv4()
  const userId = '2f839951-ad0e-4a95-9f8a-7cf078bbd115' // Replace this with a real user_id

  const { data, error } = await supabase
    .from('speech_language_reports')
    .insert([
      {
        user_id: userId,
        report: {
          ...SAMPLE_REPORT,
          metadata: {
            ...SAMPLE_REPORT.metadata,
            lastUpdated: new Date().toISOString(),
            version: SAMPLE_REPORT.metadata?.version ?? 1
          }
        }
      }
    ])

  if (error) {
    console.error('❌ Seeding failed:', error.message)
  } else {
    console.log('✅ Sample report inserted!')
  }
}

seed()