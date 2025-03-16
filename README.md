
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) and designed to be fun and easy to get your hands dirty with the AI SDK.

## Claude Integration Notes

### Important: API Keys Required
When working with Claude integrations, an actual Claude API key is required for production use. Client-side simulations are provided as fallbacks only for development but are impractical for real use cases since they lack the precise text edit capabilities of Claude's text editor tool.

The MCP (Model Completion Protocol) demo requires proper server-side API configuration to work correctly. Without properly configured server environments, the tool commands cannot be executed as intended.

### Claude Text Editor Tool Integration

We've implemented a demonstration of Claude's text editor tool in the `/reports/text-editor-test` route. This implementation shows how to:

1. Make proper API calls to Claude with the text editor tool
2. Handle the two-way conversation flow that Claude uses for editing
3. Process different commands like `str_replace`, `view`, and `insert`
4. Apply the edits to text in a controlled manner

#### Common Errors and Solutions

During implementation, we encountered several issues that may be helpful for future developers:

1. **System Message Formatting**:
   - **Error**: "Unexpected role 'system'. The Messages API accepts a top-level `system` parameter, not 'system' as an input message role."
   - **Fix**: Use the top-level `system` parameter instead of including a system message in the messages array:
   ```javascript
   // Incorrect
   messages: [
     { role: 'system', content: '...' },
     { role: 'user', content: '...' }
   ]
   
   // Correct
   system: '...',
   messages: [
     { role: 'user', content: '...' }
   ]
   ```

2. **Text Editor Tool Workflow**:
   - **Issue**: Claude typically follows a two-step process when using the text editor tool, first requesting to view the content before making edits.
   - **Fix**: Implement the complete conversation flow:
     - Handle Claude's initial `view` command
     - Respond with the requested content
     - Process the subsequent `str_replace` or other editing command
     - Apply the edits to the original text

3. **Tool Use Clarity**:
   - **Issue**: Claude sometimes doesn't use the text editor tool as expected.
   - **Fix**: Make instructions very explicit in both system and user messages:
   ```javascript
   system: 'You MUST use the text editor tool with a str_replace command...',
   content: '... You MUST use the text_editor_20250124 tool with a str_replace command...'
   ```

#### Implementation Best Practices

- Always provide detailed error handling for API calls
- Use a two-way conversation model for the text editor tool
- Validate edits before applying them (checking for unique matches)
- Include a fallback mechanism for when the API is unavailable
- Log Claude's responses for debugging purposes

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
