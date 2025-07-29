#!/usr/bin/env tsx

/**
 * Simple test for Claude PDF processing
 */

import fs from 'fs'
import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  timeout: 60000, // 60 second timeout
})

const PDF_PATH = '/Users/brandonbrewer/Linguosity/multi-modal-chatbot/test_input/LAS Assessment Report - Lucia Torres.pdf'

async function testClaudePDF() {
  console.log('📄 Testing Claude PDF processing...')
  
  if (!fs.existsSync(PDF_PATH)) {
    throw new Error(`PDF not found: ${PDF_PATH}`)
  }

  const pdfBuffer = fs.readFileSync(PDF_PATH)
  const base64Content = pdfBuffer.toString('base64')
  
  console.log(`📊 PDF size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`)
  
  try {
    console.log('🤖 Calling Claude API...')
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      temperature: 0.1,
      tool_choice: { type: 'auto' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this PDF and tell me what type of document it is and list the main sections you can see.'
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
    if (content.type === 'text') {
      console.log('✅ Success!')
      console.log('\n📄 Claude Response:')
      console.log('-'.repeat(50))
      console.log(content.text)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    
    // If it's a model error, try with Claude 3.5 Sonnet
    if (error instanceof Error && error.message.includes('model')) {
      console.log('🔄 Trying with Claude 3.5 Sonnet...')
      
      const fallbackResponse = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        temperature: 0.1,
        tool_choice: { type: 'auto' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this PDF and tell me what type of document it is and list the main sections you can see.'
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
      
      const fallbackContent = fallbackResponse.content[0]
      if (fallbackContent.type === 'text') {
        console.log('✅ Fallback Success!')
        console.log('\n📄 Claude Response:')
        console.log('-'.repeat(50))
        console.log(fallbackContent.text)
      }
    } else {
      throw error
    }
  }
}

testClaudePDF().catch(console.error)