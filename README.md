# Linguosity - AI-Powered Speech-Language Assessment Tool

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) and designed to be fun and easy to get your hands dirty with the AI SDK.

## Project Overview

Linguosity is an AI-powered application designed to assist Speech-Language Pathologists (SLPs) in creating comprehensive assessment reports. The application leverages advanced AI capabilities, including Claude and OpenAI models, to streamline data analysis, automate report generation, and facilitate easy export of documents.

### Key Features

*   **AI-Assisted Report Generation**: Utilizes OpenAI and Claude models to create professional speech-language assessment reports.
*   **PDF Data Extraction**: Upload assessment PDFs for automated data extraction and integration into reports.
*   **Multi-Format Export**: Export reports as DOCX and HTML, with support for customizable templates.
*   **Real-Time Interactive AI Editing**: Modify and refine report sections with real-time AI assistance using Claude's text editor tool.
*   **Domain-Specific Assessment Tool Management**: Organize and manage assessment tools categorized by specific language domains (e.g., receptive, expressive).
*   **User Account Management**: Secure, user-specific accounts for managing individual reports and settings, powered by a Supabase backend.
*   **Batch Processing for Reports**: Efficiently generate multiple report sections in parallel for faster turnaround.
*   **Secure Authentication**: Robust user authentication and management to ensure data privacy and security.

## Project Structure

This project follows a standard Next.js application structure, with some specific additions for our features:

*   **`src/app/`**: Contains the core Next.js application logic, including:
    *   Pages and API routes (e.g., `src/app/dashboard/`, `src/app/api/auth/`).
    *   Global layout files (`layout.tsx`) and stylesheets (`globals.css`).
    *   Route-specific components and logic.
*   **`src/components/`**: Houses shared UI components used throughout the application.
    *   Includes subdirectories like `ui/` for shadcn/ui components.
    *   Contains custom components such as `header.tsx`, `app-sidebar.tsx`, and feature-specific components (e.g., `reports/`, `assessment/`).
*   **`src/lib/`**: Provides utility functions, helper scripts, and core logic modules.
    *   Examples: AI integration logic (e.g., `aiProvider.ts`, `claudeListGenerator.ts`), Supabase client setup (`supabase/`), DOCX generation (`docx-generator.ts`), and various utility functions (`utils.ts`).
*   **`src/hooks/`**: Contains custom React hooks to encapsulate reusable stateful logic (e.g., `useMobile.tsx`, `useReportUpdater.ts`).
*   **`public/`**: Stores static assets that are publicly accessible.
    *   Includes images (`linguosity_logo.jpg`, `landing-page-image.png`), favicons, and document templates (`public/templates/`).

### Key Configuration Files

*   **`next.config.js`**: Configures Next.js build settings, environment variables, webpack modifications, and server behavior.
*   **`middleware.ts`**: Implements request middleware for authentication, authorization, and URL redirections.
*   **`tailwind.config.ts`**: Defines the Tailwind CSS theme, customizations, and plugins.
*   **`components.json`**: Configuration file for shadcn/ui, tracking installed components.
*   **`.env.local`**: (Not committed, use `.env.example` as a template) Stores environment variables like API keys and Supabase credentials.
*   **`package.json`**: Lists project dependencies, scripts (for development, building, linting), and project metadata.
*   **`tsconfig.json`**: Specifies TypeScript compiler options for the project.
*   **`pnpm-lock.yaml`**: Lockfile for pnpm, ensuring consistent dependency installations.

## Core Technologies/Stack

Linguosity is built with a modern, robust technology stack:

### Frameworks & Frontend
*   **Next.js**: React framework for server-side rendering, static site generation, and API routes.
*   **React**: JavaScript library for building dynamic user interfaces.
*   **TypeScript**: Typed superset of JavaScript, enhancing code quality and maintainability.
*   **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
*   **shadcn/ui**: Accessible and customizable UI components.
*   **Framer Motion**: Animation library for creating fluid user experiences.

### AI & Machine Learning
*   **Vercel AI SDK**: Simplifies integration with various AI models and providers.
*   **OpenAI API**: Leveraged for diverse AI-driven features, including text generation and analysis.
*   **Anthropic Claude API**: Utilized for advanced language processing, particularly its text editing and document understanding capabilities.

### Backend & Database
*   **Supabase**: Provides backend-as-a-service, including user authentication, a PostgreSQL database, and real-time capabilities.

### Document Generation
*   **Docxtemplater**: Library for generating .docx documents from templates.
*   **Pizzip**: Used by Docxtemplater for handling .zip file operations (as .docx files are zipped XML).

### State Management & Forms
*   **Zustand**: Lightweight and flexible state management solution for React.
*   **React Hook Form**: Efficient library for managing forms and validation.

### Data Validation & Integrity
*   **Zod**: TypeScript-first schema declaration and validation library, ensuring data consistency.

### Development & Tooling
*   **pnpm**: Fast and disk space-efficient package manager.

## API Endpoints Overview

The backend API provides various endpoints to support the application's features. These are primarily located under `src/app/api/`.

*   **`/api/auth/`**: Manages all aspects of user authentication, including login, signup, logout, and session handling.
*   **`/api/batch/`**: Handles batch processing requests, such as the simultaneous generation of multiple report sections or complete documents.
*   **`/api/check-api-key/`**: Provides endpoints for validating external API keys (e.g., for OpenAI, Anthropic/Claude).
*   **`/api/generate-image/`**: Contains logic for any image generation capabilities within the application.
*   **`/api/generate-template/`**: Manages the creation, retrieval, and customization of report templates.
*   **`/api/lists/`**: Supports CRUD operations for customizable lists, like wordlists or other assessment-related lists.
*   **`/api/reports/`**: Offers endpoints for creating, reading, updating, and deleting user-specific reports.
*   **`/api/stories/`**: Includes functionality related to story generation or narrative creation tools.
*   **`/api/text-editor-test/`**: Houses specific API routes for testing and integrating with the Claude text editor tool.

**Note:** For more detailed information on user-facing application routes used for testing various report functionalities, please refer to the `test_routes.md` file in the repository.

## Authentication and Authorization

The application employs a robust system for managing user access and protecting routes, primarily leveraging Supabase and Next.js middleware.

### Supabase for Authentication

*   **User Management**: All core authentication processes, including user signup, login, password recovery, and session management, are handled by [Supabase](https://supabase.com/).
*   **Prerequisites**: To use the authentication features, developers need an active Supabase project with the Authentication service correctly configured and enabled.

### Route Protection with `middleware.ts`

*   **Access Control**: The `src/middleware.ts` file is central to the application's security model. It intercepts incoming requests to protected routes and API endpoints.
*   **Authentication Checks**: The middleware verifies the user's authentication status (e.g., by checking for a valid session cookie managed by Supabase) before allowing access to sensitive areas of the application.

### Redirection Logic

The middleware implements the following redirection rules:

*   **Authenticated Users on Auth Pages**: If an already authenticated user attempts to access authentication-related pages (e.g., `/auth/login`, `/auth/signup`), they are redirected to their main dashboard (typically `/dashboard`).
*   **Unauthenticated Users on Protected Routes**: If an unauthenticated user tries to access protected routes (e.g., `/dashboard/*`, `/api/reports/*`, `/api/batch/*`), they are redirected to the login page (`/auth`).
*   **Root Path (`/`) Handling**:
    *   Authenticated users accessing the root path are redirected to `/dashboard`.
    *   Unauthenticated users accessing the root path are redirected to `/auth`.
*   **Legacy URL Redirection**: The middleware also handles redirects for legacy URL structures. For instance, requests to old `/reports/*` paths are intelligently redirected to the new user-specific report URLs (e.g., `/dashboard/[userId]/reports/[reportId]`) after ensuring the user is authenticated.

### User-Specific Data Access

*   Once a user is authenticated, the application's frontend and backend logic ensure that they can only access and manage data relevant to their account. For example, when a user views their reports, the system fetches and displays only the reports belonging to that specific user, based on their authenticated user ID.

## DOCX Generation and Templates

The application provides robust functionality for exporting reports into DOCX format, utilizing a templating system for flexibility and customization.

### Core Libraries

*   The primary libraries responsible for DOCX generation are:
    *   **`docxtemplater`**: A library that replaces tags in a DOCX template with provided data.
    *   **`pizzip`**: Used by `docxtemplater` to handle the underlying ZIP file structure of DOCX documents.

### Template Storage

*   All DOCX templates are stored in the `public/templates/` directory.
*   An example of a key template is `las-assessment-report-template.docx`. Other templates may exist for different report types or layouts.

### Template Engine Basics

*   `docxtemplater` works by parsing `.docx` template files that contain specific tags (e.g., `{firstName}`, `{report_date}`, `{assessment_results}`). These tags are placeholders that get dynamically replaced with actual data from the application when a document is generated.
*   The templating engine supports more advanced features such as:
    *   **Loops**: For iterating over lists of items, such as strengths, needs, or recommendations, and rendering them appropriately (e.g., as bullet points).
    *   **Conditional rendering**: While not extensively detailed here, `docxtemplater` can support showing or hiding blocks of content based on data conditions.

### Data Preparation

*   Before generating a DOCX file, the application gathers and structures the necessary data (e.g., student information, observations, assessment scores, narrative sections). This structured data object is then passed to `docxtemplater` to populate the template.

### Customization and Best Practices

*   Users can customize the appearance and content of their exported reports by:
    *   Modifying the existing templates located in `public/templates/`.
    *   Creating new `.docx` template files and ensuring they use the correct `docxtemplater` tag syntax.
*   **Important Considerations for Custom Templates:**
    *   **Valid DOCX Format**: Templates must be valid DOCX files. A common issue in the past was a template being a text file with a .docx extension, which lacks the necessary PK ZIP signature. Ensure templates are saved correctly from an editor like Microsoft Word.
    *   **Tag Notation**: Pay close attention to tag notation. The system has been enhanced to handle data transformation (e.g., flattening nested objects like `header.studentInformation.firstName` to `header_studentInformation_firstName`), but consistency is key. Check existing templates for guidance.
    *   **Data Structure for Loops**: When dealing with loops (e.g., for lists), ensure the data passed to the template matches the structure expected by `docxtemplater`'s loop tags.

By understanding these basics, users can effectively manage and customize their DOCX report outputs.

## AI Integration

Linguosity harnesses the power of various AI models and services to provide its core features, streamlining the workflow for Speech-Language Pathologists.

### Core AI Technologies

The application integrates with the following primary AI services and SDKs:

*   **Vercel AI SDK**: Used to simplify interactions with various AI models and providers, offering a unified interface for managing AI-driven functionalities.
*   **OpenAI API**: Leveraged for a range of AI tasks, including text generation, data analysis, and potentially other utility functions within the application.
*   **Anthropic (Claude) API**: Specifically utilized for advanced language processing, most notably through Claude's powerful text editing capabilities and document understanding.

### Key AI-Powered Features

*   **Automated Report Generation**: AI plays a crucial role in drafting various sections of speech-language assessment reports. This includes generating initial content for background information, summarizing assessment results, forming clinical impressions, and suggesting recommendations based on the input data.
*   **PDF Data Extraction**: Users can upload PDF documents (e.g., standardized test protocols, previous reports). The AI then processes these documents to extract relevant data, such as test scores, behavioral observations, and other key information, integrating it into the current report structure.
*   **Interactive Text Editing (Claude)**: A significant feature is the real-time, AI-assisted text editing powered by Claude's text editor tool. This allows users to select report sections and have Claude help refine, rephrase, or expand upon the content interactively.
*   **Other AI Utilities**: The application may also employ AI for other specialized tasks such as generating domain-specific word lists or assisting in the creation of narrative components for reports, depending on the specific tools being used.

### API Key Management

*   **Crucial for Functionality**: The AI-powered features heavily rely on valid API keys for both OpenAI and Anthropic (Claude) services. Without these keys, most AI functionalities will not operate.
*   **Configuration**: Users must configure these API keys in their local environment. This is done by adding the respective keys to the `.env.local` file:
    ```env
    OPENAI_API_KEY=your_openai_api_key
    ANTHROPIC_API_KEY=your_anthropic_api_key
    ```
    (Note: The exact variable name for Claude might vary based on the integration provider; refer to the `.env.example` for specifics.)

### Notes on Claude Integration

The integration with Anthropic's Claude, especially its text editor tool, has specific considerations:

*   **Two-Step Conversation Flow**: Claude's text editor tool often follows a two-step process: it first requests to `view` the content before making edits with commands like `str_replace`. The application is designed to handle this conversational flow.
*   **Explicit Prompting**: For reliable and accurate results from Claude, especially when using its tools, system messages and user prompts need to be clear and explicit. The application incorporates carefully crafted prompts to guide the AI.
*   **Server-Side Configuration**: For full functionality, especially for advanced features like the Model Completion Protocol (MCP) demo, proper server-side API configuration is essential. Client-side simulations are for development fallbacks only.

### System Prompts and Prompt Engineering

The quality and relevance of AI-generated content are significantly influenced by the design of system messages and user prompts. The application employs prompt engineering techniques to ensure that interactions with the AI models are optimized for the specific context of speech-language pathology reporting.

## Linting and Code Quality

To maintain a high standard of code quality, consistency, and to prevent common errors, the project utilizes the following tools and practices:

### ESLint for Linting

*   **Purpose**: The project uses [ESLint](https://eslint.org/) to analyze JavaScript/TypeScript code for patterns and potential issues. It helps enforce coding standards and improves overall code consistency.
*   **Configuration**: ESLint's configuration can be found in the `.eslintrc.json` file (and potentially `eslint.config.js` if present, though `.eslintrc.json` is the primary Next.js default). This file defines the rules and plugins used for linting.

### Running the Linter

*   To manually check the codebase for linting errors, use the following command:
    ```bash
    pnpm lint
    ```
    This command will scan the project files and report any violations of the configured ESLint rules.

### TypeScript for Type Safety

*   The extensive use of [TypeScript](https://www.typescriptlang.org/) throughout the project is a core aspect of our code quality strategy. TypeScript's static type checking helps detect many common errors during development, leading to more robust and maintainable code.

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

This guide will help you set up and run the Linguosity project locally.

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: LTS version (e.g., 18.x or 20.x) is recommended. You can download it from [nodejs.org](https://nodejs.org/).
*   **pnpm**: This project uses pnpm as its package manager. If you don't have it installed, follow the instructions at [pnpm.io/installation](https://pnpm.io/installation).

### Setup Instructions

1.  **Clone the repository:**
    First, clone your forked repository to your local machine. If you haven't forked it yet, please do so first.
    ```bash
    git clone https://github.com/your-username/linguosity.git # Replace with your fork's URL
    cd linguosity
    ```

2.  **Install dependencies:**
    Navigate to the project directory and install the required packages using pnpm:
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    Environment variables are crucial for the application to connect to various services.
    *   Copy the example environment file to create your local configuration:
        ```bash
        cp .env.example .env.local
        ```
    *   Open the `.env.local` file and update it with your actual credentials.
        ```env
        # OpenAI API Key
        OPENAI_API_KEY=your_openai_api_key

        # Supabase Project Credentials
        # Obtain these from your Supabase project settings
        NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
        NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
        SUPABASE_SERVICE_KEY=your_supabase_service_key # Required for service-level functions

        # Anthropic/Claude API Key
        # This key is necessary for features utilizing Claude.
        # The exact environment variable name (e.g., ANTHROPIC_API_KEY or using OPENAI_API_KEY for Claude access via certain providers)
        # should be confirmed based on the specific Claude integration points in the application.
        # For now, we'll use ANTHROPIC_API_KEY as a placeholder.
        ANTHROPIC_API_KEY=your_anthropic_api_key
        ```

4.  **Supabase Project Setup:**
    *   You will need an active Supabase project. If you don't have one, create it at [supabase.com](https://supabase.com/).
    *   Ensure that Supabase Authentication is enabled in your project settings.
    *   The necessary database schema and tables should be set up. (Refer to any specific schema migration guides if available, though detailed schema setup is beyond the scope of this README).

### Running the Development Server

Once the setup is complete, you can start the development server:

*   **Standard mode:**
    ```bash
    pnpm dev
    ```

*   **For SSL/TLS issues (unsafe mode):**
    If you encounter SSL certificate errors (often in corporate environments or with custom local network configurations), you can use the `dev:safe` script. This command sets `NODE_TLS_REJECT_UNAUTHORIZED=0`, disabling TLS certificate verification.
    ```bash
    pnpm dev:safe
    ```

*   **Accessing the application:**
    After the server starts (typically on port 3000), open [http://localhost:3000](http://localhost:3000) in your web browser to see the application.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.