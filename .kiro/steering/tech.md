# Technical Stack & Development Guidelines

## Tech Stack

- **Framework**: Next.js 15.x (React 18.x)
- **Language**: TypeScript
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **AI Integration**: Anthropic API (Claude)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Form Validation**: Zod
- **Rich Text Editing**: Tiptap
- **Drag-and-Drop**: dnd-kit and dnd-kit-sortable-tree
- **Package Manager**: pnpm

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

## Environment Setup

Create a `.env.local` file based on `.env.example` with the following keys:
- Supabase URL and API keys
- Anthropic API key
- Other service credentials

## Code Style & Patterns

- **Components**: React functional components with TypeScript interfaces
- **State Management**: React hooks for local state, context for shared state
- **Data Fetching**: Server components for initial data, client components for interactive features
- **Styling**: Tailwind utility classes with shadcn/ui component library
- **Form Handling**: Zod schemas for validation
- **Error Handling**: Try/catch blocks with appropriate error logging

## Testing

- ESLint for static code analysis
- TypeScript for type checking

## Database

- Supabase PostgreSQL database
- Row Level Security (RLS) policies for data protection
- Migrations in `supabase_migrations` directory

## Authentication

- Supabase Auth for user authentication
- Google OAuth integration