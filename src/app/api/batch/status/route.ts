import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { deepMerge } from '@/lib/reportUtils';
import { SpeechLanguageReportSchema } from '@/types/reportSchemas';
import { ZodError } from 'zod';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

/**
 * Convert S3 stream to string
 */
async function streamToString(stream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

/**
 * Check batch job status from Claude API
 */
async function checkBatchJobStatus(batchId: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  
  try {
    const response = await fetch(`https://api.anthropic.com/v1/messages/batches/${batchId}`, {
      method: 'GET',
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorData)}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error checking batch job status for ${batchId}:`, error);
    throw error;
  }
}

/**
 * Fetch batch results from S3 when complete
 */
async function fetchBatchResults(outputLocation: string) {
  try {
    // Parse S3 URL to get bucket and key
    const s3Url = new URL(outputLocation);
    const bucketName = s3Url.hostname;
    const key = s3Url.pathname.substring(1); // Remove leading slash
    
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    
    const response = await s3.send(getObjectCommand);
    if (!response.Body) {
      throw new Error('Empty response body from S3');
    }
    
    const contentString = await streamToString(response.Body);
    
    // Parse JSONL into array of objects
    const results = contentString
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => JSON.parse(line));
    
    return results;
  } catch (error) {
    console.error('Error fetching batch results from S3:', error);
    throw error;
  }
}

/**
 * Process the results from Claude's batch output
 */
function processClaudeOutput(result: any) {
  try {
    // Extract the specific output message from Claude's response
    if (!result.output || !result.output.content) {
      throw new Error('Invalid output format from Claude');
    }
    
    // Find text block in content array
    const textBlock = result.output.content.find((block: any) => block.type === 'text');
    if (!textBlock) {
      throw new Error('No text block found in Claude output');
    }
    
    // Parse JSON from text response
    const jsonOutput = JSON.parse(textBlock.text);
    
    // Validate the JSON against our schema
    try {
      const validatedData = SpeechLanguageReportSchema.parse(jsonOutput);
      console.log('JSON successfully validated against schema');
      return validatedData;
    } catch (zodError) {
      if (zodError instanceof ZodError) {
        console.error('Zod validation error:', JSON.stringify(zodError.format(), null, 2));
        
        // Despite validation errors, we might still want to return the data
        // but with proper logging and flagging
        console.warn('Returning non-validated data for manual review');
        return {
          ...jsonOutput,
          _validation: {
            passed: false,
            errors: zodError.format()
          }
        };
      }
      throw zodError;
    }
  } catch (error) {
    console.error('Error processing Claude output:', error);
    throw error;
  }
}

/**
 * Verify user has permission to access the batch job
 */
async function verifyBatchAccess(batchId: string, userId: string, supabase: any) {
  try {
    // Check if batch job exists and belongs to user
    const { data: batchData, error: batchError } = await supabase
      .from('batch_jobs')
      .select('*')
      .eq('batch_id', batchId)
      .eq('user_id', userId)
      .single();
      
    if (batchError || !batchData) {
      console.error(`User ${userId} attempted to access unauthorized batch ${batchId}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error verifying batch access for ${batchId}:`, error);
    return false;
  }
}

/**
 * API route handler for checking batch job status
 */
export async function GET(request: NextRequest) {
  // Extract batchId from query parameters
  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get('batchId');
  
  if (!batchId) {
    return NextResponse.json(
      { error: 'batchId parameter is required' },
      { status: 400 }
    );
  }
  
  // Check authentication
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Get the current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // If no user, return Unauthorized
  if (authError || !user) {
    console.error(`API Route: Unauthorized access attempt to batch status for ${batchId}`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // User is authenticated
  const userId = user.id;
  console.log(`Authenticated user ${userId} checking batch status for ${batchId}`);
  
  // Verify user has access to this batch job
  const hasAccess = await verifyBatchAccess(batchId, userId, supabase);
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Batch job not found or access denied' },
      { status: 403 }
    );
  }
  
  try {
    // Check batch job status
    const batchStatus = await checkBatchJobStatus(batchId);
    
    // Update batch status in database
    await supabase
      .from('batch_jobs')
      .update({ 
        status: batchStatus.status || 'unknown',
        last_checked: new Date().toISOString()
      })
      .eq('batch_id', batchId)
      .eq('user_id', userId);
    
    // If job is not complete, return status only
    if (batchStatus.status !== 'completed') {
      return NextResponse.json({
        batchId,
        status: batchStatus.status,
        progress: batchStatus.progress || {},
        createdAt: batchStatus.created_at,
      });
    }
    
    // Job is complete, fetch results from S3
    const outputLocation = batchStatus.output_file_url;
    const batchResults = await fetchBatchResults(outputLocation);
    
    // Update database with completion info
    await supabase
      .from('batch_jobs')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('batch_id', batchId)
      .eq('user_id', userId);
    
    // Process the first result (we typically have only one request per batch for now)
    // This now includes Zod validation against the schema
    const validatedData = processClaudeOutput(batchResults[0]);
    
    // Return the processed report data
    return NextResponse.json({
      batchId,
      status: 'completed',
      data: validatedData
    });
  } catch (error) {
    console.error(`Error processing batch ${batchId}:`, error);
    
    // Update database with error info
    await supabase
      .from('batch_jobs')
      .update({ 
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        last_checked: new Date().toISOString()
      })
      .eq('batch_id', batchId)
      .eq('user_id', userId);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error',
        batchId
      },
      { status: 500 }
    );
  }
}

/**
 * API route handler for merging the batch results with existing report data
 */
export async function POST(request: NextRequest) {
  // Check authentication
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // Get the current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // If no user, return Unauthorized
  if (authError || !user) {
    console.error(`API Route: Unauthorized access attempt to batch merge`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // User is authenticated
  const userId = user.id;
  
  try {
    const { batchId, currentReport, reportId } = await request.json();
    
    if (!batchId) {
      return NextResponse.json(
        { error: 'batchId parameter is required' },
        { status: 400 }
      );
    }
    
    if (!currentReport) {
      return NextResponse.json(
        { error: 'currentReport is required' },
        { status: 400 }
      );
    }
    
    // Verify user has access to this batch job
    const hasAccess = await verifyBatchAccess(batchId, userId, supabase);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Batch job not found or access denied' },
        { status: 403 }
      );
    }
    
    // If reportId is provided, verify ownership
    if (reportId) {
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('id')
        .eq('id', reportId)
        .eq('user_id', userId)
        .single();
      
      if (reportError || !reportData) {
        console.error(`User ${userId} attempted to update unauthorized report ${reportId}`);
        return NextResponse.json({ error: 'Report not found or access denied' }, { status: 403 });
      }
      
      console.log(`Verified ownership of report ${reportId} for user ${userId}`);
    }
    
    // Check batch job status
    const batchStatus = await checkBatchJobStatus(batchId);
    
    // If job is not complete, return error
    if (batchStatus.status !== 'completed') {
      return NextResponse.json(
        { error: `Batch job ${batchId} is not completed yet. Status: ${batchStatus.status}` },
        { status: 400 }
      );
    }
    
    // Job is complete, fetch results
    const outputLocation = batchStatus.output_file_url;
    const batchResults = await fetchBatchResults(outputLocation);
    
    // Process the first result with Zod validation
    const newReportData = processClaudeOutput(batchResults[0]);
    
    // Check if validation passed
    if (newReportData._validation && !newReportData._validation.passed) {
      console.warn('Proceeding with merge despite validation errors');
      // You might want to add additional logic here, such as:
      // - Returning a 400 error if validation is critical
      // - Sending notification to admin
      // - Adding metadata to flag the report as potentially problematic
    }
    
    // Merge the new data with the current report
    const mergedReport = deepMerge(currentReport, newReportData);
    
    // Update metadata
    mergedReport.metadata = {
      ...mergedReport.metadata,
      lastUpdated: new Date().toISOString(),
      version: (mergedReport.metadata?.version || 0) + 1,
      userId: userId // Store the user ID in metadata
    };
    
    // If reportId is provided, update report in database
    if (reportId) {
      const { error: updateError } = await supabase
        .from('reports')
        .update({ 
          content: mergedReport,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .eq('user_id', userId);
      
      if (updateError) {
        console.error(`Error updating report ${reportId}:`, updateError);
        // Continue anyway to return the merged report to the client
      } else {
        console.log(`Successfully updated report ${reportId} with batch results`);
      }
    }
    
    // Mark batch job as applied in database
    await supabase
      .from('batch_jobs')
      .update({ 
        status: 'applied',
        report_id: reportId || null,
        applied_at: new Date().toISOString()
      })
      .eq('batch_id', batchId)
      .eq('user_id', userId);
    
    // Return the merged report
    return NextResponse.json({
      batchId,
      status: 'completed',
      report: mergedReport,
      reportId: reportId || null
    });
  } catch (error) {
    console.error('Error in batch merge operation:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error'
      },
      { status: 500 }
    );
  }
}