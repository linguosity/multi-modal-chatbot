# Wireframe Implementation Roadmap

> Generated from the Claude Design wireframe bundle (`wireframes.html`).
> Maps each wireframe screen to what exists, what needs building, and what might break.

---

## Status Key

- **DONE** — already implemented in this session (design tokens, dashboard, sidebar, header)
- **EXISTS** — codebase has a component that overlaps; needs restyling or extending
- **NEW** — nothing exists; build from scratch
- **MIGRATION** — requires Supabase schema changes

---

## Phase 0: Foundation (DONE)

| Item | File(s) | Status |
|------|---------|--------|
| Color palette (terracotta/tan/paper/ink) | `globals.css`, `tailwind.config.ts` | DONE |
| Fonts (Gloock, Inconsolata, Caveat) | `layout.tsx` | DONE |
| Sidebar rebrand | `Sidebar.tsx` | DONE |
| Header/topbar restyle | `Header.tsx` | DONE |
| Dashboard layout bg | `dashboard/layout.tsx` | DONE |
| Dashboard cards + stats + privacy banner | `DashboardContent.tsx` | DONE |

---

## Phase 1: Upload Flow Restyle (~30 min)

The wireframe shows a **staged upload step** with a dropzone, file chips, context box, and submit button.

| Item | Current State | Work Needed |
|------|--------------|-------------|
| Upload dropzone | `AIIntakeDrawer.tsx` exists with drag-drop | Restyle to match wireframe aesthetic (dashed border, dot-grid bg, terracotta buttons). The drawer already accepts PDFs/images/audio/text. |
| File chips | No chip component | Create a reusable `EvidenceChip` component matching wireframe (file icon, name, meta, grab cursor). |
| New Report page | `reports/new/page.tsx` exists | Restyle form + add the "two-path" CTA (AI path vs manual) with wireframe styling. |
| Upload queue display | Partially in AIIntakeDrawer | Add queued file list with chip components before submit. |

**Potential errors:**
- None expected — purely visual changes to existing components.

---

## Phase 2: Loading Moment (~45 min)

The wireframe shows a **cinematic full-screen loading state** with live file processing log, progress bar, and "what Linguosity is doing" sidebar.

| Item | Current State | Work Needed |
|------|--------------|-------------|
| Loading screen | `ProgressToast.tsx` exists (toasts only) | NEW page/modal: full-screen loading moment with per-file progress, live log, cycling status messages. Wire to existing `/api/stream/[operationId]` SSE endpoint. |
| Per-file progress | `progress_events` table exists | Use existing SSE stream to show per-file status (reading, extracting, classifying). |
| "What Linguosity is doing" panel | Not exists | NEW component: cycling explanatory text with indeterminate progress bar. |

**Potential errors:**
- SSE endpoint already exists at `/api/stream/[operationId]` — need to ensure the `progress_events` table has granular enough events. May need to add `file_name` and `stage` fields to progress events.

**Possible migration:**
```sql
ALTER TABLE progress_events ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE progress_events ADD COLUMN IF NOT EXISTS processing_stage TEXT; -- 'reading' | 'extracting' | 'classifying'
```

---

## Phase 3: Evidence Triage (~1.5 hours) — NEW

The wireframe shows a **split-pane triage view** where each uploaded file is classified by AI (section, method, direction) and the SLP confirms or reroutes.

| Item | Current State | Work Needed |
|------|--------------|-------------|
| Triage table | NOT EXISTS | NEW component: table with source chip, section dropdown, method dropdown, direction pill, confirm checkbox. |
| AI pre-classification | `process-multimodal` route returns extracted data | Extend API response to include suggested section, method type (norm-ref/observation/interview), and clinical direction (toward/against/neutral). |
| Skeleton preview panel | Report sections exist | Right-side panel showing sections filling up as chips are confirmed. |
| Bulk actions | NOT EXISTS | "Set direction" and "assign section" bulk action buttons. |

**Potential errors:**
- The `file_uploads` table exists but doesn't store classification metadata (section assignment, method type, clinical direction). Need to extend it.
- The `process-multimodal` API needs to return classification suggestions — currently returns extracted text + AI results but not section/method/direction tags.

**Required migration:**
```sql
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS suggested_section TEXT;
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS evidence_method TEXT; -- 'norm-ref' | 'observation' | 'interview' | 'lang-sample' | 'record'
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS clinical_direction TEXT; -- 'toward' | 'against' | 'neutral' | 'unknown'
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS classification_confidence FLOAT;
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT FALSE;
```

**TypeScript changes:**
- Update `src/types/supabase.ts` to reflect new `file_uploads` columns.
- Add new types for triage state in `src/types/report-types.ts`.

---

## Phase 4: Working Surface — Outline + Tray Rail (~1 hour)

The wireframe shows a **tabbed working surface** (Outline / Canvas / Tray rail) for building the report skeleton after triage.

| Item | Current State | Work Needed |
|------|--------------|-------------|
| Outline view | Report section editor exists at `[sectionId]/page.tsx` | Restyle as collapsible outline with expand/collapse, evidence chips per section, drop targets. This is the main edit view, already functional. |
| Inner tab bar | Not exists | NEW: tab bar switching between Outline / Canvas / Tray views. |
| Tray rail (left sidebar) | Sidebar exists but for navigation | NEW component: evidence rail showing all files with section/method/direction pills, docked left. |
| Section progress pills | Partially exists (TOC status dots) | Extend with "X sources" count per section. |

**Potential errors:**
- The current section editor is a full page per section (`[sectionId]/page.tsx`). The wireframe shows all sections in a single outline view. This is an architecture difference — may need a new "outline mode" page that renders all sections collapsed.

---

## Phase 5: Interactive Canvas (~2 hours) — NEW

The wireframe shows a **fully interactive spatial canvas** where evidence chips are dragged onto section buckets with zoom/pan, wires, context menus, and auto-layout.

| Item | Current State | Work Needed |
|------|--------------|-------------|
| Canvas component | NOT EXISTS | NEW: large canvas with pan/zoom, grid background, positioned chip nodes and section buckets. |
| Drag chip → bucket | `DragDropTest.tsx` exists (basic) | Need full spatial drag-and-drop with collision detection (chip lands inside bucket bounds). |
| Wires (chip → bucket) | NOT EXISTS | SVG bezier curves connecting attached chips to their buckets. |
| Context menu | NOT EXISTS | Right-click chip → split across sections, view source, re-analyze, flag. |
| Auto-layout | NOT EXISTS | "AI cluster" button that animates chips into their AI-suggested buckets. |
| Mini-map | NOT EXISTS | Small overview in corner showing viewport position. |
| Split modal | NOT EXISTS | Modal for splitting one source across multiple sections. |

**Potential errors:**
- This is the most complex new feature. No existing canvas library (like react-flow, xyflow) is installed. Options:
  1. **Build custom** (as wireframe does) — more control, more code
  2. **Use @xyflow/react** — mature library, handles pan/zoom/nodes natively
- Performance concern with many chips + wires on a single canvas.

**New dependency (recommended):**
```
pnpm add @xyflow/react
```

---

## Phase 6: Convergence Beeswarm (~2 hours) — NEW

The wireframe shows a **beeswarm visualization** plotting evidence on a supports↔does-not-support axis, with a convergence index, edge-case flags, and a detail drawer.

| Item | Current State | Work Needed |
|------|--------------|-------------|
| Beeswarm SVG | NOT EXISTS | NEW: SVG-based beeswarm with collision-packed dots, color by type, size by strength. |
| Convergence math | NOT EXISTS | NEW: compute convergence index from V/R/R scores per evidence item. |
| Summary strip | NOT EXISTS | Dial + stat bars + suggested classification + flags. |
| Evidence detail drawer | `Drawer.tsx` exists (generic) | Extend drawer with rubric score display (pips), strength bar, finding badge, confirm/adjust buttons. |
| Legend with filters | NOT EXISTS | Type filter chips, border style legend, size scale. |

**Required migration:**
```sql
-- Evidence scoring table (new)
CREATE TABLE IF NOT EXISTS evidence_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_upload_id UUID REFERENCES file_uploads(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL, -- 'standardized_test' | 'language_sample' | etc.
  modality TEXT, -- 'receptive' | 'expressive' | 'mixed' | 'pragmatic' | 'speech'
  language_context TEXT, -- 'L1' | 'L2' | 'both' | 'unknown'
  finding_direction TEXT, -- 'supports_disorder' | 'does_not_support' | 'mixed' | 'unclear'
  validity_score INT CHECK (validity_score BETWEEN 0 AND 3),
  relevance_score INT CHECK (relevance_score BETWEEN 0 AND 3),
  reliability_score INT CHECK (reliability_score BETWEEN 0 AND 3),
  setting TEXT, -- 'home' | 'school' | 'clinic'
  source_description TEXT,
  clinical_note TEXT,
  is_ai_scored BOOLEAN DEFAULT TRUE,
  is_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE evidence_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own evidence scores"
  ON evidence_scores FOR ALL
  USING (report_id IN (SELECT id FROM reports WHERE user_id = auth.uid()));
```

**TypeScript changes:**
- New `EvidenceScore` type in `report-types.ts`.
- New API route `/api/reports/[id]/evidence` for CRUD on evidence scores.

---

## Phase 7: Tool Library Restyle (~45 min)

The wireframe shows a **searchable catalog of standardized assessment tools** with APA citations, validity statements, and rubric defaults.

| Item | Current State | Work Needed |
|------|--------------|-------------|
| Tool grid | `AssessmentToolsGrid.tsx` exists | Restyle to match wireframe card layout (acronym, name, domains, age range, norms, tags). |
| Tool detail drawer | `AssessmentToolModal.tsx` exists | Restyle drawer with summary blurb, use-case, validity statement, APA citation, rubric defaults. |
| Search + tag filters | Not in current grid | Add search input + tag filter pills (language, speech, bilingual, etc.). |
| "Add custom tool" | Not exists | Button + form for adding custom assessment tools. |

**Possible migration:**
The wireframe shows tool data fields (APA citation, validity statement, rubric defaults V/R/R, bilingual modifier) that may not exist in the current schema. If tools are stored in Supabase (vs. hardcoded), need:
```sql
-- Check if assessment_tools table exists; if not:
CREATE TABLE IF NOT EXISTS assessment_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- NULL for system tools, user UUID for custom
  acronym TEXT NOT NULL,
  name TEXT NOT NULL,
  edition TEXT,
  domains TEXT[],
  age_range TEXT,
  norms_population TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  summary TEXT,
  use_case TEXT,
  validity_statement TEXT,
  apa_citation TEXT,
  default_validity INT DEFAULT 2,
  default_relevance INT DEFAULT 2,
  default_reliability INT DEFAULT 2,
  bilingual_modifier INT DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Phase 8: PII Confirmation Step (~1.5 hours) — NEW

The wireframe shows a **pre-analysis step** that detects and de-identifies personal information before sending to AI.

| Item | Current State | Work Needed |
|------|--------------|-------------|
| PII detection | NOT EXISTS | NEW: server-side PII scanning using regex + NER patterns (names, DOBs, addresses, phone, MRN). |
| Confirmation table | NOT EXISTS | NEW component: table showing detected entities, token mapping, action selector (replace/semantic/remove), exclude button. |
| Stats strip | NOT EXISTS | Entity count, category count, file count, low-confidence count. |
| Pipeline explainer | NOT EXISTS | 3-step visual: de-identify locally → AI sees tokens → re-identify in your view. |
| Token mapping storage | NOT EXISTS | Server-side mapping of real values → tokens. |

**Required migration:**
```sql
CREATE TABLE IF NOT EXISTS pii_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'STUDENT' | 'PARENT' | 'TEACHER' | 'SCHOOL' | 'DOB' | 'ADDRESS' | 'PHONE' | 'MRN'
  detected_value TEXT NOT NULL,
  token TEXT NOT NULL, -- '[STUDENT_001]'
  action TEXT NOT NULL DEFAULT 'replace', -- 'replace' | 'semantic' | 'remove'
  source_file TEXT,
  confidence FLOAT,
  is_excluded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pii_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own PII mappings"
  ON pii_mappings FOR ALL
  USING (report_id IN (SELECT id FROM reports WHERE user_id = auth.uid()));
```

**New dependency:**
```
pnpm add compromise  # lightweight NLP for entity detection
```
Or use Gemini Nano / a small model for PII detection (as discussed in wireframe chat).

---

## Phase 9: Chat Popup Restyle (~30 min)

The wireframe shows an **always-on chat widget** in the bottom-left corner (like Intercom).

| Item | Current State | Work Needed |
|------|--------------|-------------|
| Chat FAB | `FloatingAIAssistant.tsx` exists (bottom-right) | Move to bottom-left. Restyle as terracotta pill with chat icon + "Ask Linguosity" label + "AI" badge. |
| Chat panel | FloatingAIAssistant has a popup | Restyle panel: header with "L" icon, scroll area with bubbles (user tan, AI white), quick-reply buttons, text input. |
| Quick replies | Not exists | Add 3-4 contextual quick-reply buttons above input ("Summarize CELF-5", "Any conflicts?", "Draft section 5"). |
| Chat bubbles | Basic message display | Restyle with wireframe bubble classes (max-width 84%, border, user/ai variants). |

**Potential errors:**
- None expected — purely visual restyle of existing component.

---

## Phase 10: Remaining Page Restyling (~1 hour)

| Page | Work |
|------|------|
| New Report (`reports/new/page.tsx`) | Restyle form with wireframe aesthetic (paper bg, ink borders, terracotta buttons). |
| Section Editor (`[sectionId]/page.tsx`) | Update card backgrounds, borders, button styles to match design system. |
| Report View (`view/page.tsx`) | Update header, section rendering, print styles. |
| Timeline (`timeline/page.tsx`) | Restyle activity items. |
| Auth page | Update login page with brand mark and wireframe styling. |

---

## Summary: Time Estimates

| Phase | Description | Estimate | Dependencies |
|-------|-------------|----------|-------------|
| 0 | Foundation (design tokens, dashboard, sidebar, header) | DONE | — |
| 1 | Upload flow restyle | ~30 min | — |
| 2 | Loading moment | ~45 min | Phase 1 |
| 3 | Evidence triage | ~1.5 hrs | Migration, Phase 2 |
| 4 | Working surface (outline + tray) | ~1 hr | Phase 3 |
| 5 | Interactive canvas | ~2 hrs | Phase 4, possibly @xyflow/react |
| 6 | Convergence beeswarm | ~2 hrs | Migration, Phase 3 |
| 7 | Tool library restyle | ~45 min | Possible migration |
| 8 | PII confirmation | ~1.5 hrs | Migration, new dependency |
| 9 | Chat popup restyle | ~30 min | — |
| 10 | Remaining page restyling | ~1 hr | — |
| **TOTAL** | | **~11.5 hours** | |

---

## Migration Summary

New tables needed:
1. `evidence_scores` — rubric scoring per evidence item (Phase 6)
2. `assessment_tools` — tool library catalog (Phase 7, if not hardcoded)
3. `pii_mappings` — PII token mappings per report (Phase 8)

Column additions to existing tables:
1. `file_uploads` — add `suggested_section`, `evidence_method`, `clinical_direction`, `classification_confidence`, `is_confirmed` (Phase 3)
2. `progress_events` — add `file_name`, `processing_stage` (Phase 2)

---

## Risk Areas

1. **Canvas (Phase 5)** — Most complex new feature. Consider using @xyflow/react instead of building from scratch.
2. **Convergence math (Phase 6)** — The beeswarm layout algorithm and convergence index calculation need careful implementation. The wireframe has a working reference implementation in `convergence-beeswarm.jsx`.
3. **PII detection (Phase 8)** — Running NER locally in Node.js is lightweight but imperfect. The wireframe suggested Gemini Nano for on-device detection; if targeting Chrome-only, this is viable via the Prompt API. Otherwise use regex + compromise.js as fallback.
4. **Architecture tension** — Current app is **section-per-page** (`[sectionId]/page.tsx`). Wireframe is **all-sections-in-one-view** (outline). Both can coexist, but the outline view is a new page.
5. **TypeScript strictness** — Many wireframe components use `any` types. Production code needs proper typing for all new types (EvidenceScore, PIIMapping, AssessmentTool, etc.).
