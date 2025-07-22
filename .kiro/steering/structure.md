# Project Structure & Organization

## Directory Structure

```
linguosity/
├── src/                      # Source code
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API routes
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Dashboard pages
│   │   │   ├── reports/      # Report management
│   │   │   └── templates/    # Template management
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── ui/               # UI components (shadcn/ui)
│   │   └── ...               # Feature-specific components
│   ├── lib/                  # Shared utilities and libraries
│   │   ├── context/          # React context providers
│   │   ├── hooks/            # Custom React hooks
│   │   ├── schemas/          # Zod schemas
│   │   └── supabase/         # Supabase clients
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── public/                   # Static assets
├── supabase_migrations/      # Database migrations
└── .env.example              # Environment variables template
```

## Key Architecture Patterns

### Data Flow

1. **Database Layer**: Supabase PostgreSQL tables
2. **API Layer**: Next.js API routes in `src/app/api/`
3. **Client Layer**: React components consuming API data

### Component Organization

- **UI Components**: Reusable, presentational components in `src/components/ui/`
- **Feature Components**: Business logic components in `src/components/`
- **Page Components**: Route-specific components in `src/app/`

### Data Models

- **Report Templates**: Define structure of reports
  - Contains groups of section types
  - Stored in `report_templates` table

- **Report Section Types**: Define types of sections
  - Include AI directives for generation
  - Stored in `report_section_types` table

- **Reports**: User-created reports
  - Contains sections with content
  - Stored in `reports` table

### Tree Structure

The application uses a tree-based data structure for organizing report templates:
- `TreeItem`: Base interface for tree nodes
- `GroupNode`: Container for sections (e.g., "Assessment Results")
- `SectionNode`: Individual report sections

### API Routes

- `/api/report-templates`: CRUD operations for templates
- `/api/reports`: CRUD operations for reports
- `/api/report-section-types`: Get section types
- `/api/ai/generate-section`: AI generation endpoint