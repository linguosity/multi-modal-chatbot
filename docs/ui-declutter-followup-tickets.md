# Follow-up tickets — `feat/ui-declutter`

Sequenced into three buckets: **P0 ship-blockers** (must land before merge),
**P1 finish-the-card** (close the loop on patterns we already started),
**P2 system hardening** (codify the primitives). Effort estimates are
S (≤1 day), M (1–3 days), L (3–5 days).

---

## P0 — Ship-blockers (resolve before merging `feat/ui-declutter`)

### LING-101 — Top app bar overlaps itself at laptop widths

**Type:** Bug · **Priority:** P0 · **Effort:** S

At 1176–1440px viewports, the top bar's report-title text wraps to 2–3
lines and the utility chips ("AI Intake", "Realtime: ON/OFF",
"Timeline", "RECORD", "Settings", "Save Report") visually collide.
Reproduces on the Student Information, Eligibility Checklist, and
Accommodations routes.

**Acceptance criteria.**
- Report title truncates with ellipsis and a hover tooltip when its
  container would force wrap.
- No visual overlap between any two top-bar elements at viewport widths
  ≥1024px.
- Below 1280px, secondary controls (Realtime, Timeline, RECORD) collapse
  into an overflow menu (kebab) on the right of the bar; Save Report
  and Settings remain always visible.
- Header height stays ≤72px at all widths ≥1024px.

**Out of scope.** Sticky-nav redesign (LING-121).

**Verification.** Manual at 1024 / 1280 / 1440 / 1920 widths plus a
Storybook story for the bar at each breakpoint.

---

### LING-102 — Remove `Broadcast: TIMED_OUT | PG: DISABLED` diagnostic from header

**Status:** ✓ landed in `<commit>`. Gated behind
`NEXT_PUBLIC_DEBUG_BANNER=true`.

**Acceptance criteria.** No diagnostic strings in the header in any
environment unless `NEXT_PUBLIC_DEBUG_BANNER=true` is set.

---

### LING-103 — Dual progress meter on Eligibility Checklist contradicts itself

**Status:** ✓ landed in `<commit>`. Generic field-count meter is
suppressed on `eligibility_checklist` and `validity_statement`.

**Acceptance criteria.**
- Eligibility Checklist shows only the criterion-progress meter
  (`N of M criteria decided`).
- The generic field-count meter is hidden on sections where a more
  meaningful unit exists.
- Add a `progressUnit?: 'fields' | 'criteria' | 'tools' | 'goals' | 'custom'`
  config to the section meta so other sections can opt out similarly.
  *(Initial fix uses an explicit allow-list; the generalized config
  field is a follow-up.)*

---

### LING-104 — Section H1 flashes empty on hydration

**Type:** Bug · **Priority:** P0 · **Effort:** S

On Student Information and Eligibility Checklist, the `<h1>` is missing
during the first ~250–500ms after navigation; only the small subtitle
renders. Looks like a hydration/skeleton mismatch.

**Acceptance criteria.**
- H1 is present in the SSR HTML (no client-only render).
- Skeleton state (if any) shows a placeholder for the H1, not blank
  space.
- Reproduce-and-verify with Network throttled to Slow 3G.

**Verification.** Lighthouse FCP/LCP unchanged or improved; manual
throttle test.

---

### LING-105 — Accessibility wiring: labels, tabs, progressbar

**Type:** Bug · **Priority:** P0 · **Effort:** M

Audit findings: zero `<label for>`/wrapped pairs across all data-entry
inputs; tabs (`Data entry / Edit template / Sources`) are plain
`<button>`s without `role="tab"` or `tablist` parent; progress meters
have no `role="progressbar"` or aria values; ~41 focusable elements
failed a quick visible-focus check.

**Acceptance criteria.**
- Every `<input>`, `<textarea>`, `<select>`, and custom radio in the
  data-entry view has either `htmlFor`/`id` association or wrapping
  label or `aria-labelledby`.
- The section-tab component exposes `role="tablist"` on the container
  and `role="tab"`/`aria-selected`/`aria-controls` on each tab; arrow
  keys cycle focus and update selection; `Home`/`End` jump to first/last.
- Progress meters use `<progress>` or `role="progressbar"` with
  `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and an `aria-label`.
- All interactive elements have a visible `:focus-visible` outline
  meeting WCAG 2.4.7.
- Add an axe-core CI check that fails on serious/critical violations on
  the Student Info, Eligibility, and Accommodations routes.

**Verification.** axe-core clean run; manual keyboard-only walkthrough;
VoiceOver/NVDA spot check on Eligibility.

---

### LING-106 — Empty-state pile-up in AI narrative footer

**Type:** Polish · **Priority:** P0 · **Effort:** S

Empty state stacks "Add data above to generate narrative" + "Generate
for this section" + "No narrative generated yet" + "Add some data to the
section above, then generate a narrative" — four near-redundant lines.

**Acceptance criteria.**
- Single empty state with one headline ("No narrative yet") and one
  helper line that reflects state ("Fill N more fields, then I can
  draft a narrative" when fields are missing; "Click Generate when
  you're ready" when fields are sufficient).
- Disable the Generate button until the section has the minimum fields
  configured for narrative generation.

---

## P1 — Finish-the-card (next sprint)

### LING-110 — Per-criterion AI-draft on Eligibility justifications

**Type:** Feature · **Priority:** P1 · **Effort:** M

CriterionCards landed structurally but the justification textareas have
no AI assist, even though Sources and prior sections contain the
evidence. Highest-leverage missing piece.

**Acceptance criteria.**
- Each CriterionCard's justification textarea has an `[✨ AI draft]`
  button that:
  - Pulls from the section's Sources plus a configurable list of
    upstream sections (`evidenceSources` on the criterion config).
  - Returns a 2–4 sentence draft scoped to the specific criterion.
  - Inserts as draft text the user can edit; keeps the original empty
    value if the user dismisses.
  - Shows a confidence chip + provenance ("Drafted from: Assessment
    Results, Parent Concern · 79%").
- Streaming UX: draft appears progressively, not all-at-once.
- Keyboard shortcut: `Cmd/Ctrl+J` to draft the focused justification.
- Telemetry: log accept / edit / reject events to feed prompt iteration.

**Out of scope.** AI-draft on non-Eligibility narrative fields (LING-122).

---

### LING-111 — Evidence chips on Eligibility CriterionCards

**Type:** Feature · **Priority:** P1 · **Effort:** S–M

Spec called for a footer row on each CriterionCard listing which sections
supply evidence (`Evidence from: CELF-5 (Sec 7), Parent Concern (Sec 5)`).
Currently absent.

**Acceptance criteria.**
- Below the justification field, render a row of small chips listing
  the upstream sections/fields configured as evidence sources for that
  criterion.
- Each chip is a link that scrolls to / opens that source section.
- If a source PDF page is known, the chip shows page number
  ("CELF-5 · p.12").
- When AI-draft is invoked (LING-110), highlight the chips that were
  actually used in the draft.

---

### LING-112 — Default Eligibility criterion definition to expanded

**Type:** UX · **Priority:** P1 · **Effort:** S

"Show definition" defaults to collapsed. The criterion text *is* the
context for the Yes/No decision; collapsing it forces a click before the
user can answer accurately.

**Acceptance criteria.**
- Definition is expanded by default on first load.
- User can collapse; collapsed state persists per criterion per session
  (not per device).
- "Show definition" / "Hide definition" copy stays the same.

---

### LING-113 — Auto-filled lane responsive behavior on Student Information

**Type:** UX · **Priority:** P1 · **Effort:** S–M

Lane uses `lg:grid-cols-[1fr_280px]`. Below 1024px it stacks as
full-width below the main fields and reads as just another row of the
form. Even at ≥lg, it's a soft visual register.

**Acceptance criteria.**
- Drop the breakpoint to ~880px (or `md:`), narrow the rail to 240px,
  so the side-by-side layout holds at most laptop widths.
- When stacked (below the breakpoint), wrap the lane in a clearly-
  distinct "Auto-filled" card: stronger border, `Auto-filled · N`
  heading outside the box, top margin to separate from the main grid.
- At ≥breakpoint widths, align field rows in the lane with main-column
  rows (top-aligned grid baseline).
- Add a horizontal divider between manual fields and the lane on the
  stacked view.

---

### LING-114 — Eligibility Status: switch from segmented to dropdown when labels overflow

**Type:** Bug · **Priority:** P1 · **Effort:** S

"Re-evaluation Required" wraps to 3 lines inside a segment at every
common laptop width. Pattern needs a guardrail.

**Acceptance criteria.**
- Codify rule: ≤4 short options (≤14 chars each) → segmented;
  otherwise → dropdown.
- Apply rule via a single `SingleSelect` primitive that picks renderer
  based on options length and label width.
- Migrate Eligibility Status to use it (will render as dropdown given
  current options).
- Update Severity (3) and Prognosis (3) to render as segmented per the
  same rule.

**Verification.** Snapshot tests for the SingleSelect renderer at
varying option counts/lengths.

---

### LING-115 — Apply CriterionCard pattern to Validity Statement and Reason for Referral

**Type:** UX · **Priority:** P1 · **Effort:** M

Yes/No + justification pairs still floating on Reason for Referral;
CriterionCard is the standard now.

**Status:** Validity Statement portion ✓ landed in `7cd19a0`.
Reason-for-Referral migration still pending.

**Acceptance criteria.**
- Reason for Referral: "Academic impact demonstrated" becomes a
  YesNoDecision with the existing details textarea bound as its
  justification.

---

### LING-116 — Deduplicate cross-section fields with `linked` chip

**Type:** Feature · **Priority:** P1 · **Effort:** M

"Primary Language(s)" appears in Student Info and Family Background;
"Educational impact" appears in Reason for Referral and Eligibility.

**Acceptance criteria.**
- Field schema supports `linkedFrom: { sectionId, fieldId }`.
- Linked fields render as read-only with a `linked from {section name}`
  chip; clicking the chip jumps to the source.
- Optional `allowDivergence: true` lets the user override the linked
  value, after which the chip changes to `diverges from {section name}`
  and exposes a "revert to source" action.
- Migrate the two known dupes (Languages, Educational Impact) to use
  this.

---

### LING-117 — Visible autosave indicator

**Type:** Feature · **Priority:** P1 · **Effort:** S–M

Reports take ≥1 hour to fill; "Save Report" is a manual action with no
dirty/saved state visible. Trust risk.

**Acceptance criteria.**
- A small status indicator near "Save Report" shows one of:
  `Saved · 2s ago`, `Saving…`, `Unsaved changes`,
  `Offline — changes will retry`.
- Per-field autosave debounced at 800ms; surfaces failures inline with
  retry.
- Beforeunload guard if there are unsaved local changes.

---

### LING-118 — Curate Accommodations chip suggestions

**Type:** Content · **Priority:** P1 · **Effort:** S

Seeded chips landed but the list is incomplete and uses non-IEP-standard
phrasing in places.

**Acceptance criteria.**
- **Testing Accommodations** suggested set: Extended time · Extended
  response time · Reduced-distraction environment (rename from
  "Quiet environment") · Small group setting · Frequent breaks · Oral
  administration · Repeat/rephrase test directions · Simplified
  directions · Visual supports · Allow nonverbal/AAC responses · Use
  of bilingual examiner or interpreter · Familiar examiner/setting ·
  Frequent check-ins for understanding.
- **Classroom Modifications** suggested set: Preferential seating ·
  Visual supports · Break down multi-step directions · Use gestures
  with verbal directions · Provide written checklists · Allow extra
  processing time · Pre-teach vocabulary · Repeat/rephrase
  instructions · Chunked assignments · Reduced workload (quality over
  quantity) · Sentence frames / starters · Graphic organizers · Word
  banks · Modeling and guided practice.
- Drop "Pair simplified verbal input with visual aids" (covered by
  "Visual supports").
- Suggested chips render in a "Common picks" subgroup; one click adds
  the chip to the selected list above.
- Add an admin-only "Manage suggestions" link (stub for LING-130).

---

## P2 — System hardening

### LING-120 — Codify the `StateChip` component (computed / locked / AI / linked)

**Type:** Refactor · **Priority:** P2 · **Effort:** S

`<StateChip kind="computed|locked|ai|linked" tooltip={...} />` with
consistent icon, color token, size, hover/focus tooltip.

---

### LING-121 — Sticky chrome compaction

**Type:** UX · **Priority:** P2 · **Effort:** M

Combined sticky chrome ≤72px at all widths ≥1024px. Workflow nav either
un-sticks past first scroll, or compresses to icon-only with hover labels
when sticky.

---

### LING-122 — Per-field AI-draft on narrative sections

**Type:** Feature · **Priority:** P2 · **Effort:** M

Generalize the Eligibility AI-draft (LING-110) to every TextLong field
on narrative sections.

---

### LING-123 — Retire `Tools` giant-card layout in favor of compact table (Template D)

**Type:** UX · **Priority:** P2 · **Effort:** M

Compact table with columns Tool · Date · Type · Population, expand-to-
edit on row click. Measure Type and Target Population become
SingleSelects. Title becomes searchable combobox linked to Tool Library.

---

### LING-124 — Recommendations: Template E (segments + chips, not textareas)

**Type:** UX · **Priority:** P2 · **Effort:** M

Frequency segmented (1x–5x/wk + custom); Duration segmented
(20/30/45/60 min + custom); Setting MultiSelectChips; Goals as a
repeating list with "Add from goal bank" pulling from Tool Library.

---

### LING-125 — Edit template: two-pane Blueprint + live Preview

**Type:** Feature · **Priority:** P2 · **Effort:** L

Left pane: field list with cluster headers, drag-to-reorder, type-aware
add menu using primitive icons + plain-language names. Right pane:
live-rendered preview of the Data entry view. Per-field editor is
type-aware. "Key" hidden under Advanced disclosure.

---

### LING-126 — Tab semantics: real `tablist` with arrow-key navigation

**Type:** A11y · **Priority:** P2 · **Effort:** S

Implement once as a shared `<Tabs>` primitive used by all section pages.

---

### LING-127 — Sources tab: bidirectional links to fields

**Type:** Feature · **Priority:** P2 · **Effort:** M

Each source card shows "Used in: 7 fields across 4 sections" with
click-to-expand list. Drag/drop upload affordance. Page count, upload
origin, replace action.

---

### LING-128 — Pipeline stepper shows current phase

**Type:** UX · **Priority:** P2 · **Effort:** S

Current phase visually distinct; completed phases checked; future
phases muted.

---

### LING-129 — Sidebar status-dot legend

**Type:** UX · **Priority:** P2 · **Effort:** S

Hover tooltip on each dot ("Complete" / "In progress" / "Empty"); a
small key at the top of the Contents list on first visit, dismissible.

---

### LING-130 — Admin-managed chip suggestion library

**Type:** Feature · **Priority:** P2 · **Effort:** L

Per-tenant suggestion sets editable by an admin role; the data-entry
chip components pull from these sets; falls back to default seed list
if a tenant set is empty.

---

## Suggested sequencing

**This sprint (P0):** LING-101, 102, 103, 104, 105, 106. Total
~5–7 dev-days. Unblocks merge of `feat/ui-declutter`.

**Next sprint (P1):** LING-110, 111, 112, 113, 114, 117, 118. Total
~10–12 dev-days. Delivers the Eligibility "wow" demo (AI-draft +
evidence chips), polishes Student Info, ships autosave indicator.

**Following sprint (P1 spillover + P2 starters):** LING-115, 116, 120,
121, 122. Brings the rest of the report onto the new patterns.

**Backlog (P2):** 123, 124, 125, 126, 127, 128, 129, 130. Sequence
Edit-template rebuild (125) before the admin chip library (130) since
the latter depends on the type-aware editor.
