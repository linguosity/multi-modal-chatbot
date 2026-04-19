# Linguosity — project guide

## What this is

A speech-language pathology (SLP) report writer for clinicians. SLPs upload
assessment evidence (PDFs, audio of sessions, handwritten notes, intake forms)
and Linguosity drafts a structured report section-by-section.

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 18, TypeScript strict
- **Styling:** Tailwind 3.4 + `wf-*` wireframe primitives in `globals.css`
  (terracotta / tan / paper / ink palette; Gloock display, Inconsolata mono,
  Caveat hand-written accent). Design tokens live at the top of `globals.css`.
- **UI libs:** shadcn/ui (Radix primitives), `@xyflow/react` (canvas),
  Lucide icons, Framer Motion, TipTap (rich-text editor)
- **Backend:** Node.js + Edge route handlers under `src/app/api/`
- **Database + Auth:** Supabase via `@supabase/ssr` (cookie-based sessions,
  three client tiers: browser / server / admin). RLS enforced on all tables.
- **AI provider:** Anthropic Claude (`claude-sonnet-4-6` default)
  - Text, tool use, structured JSON → Claude via `@anthropic-ai/sdk`
  - Audio transcription → Google Gemini (Claude has no native audio yet)
- **Deployment:** Vercel (60s function timeout)

## AI layer

| File | Role |
|------|------|
| `src/lib/ai/anthropic-compat.ts` | `AnthropicClient` with `messages.create()` for text + tool use. Default model is `claude-sonnet-4-6`; override via `CLAUDE_MODEL` env or explicit `model` param. |
| `src/lib/ai/structured.ts` | `parseWithZod` / `streamParseWithZod` — Claude tool-use pattern for Zod-validated JSON output. |
| `src/lib/ai/gemini-client.ts` + `gemini-file-processor.ts` | **Audio only.** `transcribeAudio()` runs session recordings through Gemini, since Claude has no native audio. |
| `src/lib/ai/gemini-messages.ts` + `gemini-structured.ts` | **Deprecated shims** — re-export the Claude versions. Migrate call sites to `./anthropic-compat` and `./structured` when touching them. |

### Structured output pattern

Do not ask Claude to "return JSON" in the prompt — use a forced tool call.
`parseWithZod(schema, name, messages)` defines a single tool whose
`input_schema` is the desired shape and forces the model to call it. Claude's
tool-use output is the validated JSON.

### Model selection

- **`claude-opus-4-7`** — reasoning-heavy tasks (report-wide synthesis, convergence)
- **`claude-sonnet-4-6`** (default) — most routes; strong at structured output + speed
- **`claude-haiku-4-5-20251001`** — high-volume / low-latency tasks

## Architecture

- **Routes:** App Router at `src/app/`. Dashboard nested under `/dashboard/*`.
  Each report has routes for sections, view, timeline, triage, surface,
  convergence, canvas, pii, preview.
- **Sidebar nav:** `src/components/Sidebar.tsx` lists all per-report routes.
- **File structure:** lowercase kebab-case directories. Group features together.
- **Server Actions** for auth flows (`src/app/auth/actions.ts`).
- **Middleware** refreshes sessions + protects routes (`src/lib/supabase/middleware.ts`).
- **SSE progress** streams via `/api/stream/[operationId]` (see `src/lib/server/progress-stream.ts`).

## Supabase schema

Primary tables: `reports`, `report_sections`, `file_uploads`, `profiles`.

Recent migrations (review before applying — see `supabase/migrations/`):
- `002_evidence_triage.sql` — classification columns on `file_uploads`
- `003_evidence_scores.sql` — V/R/R rubric table for convergence math
- `004_pii_mappings.sql` — server-only PII → token mappings

## Design system

All wireframe UI uses the `wf-*` prefix in `globals.css`:

- Typography: `.wf-heading`, `.wf-label`, `.wf-sm`, `.wf-hand` (+ `.accent`)
- Surfaces: `.wf-box` (+ `.dashed` / `.tan` / `.terra` / `.hatched`)
- Buttons: `.wf-btn` (+ `.primary` / `.ghost` / `.tan` / `.sm`)
- Pills: `.wf-pill` (+ `.terra` / `.tan` / `.dark`)
- Chip: `.wf-chip` (+ type-variants `.pdf`, `.audio`, `.image`, `.note`, `.transcript`)
- Interaction: `.wf-dropzone`, `.wf-stepper`, `.wf-inner-tabs`, `.wf-outline-item`, `.wf-rail`
- Viz: `.wf-bar`, `.wf-spinner`, `.wf-conv-*`, `.wf-stat-*`, `.wf-lib-*`, `.wf-pii-*`

Wireframe reference lives outside the repo at `wireframes/` (gitignored).
Design source: `wireframes/wireframes.html` + `wireframes/src/*.jsx`.

## Code style

- TypeScript strict. Explicit interfaces for DB rows and AI JSON payloads.
- Favor early returns over deep nesting.
- RSC by default; `'use client'` only when hooks or interactivity are needed.
- No raw `console.log` in production code.
- Animations via Framer Motion off the main thread; respect `prefers-reduced-motion`.

## Constraints

- **Vercel 60s timeout:** long AI jobs must be async + backgrounded (SSE or polling).
- **RLS:** every table policy scopes to `auth.uid()` via `reports.user_id`.
- **PII:** nothing leaves the server without passing through `src/lib/pii/detect.ts`
  and the `/pii` confirmation step. The `detected_value` column in `pii_mappings`
  is the only place real PII is stored; only `token`s are sent to Claude.

## Testing

Vitest + Testing Library + jsdom. Mock Supabase + Anthropic + Gemini clients in
tests — tests must not make real network calls.
