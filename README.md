# Linguosity - AI-Powered Speech-Language Assessment Tool

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) and designed to be fun and easy to get your hands dirty with the AI SDK.

## Project Overview

Linguosity is an AI-powered application designed to assist Speech-Language Pathologists (SLPs) in creating comprehensive assessment reports. The application leverages Claude's capabilities to process and analyze assessment data, generate professional reports, and export them in various formats.

### Key Features

- **Intelligent Report Generation**: Create professional speech-language assessment reports with AI assistance
- **PDF Document Processing**: Upload assessment PDFs for automatic data extraction
- **DOCX Export**: Export reports as Microsoft Word documents with customizable templates
- **Interactive Editing**: Modify report sections with real-time AI feedback
- **Domain-Specific Tools**: Organize assessment tools by language domain (receptive, expressive, etc.)
- **Multi-format Export**: Export reports as DOCX or HTML
- **User-Specific Reports**: Each user has their own reports section with proper navigation

## March 30, 2025 Update: User-Specific Reports Structure and Navigation

We've implemented a comprehensive restructuring of the application to support user-specific reports with proper navigation:

### 1. New URL Structure
- Changed from `/reports/*` to `/dashboard/[userId]/reports/[reportId]`
- Each user now has their own reports section with independent data
- Proper route parameters for user ID and report ID
- Added middleware to handle redirects from old URLs to new structure

### 2. Navigation Improvements
- Updated dashboard layout with section navigation
- Report sections now appear in the sidebar under "Linguosity Suite" when viewing a specific report
- Fixed context provider issue to ensure proper state management across pages
- Added breadcrumb navigation for easy movement between screens

### 3. Report Management
- Created a reports list page with search and filtering
- Added "New Report" button for creating new reports
- Implemented mock data with user-specific structure
- Set up foundation for eventual Supabase integration

### Technical Changes
- Moved files from `/reports` to `/dashboard/[userId]/reports`
- Implemented ReportsProvider context for section navigation
- Created middleware for URL redirects
- Fixed bugs in the navbar linking

### 4. Bundle Analysis with Next.js Bundle Analyzer
- Added `@next/bundle-analyzer` for visualizing bundle size
- Configure build analysis with `ANALYZE=true pnpm build`
- Track and optimize bundle size for better performance

### 5. Schema Validation with Zod
- Implemented comprehensive schema validation for report data
- Created type definitions with proper validation rules
- Added error handling for malformed data
- Set up proper type inference for TypeScript integration

## Claude Integration Notes

### Important: API Keys Required
When working with Claude integrations, an actual Claude API key is required for production use. Client-side simulations are provided as fallbacks only for development but are impractical for real use cases since they lack the precise text edit capabilities of Claude's text editor tool.

The MCP (Model Completion Protocol) demo requires proper server-side API configuration to work correctly. Without properly configured server environments, the tool commands cannot be executed as intended.

### Claude Text Editor Tool Integration

We've implemented a demonstration of Claude's text editor tool in the reports editor. This implementation shows how to:

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

## March 29, 2025 Update: Batch Processing with Anthropic's Message Batches API

Today we implemented an efficient batch processing system for speech-language reports using Anthropic's Message Batches API. This significant enhancement allows the application to process multiple report sections in parallel, greatly improving performance and reducing processing time.

### 1. Parallel Processing Architecture

We redesigned the API route to use Anthropic's Message Batches API, which enables:
- Processing multiple report sections simultaneously (header, background, assessment results, conclusion)
- Token counting for monitoring API usage
- Asynchronous batch status tracking through polling
- Robust error handling with simulation fallbacks

### 2. Implementation Highlights

**API Structure:**
- Main batch endpoint (`/api/text-editor-test/route.ts`):
  - Creates and submits batch requests to Anthropic
  - Prepares specialized prompts for each section
  - Implements token counting
  - Returns a batch ID for status tracking

- Status endpoint (`/api/text-editor-test/status/route.ts`):
  - Polls Anthropic's API for batch status
  - Fetches and processes results when batch completes
  - Extracts and applies update commands from Claude's responses
  - Falls back to simulation mode if API calls fail

**UI Components:**
- Added `BatchRequestStatus` component for real-time progress tracking
- Enhanced `EditorPanel` with batch processing mode
- Updated `CommandDetailsCard` to show batch processing results

### 3. Technical Challenges Solved

- **Batch ID Validation**: Added robust validation to ensure batch IDs match Anthropic's format (msgbatch_ prefix)
- **Error Recovery**: Implemented simulation fallbacks for API failures
- **JSON Parsing**: Added advanced error handling for malformed JSON responses
- **Result Parsing**: Built a system to extract and apply update commands from batch results
- **Progress Tracking**: Developed a comprehensive status tracking system with visual feedback

### 4. Assessment Data Extraction

Enhanced the batch processing system to extract and properly place assessment tools:
- Automatically identifies standardized tests mentioned in input (GFTA-3, CELF-5, etc.)
- Places test scores and results in appropriate domain sections
- Updates the global assessment tools list
- Extracts specific subtest details and includes them in domain needs/strengths

### 5. Performance Benefits

Batch processing offers significant performance improvements:
- Processes multiple sections in parallel instead of sequentially
- Reduces overall processing time by ~50-70% for complete reports
- Maintains context relevance by using section-specific prompts
- Provides real-time progress tracking

This implementation of batch processing represents a significant architectural improvement that enhances both performance and user experience.

## March 27, 2025 Update: Floating Editor Panel Implementation

Today we implemented a floating pencil icon with a collapsible editor panel for the report interface. This feature provides users with a persistent editor tool that remains accessible while scrolling through long reports.

### 1. Floating Editor UI Implementation
We created a floating editor interface with the following components:
- A small pencil icon button that's always visible in the upper-left corner of the report
- An expandable panel that appears when the pencil is clicked
- Panel content with editing tools, input field, and export options
- Toggle behavior that maintains proper positioning during scroll

### 2. Technical Implementation Challenges
Several positioning and rendering approaches were explored before finding an optimal solution:

**Challenge #1: Editor Panel Positioning**
- **Issue**: Initial implementations using Popover from shadcn/ui caused positioning problems because of portal-based rendering
- **Solution**: Implemented a custom solution using CSS positioning instead of relying on the Popover component
- **Approach Evolution**:
  1. Started with absolute positioning, which broke scroll containment
  2. Tried fixed positioning, which caused issues with other page elements
  3. **Final Solution**: Used sticky positioning inside a scrollable container for both the pencil icon and editor panel

**Challenge #2: Layout Preservation During Toggle**
- **Issue**: Initially used conditional rendering (`{isOpen && <Component />}`) which caused layout jumps when toggling between the pencil and editor panel
- **Solution**: Implemented a CSS-based visibility approach that keeps both elements in the DOM
- **Implementation Details**:
  ```tsx
  {/* Pencil icon - always rendered but visibility toggled with CSS */}
  <Button
    className={`... ${editorOpen ? "invisible pointer-events-none" : ""}`}
    onClick={() => setEditorOpen(true)}
  >
    <Pencil />
  </Button>
  
  {/* Editor panel - always rendered but visibility toggled with CSS */}
  <div className={`... ${editorOpen ? "" : "invisible pointer-events-none"}`}>
    {/* Panel content */}
  </div>
  ```

**Challenge #3: Z-index Management**
- **Issue**: Ensuring the editor panel properly overlays report content without being hidden by other elements
- **Solution**: Carefully structured the z-index hierarchy and container stacking
- **Key Implementation**: Used `z-[9999]` to ensure the panel appears above all other page elements while maintaining proper DOM relationships

### 3. Debugging Approach
We used a systematic debugging approach to solve these UI challenges:
- Added debug logging with console output for state changes
- Added class name logging to track component rendering
- Studied DOM element hierarchies to understand rendering context
- Tested multiple positioning strategies to find the optimal solution
- Implemented visibility transitions to prevent layout shifts

### 4. Accessibility Considerations
The implementation includes several accessibility enhancements:
- Added aria-label to the pencil button
- Ensured keyboard accessibility for the toggle controls
- Used pointer-events-none to prevent interaction with invisible elements
- Maintained focus management when toggling between states

This floating editor implementation provides a clean, non-intrusive way for users to access editing tools while reviewing report content, improving the overall user experience by keeping important controls accessible without sacrificing screen real estate.

## March 22, 2025 Update: DOCX Export Bugfixes

Today we fixed two critical issues with the DOCX export functionality:

### 1. DOCX Template File Issue
We identified and resolved an issue where the main template file (`report-template.docx`) in the `/public/templates/` directory was not a valid DOCX file but a text file with a .docx extension. This was causing errors like:
- "Can't find end of central directory: is this a zip file?"
- "Invalid DOCX file signature. First bytes: [...]"
- "The file does not appear to be a valid DOCX file (missing PK signature)"

**Root cause**: DOCX files are ZIP archives containing XML content and must start with the "PK" file signature (bytes [0x50, 0x4B]). The main template was mistakenly saved as a plain text file.

**Solution**: 
1. Updated the application to use the valid DOCX template (`las-assessment-report-template.docx`) instead
2. Added signature validation to verify template files have the correct ZIP/DOCX headers
3. Implemented multiple fallback mechanisms:
   - Try alternative template if the primary one fails
   - Generate a simple HTML report if all DOCX templates fail

### 2. Template Tag Notation Issue
We fixed a second issue with Docxtemplater throwing "Multi error" exceptions when trying to render DOCX files with mismatched data formats.

**Root cause**: The DOCX templates were using underscore notation for tags (e.g., `{header_studentInformation_firstName}`), but our data was in nested object format using dot notation (e.g., `header.studentInformation.firstName`), causing Docxtemplater to fail finding matching data fields.

**Solution**:
1. Implemented a data transformation function in `docx-generator.ts` that flattens nested objects to underscore notation
2. Updated the code to support both dot and underscore notation in templates
3. Added comprehensive error diagnostics to help identify template tag issues:
   - Extracts and logs all tags found in templates
   - Detects whether templates use dot or underscore notation
   - Provides detailed error information for template rendering failures
4. Enhanced the JSON data preparation to ensure compatibility with Docxtemplater's loop syntax for arrays

## March 17, 2025 Update: DOCX Export & PDF Processing Enhancements

Earlier we implemented several significant improvements to the speech-language report editor:

### 1. DOCX Export Functionality
We've added the ability to export reports as Microsoft Word (.docx) documents:
- Used docxtemplater and pizzip libraries for report generation
- Created customizable template system for consistent document formatting
- Added a template creation tool for users to define their own report formats
- Implemented proper formatting of arrays (strengths, needs, recommendations) as bulleted lists
- Added export button to the report interface for one-click document creation
- **NEW**: Added specialized LAS Assessment Report template with appropriate tags and formatting

### 2. PDF Upload & Processing
We added PDF upload capability, allowing users to submit assessment test results directly from PDFs. Key features:
- Drag-and-drop interface for PDF uploads using ShadCN components
- Base64 encoding of PDFs for direct processing by Claude
- Custom prompting to extract relevant information from standardized tests
- Automatic update of report domains based on extracted data

### 3. Domain-Specific Assessment Tools
We solved a key workflow issue by implementing domain-specific assessment tools:
- Added `assessmentTools` array to each domain section
- Modified Claude's prompts to place extracted tool names directly in relevant domains
- Created UI to display domain-specific tools with "Add to global list" functionality
- Implemented visual feedback showing which tools are already in the global list

### 4. User Experience Improvements
We enhanced usability with several quality-of-life features:
- Added a "Clear Report" button with confirmation dialog
- Implemented tabbed interface for switching between text and PDF input methods
- Added success/error feedback for all operations
- Optimized token usage by targeting specific report sections

### Technical Challenges Overcome
1. **DOCX Template System**: Creating a flexible template system required careful consideration of:
   - How to handle array data in docxtemplater (converting arrays to special format for loops)
   - Properly structuring document templates for professional reports
   - Creating a user-friendly template creation process

2. **Binary File Handling**: We encountered and resolved several issues with DOCX file handling:
   - Ensuring templates are properly loaded as binary data, not text files
   - Adding validation for DOCX file signatures to detect invalid templates
   - Implementing multiple fallback mechanisms for template failures
   - Understanding the ZIP file format that underlies DOCX files

3. **Template Tag Formatting**: We solved issues with Docxtemplater tag notation:
   - Created a data transformation system that converts nested objects to flattened underscore notation
   - Implemented support for both dot notation (`{header.studentInformation.firstName}`) and underscore notation (`{header_studentInformation_firstName}`)
   - Added template analysis to detect which notation is being used in templates
   - Developed better diagnostics to pinpoint problematic tags in templates

4. **PDF Processing**: We needed to properly handle PDF data through the entire pipeline - from client-side upload to base64 encoding to Claude's document processing capabilities.

5. **Assessment Tool Integration**: Initially, Claude correctly extracted test names but placed them in a non-standard location within the domain objects. We solved this by:
   - Defining a clear schema for domain-specific assessment tools
   - Updating system prompts to guide Claude in placing tools correctly
   - Creating a UI for promoting domain tools to the global tools list

6. **Multi-stage API Interactions**: The solution required careful handling of the multi-stage conversation with Claude, ensuring proper context is maintained when processing PDFs.

This implementation provides a much more intuitive workflow for speech-language pathologists, allowing them to directly upload test materials and have relevant information automatically extracted, organized within the report structure, and exported to standard document formats.

## Getting Started

### Development with SSL Certificate Issues

If you're encountering SSL/TLS certificate issues (common in development):

```bash
# Use the safe dev command that disables TLS verification
npm run dev:safe
# or 
yarn dev:safe
# or
pnpm dev:safe
```

### Standard Development

For normal development without SSL issues:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

### Authentication

The application now uses Supabase for authentication with server-side routes. Make sure to:

1. Have a Supabase project with authentication enabled
2. Set the following environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

### Troubleshooting

If you encounter issues:

1. Try using `npm run dev:safe` to bypass SSL certificate issues
2. Check browser console for error messages
3. Clear browser cookies and localStorage
4. Ensure Supabase project settings match your environment variables

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.