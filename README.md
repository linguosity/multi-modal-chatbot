# Linguosity Multi-Modal Chatbot

Linguosity is a web-based application designed to assist Speech-Language Pathologists (SLPs) in generating comprehensive reports. It leverages a multi-modal approach, allowing users to input unstructured text and files (images, PDFs) to generate structured report sections. The application is built with a modern web stack, focusing on a dynamic and interactive user experience.

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
