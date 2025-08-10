# Linguosity Multi-Modal Chatbot

Linguosity is a web-based application designed to assist Speech-Language Pathologists (SLPs) in generating comprehensive reports. It leverages a multi-modal approach, allowing users to input unstructured text and files (images, PDFs) to generate structured report sections. The application is built with a modern web stack, focusing on a dynamic and interactive user experience.

## ⚠️ CRITICAL DEVELOPMENT WARNING

**Stack Overflow Risk**: This application processes deeply nested report data structures. **ALL DEVELOPERS MUST**:

1. **Read `DEVELOPMENT_GUIDELINES.md`** before making any changes
2. **Use iterative algorithms only** - never recursive ones
3. **Never use `JSON.stringify` in useEffect dependencies**
4. **Follow the mandatory code review checklist**

**Recent Incidents**: Multiple stack overflow crashes due to recursive object traversal. See `STACK_OVERFLOW_INCIDENT_LOG.md` for details.

## Key Features

*   **AI-Powered Report Generation:** Utilizes the Anthropic API (Claude) to process unstructured notes and generate formatted report sections.
*   **Dynamic Report Templates:** Users can create, edit, and manage their own report templates, defining the structure and sections of their reports.
*   **Drag-and-Drop Interface:** An intuitive drag-and-drop interface for organizing and reordering report sections.
*   **Rich Text Editing:** A Tiptap-based rich text editor for editing report content.
*   **Secure User Authentication:** Supabase is used for user authentication and data storage, with Row Level Security (RLS) to protect user data.
*   **Multi-Modal Inputs:** The application can accept a variety of inputs, including text and images, with plans to support PDF text extraction.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (React)
*   **Backend:** [Supabase](https://supabase.io/) (PostgreSQL, Authentication, Storage)
*   **AI:** [Anthropic API (Claude)](https://www.anthropic.com/claude)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) components
*   **Text Editor:** [Tiptap](https://tiptap.dev/)
*   **Drag-and-Drop:** [@dnd-kit](https://dndkit.com/)
*   **Schema Validation:** [Zod](https://zod.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Linting:** [ESLint](https://eslint.org/)
*   **Package Manager:** [pnpm](https://pnpm.io/)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```
3.  **Set up environment variables:**
    Create a `.env.local` file by copying `.env.example` and fill in the required Supabase and Anthropic API keys.
4.  **Run the development server:**
    ```bash
    pnpm dev
    ```

The application will be available at `http://localhost:3000`.

## AI Pipelines (OpenAI)

- PDF: `POST /api/extract/pdf` with `form-data` field `file` (application/pdf). Returns a normalized artifact for the Sources tab.
- Audio: `POST /api/transcribe` with `form-data` field `file` (audio/*). Uses Whisper and returns a transcript artifact.
- Analyze (per-section): `POST /api/analyze` with JSON `{ sectionKey, fields?, sources[] }` to extract only the requested fields using the section schema. Returns `{ values, provenance }`.

Environment:
- `OPENAI_API_KEY` required. Optional `OPENAI_MODEL` (defaults to `gpt-4.1`).

Field Modes and Provenance:
- `FieldSchema` now supports modes (`manual|computed|ai_extracted|ai_summarized|locked`), validators, per-field prompts, compute specs (e.g., ageFromDOB), and `source_refs` for provenance chips.
