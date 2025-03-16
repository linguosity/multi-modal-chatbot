'use client';

import { McpReportUpdater } from '@/components/reports/McpReportUpdater';

/**
 * Demonstration page for Claude with MCP Text Editor integration
 */
export default function McpDemoPage() {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-medium mb-2">Claude MCP Text Editor Demo</h1>
        <p className="text-gray-600 text-sm">
          This demo showcases how Claude's text editor tool can make precise edits to report sections
          using the MCP (Model Completion Protocol) server.
        </p>
      </header>
      
      <div className="bg-purple-50 border border-purple-200 rounded-md p-4 mb-6">
        <h2 className="text-lg font-medium text-purple-800 mb-2">How This Works</h2>
        <p className="text-sm text-purple-900 mb-3">
          Unlike traditional AI approaches that regenerate entire sections, Claude's text editor tool makes
          precise, surgical edits to your content:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-purple-900">
          <li>
            <strong>Precise Updates:</strong> Claude examines your input and identifies exactly which part of which
            section needs to be modified
          </li>
          <li>
            <strong>Preservation:</strong> All existing content that doesn't need to change is preserved exactly as is
          </li>
          <li>
            <strong>Efficiency:</strong> Uses fewer tokens since we're only modifying what needs to change
          </li>
          <li>
            <strong>MCP Integration:</strong> Commands like <code>str_replace</code> are executed by our MCP server 
            to update specific sections
          </li>
        </ul>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <h2 className="text-lg font-medium text-blue-800 mb-2">ℹ️ Demo Mode</h2>
        <p className="text-sm text-blue-900">
          This demo is running in client-side simulation mode. In production, it would connect to a Claude API
          and use the MCP server for text editing operations.
        </p>
      </div>
      
      <McpReportUpdater />
    </div>
  );
}