# Linguosity Development Log

This document tracks the progress, key decisions, roadblocks, and future plans for the Linguosity project. It serves as a continuous record to ensure seamless continuation of work.

## Current Status: Saturday, June 28, 2025, 10:30 PM PST

The core report writing application is functional, including:
*   User authentication (Login/Signup) via Supabase.
*   Protected dashboard with basic navigation.
*   Report creation, listing, and individual report viewing/editing.
*   AI integration for multi-section content generation using Claude's tool-use capabilities.
*   Temporary visual highlighting of AI-updated sections.

## Key Milestones Achieved

*   **Project Scaffolding:** New Next.js project initialized with TypeScript, Tailwind CSS, and ESLint.
*   **Supabase Integration:** Client, server, and middleware for Supabase authentication and database interaction are set up.
*   **Database Schema:** `reports` table created in Supabase via migration (manual `supabase db push` required by user).
*   **Core Report CRUD:** API endpoints for creating, fetching all, fetching single, and updating reports are implemented.
*   **AI Integration (Initial):**
    *   Backend API (`/api/ai/generate-section`) to interact with Claude.
    *   Claude configured to use `update_report_section` tool.
    *   Frontend UI for unstructured notes input and AI generation button.
    *   Successful multi-section updates by AI (e.g., Reason for Referral, Parent Concern, Health History, Assessment Results/Tools).

## Roadblocks & Resolutions

*   **Missing Project Files:** Initial `rm -rf *` command was too aggressive, deleting `package.json` and other config files.
    *   **Resolution:** Manually recreated `package.json`, `tailwind.config.ts`, `tsconfig.json`, `globals.css`, and `components.json` to restore project integrity.
*   **Supabase CLI Login:** Non-interactive environment prevented direct `supabase login`.
    *   **Resolution:** User performed `supabase login` manually in their terminal.
*   **Supabase DB Push Password:** `supabase db push` failed due to requiring database password in non-interactive environment.
    *   **Resolution:** User performed `supabase db push` manually in their terminal after resetting password.
*   **Zod Validation Errors (Report Creation):** Mismatch between `ReportSchema` (camelCase) and database fields (snake_case), and float `order` value.
    *   **Resolution:** Adjusted API logic to map camelCase to snake_case for DB insertion, and corrected `order` values in `DEFAULT_SECTIONS` to integers.
*   **Unterminated String Constants (Build Error):** Multi-line strings in `DEFAULT_SECTIONS` were not using template literals.
    *   **Resolution:** Rewrote `DEFAULT_SECTIONS` content to ensure all multi-line strings use backticks.
*   **AI Over-Cautiousness / No Tool Calls:** Initial prompt refinements made Claude too hesitant, resulting in empty `updatedSections`.
    *   **Resolution:** Re-introduced `sectionId` as a primary hint to Claude in the API call and prompt, simplifying the prompt to give Claude a clearer focus while retaining multi-section autonomy.
*   **Report Update Validation:** `createdAt`, `updatedAt`, and `studentId` fields were causing validation errors on report updates.
    *   **Resolution:** Marked `createdAt`, `updatedAt`, and `studentId` as optional in `ReportSchema` for update operations.

## Current Focus

*   **Ensuring AI Robustness:** Systematically testing Claude's ability to accurately identify and update relevant sections based on diverse text inputs.
    *   **Prompt Refinement (Family Background):** Updated generation prompt to be more direct about extracting family members and home language environment.
    *   **Prompt Refinement (Assessment Tools):** Updated generation prompt to explicitly encourage inference and inclusion of informal assessment procedures (e.g., language sample analysis, oral mechanism exam, clinical observation) from unstructured notes.

## Next Steps & Plan

**Phase 1: Comprehensive Text Input Testing (Automated via Gemini)**

*   **Goal:** Ensure Claude accurately identifies and updates relevant sections for various text-based inputs.
*   **Method:** I will define a series of test cases, each with:
    *   An `unstructuredInput` string.
    *   An `expectedUpdatedSections` array (the IDs of sections I expect Claude to update).
    *   An `expectedContentKeywords` object (keywords I expect to see in the generated content for specific sections).
*   **Execution:** For each test case, I will:
    1.  Make a `POST` request to `/api/ai/generate-section` with a consistent `reportId` and the `unstructuredInput`.
    2.  Analyze the `updatedSections` returned in the response.
    3.  Compare `updatedSections` with `expectedUpdatedSections`.
    4.  If there's a mismatch, I will report it and suggest prompt adjustments.
    5.  If they match, I will then fetch the updated report from Supabase (using `GET /api/reports/[id]`) and verify the `expectedContentKeywords` in the generated content.
*   **Action:** I will start by creating a new report to get a `reportId` for testing.

**Phase 2: PDF and Image Integration (Initial Steps)**

*   **Goal:** Enable the system to accept PDF and image inputs and pass them to Claude for analysis.
*   **Method:**
    1.  **Frontend:** Modify the report detail page to allow users to upload PDF and image files. This will involve using a file input and converting the file to base64 for sending to the backend.
    2.  **Backend (`/api/ai/generate-section`):**
        *   Modify the API to accept file data (base64 encoded PDF/image) in addition to unstructured text.
        *   Update the Claude prompt to include the file data using the `document` or `image` content blocks, as per the Anthropic docs.
        *   Instruct Claude to analyze the file content and update relevant report sections.
    3.  **Testing:** I will define test cases with sample PDF/image data (or descriptions of what they contain) and expected section updates.

**Phase 3: Refinement and Iteration**

*   Based on the results of Phase 1 and 2, we will iteratively refine the Claude prompt and potentially the tool definitions to improve accuracy and reduce unwanted updates.

## Future Features (from `FUTURE_FEATURES.md`)

*   **AI-Driven Dynamic Checklists:** AI extracts entities from text to generate interactive checklists.
*   **PII Handling Strategy (Placeholders):** Use placeholders for PII during AI interaction, replace at export.
*   **Manual Section Selection for AI Updates:** User can manually select sections for AI to update.
*   **Point-by-Point Generation:** AI generates lists of points for sections, which can then be compiled into paragraphs.