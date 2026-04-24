# Work Journal

Running log of substantial changes, architectural decisions, bugs encountered,
and follow-ups deferred. Newest entries on top. Entry template at the bottom
of the file.

---

## 2026-04-24 — Section editor: unified block model, slot architecture, AI integration

**Scope:** Built the outline ⇄ prose section editor from spec through
merge-to-main. Added the block-kind discriminated data model, slot-annotated
paragraphs, a validator, schema versioning, and hooked the AI intake pipeline
into the new tree format.

### Timeline

**Phase 1 — Section editor scaffold** (`feat/outline-prose-editor` branch)

| Commit    | What                                                                                        |
| --------- | ------------------------------------------------------------------------------------------- |
| `19908c6` | Section UI v2 split-pane spike — flag-gated (merged from spike branch)                      |
| `a10cb47` | Committed the outline-prose design spec (docs/outline-prose-editor-spec.md)                 |
| `034756b` | Foundation: `types.ts`, `tree-ops.ts`, `segment.ts`, read-only shell                        |
| `5834c2f` | v1 editing: `contentEditable`, blur-commit, Enter-new-sibling, Backspace-delete             |
| `dc07d87` | Tab / Shift+Tab nesting + pointer-event drag-drop with depth math                           |
| `07a96c4` | Fixed drop-indicator alignment — snapshot container rect, anchor math at actual content-start X |
| `ec380c1` | **Pivot**: dropped sentence-based prose sync (`segment.ts`) in favor of paragraph-per-point; Enter splits at cursor |
| `5db4dcb` | Merged `spike/section-ui-v2-split-pane` into the feature branch                             |
| `83fbc50` | Wired both editors into `src/app/dashboard/reports/[id]/[sectionId]/page.tsx`               |

**Phase 2 — Merge to main + cleanup**

| Commit    | What                                                                                 |
| --------- | ------------------------------------------------------------------------------------ |
| `fcbaea0` | Merged `feat/outline-prose-editor` into `main` (`--no-ff`, 204 files, +27k / −5k)    |
| `24bb8cb` | Cleared all pre-existing TypeScript errors: 66 → 0                                   |

**Phase 3 — Bug fixes + styling polish** (on `main`)

| Commit    | What                                                                                   |
| --------- | -------------------------------------------------------------------------------------- |
| `f05f158` | Fixed `{token}` interpolation bug; unified meta+title+toggle into one paper bar; added hint strip |
| `aa31958` | Interpolation polish: em-dash for missing slots, Yes/No for booleans, sentence-split fallback for legacy content |

**Phase 4 — Slot architecture + AI integration**

| Commit    | What                                                                                  |
| --------- | ------------------------------------------------------------------------------------- |
| `ea93c6b` | Slot annotations on `ParagraphBlock`, slot registry, validator, schema versioning, pencil + slot-dot affordances |
| `b5d8578` | `process-intake` route emits slot-annotated SectionTree alongside structured_data     |
| `6dc59ce` | Source chevron in editor, slot-aware sidebar completion ring, score-card tree seeding for `assessment_results` / `assessment_tools` |

### Architectural milestones

- **Unified block model.** A section is `{ topic, blocks[] }` where each
  block is kind-discriminated (`paragraph | score-card | criterion`). The
  outline and prose views are literal lenses over the same tree — no
  separate prose-string / data layer, no round-trip drift. Drag-drop,
  Tab/Shift+Tab, Enter-split, `normalizeDepths` all operate identically
  across kinds.
- **Paragraph-per-point (not sentence-per-point).** The original spec
  modeled points as sentences with segmentation-based prose ⇄ outline
  sync. That was reversed mid-session — a point is now a paragraph,
  blur-commits by stable `data-id`, no segmentation, no fuzzy matching.
  Deleted `segment.ts` entirely.
- **Slot annotations on paragraphs.** Each paragraph optionally carries
  `{ slot, value, source }`. These are invisible to clinicians;
  they guide AI extraction, completion validation, and export. The
  slot registry (`slots.ts`) is flat (no nesting) with ~30 typed slots
  and per-section schemas declaring expected slot ids.
- **Tree as authoritative storage.** `content` column serializes a JSON
  tree; `contentToTree` parses JSON first with plaintext fallback for
  legacy rows. `structured_data` column is preserved for legacy/AI
  pipelines but the editor reads from `content`.
- **AI bridge.** `process-intake` still extracts via field-path updates
  (unchanged) but now also emits a slot-annotated SectionTree at the
  upsert seam via `seedTreeFromStructuredData`. No prompt re-engineering.
- **Schema versioning.** `CURRENT_SCHEMA_VERSION = 1` stamped on every
  new tree. Older trees load cleanly; unknown slot ids pass through as
  free-form. Migration is opt-in at the report level, not automatic.

### Errors / bugs encountered and resolved

1. **Stale git lock file** (session start). `.git/index.lock` from a
   prior Claude session was blocking the first commit. Verified no
   active git process, removed manually. Noted in the safety protocol
   to always check for running processes before removing locks.
2. **Branch topology surprise.** `main` turned out to be ~150 commits
   behind the spike/feat branches (c746912 vs the feature tip). The
   `--no-ff` merge into main pulled in a lot more than just the editor
   — canvas/convergence/pii/triage routes, PII libs, supabase migrations,
   etc. Not an error, but worth knowing: most of the 204-file merge
   was catching main up to accumulated unrelated work.
3. **Drop-indicator alignment (`07a96c4`).** The drop indicator was
   anchoring at `container.left + 8px` (the spec's handle gutter),
   but actual content starts at `container.left + 56px` (16 handle +
   6 gap + 28 bullet + 6 gap). Fix: defined `CONTENT_START_OFFSET`
   constant used by both the detection math and the rendered line.
   Snapshotted container rect at drag start (not `rowLayouts[0].left`)
   so empty-list / depth-1 first rows work.
4. **`{first_name}` literally rendering** (`f05f158`). Structured
   sections stored `content` strings like
   `Date of Birth: {date_of_birth} (Age: {age})`. The old
   `DynamicStructuredBlock` path ran `renderTemplate(content, ctx)`;
   the new SectionEditor path just stripped HTML and split paragraphs,
   so every token rendered as literal text across every structured
   section. Confirmed via bundle analysis (the user inspected
   `contentToTree` offset 3,905,030 present, `renderTemplate` offset
   -1 absent). Fix: added `interpolateTokens(content, ctx)` called at
   the client-side boundary (server RSC payload is `content: ""`, the
   actual content arrives via Supabase client fetch). Documented
   tradeoff: first save collapses tokens to resolved values
   permanently.
5. **Missing tokens rendering as `{home_languages}`** (`aa31958`).
   First interpolation pass left unresolved tokens as visible
   `{token}` so clinicians could spot gaps. Feedback: this reads as
   broken template syntax, not helpful. Changed to em-dash (`—`)
   for missing values, Yes/No for booleans, sentence-split fallback
   when content has no paragraph breaks (legacy AI output was a
   single period-joined blob).
6. **Outline view looking like prose** (same commit). Family
   Background's content had no `\n` breaks — just periods between
   fields — so the outline view rendered everything as a single row.
   Fix: when `contentToTree` produces exactly one paragraph that
   contains multiple sentences, sentence-split via `Intl.Segmenter`
   (with regex fallback).
7. **66 pre-existing TypeScript errors.** Not caused by this session
   but blocked a clean handoff. Systematically cleared:
   - Design-system variant mismatches (`Omit<BaseComponentProps, 'variant' | 'size'>` pattern)
   - Radix popover + React type version drift (cast primitives via `as any` wrappers)
   - Lucide icon `title` prop (swapped to `aria-label`)
   - Keyboard shortcut modifier widening (readonly string[])
   - Boolean shadowing in FeedbackContext (`showToast` the flag shadowing `showToast` the function)
   - Several one-off fixes: form-field value coercion, StandardizedTestEditor spread cast, InlineBulletEditor DragEvent cast, change-tracking-service empty module, etc.

### Deferred / known tradeoffs

- **Token interpolation is one-shot.** Once a clinician saves,
  `{first_name}` → `"Lucia"` is permanent for that row. Fine for
  intake; bad for living records. Long-term fix: token-preserving
  decoration layer (render resolved values over a tree that still
  stores tokens). Skipped because it requires a custom block kind.
- **AI tool-use still `save_assessment_data`.** Returns field_path +
  value updates that we then reshape into a tree at the DB boundary.
  A `fill_section_tree` tool that returns the whole tree directly
  would be cleaner but needs prompt re-engineering + fixture
  evaluation. The bridge approach gets 80% of the value without
  risk.
- **Edit-vs-value reconciliation.** When a clinician edits the text
  of a slotted paragraph, `value` becomes stale. Today we treat text
  as canonical (Option B from the design doc). Option C (inline
  confirmation on conflict) requires slot-aware parsers.
- **Source click-through.** `paragraph.source` is surfaced as a
  hover chevron with `title` only. Clicking to open the source in a
  side panel needs a source-resolver service that maps tokens like
  `ai:process-intake` or file ids to actual displayable evidence.
- **Clinician-customizable schema library.** `SECTION_SCHEMAS` is
  hard-coded in `slots.ts`. The architecture supports clinician
  overrides but the settings surface and override storage don't
  exist.
- **Shared tree state JSON panel from the mockup** — intentionally
  omitted as a dev-only debug affordance. Can re-add behind a flag
  if debugging demands it.

### Files added this session

Core editor:
- `src/components/report/section-editor/types.ts`
- `src/components/report/section-editor/tree-ops.ts`
- `src/components/report/section-editor/content-adapter.ts`
- `src/components/report/section-editor/SectionEditor.tsx`
- `src/components/report/section-editor/blocks.tsx`
- `src/components/report/section-editor/slots.ts`
- `src/components/report/section-editor/slot-seeding.ts`
- `src/components/report/section-editor/validator.ts`

Dev preview:
- `src/app/dev/section-editor/page.tsx`

Design spec:
- `docs/outline-prose-editor-spec.md`

Modified: `src/app/dashboard/reports/[id]/[sectionId]/page.tsx`,
`src/components/Sidebar.tsx`, `src/app/globals.css`,
`src/app/api/ai/process-intake/route.ts`, plus ~34 files for TS cleanup.

### State at end of session

- `main` at `6dc59ce`, 50+ commits ahead of `origin/main`. **Not pushed.**
- TypeScript clean (`npx tsc --noEmit` → 0 errors).
- Dev server serving 200 on `/dev/section-editor` and real section routes.
- Dev preview at `http://localhost:3002/dev/section-editor` — has
  four sample trees (flat / nested / scores+criteria / empty).

---

## Entry template

```markdown
## YYYY-MM-DD — Short title of the session

**Scope:** One-paragraph summary.

### Timeline
<commit log or bullet list of changes>

### Architectural milestones
<key decisions — what changed about the model, not just what shipped>

### Errors / bugs encountered and resolved
<what went wrong and how it was fixed — future-you will thank you>

### Deferred / known tradeoffs
<what was explicitly left undone, with the reason>

### Files added / modified
<high-level list; don't enumerate every line>

### State at end of session
<branch, commit hash, any pending work>
```
