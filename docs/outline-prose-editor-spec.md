# Outline ⇄ Prose Section Editor — Design Spec

Status: draft for review
Owner: brandon@linguosity.ai
Target stack: Next.js 15 (App Router), React 18, TypeScript strict, Tailwind + `wf-*` primitives, Supabase
Intended location: `src/components/report/section-editor/`

## 1. Overview

A single editable document for one report section, rendered in two densities. Users toggle between a structured outline view and a flowing prose view without ever leaving the text or losing their place.

The design claim is **one source of truth, two renderings**. The underlying data is a tree of sentences; outline mode exposes that structure with indentation and numbering; prose mode collapses the tree into a paragraph. There is no separate "outline document" and "prose document" — both views read and write the same tree.

This eliminates a class of bugs that plague dual-editor systems: drift between views, merge conflicts on toggle, ambiguous "which version is canonical." There is only one version. The toggle is a lens, not a conversion.

A working interactive prototype has been validated covering every interaction in this spec. This document is the handoff to production.

## 2. Scope

In scope for v1:
- A React client component that edits one report section at a time.
- Outline view with inline editing, keyboard shortcuts, and drag-and-drop reordering with nesting.
- Prose view with inline editing and sentence-level round-tripping back to the outline tree.
- A shared in-memory tree model and a typed `onChange` callback.

Out of scope for v1 (deferred):
- Cross-section drag-and-drop (dragging a point from section A to section B).
- Inline rich-text formatting (bold, italic, citations, highlights).
- Tracked changes, inline comments, or collaborative cursors.
- Undo beyond the last committed state.
- Auto-scroll during drag.

These deferred capabilities are all handled natively by TipTap/ProseMirror and are the main reasons we would migrate — see §13.

## 3. Data model

A section is a topic sentence plus a tree of point nodes. Each node carries a stable ID so edits can be matched to existing content across round-trips through prose.

```ts
// src/components/report/section-editor/types.ts

export type SectionNodeId = string // opaque, server-assigned where possible

export interface SectionNode {
  id: SectionNodeId
  text: string
  children: SectionNode[]
}

export interface SectionTree {
  id: SectionNodeId           // section row id
  topic: { id: SectionNodeId; text: string }
  points: SectionNode[]
}
```

Design rules:

The topic is a required, always-present sentence. A section with no topic is invalid; use an empty-string topic if needed but keep the `topic` object.

Points are a tree of arbitrary depth. For the v1 UI we cap effective depth at 3 (depth 0, 1, 2) because deeper nesting is visually unreadable and rarely useful in clinical writing. Beyond depth 2, `Tab` is a no-op.

IDs are stable across edits. They are minted server-side on insert (via a Supabase RPC, see §11) and preserved by every client-side operation. Clients mint temporary IDs for unsaved nodes with a `tmp_` prefix; the server rewrites them on save.

**Why a tree rather than a flat array with depth annotations:** the tree cleanly expresses the parent/child contract ("a sub-point belongs to its parent") and makes move-with-children operations natural. A flat representation with depth is equivalent but leaks the "depth must never jump by more than +1" invariant into every consumer. The component internally flattens to a list with depth for drag math and re-trees after the drop — see §7.5.

## 4. Component API

```ts
// src/components/report/section-editor/SectionEditor.tsx

'use client'

export interface SectionEditorProps {
  /** Initial tree state. The component owns edits from this point forward. */
  value: SectionTree

  /** Fires on every committed edit. Commit = blur or idle-debounce (400ms). */
  onChange: (next: SectionTree, op: EditOp) => void

  /** Mode defaults to 'outline'. If controlled, pass `mode` + `onModeChange`. */
  mode?: 'outline' | 'prose'
  onModeChange?: (next: 'outline' | 'prose') => void

  /** For a11y and analytics. */
  label?: string

  /** Disable structural edits (still allows text edits). Default false. */
  readOnlyStructure?: boolean

  /** Fully disable editing. Default false. */
  readOnly?: boolean

  /** For cross-instance ID coordination (optional; defaults to random). */
  idFactory?: () => SectionNodeId
}

export type EditOp =
  | { kind: 'text-edit'; nodeId: SectionNodeId; prev: string; next: string }
  | { kind: 'insert'; nodeId: SectionNodeId; parentId: SectionNodeId | null; index: number }
  | { kind: 'delete'; nodeId: SectionNodeId; prev: SectionNode }
  | { kind: 'move'; nodeId: SectionNodeId; prev: { parentId: SectionNodeId | null; index: number; depth: number }; next: { parentId: SectionNodeId | null; index: number; depth: number } }
  | { kind: 'prose-restructure'; replacedIds: SectionNodeId[]; insertedIds: SectionNodeId[] }
```

Rationale for the `op` payload: consumers may want to persist granular diffs to Supabase rather than the whole tree. `prose-restructure` is emitted when a prose commit flattens the tree (see §7.3) and is the signal that the persistence layer should reconcile rather than apply deltas.

The component is uncontrolled for text content (it manages `contentEditable` internally) and controlled for structural state via `onChange`. Parents typically pass `value` from Supabase, hold the returned tree in local state or a React Query cache, and debounce persistence.

## 5. Rendering

### 5.1 Outline mode

Each section renders as a topic paragraph followed by a tree of points. Depth is visually encoded by left indent (26px per level) and by bullet style:

| Depth | Bullet                  | Use                                    |
|-------|-------------------------|----------------------------------------|
| 0     | `01` `02` `03` (mono)   | Top-level supporting points            |
| 1     | `·` (middle dot)        | Sub-points                             |
| 2     | `○` (ring)              | Deepest supported level                |

Numbering at depth 0 is always zero-padded to two digits. Sub-levels use bullets rather than nested numbering (no `01.a.i`) because nested numeric schemes add visual density without helping the reader scan.

The topic sentence is rendered at `font-weight: 500` with slightly tightened letter-spacing. Points are `font-weight: 400` at 1.7 line-height. Section-to-section gap is 36px.

A drag handle (`⋮` symbol) sits to the left of each point at `opacity: 0` by default, animating to `opacity: 0.7` on hover of the point row. The topic has no drag handle — topics are structural anchors per section, not reorderable.

### 5.2 Prose mode

Each section renders as a single `<p>` produced by depth-first traversal of the tree:

```ts
function toProse(section: SectionTree): string {
  const collect = (nodes: SectionNode[]): string[] =>
    nodes.flatMap(n => [n.text, ...collect(n.children)])
  const parts = [section.topic.text, ...collect(section.points)]
    .map(s => s.trim().replace(/[.!?\s]+$/, ''))
    .filter(Boolean)
  return parts.length ? parts.join('. ') + '.' : ''
}
```

Hierarchy is deliberately **not** preserved visually in prose. Sub-points appear inline as sentences without indentation, italicization, or any depth marker. Prose is for reading flow; outline is for structural editing. The tree is preserved in the data model and reappears on toggle back to outline.

Section-to-section gap tightens to 22px in prose mode, and card padding tightens from `34px 36px` to `26px 36px`. These are intentional cues that the user is now reading rather than organizing.

### 5.3 The toggle

A pill-shaped toggle with two segments: **Outline** and **Prose**. A sliding indicator tracks the active segment. Transition: 280ms `cubic-bezier(0.4, 0, 0.2, 1)` for the slider, 160ms opacity crossover on the card content.

The fade is not cosmetic. A direct swap causes visible layout thrash as block list items become inline paragraph content and numbered list rows disappear. The fade hides the reflow.

Respect `prefers-reduced-motion: reduce`: set both transitions to `1ms` and skip the fade.

## 6. Interactions

### 6.1 Text editing

Every topic, point, and prose paragraph is `contentEditable="true"` with `spellcheck="false"` (SLP reports contain many proper nouns and acronyms; the browser spell-checker is a distraction and should be opted in only if the clinician wants it).

Hover darkens the row background by `rgba(42,36,27,0.04)`. Focus darkens it to `rgba(42,36,27,0.06)`. Both transitions are 140ms. No visible input border, no pencil icon, no "edit" button.

Commit happens on `focusout` (blur) or after a 400ms idle-debounce, whichever comes first. Idle-debounce is needed for long unbroken typing sessions so the `onChange` callback fires and persistence can keep up with the user.

Pasted content is stripped to plain text (`event.preventDefault()`, then insert `clipboardData.getData('text/plain')`). In outline mode, if the pasted text contains multiple sentences, each sentence becomes its own new point below the current one (SLPs commonly paste lists from templates or prior reports).

### 6.2 Keyboard

| Key              | Context                        | Action                                                    |
|------------------|--------------------------------|-----------------------------------------------------------|
| `Enter`          | Outline: end of topic or point | Insert new empty sibling after current, focus it          |
| `Enter`          | Outline: middle of a point     | Split the point at the cursor into two siblings           |
| `Shift+Enter`    | Anywhere                       | Insert a soft break (literal `\n`) in the current text    |
| `Tab`            | Outline: point                 | Increase depth by 1 (nest under previous sibling)         |
| `Shift+Tab`      | Outline: point                 | Decrease depth by 1 (promote)                             |
| `Backspace`      | Outline: empty point           | Delete the point, focus end of previous row               |
| `Backspace`      | Outline: start of non-empty    | Merge with previous sibling                               |
| `⌘⇧O` / `Ctrl+⇧O`| Anywhere in the editor         | Toggle between outline and prose mode                     |
| `⌘Z` / `Ctrl+Z`  | Anywhere                       | Undo last committed edit (see §6.4 on undo)               |

`Tab` is intercepted before the browser's default focus-change behavior. Document the keyboard shortcuts in a `title` attribute on the toggle pill and in a help popover.

### 6.3 Drag-and-drop

Points can be dragged via the handle on their left. Topics are not draggable.

Drag semantics:
- Vertical position selects a drop slot between existing rows.
- Horizontal position selects the target depth. Cursor X (relative to the section's left edge, minus a handle gutter) mapped by `Math.floor((offsetX - 8) / 26)` and clamped to `[minDepth, maxDepth]` where:
  - `minDepth = depth(rowBelow) ?? 0` — can't be shallower than what follows, or the tree becomes malformed.
  - `maxDepth = depth(rowAbove) + 1` — can be at most one deeper than what precedes, per the "no depth jump greater than +1" invariant.
- A horizontal indicator line shows exactly where the drop will land, with a small dot at its left edge marking the target depth.
- Dragging a node with children moves the whole subtree. The preview pill says "+N nested" to confirm.
- Dropping on a descendant of the dragged node is impossible because descendants are filtered from the hover-target set.

Implementation uses pointer events (`pointerdown` on handle → listen for `pointermove` / `pointerup` on document). Not native HTML5 drag-drop — HTML5 has poor drop-indicator support and cannot customize the drag preview without image hacks.

During drag:
- The source row receives `opacity: 0.35`.
- The preview pill is a `position: fixed` element attached to document.body, following the cursor with a small offset.
- The indicator is a `position: absolute` element inside the outline container.
- `Escape` cancels the drag (cleans up preview, indicator, and the `dragging` class without committing).

On drop: remove the dragged range from the flat list, adjust depths by `(targetDepth - origDepth)` applied to every descendant so relative structure is preserved, splice into the new position, run `normalizeDepths` to clamp any impossible jumps, re-tree, and emit an `EditOp` of kind `move`.

### 6.4 Undo

v1 undo is coarse-grained: after each `onChange`, push the previous `SectionTree` onto an in-component history stack (cap at 50 entries). `⌘Z` pops and emits an `onChange` with the restored tree plus a synthetic `EditOp` with `kind: 'text-edit'` or similar.

Known limit: in-word undo is not supported (the browser's built-in undo for `contentEditable` is bypassed by our blur-commit flow). If clinicians want fine-grained undo, we migrate to TipTap which has a proper ProseMirror history plugin — see §13.

## 7. Bidirectional sync algorithm

### 7.1 Outline → model

Trivial. Each editable element carries `data-node-id`. On commit, locate the node in the tree by ID and set `node.text = normalized(innerText)`. Normalization: collapse internal runs of whitespace, trim ends, preserve case.

For structural ops (`Enter`, `Tab`, `Backspace`, drag), the flat-list-plus-depth representation is used transiently. See §7.5.

### 7.2 Prose → model

This is the non-trivial direction. Prose commits a single paragraph; we must recover the tree.

Steps:

1. **Segment.** Use `Intl.Segmenter('en', { granularity: 'sentence' })` to split the paragraph into sentence strings. Do not hand-roll period-splitting — SLP content is full of abbreviations (`Dr.`, `Ms.`, `e.g.`, `et al.`), assessment names with internal hyphens and periods (`Goldman-Fristoe-3`), and stats notation (`p < .05`, `M = 1.5`) that break naive regex.

2. **Match.** Flatten the existing tree depth-first into `[{id, text}, ...]` with the topic prepended. For each new sentence, attempt to match to an existing ID:
   - Pass 1: exact string equality (after trim). Preserves ID for untouched sentences.
   - Pass 2: fuzzy similarity above a threshold. Preserves ID for lightly edited sentences. Similarity is the Dice coefficient on word-unigram sets:
     ```ts
     function dice(a: string, b: string): number {
       const norm = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean)
       const sa = new Set(norm(a)), sb = new Set(norm(b))
       if (!sa.size && !sb.size) return 1
       if (!sa.size || !sb.size) return 0
       let inter = 0
       sa.forEach(w => { if (sb.has(w)) inter++ })
       return (2 * inter) / (sa.size + sb.size)
     }
     ```
     Threshold: 0.3. Tune up for stricter identity preservation (loses IDs more aggressively on heavy edits), down for more forgiving matching (risks mis-matching unrelated sentences that share common words).
   - Unmatched new sentences get fresh IDs (insertions).
   - Unmatched old IDs are deletions.

3. **Rebuild.** Two cases:
   - **Preserved case:** `matched.length === old.length` AND `matched[i].id === old[i].id` for all `i`. Only text changed; structure is intact. Walk the existing tree and update text by ID. Keep all `children` arrays. No `prose-restructure` event.
   - **Flattened case:** anything else. Rebuild the section with `topic = matched[0]` and `points = matched.slice(1).map(m => ({ ...m, children: [] }))`. Hierarchy is lost. Emit `prose-restructure` with the deleted and inserted ID sets.

The flattening rule is the central tradeoff: prose can't unambiguously express "this new sentence should be a sub-point of that other new sentence," so heavy restructuring in prose forfeits depth. Users who want to restructure should do it in outline; prose is for polishing text.

If this feels too lossy in practice we can tighten the rule to "preserve matched subtrees at their original depth, insert new sentences at depth 0" — but this fails unpredictably when users reorder sentences across subtree boundaries. The simple rule is more predictable; the loss is clearly tied to "did I change structure or just text?"

### 7.3 Structure-preservation detection

Because the preserved case is a common, important path, make the detection fast and explicit:

```ts
function isStructurePreserved(
  oldFlat: { id: string; text: string }[],
  matched: { id: string; text: string }[]
): boolean {
  if (matched.length !== oldFlat.length) return false
  for (let i = 0; i < matched.length; i++) {
    if (matched[i].id !== oldFlat[i].id) return false
  }
  return true
}
```

### 7.4 Commit timing

Outline text edits commit on `focusout` OR after 400ms of inactivity. The debounce matters for long prose typing so the `onChange` feed for persistence doesn't stall at a single burst.

Prose commits happen only on `focusout`. Parsing mid-typing would re-segment on every keystroke and fight the cursor when the user is typing inside a sentence that temporarily has no terminator.

Structural edits (Enter, Tab, Backspace, drag drop) commit synchronously and emit their specific `EditOp` kinds.

### 7.5 Flat list ↔ tree conversions

For drag math, Tab/Shift-Tab, and Enter-inserts, convert to flat with depth, mutate, then re-tree:

```ts
function toFlat(nodes: SectionNode[], depth = 0, out: FlatNode[] = []): FlatNode[] {
  for (const n of nodes) {
    out.push({ id: n.id, text: n.text, depth })
    toFlat(n.children, depth + 1, out)
  }
  return out
}

function toTree(flat: FlatNode[]): SectionNode[] {
  const result: SectionNode[] = []
  const stack: Array<{ children: SectionNode[]; depth: number }> = [{ children: result, depth: -1 }]
  for (const item of flat) {
    while (stack[stack.length - 1].depth >= item.depth) stack.pop()
    const node: SectionNode = { id: item.id, text: item.text, children: [] }
    stack[stack.length - 1].children.push(node)
    stack.push({ children: node.children, depth: item.depth })
  }
  return result
}

function normalizeDepths(flat: FlatNode[]): FlatNode[] {
  for (let i = 0; i < flat.length; i++) {
    const maxD = i === 0 ? 0 : flat[i - 1].depth + 1
    if (flat[i].depth > maxD) flat[i].depth = maxD
    if (flat[i].depth < 0) flat[i].depth = 0
  }
  return flat
}
```

Invariant after `normalizeDepths`: no depth jump greater than +1 from row `i-1` to row `i`, and no negative depths. `toTree` assumes this invariant; callers must run `normalizeDepths` after any depth mutation.

## 8. Edge case catalog

Behavior for every edit the spec owners considered. Each row is a test case — see §12.

| # | Edit                                        | Mode    | Expected outcome                                                                 |
|---|---------------------------------------------|---------|----------------------------------------------------------------------------------|
| 1 | Change one word in a point                  | Outline | Text updates in model; prose view reflects on toggle; ID unchanged               |
| 2 | Change one word in a sentence in prose      | Prose   | Text updates; ID preserved via fuzzy match; outline unchanged structure          |
| 3 | Delete a full sentence in prose             | Prose   | Old ID dropped; following points renumber; emits prose-restructure               |
| 4 | Insert a new sentence mid-paragraph         | Prose   | Fresh ID minted; slotted at correct index; emits prose-restructure               |
| 5 | Delete everything and retype                | Prose   | All old IDs dropped; first new sentence = topic; rest = depth-0 points           |
| 6 | Merge two sentences with "and"              | Prose   | Merged sentence keeps the ID of the one with higher similarity; other dropped    |
| 7 | Split one sentence into two                 | Prose   | First fragment keeps original ID; second is an insertion                         |
| 8 | Abbreviation with period (`Dr. Smith`)      | Prose   | Treated as one sentence, not two (via `Intl.Segmenter`)                          |
| 9 | Decimal or stat (`p < .05`, `1.5 SD`)       | Prose   | Treated as part of the enclosing sentence                                        |
| 10| Empty topic                                 | Outline | Valid; placeholder rendered; section is not deleted                              |
| 11| Delete topic in prose, keep other sentences | Prose   | First remaining sentence promotes to topic                                       |
| 12| Paste rich text                             | Either  | Formatting stripped; plain text inserted                                         |
| 13| Paste multi-sentence text in outline point  | Outline | Splits into multiple new sibling points below the paste target                   |
| 14| Enter at end of point                       | Outline | New empty sibling below at same depth; focus moves to it                         |
| 15| Enter in middle of a point                  | Outline | Splits the point; left half keeps original ID, right half is new                 |
| 16| Tab on depth-0 point                        | Outline | Becomes a child of previous sibling (depth 1)                                    |
| 17| Tab on first point in section               | Outline | No-op (no previous sibling to nest under)                                        |
| 18| Tab on depth-2 point                        | Outline | No-op (depth cap)                                                                |
| 19| Shift-Tab on depth-0 point                  | Outline | No-op (already at root)                                                          |
| 20| Shift-Tab on nested point with children     | Outline | Point and all descendants promote by one level                                   |
| 21| Backspace on empty point                    | Outline | Point removed; focus goes to end of previous row                                 |
| 22| Backspace on empty point with children      | Outline | No-op (must manually promote children first, or delete children)                 |
| 23| Drag point to end of section                | Outline | Moves to new position at default depth (depth of previous row)                   |
| 24| Drag with cursor shifted right              | Outline | Depth increases if previous row allows                                           |
| 25| Drag with cursor shifted left               | Outline | Depth decreases, clamped at 0                                                    |
| 26| Drag subtree                                | Outline | Children follow; relative depths preserved                                       |
| 27| Drag outside section boundary               | Outline | Drop indicator hides; drop is a no-op                                            |
| 28| Escape during drag                          | Outline | Drag cancels; original position preserved                                        |
| 29| Typing then immediately toggling            | Either  | Active element blurs first, committing the edit before view swap                 |
| 30| Whitespace-only edit                        | Either  | On commit: trim ends, collapse internal whitespace                               |
| 31| IME composition (Japanese, Chinese, etc.)   | Either  | Commit suppressed during `compositionstart`/`compositionend`; no premature blur  |

Edge case 31 is a real risk for `contentEditable` with IME. Listen for `compositionstart` / `compositionend` on the editor and suppress the idle-debounce commit while `isComposing` is true. Blur-commit still works.

## 9. Visual system

### 9.1 Palette

The editor introduces a slightly warmer sibling palette to the existing `wf-*` tokens. It should be added to `globals.css` as its own token set rather than overriding `wf-*`, because the editor is a focused writing surface and should feel distinct from the surrounding dashboard chrome.

```css
:root {
  --se-paper: #ebe3cf;            /* outer background */
  --se-card: #f6f1e4;             /* card surface */
  --se-border: #d4c9ad;           /* card + control borders */
  --se-ink: #2a241b;              /* primary text */
  --se-muted: #8a7f6e;            /* metadata, numerals, hints */
  --se-accent: #c47a4a;           /* drop indicators, pulses, focus */
  --se-hover: rgba(42,36,27,0.04);
  --se-focus: rgba(42,36,27,0.06);
}
```

The radial dot background: `radial-gradient(rgba(138,127,110,0.32) 1px, transparent 1px)` at `16px 16px`. Subtle texture without visual noise.

### 9.2 Typography

Three typefaces, each with a clear role. Load via `next/font`:

```ts
// src/app/fonts.ts (or wherever font config lives)
import { Instrument_Serif, DM_Sans, DM_Mono } from 'next/font/google'

export const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-se-serif' })
export const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400','500'], variable: '--font-se-sans' })
export const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400'], variable: '--font-se-mono' })
```

Role assignment:
- Instrument Serif: section title only.
- DM Sans: topic sentences, points, prose paragraphs.
- DM Mono: numbering, metadata, hint row, toggle labels.

Size scale inside the editor:
- Section title: 28px / weight 400 / leading 1.1
- Topic: 15.5px / weight 500 / leading 1.55 / letter-spacing -0.003em
- Point: 15px / weight 400 / leading 1.7
- Prose paragraph: 15.5px / weight 400 / leading 1.78
- Numbering (`01` etc.): 12px mono / muted
- Metadata / hint rows: 10.5px mono / 0.14em letter-spacing / UPPERCASE / muted

### 9.3 Shadow

One long, soft shadow under the card. No elevation changes on hover or interaction.

```css
box-shadow:
  0 22px 44px -22px rgba(42,36,27,0.28),
  0 2px 4px rgba(42,36,27,0.04);
```

### 9.4 Motion

| Property                                  | Timing                                   |
|-------------------------------------------|------------------------------------------|
| Pill toggle slider                        | 280ms cubic-bezier(0.4, 0, 0.2, 1)       |
| Card content fade on mode swap            | 160ms ease                               |
| Card padding on mode swap                 | 280ms ease                               |
| Section-to-section gap on mode swap       | 280ms ease                               |
| Row hover / focus background              | 140ms ease                               |
| Toggle segment text color                 | 220ms ease                               |
| Sync pulse flash                          | 260ms ease (dev-only, may omit in prod)  |
| Drag preview follow                       | none (tracks pointer directly)           |

All motion collapses to 1ms under `prefers-reduced-motion: reduce`.

## 10. Accessibility

### 10.1 ARIA

- The pill toggle is `role="tablist"` with two `role="tab"` buttons. `aria-selected` reflects the active mode. The card is `role="tabpanel"` with `aria-labelledby` pointing at the active tab.
- Each editable row uses `contenteditable="true"` with `aria-label` describing its role ("Topic sentence", "Point 1 of 3", "Sub-point 2 of 2 under Point 1").
- The drag handle is a `<button>` with `aria-label="Drag to reorder point 2"` so it is focusable and activatable via keyboard (space/enter to initiate drag, arrows to move, escape to cancel — keyboard drag is in scope for v1 a11y).
- The state-preservation toast ("section structure preserved" / "structure changed") after prose commits uses `aria-live="polite"`.

### 10.2 Keyboard

All interactions must be keyboard-reachable:
- Tab cycles into the toggle, then into each editable row in document order.
- Arrow up/down within the editor moves focus between rows (optional but recommended).
- Drag-and-drop has a keyboard-only alternative: with a row focused, `Space` picks up, arrows move and indent, `Space` drops, `Escape` cancels.

### 10.3 Screen readers

On mode toggle, announce: "Switched to outline mode" / "Switched to prose mode".

On structural changes, announce the net result: "Point added at position 3", "Point 2 deleted", "Point 2 moved to sub-point of point 1", "Section structure was flattened".

### 10.4 Reduced motion

Collapse all transitions to 1ms. The mode swap still fades via instant opacity change to avoid mid-swap DOM flicker; just skip the animation duration.

### 10.5 Contrast

All text against `--se-card` must pass WCAG AA (4.5:1 for body text, 3:1 for large text). The current palette clears AA — confirm during review with an automated tool like axe.

## 11. Persistence / Supabase integration

The component itself is unaware of Supabase. It emits `onChange(tree, op)` and the route handler or parent component persists.

Recommended data shape for `report_sections`:

```sql
-- existing table, illustrative shape
report_sections (
  id uuid primary key,
  report_id uuid references reports(id) on delete cascade,
  ordinal int not null,
  title text,
  body jsonb not null,     -- SectionTree serialized
  updated_at timestamptz not null default now()
)
```

`body` stores `SectionTree` as JSONB. Reads are a single row lookup; writes are a full-body upsert (simple) or JSON-patch (more surgical, higher complexity).

For v1 persistence, a full-body upsert is fine. Clinicians typically edit one section at a time and the body is small (kilobytes). Switch to patches only if profiling shows write amplification.

Optimistic update pattern in the parent:

```ts
const [tree, setTree] = useState(initial)
const debouncedSave = useDebouncedCallback(async (t: SectionTree) => {
  await supabase.from('report_sections').update({ body: t, updated_at: new Date().toISOString() }).eq('id', t.id)
}, 600)

<SectionEditor
  value={tree}
  onChange={(next) => {
    setTree(next)
    debouncedSave(next)
  }}
/>
```

ID minting: client mints `tmp_<nanoid>` for unsaved nodes. Server replaces on write. After the write, the parent sets the returned tree (with server IDs) back into state. Because the component is uncontrolled for text and the IDs are only meaningful as keys, this doesn't cause cursor loss — but guard the swap behind a check that the user isn't actively typing (`document.activeElement` is not inside the editor).

RLS: per existing policy, `report_sections` inherits `auth.uid()` scoping through `report_id → reports.user_id`. No changes needed.

## 12. Testing

### 12.1 Unit tests (Vitest)

Cover the sync algorithm in isolation:

- `segment()` correctly splits paragraphs containing common SLP abbreviations, decimals, and assessment names.
- `dice()` returns 1 for identical strings, 0 for disjoint word sets, monotonic in between.
- `matchIds()`:
  - All exact matches preserved.
  - Single-word edits within a sentence preserve the original ID.
  - Unrelated sentences get fresh IDs.
  - Threshold tuning behaves as expected.
- `toFlat()` / `toTree()` round-trip any valid tree losslessly.
- `normalizeDepths()` clamps invalid depth jumps.
- `commitProse()`:
  - Preserved case keeps tree and only updates text.
  - Flattened case emits correct `prose-restructure` payload.

### 12.2 Integration tests (Testing Library + jsdom)

- Toggle the mode; assert the correct view is visible, the slider has moved, the inactive view has `display: none`.
- Type into a point, blur, assert the `onChange` callback fired with the expected tree + `text-edit` op.
- Press Enter at end of point, assert a new sibling exists below.
- Press Tab on a point with a previous sibling at depth 0, assert depth is now 1.
- Simulate pointer drag via synthetic `pointerdown`/`pointermove`/`pointerup` events on the handle; assert final tree reflects the new position.
- Commit a heavy prose edit, assert `prose-restructure` fires and the tree flattens.
- Commit a light prose edit, assert text changes propagate and the tree structure is preserved.

Mock Supabase at the module boundary. Tests must not hit the network.

### 12.3 Manual checklist

Run through all 31 edge cases in §8 in a real browser before merge. Record pass/fail in the PR description.

## 13. Extension path to TipTap

The hand-rolled `contentEditable` approach is viable for v1 because the content model is flat (topic + points-tree-of-strings) and the interaction vocabulary is small (text, Enter, Tab, Backspace, drag).

Migrate to TipTap/ProseMirror when any of these become requirements:

- **Inline formatting inside a sentence.** Bold, italic, superscript, citation anchors. `contentEditable` with raw strings can't represent these without reintroducing a rich-text model.
- **Fine-grained undo.** ProseMirror has a proper history plugin with per-keystroke granularity. Our blur-commit flow can't match it.
- **Collaboration.** Y.js bindings for TipTap are production-grade; rolling our own OT/CRDT is a multi-quarter project.
- **Tracked changes.** TipTap has extensions for this.
- **Inline comments anchored to a sentence or range.** Requires a stable selection model that outlives edits — ProseMirror's decorations are the right tool.

The migration shape: define a ProseMirror schema with `section`, `topic`, `point` nodes, where `point` has a `depth` attribute and supports nested `point` children. Render each node via a `NodeView` (React wrapper). The Outline/Prose toggle becomes a choice between two `NodeView` renderers over the same document. The algorithmic work in this spec — segmentation, matching, drag math — mostly goes away because the schema enforces the shape and drag is handled by `prosemirror-dropcursor`.

Estimated effort for the migration, after v1 is in production and the UX is settled: 2–3 weeks for one engineer, plus QA.

## 14. Known limits

- **Prose round-trip is lossy for structural edits.** By design. Documented in §7.2. Users restructure in outline.
- **In-word undo is not supported.** Blur-commit flow bypasses browser undo. Migrate to TipTap if clinicians complain.
- **No cross-section drag.** Deferred to v2. Workaround: delete from section A, type in section B.
- **Depth cap at 2.** Three levels of indentation is the practical limit for readable clinical writing.
- **Mobile drag ergonomics.** Pointer events work on touch, but the drag handle is small. If mobile editing becomes a use case, widen the handle hit target to 24px and consider a long-press to initiate drag.
- **Fuzzy threshold is a magic number.** 0.3 was chosen by eye during prototyping. Consider making it configurable or adaptive if matching quality is contested.

## 15. Implementation checklist for v1

Order is suggested, not strict. Each block should land in its own PR.

1. `types.ts` — `SectionNode`, `SectionTree`, `EditOp`. No behavior, just types.
2. `tree-ops.ts` — `toFlat`, `toTree`, `normalizeDepths`, `findById`, `insertAfter`, `removePoint`. Pure functions, full unit test coverage.
3. `segment.ts` — `segment()` wrapping `Intl.Segmenter`, `dice()`, `matchIds()`, `commitProse()`. Pure functions, full unit test coverage.
4. `SectionEditor.tsx` — the component shell, props, state, mode toggle. No editing yet.
5. Outline view rendering and inline edit commits (no structural ops).
6. Outline view Enter/Tab/Backspace.
7. Outline drag-and-drop.
8. Prose view rendering and commits (including the preserved/flattened branches).
9. Toggle animation and `prefers-reduced-motion` handling.
10. ARIA, keyboard drag alternative, screen reader announcements.
11. Storybook / Ladle story with all 31 edge cases reachable by interaction.
12. Integration into one report route behind a feature flag.
13. Dogfood internally for one clinical report end-to-end. Log any surprise.
14. Remove the flag.

## Appendix A — Worked examples

### A.1 Preserved round-trip

Outline (two points):
```
Topic: Lucia presents with reduced intelligibility.
  01 She attends second grade at Lincoln Elementary.
  02 Medical history is unremarkable.
```

Prose (toggle):
```
Lucia presents with reduced intelligibility. She attends second grade at Lincoln Elementary. Medical history is unremarkable.
```

User edits `"Lincoln"` → `"Lincoln Heights"` in prose, blurs.

Segmenter yields 3 sentences. Dice similarity of sentence 2 to old point 01 is 0.92 (one word changed). Matches preserved; structure preserved. Toggle back to outline:
```
Topic: Lucia presents with reduced intelligibility.
  01 She attends second grade at Lincoln Heights Elementary.
  02 Medical history is unremarkable.
```
No new IDs minted. No `prose-restructure` event.

### A.2 Flattened round-trip

Same starting outline. Same starting prose. User deletes the middle sentence entirely, blurs.

Segmenter yields 2 sentences. Sentence 1 exact-matches topic; sentence 2 fuzzy-matches old point 02 at 1.0; old point 01 is unmatched. Structure changed (length differs). Flattened rebuild: `topic = matched[0]`, `points = [matched[1]]`. `prose-restructure` fires with `replacedIds: [oldP01], insertedIds: []`.

If the section had nested children under point 02, they are **lost** in this flattening — the flattened rebuild does not recurse into children. This is the documented behavior; users who want to preserve nested structure should edit in outline.

### A.3 Indented drag

User grabs point 02 ("Medical history is unremarkable."), drags to just below point 01, cursor offset right by ~30px.

Hover target: slot between point 01 and end-of-section. `minDepth = 0` (no row below), `maxDepth = 1` (depth of row above + 1). Proposed depth from cursor X: `floor((30 - 8) / 26) = 0`. Clamped to `[0, 1]` → stays at 0.

User nudges further right to ~60px. Proposed depth: `floor((60 - 8) / 26) = 2` → clamped to `[0, 1]` → depth 1.

Drop. Point 02 becomes a child of point 01. Toggle to prose: unchanged visual output (depth-first traversal is the same order). Model now has `points[0].children = [{ id: p02, ... }]`.

## Appendix B — Open questions

1. Should empty sections auto-delete on blur or require an explicit delete action? Recommend explicit — auto-delete is a classic data-loss bug.
2. Do clinicians want per-point evidence citations in v1, or is that v2? Citations would anchor to a `point.id` — the ID stability guarantees make this tractable.
3. Should prose mode show a subtle indicator when a section has nested structure that will be flattened on heavy edit? A faint icon in the margin, clickable to toggle back to outline. Nice-to-have, not blocking.
4. How is section ordinal reordering handled — separate from this component? Assumed yes: a sibling sidebar or drag affordance at the section-card level, outside `SectionEditor`.

— end of spec —
