// Database column constants to prevent drift between types and queries

// Report columns
export const REPORT_COLUMNS = [
  'id',
  'user_id', 
  'template_id',
  'title',
  'type',
  'status',
  'student_id',
  'evaluator_id',
  'created_at',
  'updated_at',
  'sections',
  'tags',
  'finalized_date',
  'print_version',
  'related_assessment_ids',
  'related_eligibility_ids'
] as const

export type ReportDbColumns = typeof REPORT_COLUMNS[number]
export const REPORT_SELECT = REPORT_COLUMNS.join(', ')

// Report Template columns
export const REPORT_TEMPLATE_COLUMNS = [
  'id',
  'user_id',
  'name',
  'description',
  'template_structure',
  'created_at',
  'updated_at'
] as const

export type ReportTemplateDbColumns = typeof REPORT_TEMPLATE_COLUMNS[number]
export const REPORT_TEMPLATE_SELECT = REPORT_TEMPLATE_COLUMNS.join(', ')

// Report Section Types columns
export const REPORT_SECTION_TYPE_COLUMNS = [
  'id',
  'name',
  'default_title',
  'ai_directive',
  'schema',
  'created_at',
  'updated_at'
] as const

export type ReportSectionTypeDbColumns = typeof REPORT_SECTION_TYPE_COLUMNS[number]
export const REPORT_SECTION_TYPE_SELECT = REPORT_SECTION_TYPE_COLUMNS.join(', ')

// Database table configurations
export const DB_TABLES = {
  reports: {
    name: 'reports',
    columns: REPORT_COLUMNS,
    select: REPORT_SELECT,
    userIdField: 'user_id' as const
  },
  reportTemplates: {
    name: 'report_templates',
    columns: REPORT_TEMPLATE_COLUMNS,
    select: REPORT_TEMPLATE_SELECT,
    userIdField: 'user_id' as const
  },
  reportSectionTypes: {
    name: 'report_section_types',
    columns: REPORT_SECTION_TYPE_COLUMNS,
    select: REPORT_SECTION_TYPE_SELECT,
    userIdField: null
  }
} as const

// Type-safe database helpers
export function createTableHelpers<T extends keyof typeof DB_TABLES>(tableName: T) {
  const config = DB_TABLES[tableName]
  
  return {
    ...config,
    buildSelectQuery: (supabase: any, userId?: string) => {
      let query = supabase
        .from(config.name)
        .select(config.select)
      
      if (config.userIdField && userId) {
        query = query.eq(config.userIdField, userId)
      }
      
      return query
    },
    
    buildInsertQuery: (supabase: any, data: any, userId?: string) => {
      const insertData = { ...data }
      if (config.userIdField && userId) {
        insertData[config.userIdField] = userId
      }
      
      return supabase
        .from(config.name)
        .insert(insertData)
        .select(config.select)
        .single()
    },
    
    buildUpdateQuery: (supabase: any, id: string, data: any, userId?: string) => {
      let query = supabase
        .from(config.name)
        .update(data)
        .eq('id', id)
      
      if (config.userIdField && userId) {
        query = query.eq(config.userIdField, userId)
      }
      
      return query.select(config.select).single()
    },
    
    buildDeleteQuery: (supabase: any, id: string, userId?: string) => {
      let query = supabase
        .from(config.name)
        .delete()
        .eq('id', id)
      
      if (config.userIdField && userId) {
        query = query.eq(config.userIdField, userId)
      }
      
      return query
    }
  }
}