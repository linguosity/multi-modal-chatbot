import { ReportContextBuilder } from '../report-context-builder'

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}

// Mock the server client
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: jest.fn(() => Promise.resolve(mockSupabase))
}))

// Mock data integrity guard
jest.mock('../data-integrity-guard', () => ({
  dataIntegrityGuard: {
    cleanCorruptedData: jest.fn((data) => ({
      cleanedData: data,
      wasCorrupted: false,
      issuesFound: [],
      cleanupActions: []
    }))
  }
}))

describe('ReportContextBuilder', () => {
  let builder: ReportContextBuilder

  beforeEach(() => {
    builder = new ReportContextBuilder()
    jest.clearAllMocks()
  })

  describe('buildReportContext', () => {
    test('should build complete report context successfully', async () => {
      // Mock report data
      const mockReport = {
        id: 'report-123',
        title: 'Test Report',
        template_id: 'template-456'
      }

      // Mock sections data
      const mockSections = [
        {
          id: 'section-1',
          title: 'Student Information',
          section_type: 'student_info',
          section_type_id: 'type-1',
          structured_data: { age: 10 },
          content: '',
          order: 1,
          is_required: true,
          is_generated: false
        },
        {
          id: 'section-2',
          title: 'Assessment Results',
          section_type: 'assessment_results',
          section_type_id: 'type-2',
          structured_data: { test_scores: {} },
          content: '',
          order: 2,
          is_required: true,
          is_generated: true
        }
      ]

      // Mock section types data
      const mockSectionTypes = [
        {
          id: 'type-1',
          name: 'Student Information',
          ai_directive: 'Extract student demographic information',
          schema: { type: 'object' }
        },
        {
          id: 'type-2',
          name: 'Assessment Results',
          ai_directive: 'Extract test scores and assessment data',
          schema: { type: 'object' }
        }
      ]

      // Setup mocks
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'reports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockReport, error: null })
              })
            })
          }
        } else if (table === 'report_sections') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: mockSections, error: null })
              })
            })
          }
        } else if (table === 'report_section_types') {
          return {
            select: () => Promise.resolve({ data: mockSectionTypes, error: null })
          }
        }
        return mockSupabase.from()
      })

      const result = await builder.buildReportContext('report-123', ['section-1', 'section-2'])

      expect(result.success).toBe(true)
      expect(result.context).toBeDefined()
      expect(result.context!.reportId).toBe('report-123')
      expect(result.context!.reportTitle).toBe('Test Report')
      expect(result.context!.sections).toHaveLength(2)
      expect(result.context!.targetSectionIds).toEqual(['section-1', 'section-2'])
      expect(result.context!.sectionTypes.size).toBe(2)
      expect(result.context!.metadata.totalSections).toBe(2)
      expect(result.context!.metadata.targetSections).toBe(2)
    })

    test('should handle invalid section IDs gracefully', async () => {
      const mockReport = {
        id: 'report-123',
        title: 'Test Report',
        template_id: 'template-456'
      }

      const mockSections = [
        {
          id: 'section-1',
          title: 'Student Information',
          section_type: 'student_info',
          section_type_id: 'type-1',
          structured_data: { age: 10 },
          content: '',
          order: 1,
          is_required: true,
          is_generated: false
        }
      ]

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'reports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockReport, error: null })
              })
            })
          }
        } else if (table === 'report_sections') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: mockSections, error: null })
              })
            })
          }
        } else if (table === 'report_section_types') {
          return {
            select: () => Promise.resolve({ data: [], error: null })
          }
        }
        return mockSupabase.from()
      })

      const result = await builder.buildReportContext('report-123', ['section-1', 'invalid-section'])

      expect(result.success).toBe(true)
      expect(result.warnings).toContain('Invalid section IDs requested: invalid-section')
      expect(result.context!.targetSectionIds).toEqual(['section-1'])
      expect(result.context!.metadata.targetSections).toBe(1)
    })

    test('should handle report not found', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'reports') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: { message: 'Report not found' } })
              })
            })
          }
        }
        return mockSupabase.from()
      })

      const result = await builder.buildReportContext('invalid-report', ['section-1'])

      expect(result.success).toBe(false)
      expect(result.error).toContain('Report not found')
    })
  })

  describe('buildEnhancedSystemPrompt', () => {
    test('should build comprehensive system prompt', () => {
      const mockContext = {
        reportId: 'report-123',
        reportTitle: 'Test Report',
        sections: [
          {
            id: 'section-1',
            title: 'Student Information',
            section_type: 'student_info',
            section_type_id: 'type-1',
            structured_data: { age: 10, grade: 5 },
            content: '',
            order: 1,
            is_required: true,
            is_generated: false
          }
        ],
        sectionTypes: new Map([
          ['type-1', {
            id: 'type-1',
            name: 'Student Information',
            ai_directive: 'Extract student demographic information',
            schema: { type: 'object' }
          }]
        ]),
        targetSectionIds: ['section-1'],
        hasCircularReferences: false,
        metadata: {
          totalSections: 1,
          targetSections: 1,
          corruptedSections: 0,
          cleanedSections: 0
        }
      }

      const prompt = builder.buildEnhancedSystemPrompt(mockContext)

      expect(prompt).toContain('CRITICAL FIELD PATH RULES')
      expect(prompt).toContain('NEVER use "structured_data" as a field_path')
      expect(prompt).toContain('Test Report (ID: report-123)')
      expect(prompt).toContain('ID: section-1')
      expect(prompt).toContain('Title: Student Information')
      expect(prompt).toContain('Current Data Keys: age, grade')
      expect(prompt).toContain('AI Directive: Extract student demographic information')
      expect(prompt).toContain('section-1 (Student Information)')
    })
  })

  describe('getTargetSectionsWithContext', () => {
    test('should return target sections with full context', () => {
      const mockContext = {
        reportId: 'report-123',
        reportTitle: 'Test Report',
        sections: [
          {
            id: 'section-1',
            title: 'Student Information',
            section_type: 'student_info',
            section_type_id: 'type-1',
            structured_data: { age: 10, grade: 5 },
            content: '',
            order: 1,
            is_required: true,
            is_generated: false
          },
          {
            id: 'section-2',
            title: 'Assessment Results',
            section_type: 'assessment_results',
            section_type_id: 'type-2',
            structured_data: null,
            content: '',
            order: 2,
            is_required: true,
            is_generated: true
          }
        ],
        sectionTypes: new Map([
          ['type-1', {
            id: 'type-1',
            name: 'Student Information',
            ai_directive: 'Extract student demographic information',
            schema: { type: 'object' }
          }]
        ]),
        targetSectionIds: ['section-1'],
        hasCircularReferences: false,
        metadata: {
          totalSections: 2,
          targetSections: 1,
          corruptedSections: 0,
          cleanedSections: 0
        }
      }

      const result = builder.getTargetSectionsWithContext(mockContext)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'section-1',
        title: 'Student Information',
        section_type: 'student_info',
        ai_directive: 'Extract student demographic information',
        schema: { type: 'object' },
        current_data_keys: ['age', 'grade']
      })
    })
  })
})