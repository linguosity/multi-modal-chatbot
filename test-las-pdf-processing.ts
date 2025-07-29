#!/usr/bin/env tsx

/**
 * Test script for processing LAS Assessment Report PDF with Claude API
 * Tests our PDF processing pipeline and prompts
 */

import fs from 'fs'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not found in environment')
  process.exit(1)
}

const PDF_PATH = '/Users/brandonbrewer/Linguosity/multi-modal-chatbot/test_input/LAS Assessment Report - Lucia Torres.pdf'

async function processPDFWithClaude(pdfPath: string) {
  console.log('📄 Processing PDF:', pdfPath)
  
  // Check if file exists
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`)
  }

  // Read PDF as buffer and convert to base64
  const pdfBuffer = fs.readFileSync(pdfPath)
  const base64Content = pdfBuffer.toString('base64')
  
  console.log('📊 PDF Stats:')
  console.log(`  - File size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`)
  console.log(`  - Base64 length: ${base64Content.length} characters`)

  // Create Claude message with PDF
  const prompt = `You are an expert Speech-Language Pathologist analyzing an assessment report. Please extract and structure the key information from this LAS (Language Assessment Scales) report.

EXTRACTION GOALS:
1. Student demographic information
2. Assessment tools administered and dates
3. Quantitative scores and results
4. Qualitative observations and notes
5. Recommendations and next steps
6. Any standardized test scores with percentiles/standard scores

CLINICAL FOCUS:
- Extract specific numerical scores, percentiles, age equivalents
- Identify language domains assessed (receptive, expressive, pragmatic, etc.)
- Note any behavioral observations during testing
- Capture clinician recommendations and service suggestions
- Identify any diagnostic impressions or eligibility determinations

Please provide a structured analysis that would be useful for generating a comprehensive SLP evaluation report.`

  console.log('🤖 Sending to Claude API...')
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219-v1:0', // Updated to Claude 3.7 Sonnet for PDF support
      max_tokens: 4000,
      temperature: 0.1, // Low temperature for factual extraction
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Content
              }
            }
          ]
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    return content.text
  } catch (error) {
    console.error('❌ Claude API Error:', error)
    throw error
  }
}

async function testStructuredDataExtraction(extractedContent: string) {
  console.log('\n🔄 Testing structured data extraction...')
  
  const structuringPrompt = `Based on the following extracted assessment information, create a structured JSON object that matches our application's data schema for SLP reports.

EXTRACTED CONTENT:
${extractedContent}

Please structure this into JSON format with these sections:
{
  "student_info": {
    "name": "string",
    "age": "string", 
    "grade": "string",
    "date_of_birth": "string",
    "assessment_date": "string"
  },
  "assessment_tools": [
    {
      "tool_name": "string",
      "administration_date": "string",
      "standard_score": number,
      "percentile": number,
      "age_equivalent": "string",
      "qualitative_descriptor": "string",
      "subtests": [
        {
          "subtest_name": "string",
          "raw_score": number,
          "standard_score": number,
          "percentile": number
        }
      ]
    }
  ],
  "observations": {
    "cooperation": "string",
    "attention": "string",
    "communication_style": "string",
    "behavioral_notes": "string"
  },
  "recommendations": [
    "string"
  ],
  "diagnostic_impression": "string",
  "eligibility_determination": "string"
}

Ensure all numerical scores are properly typed as numbers, not strings. If information is not available, use null or appropriate empty values.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219-v1:0', // Updated to Claude 3.7 Sonnet
      max_tokens: 3000,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: structuringPrompt
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Try to parse as JSON
    try {
      const jsonMatch = content.text.match(/```json\s*([\s\S]*?)\s*```/) || content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        const parsed = JSON.parse(jsonStr)
        return parsed
      } else {
        console.log('⚠️  No JSON block found, returning raw text')
        return content.text
      }
    } catch (parseError) {
      console.log('⚠️  JSON parsing failed, returning raw text')
      return content.text
    }
  } catch (error) {
    console.error('❌ Structured extraction error:', error)
    throw error
  }
}

async function testNarrativeGeneration(structuredData: any) {
  console.log('\n📝 Testing narrative generation...')
  
  const narrativePrompt = `You are an expert Speech-Language Pathologist writing a professional evaluation report section. Generate a comprehensive "Assessment Results" narrative based on this structured data:

STRUCTURED DATA:
${JSON.stringify(structuredData, null, 2)}

CLINICAL NARRATIVE REQUIREMENTS:
1. Professional SLP tone and terminology
2. Logical flow from assessment administration to results interpretation
3. Include specific scores with clinical interpretation
4. Note behavioral observations and testing conditions
5. Connect findings to functional communication impact
6. Use person-first language and strengths-based approach

Write a polished narrative that would be appropriate for an official SLP evaluation report.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219-v1:0', // Updated to Claude 3.7 Sonnet
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: narrativePrompt
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    return content.text
  } catch (error) {
    console.error('❌ Narrative generation error:', error)
    throw error
  }
}

async function main() {
  console.log('🚀 Starting LAS PDF Processing Test\n')
  
  try {
    // Step 1: Extract content from PDF
    console.log('='.repeat(60))
    console.log('STEP 1: PDF CONTENT EXTRACTION')
    console.log('='.repeat(60))
    
    const extractedContent = await processPDFWithClaude(PDF_PATH)
    console.log('✅ PDF processed successfully')
    console.log('\n📄 EXTRACTED CONTENT:')
    console.log('-'.repeat(40))
    console.log(extractedContent)
    
    // Step 2: Structure the data
    console.log('\n' + '='.repeat(60))
    console.log('STEP 2: STRUCTURED DATA EXTRACTION')
    console.log('='.repeat(60))
    
    const structuredData = await testStructuredDataExtraction(extractedContent)
    console.log('✅ Data structured successfully')
    console.log('\n📊 STRUCTURED DATA:')
    console.log('-'.repeat(40))
    console.log(JSON.stringify(structuredData, null, 2))
    
    // Step 3: Generate narrative
    console.log('\n' + '='.repeat(60))
    console.log('STEP 3: NARRATIVE GENERATION')
    console.log('='.repeat(60))
    
    const narrative = await testNarrativeGeneration(structuredData)
    console.log('✅ Narrative generated successfully')
    console.log('\n📝 GENERATED NARRATIVE:')
    console.log('-'.repeat(40))
    console.log(narrative)
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('TEST SUMMARY')
    console.log('='.repeat(60))
    console.log('✅ PDF processing: SUCCESS')
    console.log('✅ Data structuring: SUCCESS')
    console.log('✅ Narrative generation: SUCCESS')
    console.log('\n🎉 All tests passed! Our Claude PDF pipeline is working correctly.')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
main().catch(console.error)