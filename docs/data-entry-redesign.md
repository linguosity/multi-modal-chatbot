# Linguosity Data-Entry Redesign Spec

> Preserved as the source of truth for the multi-phase Data Entry redesign.
> Commits on the `feat/ui-declutter` branch chip away at this spec in small,
> shippable increments; the full rollout plan lives at the bottom.

## 1. Diagnosis of current state

The report has 12 sections that all share one template: a two-column
"label + input" grid plus a bottom AI-generated narrative. That template
is doing five structurally different jobs, which is why the UX feels off
even though any individual field looks fine. Across the 12 sections
catalogued:

- **5 archetypes** (structured demographics, narrative, decision /
  justification, collection, enumerable-as-text)
- **4 field states** (manual, computed, locked, AI-assisted) that are
  announced with inconsistent badges
- **At least 3 cross-section duplicates** (Primary Language, Educational
  Impact, Concerns)
- **Multiple placeholder-as-instruction uses** where the field type is
  wrong (comma-separated lists, "2x/week, 3x/week", "Standardized,
  Observation, Interview", language lists)

The fix is a small field-primitive library plus five section templates,
applied consistently across all 12 sections, with a shared
AI / narrative / progress chrome.

## 2. The field primitive library (build this first)

Highest-leverage change. Ten primitives, each with a clear data shape and
editor-configurable options.

- **TextShort** — single-line string. Options: max length, regex hint,
  monospace. Use for: names, student ID.
- **TextLong** — multi-line string with optional autosize, character
  counter, and AI-assist button. Options: min rows, AI prompt template,
  linked source fields. Use for: all narrative fields.
- **DateField** — native date picker with relative-age display. Options:
  min / max, "compute age from this" flag. Use for: DOB, report date.
- **DateList** — multiple dates as chips ("Add another date"). Use for:
  Evaluation Date(s).
- **ComputedField** — read-only value derived from other fields with a
  visible formula chip. Options: formula, units, manual override toggle.
  Use for: Age.
- **SingleSelect** — dropdown or segmented control (auto-chooses based on
  option count: ≤5 = segmented, >5 = dropdown with search). Options:
  options list, allow other. Use for: Grade, Severity, Prognosis,
  Eligibility Status, Measure Type.
- **MultiSelectChips** — tag input with suggested values and free-add.
  Options: suggested list, free-add on/off, max count. Use for: Primary
  Language(s), Testing Accommodations, Classroom Modifications, Measure
  Type (if multiple).
- **YesNoDecision** — a prominent binary control bound to an optional
  justification TextLong. Options: require justification on Yes / No /
  both, label customization. Use for: every Yes / No in Validity and
  Eligibility.
- **CriterionCard** — compound: definition text (read-only),
  YesNoDecision, justification TextLong, optional source citation.
  Options: definition source (custom or linked to rubric), AI-suggest
  justification. Use for: every eligibility criterion.
- **RepeatingGroup** — a configurable list of sub-records rendered as a
  compact table by default, expandable to a full form per row. Options:
  subfield schema, columns shown in collapsed view, sort, "AI extract
  from source" action. Use for: Assessment Tools, optionally Assessment
  Results if scores get added.

Three shared state chips apply across all primitives: **AI** (green
sparkle), **Computed** (function icon), **Locked** (lock icon). Drop the
current all-caps wordmarks in favor of icon + tooltip to reduce visual
noise.

## 3. The five section templates

Every section uses one of these layouts. No more one-size two-column grid.

- **Template A — Structured Demographics.** Single card, 12-column grid,
  fields grouped into labeled clusters with a thin divider. Each cluster
  can collapse to a summary line once complete. Auto / locked / AI
  fields live in a right-hand "Auto-filled" lane so manual fields
  aren't visually contaminated by read-only ones.
  Applies to: Student Information, top of Conclusion.
- **Template B — Narrative.** Single column, full-width TextLong fields
  stacked with breathing room. Each field has an inline "AI draft"
  button that uses that section's Sources. A field-level "Link to:
  Source X, page Y" chip appears when AI populated it.
  Applies to: Reason for Referral, Health & Developmental History,
  Family Background, Parent Concern, Assessment Results (until it gets
  scores), bottom of Conclusion.
- **Template C — Decision Cards.** Stack of CriterionCards. Each card
  shows the definition (collapsible), the YesNoDecision front-and-
  center, and a justification TextLong below. A sticky "X of Y decided"
  progress chip at the top.
  Applies to: Validity Statement, Eligibility Checklist.
- **Template D — Collection.** A compact table (one row per item,
  columns for the 2–3 most important subfields, expand-to-edit on
  click), plus "+ Add" and "AI extract from sources" buttons. Empty
  state is a friendly 1-line nudge, not a dashed box.
  Applies to: Assessment Tools, and a future Assessment Results if you
  add per-domain score tables.
- **Template E — Structured Recommendation.** A mini-form where each
  plan line is a chip / picker combo rather than a textarea: Frequency
  (segmented: 1x, 2x, 3x, 4x, 5x / week + custom), Duration (segmented:
  20 / 30 / 45 / 60 min + custom), Setting (chips: Individual, Small
  group, Classroom, Teletherapy), Goals (TextLong with inline "Add
  from goal bank").
  Applies to: Recommendations, Accommodations.

## 4. Per-section redesign (all 12)

### Section 01 — Student Information (Template A)

**Today**: 13 flat fields in a 2-col grid mixing manual / computed /
locked / AI fields; "COMPUTED / LOCKED / AI" wordmark badges.

**Redesign**: Three clusters.

- **Student Identity** — First Name, Last Name, DOB (DateField), Age
  (ComputedField, read-only with override), Student ID.
- **Schooling** — Grade (SingleSelect as segmented PreK / K / 1–12),
  School Name, Primary Language(s) (MultiSelectChips — source of truth
  for the whole report).
- **Evaluation Metadata** — Report Date, Evaluation Date(s) (DateList),
  Evaluator Name, Evaluator Credentials, Eligibility Status
  (SingleSelect with AI chip).

Auto-filled lane on right of the card surfaces Age, Evaluator Name /
Credentials, Eligibility Status with confidence chips and "edit"
affordances. Collapsed summary line once complete: "Jane Doe · 7y 3m ·
Grade 2 · English / Spanish".

### Section 02 — Reason for Referral (Template B)

**Today**: 4 fields, awkward Yes / No floating next to a textarea.

**Redesign**: Single-column narrative stack.

- Referral Source (SingleSelect chips: Teacher, Parent, Self,
  Pediatrician, SST, Other + free-add).
- Primary Concerns (TextLong, AI-draft button pulls from Parent Concern
  section).
- Academic Impact (YesNoDecision with justification = Academic Impact
  Details; replaces the current two-field pair).

**Deduplicate**: Academic Impact flows downstream to Eligibility
Checklist's "Educational impact demonstrated" — enter once, show as
read-only with "source: Reason for Referral" chip in Eligibility.

### Section 03 — Health & Developmental History (Template B)

**Today**: Textarea wall with one checkbox + conditional textarea.

**Redesign**: Single-column narrative stack.

- Birth / Pregnancy complications (YesNoDecision with justification =
  Birth Complication Details).
- Developmental Milestones (TextLong; later can upgrade to a milestone
  matrix with on-track / delayed chips per milestone).
- Medical Conditions (MultiSelectChips with ICD / condition suggestions
  + free-add).
- Current Medications (MultiSelectChips + free-add).
- Hearing / Vision Status (TextLong with suggested templates: "Passed
  screening [date]" / "Referred").

### Section 04 — Family Background (Template B)

**Today**: 4 fields; "Primary Language(s) at Home" duplicates Student
Info.

**Redesign**:

- Languages at Home (MultiSelectChips, linked to Student Info's Primary
  Languages, pre-filled, editable with "diverges from Student Info"
  chip if user overrides).
- Family History of Communication Disorders (YesNoDecision with
  justification = Family History Details).
- Educational Background of Parents (TextLong).
- Cultural Considerations (TextLong).

### Section 05 — Parent Concern (Template B)

**Today**: 5 narrative fields, odd lone textarea breaking the 2-col grid.

**Redesign**: Single-column stack.

- Parent / Guardian Name (TextShort, or SingleSelect if multiple
  guardians added earlier).
- Communication Concerns, Social Interaction Concerns, Academic Concerns
  (three TextLong with consistent spacing and per-field AI-assist).
- Onset / Duration (compound: onset DateField or age, duration
  SingleSelect: <6mo / 6–12mo / 1–2y / 2y+).

### Section 06 — Assessment Tools (Template D)

**Today**: Stacked giant cards per tool with full-width textareas for
things like "Measure Type".

**Redesign**: Compact table. Row click expands inline to the full form.
Measure Type becomes a SingleSelect (Standardized, Criterion-referenced,
Observation, Interview, Narrative, Dynamic). Target Population becomes
SingleSelect. Title becomes a searchable combobox linked to the Tool
Library in the sidebar (so clinicians pick from a shared list rather
than retyping). Add "AI extract tools from sources" button that
pre-fills rows from uploaded PDFs.

### Section 07 — Assessment Results (Template B now, Template D later)

**Today**: 6 parallel "Summarize X findings" textareas; no place for
scores.

**Redesign (phase 1)**: Keep Template B but add (a) a per-domain AI-
draft button seeded by the tools from Section 06, (b) a "domains
addressed" toggle at the top so you can hide domains that weren't
assessed instead of showing empty textareas for all six.

**Redesign (phase 2)**: Upgrade to Template D — a table per domain with
columns for Subtest, Standard Score, %ile, Confidence Interval,
Descriptive Range, and a Notes TextLong beneath. AI extracts score
tables directly from uploaded PDFs and populates.

### Section 08 — Validity Statement (Template C)

**Today**: Already hints at grouping ("Student Cooperation", "Validity
Factors") but fields aren't visually bound.

**Redesign**: A stack of CriterionCards.

- Results are valid (YesNoDecision, required justification if No).
- Student Cooperation (CriterionCard: definition = "Was the student
  cooperative throughout?", YesNoDecision, Understanding notes).
- Validity Factors — one CriterionCard per factor (Attention, Fatigue,
  Motivation, Linguistic / Cultural, Environmental, Other), each with
  YesNoDecision + notes. "Other factors" is an inline "+ Add factor"
  with a custom label.

### Section 09 — Eligibility Checklist (Template C) — highest-impact

**Today**: The worst UX. Definition text blob, Yes / No and justification
visually unlinked, Educational Impact duplicated.

**Redesign**: A stack of CriterionCards, one per eligibility criterion.

Each card:

```
┌─────────────────────────────────────────────────────────┐
│ ① Meets criteria for speech impairment      [ Yes | No ]│
│    California Definition: Speech or language… [expand ▾]│
│ ─────────────────────────────────────────────────────── │
│ Justification                            [✨ AI draft]   │
│ [ TextLong, pre-seeded with AI suggestion if available ] │
│ Evidence from: CELF-5 (Sec 7), Parent Concern (Sec 5)   │
└─────────────────────────────────────────────────────────┘
```

Cards for: Speech impairment, Language impairment, Adverse effect on
educational performance (linked read-only to Reason for Referral →
Academic Impact), Requires specialized instruction. A sticky header
shows "3 of 4 criteria decided — eligibility: Meets / Does not meet"
computed live from the decisions. No more scattered Yes / No pairs.

### Section 10 — Conclusion (Template A + B)

**Today**: Primary Diagnosis is a freeform textarea.

**Redesign**: Split the card.

- Diagnosis (Template A cluster): Primary Diagnosis (SingleSelect with
  search over SLP / ICD-10 diagnosis codes; free-add allowed), Severity
  (segmented: Mild / Moderate / Severe / Profound), Prognosis
  (segmented: Good / Fair / Guarded).
- Summary (Template B): Summary Statement (TextLong with an AI-draft
  button that pulls from Sections 7–9).

### Section 11 — Recommendations (Template E)

**Today**: Four textareas where "2x / week" is typed by hand every time.

**Redesign**:

- Service Frequency (segmented: 1x, 2x, 3x, 4x, 5x / week + custom).
- Session Duration (segmented: 20 / 30 / 45 / 60 min + custom).
- Service Setting (MultiSelectChips: Individual, Small group, Classroom,
  Teletherapy).
- Goals / Targets (repeating list, each goal = TextLong + domain
  SingleSelect, with "Add from goal bank" pulling from Tool Library
  goals).

### Section 12 — Accommodations (Template E)

**Today**: "Enter items separated by commas" — the clearest tell that
the field type is wrong.

**Redesign**:

- Testing Accommodations (MultiSelectChips with a suggested list:
  extended time, small group setting, frequent breaks, oral
  administration, simplified directions, etc. + free-add).
- Classroom Modifications (MultiSelectChips similarly seeded).
- Assistive Technology (MultiSelectChips + optional TextLong for
  specifics).
- Other Supports (TextLong).

## 5. Shared chrome redesign (applies to every section)

- **Section header.** Keep the "Section 0X · Report Name · Title"
  block, but add right-aligned: completion meter (e.g., "8 of 11
  fields · 73%") and a status pill (Draft / Needs review / Ready).
- **Tabs.** Keep Data entry / Edit template / Sources. Add a fourth:
  **Preview** — a read-only rendering that looks like the final report,
  so clinicians can see the effect of their inputs without leaving the
  section.
- **AI narrative footer.** Upgrade from "Add data above to generate
  narrative" to a live list of the fields it will use, with each field
  lighting up as filled. Button copy changes from "Generate for this
  section" to "Draft narrative from N fields". Generated narrative
  shows per-paragraph source chips (which field drove it) and an inline
  "Regenerate this paragraph" control.
- **Section navigation.** Replace the Previous / Next buttons with a
  compact step-rail showing the prior and next section names plus a
  "Jump to first incomplete" shortcut.
- **State chips.** Replace COMPUTED / LOCKED / AI wordmarks with icons
  (function, lock, sparkle) + tooltip. Keep them small and monochrome
  to reduce noise.
- **Cross-section linking.** Any field that appears in more than one
  section shows a linked chip with the source section name. Editing the
  linked value updates the source. This eliminates the Primary Language
  and Educational Impact duplications by design.

## 6. Edit template redesign

**Today**: Vertical list of identical cards with Label + Type chip.
Expanded editor shows Label, Key, Type, Placeholder.

**Redesign**: Two-pane layout.

- **Left pane — Blueprint.** The field list, drag-to-reorder, with
  cluster headers (to support Template A grouping). "+ Add field"
  opens a picker that shows the 10 primitives with icons +
  plain-language descriptions ("Yes / No with explanation", "List of
  tags", "Criterion card with decision", etc.) instead of
  implementation names.
- **Right pane — Live preview.** The Data entry view re-rendered in
  real time as the template is edited. So a change to "Severity" from
  SingleSelect to segmented control is immediately visible.

Per-field editor is type-aware:

- SingleSelect / MultiSelectChips → inline option manager with
  suggested values.
- YesNoDecision / CriterionCard → definition text,
  justification-required rule, AI prompt.
- ComputedField → formula builder referencing other fields by label.
- RepeatingGroup → nested subfield editor.

"Key" is hidden under an Advanced disclosure — clinicians shouldn't
need to see `first_name` to configure a field.

## 7. Rollout plan (phased, so it's shippable)

- **Phase 1 — Foundations (2–3 weeks).** Ship the primitive library,
  state-chip cleanup, and cross-section linking infra. No visible
  redesign yet; just refactor existing fields onto the new primitives.
  Deliverable: nothing looks different, but future changes are cheap.
- **Phase 2 — Highest-impact sections (2 weeks).** Redesign Eligibility
  Checklist (Template C), Assessment Tools (Template D), Recommendations
  + Accommodations (Template E). These are the sections with the worst
  current UX and the most structured data. Ship behind a feature flag.
- **Phase 3 — Narrative + demographics (1–2 weeks).** Redesign Student
  Information (Template A) and all Template B sections. Mostly layout
  and spacing changes plus AI-assist buttons; low engineering risk.
- **Phase 4 — Shared chrome (1 week).** Completion meter, Preview tab,
  smarter narrative footer, step-rail navigation.
- **Phase 5 — Edit template rebuild (2 weeks).** Two-pane blueprint +
  live preview. This unlocks power users and is where you can demo
  "non-engineers can now configure the form."

## Appendix: progress on `feat/ui-declutter`

| Item | Status | Commit |
|---|---|---|
| §3 Template A auto-filled lane (Student Info) | ✓ | `77f16f7` |
| §5 Status pill (Draft / In review / Finalized) | ✓ | `e5f8177` |
| §5 Report-level completion meter in Header | ✓ | `b9e92c8` |
| §5 Workspace / Contents sidebar grouping | ✓ | `b9e92c8` |
| §5 Horizontal workflow stepper | ✓ | `260bf30` |
| §5 Plain-language stage names | ✓ | `260bf30` |
| §5 Section chrome, section-level completion meter | ✓ | `6a1ede4` |
| §5 State chips → icon-only | ✓ | `6a1ede4` |
| §2 SingleSelect ≤5 options → segmented | ✓ | `6a1ede4` |
| §2 YesNoDecision + CriterionCard primitives | ✓ | `<this commit>` |
| §4.09 Eligibility Checklist → Template C | ✓ | `<this commit>` |
| §4.08 Validity Statement → Template C (reuses primitives) | ✓ | `<this commit>` |
| §2 MultiSelectChips primitive | not started | — |
| §2 RepeatingGroup as compact table | not started | — |
| §4.06 Assessment Tools → Template D | not started | — |
| §4.11–12 Recommendations / Accommodations → Template E | not started | — |
| §6 Edit template two-pane + live preview | not started | — |
