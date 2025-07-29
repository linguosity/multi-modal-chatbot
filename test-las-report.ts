/**
 * Test script for processing the LAS Assessment Report with improved prompts
 * Run with: npx tsx test-las-report.ts
 */

import { readFileSync } from 'fs'
import { processMultipleFiles } from './src/lib/file-processing'

async function testLASReport() {
  console.log('🧪 Testing LAS Assessment Report Processing...')
  
  try {
    // Read the PDF file
    const pdfPath = '/Users/brandonbrewer/Linguosity/multi-modal-chatbot/test_input/LAS Assessment Report - Lucia Torres.pdf'
    const pdfBuffer = readFileSync(pdfPath)
    
    // Create a File object for processing
    const file = new File([pdfBuffer], 'LAS Assessment Report - Lucia Torres.pdf', {
      type: 'application/pdf'
    })
    
    console.log('📄 Processing PDF file:', file.name)
    console.log('📊 File size:', (file.size / 1024).toFixed(2), 'KB')
    
    // Process the file
    const processedFiles = await processMultipleFiles([file])
    
    console.log('✅ File processing complete!')
    console.log('📋 Processed files:', processedFiles.length)
    
    if (processedFiles.length > 0) {
      const processedFile = processedFiles[0]
      console.log('📝 Content preview (first 500 chars):')
      console.log(processedFile.content.substring(0, 500) + '...')
      
      console.log('\n🔍 Content analysis:')
      console.log('- Total length:', processedFile.content.length, 'characters')
      console.log('- Contains "standard score":', processedFile.content.toLowerCase().includes('standard score'))
      console.log('- Contains "percentile":', processedFile.content.toLowerCase().includes('percentile'))
      console.log('- Contains "assessment":', processedFile.content.toLowerCase().includes('assessment'))
      console.log('- Contains "language":', processedFile.content.toLowerCase().includes('language'))
      
      // Look for specific test names
      const testNames = ['PLS', 'CELF', 'PPVT', 'EVT', 'GFTA', 'Goldman-Fristoe']
      console.log('\n🧪 Test detection:')
      testNames.forEach(test => {
        const found = processedFile.content.toLowerCase().includes(test.toLowerCase())
        console.log(`- ${test}: ${found ? '✅ Found' : '❌ Not found'}`)
      })
      
      // Look for score patterns
      const scorePatterns = [
        /standard score[:\s]+(\d+)/gi,
        /percentile[:\s]+(\d+)/gi,
        /age equivalent[:\s]+(\d+[:\-]\d+)/gi
      ]
      
      console.log('\n📊 Score pattern detection:')
      scorePatterns.forEach((pattern, index) => {
        const matches = processedFile.content.match(pattern)
        const patternNames = ['Standard Scores', 'Percentiles', 'Age Equivalents']
        console.log(`- ${patternNames[index]}: ${matches ? matches.length + ' found' : 'None found'}`)
        if (matches && matches.length > 0) {
          console.log(`  Examples: ${matches.slice(0, 3).join(', ')}`)
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Error processing file:', error)
  }
}

// Run the test
testLASReport()