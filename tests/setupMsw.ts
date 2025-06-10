import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Mock response for Claude API
const claudeApiHandler = http.post('https://api.anthropic.com/v1/messages', () => {
  return HttpResponse.json({
    id: 'msg_012345',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: '{"result":"success","data":{"field1":"value1","field2":"value2"}}'
      }
    ],
    model: 'claude-3-7-sonnet-20250219',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 100,
      output_tokens: 50
    }
  });
});

// Mock response for Claude Batch API
const claudeBatchApiHandler = http.post('https://api.anthropic.com/v1/messages/batches', () => {
  return HttpResponse.json({
    id: 'msgbatch_012345',
    type: 'batch',
    status: 'submitted',
    progress: {
      percent_complete: 0,
      total_requests: 1,
      completed_requests: 0,
      errored_requests: 0
    },
    created_at: new Date().toISOString()
  });
});

// Mock response for Claude Batch Status API
const claudeBatchStatusHandler = http.get(
  'https://api.anthropic.com/v1/messages/batches/:batchId', 
  () => {
    return HttpResponse.json({
      id: 'msgbatch_012345',
      type: 'batch',
      status: 'completed',
      progress: {
        percent_complete: 100,
        total_requests: 1,
        completed_requests: 1,
        errored_requests: 0
      },
      created_at: new Date().toISOString(),
      output_file_url: 'https://example.com/s3/output.jsonl'
    });
  }
);

// Set up the server with our handlers
export const mswServer = setupServer(
  claudeApiHandler,
  claudeBatchApiHandler,
  claudeBatchStatusHandler
);