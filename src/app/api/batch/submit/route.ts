// src/app/api/batch/submit/route.ts
// NOTE: Renaming this route might be clearer, e.g., /api/process-report-section
'use server'; // Ensure this runs on the server

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server'; // Your server client factory
import type { Database } from '@/types/supabaseTypes';

// --- Removed S3 imports and client ---
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
// const s3 = new S3Client(...);
// --- Removed S3 upload function ---
// async function uploadToS3(...) { ... }

// --- Removed Batch API helpers (unless needed elsewhere) ---
// import { generateMCPInstructions, createBatchInputJsonl, getFullSchemaOutline } from '@/lib/batchApiHelper';
// --- Removed Batch job submission function ---
// async function submitBatchJob(...) { ... }

// --- Import helpers needed for Claude call ---
import { normalizeInput } from '@/lib/reportUtils'; // Keep if used for text
import { generateMCPInstructions, getFullSchemaOutline } from '@/lib/batchApiHelper'; // Keep if these generate prompts

// --- Placeholder Type for Claude's JSON response ---
// Replace with a more specific type if possible
type ClaudeReportUpdate = Record<string, any>;

/**
 * Call Claude's synchronous Messages API
 */
async function callClaudeMessagesApi(systemPrompt: string, userContent: string): Promise<ClaudeReportUpdate> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229'; // Or your preferred model
    const maxTokens = 4096; // Adjust as needed

    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }

    console.log('[Claude Call] Sending request...');
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01', // Or latest required version
                'x-api-key': apiKey
            },
            body: JSON.stringify({
                model: model,
                max_tokens: maxTokens,
                system: systemPrompt, // Use the System Prompt field
                messages: [
                    {
                        role: 'user',
                        content: userContent // Just the user's input text
                    }
                ]
                // Add other parameters like temperature if needed
            })
        });

        if (!response.ok) {
            const errorData = await response.text(); // Get text for more details
            console.error('[Claude Call] API Error Response Body:', errorData);
            throw new Error(`Claude API request failed: ${response.status} ${response.statusText}.`);
        }

        const result = await response.json();
        console.log('[Claude Call] Received response.');

        // --- IMPORTANT: Extract the actual JSON content ---
        // This depends heavily on Claude's response structure for your prompt.
        // Assuming the main content is in result.content[0].text and is valid JSON string
        if (result.content && result.content[0] && result.content[0].type === 'text') {
            try {
                // Attempt to parse the text content as JSON
                const jsonResult = JSON.parse(result.content[0].text);
                return jsonResult as ClaudeReportUpdate;
            } catch (parseError) {
                console.error("[Claude Call] Failed to parse Claude's text response as JSON:", parseError);
                console.error("[Claude Call] Raw text response:", result.content[0].text);
                throw new Error("Claude did not return valid JSON content.");
            }
        } else {
            console.error("[Claude Call] Unexpected response structure:", result);
            throw new Error("Received unexpected response structure from Claude.");
        }

    } catch (error) {
        console.error('[Claude Call] Error calling Claude Messages API:', error);
        throw error; // Re-throw to be caught by the main handler
    }
}


/**
 * API route handler for SYNCHRONOUS report processing
 */
export async function POST(request: NextRequest) {
    const requestId = uuidv4();
    console.log(`[${requestId}] SYNC report processing request received`);

    // --- Authentication (same as before) ---
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);
    if (!supabase) return NextResponse.json({ error: 'Server error: Supabase client failed' }, { status: 500 });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error(`[${requestId}] API Route: Unauthorized access attempt`);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;
    console.log(`[${requestId}] Authenticated user: ${userId}`);
    // --- End Authentication ---

    try {
        const { input, pdfData, reportId } = await request.json();
        const isPdfUpload = !!pdfData;

        // --- STOP if it's a PDF upload for now ---
        if (isPdfUpload) {
            console.warn(`[${requestId}] PDF upload received, but synchronous processing is not recommended. Aborting.`);
            return NextResponse.json(
                { error: 'PDF processing should use an asynchronous method (e.g., via Supabase Storage triggers). Direct synchronous processing not supported here.' },
                { status: 400 }
            );
        }
        // --- End PDF Check ---

        // Proceed only with text input
        if (!input) {
            return NextResponse.json({ error: 'Missing text input' }, { status: 400 });
        }

        // If reportId is provided, verify ownership (same as before)
        let currentReportData: any = {}; // To hold existing data if updating
        if (reportId && reportId !== 'new') {
             const { data: reportCheckData, error: reportError } = await supabase
                .from('reports')
                .select('id, report_data') // Select existing data if needed for merge
                .eq('id', reportId)
                .eq('user_id', userId)
                .single();

            if (reportError || !reportCheckData) {
                console.error(`[${requestId}] User ${userId} attempted to access unauthorized report ${reportId}`);
                return NextResponse.json({ error: 'Report not found or access denied' }, { status: 403 });
            }
             currentReportData = reportCheckData.report_data || {}; // Get existing JSONB data
            console.log(`[${requestId}] Verified ownership of report ${reportId} for user ${userId}`);
        } else {
             console.log(`[${requestId}] Processing for a new report or without specific report ID context.`);
             // Handle how to create a new report ID if necessary, maybe requires client to create first?
             // For now, assume reportId must exist for updates via this endpoint.
              if (!reportId || reportId === 'new') {
                 return NextResponse.json({ error: 'A valid report ID is required for updates.' }, { status: 400 });
              }
        }


        // --- Prepare for Claude Call (using your existing helpers) ---
        const normalizedInput = await normalizeInput(input); // Assuming this works for text
        const FULL_SCHEMA_OUTLINE = getFullSchemaOutline();
        const systemPrompt = generateMCPInstructions(FULL_SCHEMA_OUTLINE); // Use as System Prompt
        const userContent = `<UserInputText>\n${normalizedInput}\n</UserInputText>`; // Just the user input

        // --- Call Claude Synchronously ---
        const claudeResultJson = await callClaudeMessagesApi(systemPrompt, userContent);
        console.log(`[${requestId}] Claude processing successful.`);

        // --- Merge results (optional, simple overwrite shown) ---
        // You might want more sophisticated merging logic here depending on how Claude returns data
        const updatedReportData = {
            ...currentReportData, // Preserve existing data
            ...claudeResultJson   // Overwrite/add fields from Claude's response
            // Add/Update metadata if needed:
            // metadata: { ...currentReportData.metadata, lastUpdated: new Date().toISOString() }
        };


        // --- Update Supabase Report Table ---
        console.log(`[${requestId}] Updating report ${reportId} in Supabase...`);
        const { data: updateData, error: updateError } = await supabase
            .from('reports')
            .update({ report_data: updatedReportData }) // Save to 'report_data' jsonb column
            .eq('id', reportId)
            .eq('user_id', userId)
            .select() // Optionally select the updated row to return
            .single(); // Assuming update affects one row

        if (updateError) {
            console.error(`[${requestId}] Supabase update error:`, updateError);
            throw new Error(`Failed to save report update: ${updateError.message}`);
        }
        console.log(`[${requestId}] Supabase update successful for report ${reportId}`);
        // --- End Supabase Update ---


        // --- Remove Batch Job Tracking ---
        // No need to insert into 'batch_jobs' table


        // --- Return Success Response ---
        return NextResponse.json({
            requestId,
            status: 'completed',
            message: 'Report section processed and saved successfully.',
            // Optionally return the updated data snippet if needed by the client
            // updatedReportSection: updateData // Contains the whole updated row
        });

    } catch (error) {
        console.error(`[${requestId}] Error in synchronous processing:`, error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'An unknown error occurred',
                status: 'error'
            },
            { status: 500 }
        );
    }
}