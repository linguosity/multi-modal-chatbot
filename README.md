# Linguosity - AI-Powered Speech-Language Assessment Tool

* [Project Overview](#project-overview)
* [Key Features](#key-features)
* [Project Structure](#project-structure)
* [Core Technologies/Stack](#core-technologiesstack)
* [API Endpoints Overview](#api-endpoints-overview)
* [Authentication and Authorization](#authentication-and-authorization)
* [DOCX Generation and Templates](#docx-generation-and-templates)
* [AI Integration](#ai-integration)
* [Linting and Code Quality](#linting-and-code-quality)
* [Building and Deployment](#building-and-deployment)
* [Getting Started](#getting-started)
* [Contributing](#contributing)
* [License](#license)
* [Learn More](#learn-more)
* [Deploy on Vercel](#deploy-on-vercel)

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) and designed to be fun and easy to get your hands dirty with the AI SDK.

## Project Overview

Linguosity is an AI-powered application designed to assist Speech-Language Pathologists (SLPs) in creating comprehensive assessment reports. The application leverages advanced AI capabilities, including Claude and OpenAI models, to streamline data analysis, automate report generation, and facilitate easy export of documents.

## Key Features

*   **AI-Assisted Report Generation**: Utilizes OpenAI and Claude models to create professional speech-language assessment reports, including drafting background information, summarizing results, and suggesting recommendations.
*   **PDF Data Extraction**: Upload assessment PDFs for automated data extraction and integration into reports, powered by AI.
*   **Multi-Format Export**: Export reports as DOCX and HTML, with support for customizable templates.
*   **Real-Time Interactive AI Editing**: Modify and refine report sections with real-time AI assistance using Claude's text editor tool.
*   **Domain-Specific Assessment Tool Management**: Organize and manage assessment tools categorized by specific language domains (e.g., receptive, expressive), including features for global list integration and automatic placement from PDFs.
*   **User Account Management & User-Specific Reports**: Secure, user-specific accounts for managing individual reports and settings, powered by a Supabase backend. Includes dashboard views, report list pages with search/filter, and creation tools.
*   **Batch Processing for Reports**: Efficiently generate multiple report sections in parallel for faster turnaround, leveraging Anthropic's Message Batches API.
*   **Secure Authentication**: Robust user authentication and management to ensure data privacy and security.
*   **Intuitive Navigation**: Includes a dashboard layout with section navigation in a sidebar and breadcrumbs for easy movement between screens.
*   **Persistent Floating Editor Panel**: Provides easy access to editing tools while scrolling through long reports.
*   **Schema Validation**: Utilizes Zod for comprehensive schema validation of report data, ensuring data integrity.

## Project Structure

This project follows a standard Next.js application structure, with some specific additions for our features:

*   **`src/app/`**: Contains the core Next.js application logic.
    *   Key subdirectories include:
        *   `src/app/dashboard/[userId]/reports/`: Main area for user-specific report pages and management.
        *   `src/app/api/`: Backend API route handlers.
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

*   **`next.config.js`**: Configures Next.js build settings, environment variables, webpack modifications, and server behavior (includes `output: 'standalone'` for minimal deployment packages and settings for `@next/bundle-analyzer`).
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
*   **@next/bundle-analyzer**: For visualizing and analyzing JavaScript bundle sizes.

## API Endpoints Overview

The backend API provides various endpoints to support the application's features. These are primarily located under `src/app/api/`.

*   **`/api/auth/`**: Manages all aspects of user authentication, including login, signup, logout, and session handling.
*   **`/api/batch/`**: Handles batch processing requests, such as the simultaneous generation of multiple report sections. This includes specific routes for batch operations related to the Claude text editor tool (previously under `/api/text-editor-test/` for batch functionality).
*   **`/api/check-api-key/`**: Provides endpoints for validating external API keys (e.g., for OpenAI, Anthropic/Claude).
*   **`/api/generate-image/`**: Contains logic for any image generation capabilities within the application.
*   **`/api/generate-template/`**: Manages the creation, retrieval, and customization of report templates.
*   **`/api/lists/`**: Supports CRUD operations for customizable lists, like wordlists or other assessment-related lists.
*   **`/api/reports/`**: Offers endpoints for creating, reading, updating, and deleting user-specific reports, corresponding to the `/dashboard/[userId]/reports/[reportId]` URL structure.
*   **`/api/stories/`**: Includes functionality related to story generation or narrative creation tools.
*   **`/api/text-editor-test/`**: Houses specific API routes for testing and real-time integration with the Claude text editor tool (excluding batch operations, which are consolidated under `/api/batch/`).

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

*   Before generating a DOCX file, the application gathers and structures the necessary data (e.g., student information, observations, assessment scores, narrative sections). This structured data object is then passed to `docxtemplater` to populate the template. A data transformation function in `docx-generator.ts` helps flatten nested objects to underscore notation for compatibility with some template tag styles.

### Customization and Best Practices

*   Users can customize the appearance and content of their exported reports by:
    *   Modifying the existing templates located in `public/templates/`.
    *   Creating new `.docx` template files and ensuring they use the correct `docxtemplater` tag syntax.
*   **Important Considerations for Custom Templates:**
    *   **Valid DOCX Format**: Templates must be valid DOCX files (ZIP archives with XML content) and start with the "PK" file signature. Ensure templates are saved correctly from an editor like Microsoft Word, not as plain text files with a .docx extension. The system includes signature validation and fallback mechanisms.
    *   **Tag Notation**: While the system supports data transformation for dot and underscore notation (e.g., `header.studentInformation.firstName` vs. `header_studentInformation_firstName`), consistency within a template is recommended. Check existing templates for guidance and utilize error diagnostics for troubleshooting.
    *   **Data Structure for Loops**: When dealing with loops (e.g., for lists), ensure the data passed to the template matches the structure expected by `docxtemplater`'s loop tags.

By understanding these basics, users can effectively manage and customize their DOCX report outputs.

## AI Integration

Linguosity harnesses the power of various AI models and services to provide its core features, streamlining the workflow for Speech-Language Pathologists.

### Core AI Technologies

The application integrates with the following primary AI services and SDKs:

*   **Vercel AI SDK**: Used to simplify interactions with various AI models and providers, offering a unified interface for managing AI-driven functionalities.
*   **OpenAI API**: Leveraged for a range of AI tasks, including text generation, data analysis, and potentially other utility functions within the application.
*   **Anthropic (Claude) API**: Specifically utilized for advanced language processing, most notably through Claude's powerful text editing capabilities, document understanding, and batch processing.

### Key AI-Powered Features

*   **Automated Report Generation**: AI plays a crucial role in drafting various sections of speech-language assessment reports. This includes generating initial content for background information, summarizing assessment results, forming clinical impressions, and suggesting recommendations based on the input data.
*   **PDF Data Extraction**: Users can upload PDF documents (e.g., standardized test protocols, previous reports). The AI then processes these documents to extract relevant data, such as test scores (GFTA-3, CELF-5), behavioral observations, and other key information, integrating it into the current report structure and relevant domain sections.
*   **Interactive Text Editing (Claude)**: A significant feature is the real-time, AI-assisted text editing powered by Claude's text editor tool. This allows users to select report sections and have Claude help refine, rephrase, or expand upon the content interactively.
*   **Batch Processing (Claude)**: Leverages Anthropic's Message Batches API for efficient parallel processing of multiple report sections (header, background, results, conclusion), significantly improving performance. This includes token counting for usage monitoring and asynchronous batch status tracking via polling.
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

The integration with Anthropic's Claude, especially its text editor tool and batch processing, has specific considerations:

*   **Two-Step Conversation Flow (Text Editor Tool)**: Claude's text editor tool often follows a two-step process: it first requests to `view` the content before making edits with commands like `str_replace`. The application is designed to handle this conversational flow.
*   **Explicit Prompting**: For reliable and accurate results from Claude, especially when using its tools or batch processing, system messages and user prompts need to be clear and explicit. The application incorporates carefully crafted prompts (e.g., `You MUST use the text editor tool...`) to guide the AI.
*   **System Message Formatting**: When making API calls, the `system` parameter should be a top-level parameter, not part of the `messages` array.
*   **Server-Side Configuration**: For full functionality, especially for advanced features like the Model Completion Protocol (MCP) demo or production use of batch APIs, proper server-side API configuration is essential. Client-side simulations are for development fallbacks only.
*   **Implementation Best Practices**: Include detailed error handling for API calls, validate edits before applying, use fallback mechanisms, and log responses for debugging.

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

## Building and Deployment

This section describes how to build the application for production and provides general guidance on deployment.

### Building for Production

To create a production-ready build of the application, run the following command:

```bash
pnpm build
```
This command compiles the Next.js application, optimizes assets, and prepares it for deployment. The output will be generated in the `.next` directory. The project is configured with `output: 'standalone'` in `next.config.js` to produce a minimal deployment package.

### Analyzing Bundle Size

The project includes `@next/bundle-analyzer` to help visualize the size of JavaScript bundles. To use it, run the build command with the `ANALYZE` environment variable:

```bash
ANALYZE=true pnpm build
```
This will open a report in your browser showing the contents and size of each bundle, which is useful for identifying areas for optimization.

### Deployment

While the application can be deployed to any platform that supports Node.js and Next.js applications, the recommended platform is [Vercel](https://vercel.com), the creators of Next.js.

Key considerations for deployment:
*   **Environment Variables:** Ensure all necessary environment variables (as defined in `.env.local` or `.env.example`, especially for Supabase, OpenAI, and Anthropic/Claude) are correctly configured on your deployment platform.
*   **Supabase Configuration:** Your Supabase project should be set up for production use.
*   **Domain and SSL:** Configure your custom domain and ensure SSL/TLS is enabled for secure HTTPS access.

For more detailed information on deploying Next.js applications, refer to the [official Next.js deployment documentation](https://nextjs.org/docs/deployment).

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


## Contributing

Contributions are welcome! If you have suggestions for improvements or bug fixes, please follow these steps:

1.  **Open an Issue:** Before making significant changes, please open an issue on the project's GitHub repository to discuss your ideas or the bug you intend to fix. This helps ensure that your contributions align with the project's goals and avoids duplication of effort.
2.  **Fork the Repository:** Create a fork of the repository to your own GitHub account.
3.  **Create a Branch:** Make your changes in a new git branch:
    ```bash
    git checkout -b my-feature-branch
    ```
4.  **Commit Your Changes:** Commit your changes with clear and descriptive commit messages.
5.  **Push to Your Fork:** Push your changes to your forked repository.
6.  **Submit a Pull Request:** Open a pull request from your feature branch to the main branch of the original repository. Provide a clear description of the changes you've made.

We appreciate your contributions to making Linguosity better!

## License

This project is currently pending a formal license. It is recommended to add a `LICENSE` file to the root of the project.

Consider using a standard open-source license such as the [MIT License](https://opensource.org/licenses/MIT).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.