/**
 * Simple PDF content analysis without OpenAI processing
 */

import { readFileSync } from 'fs'
import { PDFExtract } from 'pdf.js-extract'

async function analyzeLASReport() {
  console.log('🧪 Analyzing LAS Assessment Report Content...')
  
  try {
    const pdfPath = '/Users/brandonbrewer/Linguosity/multi-modal-chatbot/test_input/LAS Assessment Report - Lucia Torres.pdf'
    
    // Check if file exists
    const pdfBuffer = readFileSync(pdfPath)
    console.log('📄 PDF file loaded:', (pdfBuffer.length / 1024).toFixed(2), 'KB')
    
    // Extract text using pdf.js-extract
    const pdfExtract = new PDFExtract()
    
    const extractOptions = {
      firstPage: 1,
      lastPage: undefined,
      password: '',
      verbosity: -1,
      normalizeWhitespace: false,
      disableCombineTextItems: false
    }
    
    console.log('🔍 Extracting text from PDF...')
    
    const data = await new Promise<any>((resolve, reject) => {
      pdfExtract.extractBuffer(pdfBuffer, extractOptions, (err: any, data: any) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
    
    // Combine all text content
    let fullText = ''
    data.pages.forEach((page: any) => {
      page.content.forEach((item: any) => {
        fullText += item.str + ' '
      })
      fullText += '\n'
    })
    
    console.log('✅ Text extraction complete!')
    console.log('📊 Total pages:', data.pages.length)
    console.log('📝 Total text length:', fullText.length, 'characters')
    
    // Analyze content for clinical data
    console.log('\n🔍 Clinical Content Analysis:')
    
    // Look for assessment tools
    const assessmentTools = [
      'PLS-5', 'PLS-4', 'CELF-5', 'CELF-4', 'PPVT-4', 'EVT-2', 'GFTA-3', 'GFTA-2',
      'Goldman-Fristoe', 'Peabody', 'Clinical Evaluation', 'Preschool Language',
      'Test of Language', 'TOLD', 'OWLS', 'CASL'
    ]
    
    const foundTools: string[] = []
    assessmentTools.forEach(tool => {
      if (fullText.toLowerCase().includes(tool.toLowerCase())) {
        foundTools.push(tool)
      }
    })
    
    console.log('🧪 Assessment tools found:', foundTools.length > 0 ? foundTools.join(', ') : 'None detected')
    
    // Look for scores
    const scorePatterns = [
      { name: 'Standard Scores', pattern: /standard score[:\s]*(\d+)/gi },
      { name: 'Percentiles', pattern: /percentile[:\s]*(\d+)/gi },
      { name: 'Age Equivalents', pattern: /age equivalent[:\s]*(\d+[:\-\s]*\d+)/gi },
      { name: 'Raw Scores', pattern: /raw score[:\s]*(\d+)/gi }
    ]
    
    console.log('\n📊 Score Detection:')
    scorePatterns.forEach(({ name, pattern }) => {
      const matches = fullText.match(pattern)
      console.log(`- ${name}: ${matches ? matches.length + ' found' : 'None found'}`)
      if (matches && matches.length > 0) {
        console.log(`  Examples: ${matches.slice(0, 3).join(', ')}`)
      }
    })
    
    // Look for clinical sections
    const clinicalSections = [
      'reason for referral', 'background', 'assessment results', 'recommendations',
      'clinical observations', 'test behavior', 'validity', 'conclusion'
    ]
    
    console.log('\n📋 Clinical Sections Found:')
    clinicalSections.forEach(section => {
      const found = fullText.toLowerCase().includes(section)
      console.log(`- ${section}: ${found ? '✅' : '❌'}`)
    })
    
    // Show first 1000 characters as preview
    console.log('\n📝 Content Preview (first 1000 chars):')
    console.log('=' .repeat(50))
    console.log(fullText.substring(0, 1000))
    console.log('=' .repeat(50))
    
    // Save extracted text for manual review
    require('fs').writeFileSync('extracted-las-content.txt', fullText)
    console.log('\n💾 Full extracted text saved to: extracted-las-content.txt')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

analyzeLASReport()