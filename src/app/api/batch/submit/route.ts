import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { normalizeInput } from '@/lib/reportUtils';
import { generateMCPInstructions, createBatchInputJsonl, getFullSchemaOutline } from '@/lib/batchApiHelper';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

// Import AWS SDK for S3 operations
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

/**
 * Upload string content to S3 bucket
 */
async function uploadToS3(content: string, key: string): Promise<string> {
  const bucketName = process.env.S3_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME environment variable is not set');
  }
  
  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: content,
      ContentType: 'application/jsonl'
    }));
    
    return `s3://${bucketName}/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

/**
 * Submit a batch job to Claude Batch API
 */
async function submitBatchJob(inputFileUrl: string, outputFileUrl: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages/batches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        input_file_url: inputFileUrl,
        output_file_url: outputFileUrl
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorData)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting batch job:', error);
    throw error;
  }
}

/**
 * API route handler for batch job submission
 */
export async function POST(request: NextRequest) {
  // Generate a unique request ID for logging
  const requestId = uuidv4();
  console.log(`[${requestId}] Batch job submission request received`);
  
  // Check authentication
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  
  // Get the current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // If no user, return Unauthorized
  if (authError || !user) {
    console.error(`[${requestId}] API Route: Unauthorized access attempt`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // User is authenticated
  const userId = user.id;
  console.log(`[${requestId}] Authenticated user: ${userId}`);
  
  try {
    // Parse the request
    const { input, pdfData, reportId } = await request.json();
    const isPdfUpload = !!pdfData;
    
    // Log the type of submission
    console.log(`[${requestId}] Processing ${isPdfUpload ? 'PDF upload' : 'text input'} for report ${reportId || 'new'}`);
    
    // If reportId is provided, verify ownership
    if (reportId) {
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('id')
        .eq('id', reportId)
        .eq('user_id', userId)
        .single();
      
      if (reportError || !reportData) {
        console.error(`[${requestId}] User ${userId} attempted to access unauthorized report ${reportId}`);
        return NextResponse.json({ error: 'Report not found or access denied' }, { status: 403 });
      }
      
      console.log(`[${requestId}] Verified ownership of report ${reportId} for user ${userId}`);
    }
    
    // Normalize the input using the existing function
    const normalizedInput = await normalizeInput(isPdfUpload ? { pdfData } : input);
    
    // Get the schema outline
    const FULL_SCHEMA_OUTLINE = getFullSchemaOutline();
    
    // Generate MCP instructions
    const mcpInstructionsString = generateMCPInstructions(FULL_SCHEMA_OUTLINE);
    
    // Construct message content based on input type
    let messageContent;
    
    if (isPdfUpload) {
      // For PDF uploads
      messageContent = [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: normalizedInput // The base64 PDF string
          }
        },
        {
          type: "text",
          text: mcpInstructionsString // Instructions ONLY
        }
      ];
    } else {
      // For text input
      messageContent = [
        {
          type: "text",
          // Combine instructions AND the user's text input here
          text: `${mcpInstructionsString}\n\n<UserInputText>\n${normalizedInput}\n</UserInputText>`
        }
      ];
    }
    
    // Prepare batch request
    const batchRequests = [{
      customId: `report-${requestId}`,
      messages: [{ role: 'user', content: messageContent }]
    }];
    
    // Create .jsonl content
    const jsonlContent = createBatchInputJsonl(batchRequests);
    
    // Generate S3 keys for input and output files
    const timestamp = Date.now();
    const inputKey = `batch-inputs/${userId}/${timestamp}-${requestId}.jsonl`;
    const outputKey = `batch-outputs/${userId}/${timestamp}-${requestId}.jsonl`;
    
    // Upload .jsonl content to S3
    const inputFileUrl = await uploadToS3(jsonlContent, inputKey);
    const outputFileUrl = `s3://${process.env.S3_BUCKET_NAME}/${outputKey}`;
    
    // Submit batch job to Claude API
    const batchResponse = await submitBatchJob(inputFileUrl, outputFileUrl);
    
    // Extract batch ID from response
    const batchId = batchResponse.id;
    
    console.log(`[${requestId}] Batch job submitted successfully. Batch ID: ${batchId}`);
    
    // Store batch job info in the database
    const { error: batchInsertError } = await supabase
      .from('batch_jobs')
      .insert({
        batch_id: batchId,
        request_id: requestId,
        user_id: userId,
        report_id: reportId || null,
        status: 'submitted',
        input_type: isPdfUpload ? 'pdf' : 'text',
        input_file_url: inputFileUrl,
        output_file_url: outputFileUrl,
        created_at: new Date().toISOString()
      });
    
    if (batchInsertError) {
      console.error(`[${requestId}] Error recording batch job in database:`, batchInsertError);
      // Continue anyway, as the API call was successful
    }
    
    // Return the batch ID and request ID to the client
    return NextResponse.json({
      batchId,
      requestId,
      status: 'submitted',
      message: 'Batch job submitted successfully'
    });
  } catch (error) {
    console.error(`[${requestId}] Error in batch submission:`, error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error'
      },
      { status: 500 }
    );
  }
}