# Linguosity: Refactor & Improvement Action Plan

## Document Purpose

This is the master action plan for refactoring Linguosity from its current state ("form-filling tool with AI features") into its target state ("AI-powered report assistant supervised by a clinician"). It covers architecture, database, UI/UX, and prioritized implementation phases.

---

## Part 1: Database Decision — Supabase vs MongoDB

### The Question

The app currently uses Supabase (PostgreSQL) with heavy JSONB usage and a dual-storage problem. Should it stay on Supabase, migrate to MongoDB, or adopt a hybrid?

### Current Pain Points Driving This Question

1. **Dual storage:** `reports.sections` (embedded JSONB) and `report_sections` (row table) store overlapping data with merge/overlay logic on every fetch
2. **Russian-doll corruption:** `structured_data` fields sometimes nest inside themselves, requiring cleanup functions and integrity guards
3. **Circular reference detection:** Needed because deep JSONB objects can create reference loops
4. **Two queries per report fetch** plus overlay merge logic
5. **Schema rigidity vs data flexibility:** Report sections have wildly different shapes (assessment tools vs. validity statements vs. language samples), yet they share one table

### Data Shape Analysis

| Data Type | Shape | Access Pattern | Relational Fit | Document Fit |
|-----------|-------|----------------|----------------|--------------|
| Users/Auth | Fixed schema | Simple CRUD, RLS | Excellent | Unnecessary |
| Reports (metadata) | Fixed schema | List, filter, sort | Excellent | Unnecessary |
| Report sections | Semi-structured, variable by type | Fetch all for report, update individually | Poor (JSONB workaround) | Excellent |
| Structured data per section | Highly variable (assessment items, validity flags, language samples) | Read/write as unit, AI extraction target | Poor (JSONB blob) | Excellent |
| Templates | Fixed outer schema, variable inner structure | Read on report create, admin CRUD | Moderate | Good |
| Section types | Fixed schema, read-only reference | Lookup | Excellent | Unnecessary |
| File metadata | Semi-structured | Append-only, query by report | Moderate | Good |
| Change tracking | Append-only, nested timestamps | Audit queries | Moderate | Good |

### Recommendation: Stay on Supabase, But Fix the Architecture

**MongoDB is not the answer.** Here's why:

**Arguments for MongoDB:**
- Document model fits `structured_data` naturally (variable shapes per section type)
- No need for JSONB workarounds
- Nested arrays and objects are first-class
- Flexible schema evolution without migrations

**Arguments against MongoDB (and why they win):**

1. **You'd lose Supabase Auth + RLS.** Supabase's authentication system with Row Level Security is doing real work — every query is automatically scoped to the authenticated user. Migrating to MongoDB means rebuilding auth middleware, session management, and per-user data isolation from scratch. That's months of work for no user-facing benefit.

2. **You'd lose Supabase Realtime.** The app already subscribes to `report_sections` changes via Postgres Changes. MongoDB Change Streams exist but require more infrastructure (replica sets, connection management).

3. **The problem isn't PostgreSQL — it's the dual-storage pattern.** The pain comes from maintaining two copies of section data (`reports.sections` JSONB + `report_sections` rows) and merging them on every read. This would be equally painful in MongoDB if you stored sections both embedded in a report document AND in a separate collection.

4. **PostgreSQL JSONB is good enough.** Postgres JSONB supports indexing (`GIN`), partial updates (`jsonb_set`), path queries (`->>`, `#>>`), and containment queries (`@>`). The current code doesn't use most of these features. The issue is application architecture, not database capability.

5. **Migration cost is high, user benefit is zero.** SLPs don't care what database you use. They care about speed. A database migration is invisible to users but consumes months of engineering time.

### The Actual Fix: Eliminate Dual Storage

**Choose ONE canonical storage approach and delete the other.**

**Option A: report_sections as sole source of truth (Recommended)**

```
reports table:
  - id, user_id, title, type, status, template_id
  - metadata JSONB (student bio, report-level config)
  - created_at, updated_at
  - DROP: sections JSONB column entirely

report_sections table (canonical):
  - id, report_id, section_type_id (FK)
  - title, order, is_completed, is_required, is_generated
  - content TEXT (narrative text)
  - structured_data JSONB (section-specific form data)
  - change_tracking JSONB (per-field audit trail)
  - source_refs JSONB (provenance data)
  - created_at, updated_at
```

**Why Option A:**
- Row-based sections enable per-section RLS if needed later (e.g., supervisor sees only their assigned sections)
- Individual section updates don't rewrite the entire report JSONB
- Joins are simple: `reports JOIN report_sections ON report_id`
- PostgreSQL is excellent at this pattern
- Keeps `structured_data` as JSONB (flexible per section type) without fighting the relational model

**Migration path:**
1. Write a migration script that copies `reports.sections[].structured_data` into `report_sections` rows (the `repair-sync` API already does this)
2. Update all read queries to fetch from `report_sections` only
3. Update all write queries to write to `report_sections` only
4. Drop the `sections` JSONB column from `reports`
5. Delete all overlay/merge/sync code

**Option B: Embedded JSONB only (Not recommended)**

Keep `reports.sections` as the only storage, drop `report_sections` table. This is simpler but means every section update rewrites the entire report document and prevents per-section indexing.

### Database Improvements Beyond Dual-Storage Fix

**Add missing indexes:**
```sql
CREATE INDEX idx_report_sections_report_id ON report_sections(report_id);
CREATE INDEX idx_report_sections_section_type ON report_sections(section_type);
CREATE INDEX idx_reports_user_updated ON reports(user_id, updated_at DESC);
```

**Add RLS to report_sections:**
```sql
CREATE POLICY "Users access own report sections" ON report_sections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM reports WHERE reports.id = report_sections.report_id AND reports.user_id = auth.uid())
  );
```

**Add file_uploads table** (currently files are processed in-memory with no persistence):
```sql
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  storage_path TEXT,  -- Supabase Storage path
  processing_status TEXT DEFAULT 'pending',  -- pending, processing, completed, failed
  extracted_text TEXT,  -- Cached extraction result
  ai_extraction_result JSONB,  -- What Claude extracted from this file
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Add confidence_scores to report_sections:**
```sql
ALTER TABLE report_sections ADD COLUMN extraction_confidence JSONB;
-- Example: {"student_name": 0.98, "dob": 0.95, "primary_concern": 0.72}
```

---

## Part 2: Architecture Refactor

### Current Architecture Problems

1. **AI is an afterthought.** The `AIIntakeDrawer` is a floating button, not the primary workflow. The extraction pipeline (`/api/ai/process-multimodal`) is powerful but disconnected from the main data flow.

2. **No file persistence.** Files are uploaded, processed by AI, and discarded. There's no way to re-process a file, see what was uploaded, or trace extraction results back to source files.

3. **Stack overflow risks.** `DEVELOPMENT_GUIDELINES.md` warns repeatedly about recursive traversal of deep objects. This is a symptom of the dual-storage merge logic.

4. **Context/state complexity.** Multiple React contexts (`ReportContext`, `UserSettings`, `ProgressToasts`, `RecentUpdates`) with overlapping responsibilities.

### Target Architecture

```
User uploads files → File Storage (Supabase Storage)
                   → AI Extraction Pipeline (Claude)
                   → Structured Data + Confidence Scores
                   → report_sections table (canonical)
                   → Verification Dashboard (user reviews)
                   → Narrative Generation (Claude)
                   → Report View + Export (PDF)
```

### Key Architectural Changes

**1. Add a File Storage Layer**

Use Supabase Storage for uploaded files. Store file metadata in `file_uploads` table. This enables:
- Re-processing files if AI extraction improves
- Showing users what was uploaded per report
- Provenance: linking extracted fields to specific files/pages

**2. Restructure the AI Pipeline**

Current: User manually triggers AI via drawer → AI processes → updates sections
Target: User uploads files → AI automatically extracts → populates sections with confidence scores → user verifies

The pipeline should be:
```
/api/ai/extract-all (new)
  ├── For each file: extract structured data
  ├── Map extracted data to section types
  ├── Score confidence per field
  ├── Write to report_sections with extraction_confidence
  └── Return summary (sections populated, fields flagged)
```

**3. Consolidate React State**

Replace multiple contexts with a single report store (consider Zustand):
```typescript
// Single store for all report state
const useReportStore = create((set, get) => ({
  report: null,
  sections: [],
  files: [],
  extractionStatus: {},

  // Actions
  loadReport: async (id) => { ... },
  updateSectionField: (sectionId, field, value) => { ... },
  generateNarrative: async (sectionId) => { ... },
  exportPdf: async () => { ... },
}))
```

---

## Part 3: UI/UX Refactor

### New User Flow

```
┌─────────────────────────────────────────────────────┐
│  1. CREATE REPORT                                    │
│     Select template, enter student name              │
│     [Create Report]                                  │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  2. UPLOAD & EXTRACT (NEW - Primary Entry Point)     │
│     Drag-and-drop zone for all assessment materials  │
│     Upload: PDFs, images, audio, handwritten notes   │
│     AI automatically processes and extracts data     │
│     Progress: "Processing 4 files... Extracted 47    │
│     data points across 8 sections"                   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  3. VERIFICATION DASHBOARD (NEW - Core Interaction)  │
│     All sections visible at a glance                 │
│     Each field shows: value, confidence, source      │
│     Color coding: green (high), yellow (review),     │
│     red (low/missing)                                │
│     Bulk approve high-confidence data                │
│     Click to edit individual fields                  │
│     Progress bar: "82% complete — 3 fields need      │
│     review"                                          │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  4. GENERATE NARRATIVE                               │
│     One-click: generate all section narratives       │
│     Split-pane: structured data ↔ narrative preview  │
│     Edit narrative directly or edit fields and       │
│     regenerate                                       │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  5. EXPORT                                           │
│     PDF generation with professional formatting      │
│     HIPAA-compliant file naming                      │
│     Download or print                                │
└─────────────────────────────────────────────────────┘
```

### Component Changes

| Current | Change | New |
|---------|--------|-----|
| `AIIntakeDrawer` (floating button) | Promote to primary step | `UploadExtractPage` (full page) |
| Section-by-section Data Entry (default) | Demote to fallback | `VerificationDashboard` (all sections at once) |
| 3 tabs per section (Data/Template/Sources) | Simplify | 1 view: fields with inline source attribution |
| No progress tracking | Add | `ReportProgressBar` + section status badges |
| No PDF export | Implement | `PdfExportService` (Puppeteer or react-pdf) |
| Manual narrative generation per section | Streamline | One-click "Generate All Narratives" |

### Navigation Restructure

```
Current:
  Dashboard → Report → Section 1 → [Data Entry | Edit Template | Sources]
                     → Section 2 → [Data Entry | Edit Template | Sources]
                     → ...
                     → Report View

Target:
  Dashboard → Create Report → Upload & Extract
                             → Verification Dashboard (all sections)
                               → Section Detail (click to drill down)
                             → Generate Narratives
                             → Export
```

---

## Part 4: Implementation Phases

### Phase 0: Foundation (Weeks 1-2)
> Fix the architecture before building new features

- [ ] **Eliminate dual storage**
  - Run `repair-sync` to ensure `report_sections` is fully populated
  - Migrate all read queries to use `report_sections` exclusively
  - Migrate all write queries to update `report_sections`
  - Drop `sections` JSONB column from `reports` table
  - Delete overlay/merge/sync code (`getReportForView.ts` overlay logic, `repair-sync` API)
  - Delete circular reference detection code (should be unnecessary without JSONB merging)

- [ ] **Add database indexes**
  - `report_sections(report_id)`, `report_sections(section_type)`
  - `reports(user_id, updated_at DESC)`
  - `file_uploads(report_id)`

- [ ] **Add RLS to report_sections**
  - Policy: user can access sections where report.user_id = auth.uid()

- [ ] **Clean up data integrity code**
  - Remove `dataIntegrityGuard` Russian-doll checks (shouldn't be needed after single-source migration)
  - Remove `removeCircularReferences`, `hasCircularReference` utilities
  - Keep `safeStringify` as a safety net

**Exit criteria:** All report reads/writes use `report_sections` table only. Zero overlay logic. All existing reports pass validation.

### Phase 1: File Storage & Extraction Pipeline (Weeks 3-4)
> Make AI extraction the primary data entry method

- [ ] **Set up Supabase Storage**
  - Create `assessment-files` bucket with RLS
  - File upload → Supabase Storage → metadata in `file_uploads` table

- [ ] **Create `file_uploads` table**
  - Schema as defined in Part 1
  - Track processing status, extracted text, AI results

- [ ] **Refactor AI extraction pipeline**
  - New endpoint: `POST /api/ai/extract-all`
  - Accepts report_id + uploaded file references
  - Processes all files in parallel
  - Maps extracted data to section types
  - Writes `structured_data` + `extraction_confidence` to `report_sections`
  - Returns extraction summary

- [ ] **Add confidence scoring**
  - Claude returns confidence per field during extraction
  - Store in `extraction_confidence` JSONB on `report_sections`
  - Threshold: ≥0.85 = auto-approved, 0.60-0.84 = needs review, <0.60 = flagged

**Exit criteria:** Upload files → AI extracts → sections populated with confidence scores. No manual data entry required for standard assessment files.

### Phase 2: Verification Dashboard (Weeks 5-6)
> Replace section-by-section editing with a report-level review view

- [ ] **Build VerificationDashboard component**
  - Shows all sections in one scrollable view
  - Each field: value, confidence badge, source file attribution
  - Color coding: green/yellow/red based on confidence
  - "Approve All High-Confidence" bulk action button
  - Click field to edit inline

- [ ] **Build ReportProgressBar component**
  - Overall completion percentage
  - Section-level status: complete / needs review / empty
  - Estimated time to completion

- [ ] **Redesign report landing page**
  - After report creation: go to Upload & Extract page (not section 1)
  - After extraction: go to Verification Dashboard (not section 1)
  - Section-by-section editing accessible from dashboard (drill-down)

- [ ] **Simplify section editing view**
  - Remove "Edit Template" tab from default view
  - Remove "Sources" tab — move source info to inline attribution
  - Single view: fields with inline provenance indicators
  - Template editing moves to Settings/Admin area

**Exit criteria:** SLP can see all extracted data at a glance, bulk-approve high-confidence fields, and drill into sections for detailed editing.

### Phase 3: Narrative Generation & Export (Weeks 7-8)
> Complete the pipeline from data to finished document

- [ ] **Implement one-click narrative generation**
  - "Generate All Narratives" button on dashboard
  - Processes all sections with complete `structured_data`
  - Streams progress: "Generating section 3 of 9..."
  - Stores narrative in `report_sections.content`

- [ ] **Build split-pane editor**
  - Left: structured data fields
  - Right: generated narrative (live preview)
  - Editing a field on the left regenerates the narrative sentence on the right
  - Editing narrative on the right flags which field may need updating

- [ ] **Implement PDF export**
  - Use Puppeteer (server-side) or @react-pdf/renderer
  - Professional formatting: headers, page numbers, letterhead placeholder
  - HIPAA-compliant file naming: `{student_last}_{report_type}_{date}.pdf`
  - Store generated PDF in Supabase Storage

- [ ] **Add report finalization workflow**
  - "Finalize Report" button runs compliance checks
  - Verifies all required sections complete
  - Verifies all flagged fields reviewed
  - Locks report from further editing (unless explicitly unlocked)

**Exit criteria:** Upload → Extract → Verify → Generate Narratives → Export PDF. Complete pipeline works end-to-end in under 15 minutes for a standard evaluation.

### Phase 4: Polish & Power Features (Weeks 9-12)
> Optimize for speed, add features that create stickiness

- [ ] **Clinical abbreviation expansion**
  - "WNL" → "within normal limits"
  - "s/p" → "status post"
  - Auto-age calculation from DOB
  - State-specific compliance language

- [ ] **Collaborative review**
  - Share report with supervisor (read-only + comment)
  - Supervisor approval workflow
  - Comment threads per section

- [ ] **Template marketplace**
  - Save custom templates
  - Share templates across organization
  - Template versioning

- [ ] **Mobile/tablet responsive design**
  - Tablet-optimized note capture during assessment sessions
  - Voice-to-text integration for observation notes

- [ ] **Assessment software integrations**
  - Import standardized test results directly (Q-Interactive, PsychCorp, etc.)
  - Auto-populate assessment tools section

- [ ] **Performance optimization**
  - Implement pagination on dashboard
  - Lazy-load section data (fetch structured_data on demand)
  - Cache frequently used templates and section types
  - Optimize Supabase query patterns

---

## Part 5: Technical Debt Cleanup

These items should be addressed during the relevant phase:

| Debt Item | Phase | Action |
|-----------|-------|--------|
| Dual storage (reports.sections + report_sections) | 0 | Eliminate — single source of truth |
| Circular reference detection code | 0 | Remove after dual storage fix |
| Russian-doll corruption guards | 0 | Remove after dual storage fix |
| `repair-sync` admin API | 0 | Delete — no longer needed |
| Metadata column constraint failures | 0 | Fix schema constraint or normalize |
| PDF export stub | 3 | Implement properly |
| "Save as Template" TODO | 4 | Implement |
| Undo/redo in editors | 4 | Implement with Tiptap history |
| Keyboard shortcuts help UI | 4 | Implement |
| Image vision analysis placeholder | 1 | Enable Claude vision for uploaded images |
| `NEXT_PUBLIC_SUPABASE_PG_CHANGES` gating | 0 | Enable realtime by default or remove |
| Simulated progress toasts | 2 | Replace with real streaming progress |

---

## Part 6: Success Metrics

### Primary KPI
**Time from "upload files" to "exported PDF"** — target: 15 minutes for a standard evaluation

### Secondary KPIs
| Metric | Current (estimated) | Target |
|--------|-------------------|--------|
| Manual fields entered per report | 50-100+ | <10 (only flagged items) |
| AI extraction accuracy | Unknown | >85% field-level accuracy |
| Clicks from report creation to export | 30+ | <15 |
| Report completion rate | Unknown | >80% of started reports |
| Time spent on data entry vs. review | 70/30 | 10/90 |

### How to Measure
- Add analytics events: `report_created`, `files_uploaded`, `extraction_completed`, `narrative_generated`, `report_exported`
- Track timestamps between events to measure funnel timing
- Log field-level edits post-extraction to measure AI accuracy
- A/B test new flow vs. old flow with pilot users

---

## Part 7: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Dual storage migration corrupts data | Medium | High | Run migration on staging first. Keep backup of `reports.sections` column for 30 days. Verify every report post-migration. |
| AI extraction accuracy too low for clinical use | Medium | High | Conservative confidence thresholds. Always require human verification. Never auto-approve clinical conclusions. |
| SLPs resist workflow change | Medium | Medium | Offer both workflows during transition. New flow as default, old flow accessible. Gather feedback from pilot users. |
| PDF export formatting issues across systems | Medium | Medium | Test across OS/browsers. Use server-side rendering (Puppeteer) for consistency. |
| Supabase Storage costs with file persistence | Low | Low | Set retention policies. Compress files. Offer file cleanup after report export. |

---

## Summary

**Database:** Stay on Supabase. Fix the dual-storage problem by making `report_sections` the sole source of truth and dropping the embedded JSONB.

**Architecture:** Add a file storage layer, restructure the AI pipeline to be extraction-first, and consolidate React state management.

**UI/UX:** Invert the workflow from "manual entry + optional AI" to "AI extraction + human verification." Add a verification dashboard, progress tracking, and working PDF export.

**Timeline:** ~12 weeks in 4 phases, with the foundation work (Phase 0) being the most critical and highest-ROI investment.

**North star:** 15-minute report workflow. Everything else is secondary.
