# Linguosity: UI/UX Analysis
## Is the Interface Optimized for the User's Use Case?

---

## Executive Summary

The Linguosity interface has a solid technical foundation and good architectural thinking, but the user experience does not prioritize the most critical task: getting an SLP from raw data to a complete report as quickly as possible.

**Verdict:** The interface currently feels like "a form-filling tool with AI features" rather than "an AI-powered report assistant supervised by a clinician." The difference is not semantic — it's a fundamental mismatch with how SLPs should interact with this tool.

### Top 3 Strengths
1. **Structured schemas ensure completeness** — The form-based approach guarantees that no required fields are missed and reports meet legal compliance requirements
2. **Auto-save and data persistence** — Users never lose work, which is critical for longer workflows
3. **Provenance tracking concept** — Showing data sources and field attribution is clinically valuable and creates an audit trail for liability protection

### Top 3 Critical Gaps
1. **AI is buried; file upload is secondary** — The most powerful feature (AI extraction) is hidden in a floating button. The primary workflow still assumes manual form-filling
2. **Section-by-section editing paradigm doesn't match data analysis workflow** — SLPs think about the whole report when they have raw data, not individual sections
3. **No report-level overview** — SLPs can't see the big picture. There's no progress indicator, completion status, or summary view showing which sections are done vs. incomplete

---

## Current User Flow Analysis

Let me walk through the existing flow as an SLP would experience it:

### Step 1: Dashboard → Create Report (✓ Good)
Clean entry point. User creates a new report, selects a template. This works well.

### Step 2: Section-by-Section Editing (⚠️ Friction Point)
The app takes the user into the "Data Entry" tab of the first section (e.g., "Demographics"). User manually fills form fields: client name, DOB, grade level, etc.

**Friction:** This is manual data entry work. If the SLP has already uploaded an intake form PDF with this information, why are they typing it again? This creates cognitive load and wastes time.

Also, the linear flow (one section at a time) doesn't align with how clinicians work. An SLP reviewing assessment data doesn't think "first I'll review demographics, then I'll review background history." They think holistically about all the information they have.

### Step 3: AI Intake Drawer (⚠️ Friction Point)
Hidden behind a floating "Ask Claude" button in the lower right. This feature is powerful but feels like an afterthought.

**Friction:** A critical feature should not be hidden in a floating button. It signals to the user that AI help is optional or secondary, when in reality it should be the primary workflow for data population.

Also, when the SLP clicks "Ask Claude," they're prompted to upload files or ask a freeform question. But the app already has access to uploaded files and structured form fields. Why is the AI interface disconnected from the form context?

### Step 4: Data Entry Tab (⚠️ Friction Point)
The default tab for each section shows manually-editable form fields. In theory, this gives SLP control. In practice, it requires data entry.

**Friction:** Three tabs within each section (Data Entry / Edit Template / Sources) add cognitive overhead. Most SLPs won't need to edit templates. Sources are valuable for auditing but shouldn't be a primary navigation tab.

The interface has too many toggle points for what should be a simpler flow: "Here's the data we extracted. Do you approve it?"

### Step 5: Narrative Generation (✓ Concept is good, but disconnected)
Once sections are filled, SLP can generate narrative text. This is smart — structured data → narrative synthesis.

**Friction:** But the generated narrative is disconnected from editing. If SLP realizes a narrative sentence is inaccurate, they have to navigate back to the form, find the relevant field, edit it, and regenerate. It's not a tight feedback loop.

### Step 6: Report View (✓ Basic, but incomplete)
The app shows a preview of the generated report. Clean presentation.

**Friction:** PDF export is listed as not working. For SLPs, the ability to export a professional PDF is table-stakes. This is a blocker for real-world use.

---

## Critical UX Issues

### 1. The AI is Buried

**The problem:** The app's most powerful feature — AI extraction of data from uploaded files — is hidden behind a floating button labeled "Ask Claude." This positioning signals that AI help is optional or secondary.

**The reality:** For the app to be competitive, AI-powered extraction should be the PRIMARY workflow. When an SLP uploads files, AI should automatically extract and populate data. The SLP should review the extraction, not start from scratch with manual forms.

**Impact:** New users see form fields and assume they need to fill them manually. Power users find the AI drawer, but the workflow feels clunky. Neither experience is optimal.

**Evidence:** The app requires both file upload AND manual form-filling. If the extraction worked as primary, form-filling would be the fallback, not the default.

**Recommendation:** Redesign the entry flow to start with "Upload your assessment materials." Make extraction automatic and visible. Show extracted data in a dashboard view with confidence scores. Let the SLP verify, not start from zero.

### 2. Section-by-Section is the Wrong Paradigm

**The problem:** The app guides SLPs through sections sequentially: Demographics, Background History, Reason for Referral, Assessment Results, Analysis, Recommendations. This mirrors how reports are structured, but not how clinicians think when analyzing data.

**The reality:** When an SLP has a folder of raw assessment data (test scores, observations, parent interview notes), they don't think "first I'll enter demographics, then background history." They think about all the information as a whole, looking for patterns and relationships.

**Impact:** Section-by-section forces an artificial, linear workflow. It works for editing a complete report, but it's wrong for initial data population.

**Evidence:** The biggest friction point in the current flow is manual form-filling for each section. If the paradigm matched user thinking, extraction would feel natural and fast.

**Recommendation:** Create two modes:
- **Bulk Entry Mode:** Upload everything, AI extracts all data, SLP reviews a dashboard showing all sections at once
- **Edit Mode:** Once data is populated, section-by-section editing for refinement

The section-based view is fine for polishing, but wrong for initial population.

### 3. Three Tabs Per Section is Confusing

**The problem:** Each section has three tabs: "Data Entry," "Edit Template," and "Sources."

**The reality:** Most SLPs will never edit templates. Templates are a power-user feature, not a primary interaction. Sources are valuable for compliance auditing, but shouldn't be a primary navigation tab.

**Impact:** Cognitive overhead. Users have to learn three different views and know when to use each one. This is mental friction that slows down the workflow.

**Evidence:** The "Edit Template" tab is a feature that serves maybe 5% of users (clinic administrators who customize templates). For the other 95%, it's noise.

**Recommendation:**
- Default to a simpler "Data Entry" view with no template editing visible
- Hide template editing behind a settings or admin area
- Make sources accessible via an info icon or inline attribution, not a primary tab
- Surface only what the SLP needs: a clean form with extracted data

### 4. No Clear "Done" Signal

**The problem:** There's no visible indicator of report completion status. SLP doesn't know which sections are done, which need review, or whether the entire report is ready to export.

**The reality:** SLPs juggle multiple reports simultaneously. They need to quickly assess "is this report close to done, or do I have a lot of work left?" There's no visual progress indicator.

**Impact:** Cognitive load. SLP has to mentally track completion. For a multi-section report, this is error-prone.

**Evidence:** The current design shows sections but no completion percentage, checkmarks, or status badges.

**Recommendation:**
- Add a progress bar showing overall report completion (e.g., 7 of 9 sections complete)
- Use visual badges: ✓ (complete), ⏳ (in progress), ⚠️ (needs review), ○ (not started)
- Show a "report readiness" score (e.g., "95% ready for export")
- Highlight sections that have low-confidence extracted data or flagged fields

### 5. Provenance is Great But Cluttered

**The problem:** The app tracks provenance (showing which file each data point came from) and field change indicators. These are excellent from a compliance perspective, but they add visual noise.

**The reality:** Some SLPs need to audit the source of every field (for liability documentation). Others just want to review the data quickly. There's no way to toggle between "detailed mode" and "simple mode."

**Impact:** Visual clutter makes the interface feel more complex than it needs to be. For quick reviews, provenance details are noise.

**Evidence:** The interface shows chips, change indicators, and source attribution everywhere. For an SLP in a hurry, this is visual overload.

**Recommendation:**
- Add a "View Mode" toggle: "Simple" vs. "Detailed"
- Simple mode hides provenance details; they're accessible via hover or info icons
- Detailed mode shows everything for compliance auditing
- Default to Simple mode; let power users opt into Detailed

### 6. Mobile/Tablet Not Considered

**The problem:** The interface appears designed for desktop/laptop only. There's no responsive design for tablets or mobile devices.

**The reality:** SLPs often take assessment notes on tablets during sessions. They might want to capture observations directly into the app, or access a report mid-session. The current interface doesn't support this.

**Impact:** Lost opportunity for capture during assessment. SLP has to transcribe notes later instead of entering them in real-time.

**Evidence:** The layout uses floating buttons, multi-column dashboards, and desktop-sized form fields. None of this adapts to tablet orientation.

**Recommendation:**
- Implement responsive design for tablet use
- Consider a simplified mobile interface optimized for note-taking during sessions
- Support landscape orientation for larger tablets
- Add dictation/voice-to-text for faster note capture

---

## What's Working Well

Not everything is wrong. The interface has genuine strengths:

**1. Structured schemas ensure completeness**
The form-based approach guarantees required fields are filled. For legal compliance, this is valuable. The app won't let an SLP export a report missing critical information.

**2. Auto-save prevents data loss**
The app automatically persists changes. SLPs won't lose work if they accidentally close the browser or lose network connection. For longer workflows, this is essential.

**3. Drag-and-drop section reordering**
Users can reorder sections to match their preferred report structure. This is intuitive and flexible.

**4. Provenance tracking is unique**
Showing data sources and field attribution is not common in clinical documentation tools. It's a genuine differentiator and valuable for legal defense.

**5. Template system allows customization**
Clinic-specific templates ensure consistency and let experienced SLPs codify their preferred language and structure.

These are solid foundational features. The issue is not the technical execution — it's the workflow and prioritization.

---

## Recommended UX Improvements (With Rationale)

### High-Priority Improvements

**1. Redesign the entry flow: Upload-first → Verify → Generate → Polish**

Current flow: Create report → manual form entry → ask AI → generate narrative

Recommended flow: Create report → upload files → AI extracts → verify → generate narrative → polish

**Rationale:** Eliminates manual data entry as the starting point. Gets to the SLP's core task (clinical review) faster.

**2. Add a report overview dashboard**

Show all sections in a single scrollable view with:
- Completion percentage per section (e.g., "6 of 7 fields complete")
- Data source indicators (e.g., "Extracted from intake_form.pdf")
- Confidence scores (green = high confidence, yellow = medium, red = low)
- Status badges (✓ complete, ⏳ in progress, ⚠️ needs review)

**Rationale:** SLPs need to see the big picture. A dashboard view lets them assess overall progress at a glance and know where to focus review effort.

**3. Make AI the default path; demote manual entry to fallback**

Currently: "Fill in forms, and AI can help"
Should be: "Upload data, AI fills in forms, you review"

Change the primary button from "Data Entry" to "Review Extracted Data." Manual form editing becomes an option for edge cases, not the default.

**Rationale:** Aligns the interface with the app's core value proposition. Signals to users that AI extraction is the expected workflow.

**4. Simplify section editing: streamline, don't customize**

Remove the "Edit Template" tab from the default view. Most SLPs won't use it. Move template editing to an admin settings area.

Keep two tabs per section (if any): "Data" and "Sources." Better yet, combine them into a single view with inline source attribution.

**Rationale:** Reduces cognitive load. SLPs are clinicians, not template designers.

**5. Add progress tracking throughout the workflow**

- Visual progress bar at the top of the page
- Section completion checklist (checkboxes that update in real-time)
- A "Report Readiness" indicator showing estimated time to export (e.g., "2 sections need review — ~5 minutes to completion")
- Color coding: green (done), yellow (in progress), red (needs review)

**Rationale:** Reduces mental burden of tracking progress. SLPs can quickly assess "how much work is left?"

### Mid-Priority Improvements

**6. Implement split-pane editing**

Left pane: Structured data (forms/fields)
Right pane: Live narrative preview

As SLP edits structured data on the left, the narrative on the right updates in real-time. Edits to narrative on the right update structured data on the left.

**Rationale:** Creates a tight feedback loop. SLP sees immediately how field edits affect the narrative.

**7. Add batch review mode**

Show all AI-extracted data across all sections in one scrollable view, with confidence scoring. Let SLP quickly approve/reject/edit in bulk before moving to narrative generation.

**Rationale:** For initial verification, seeing all extracted data at once is faster than reviewing section-by-section. Batch approval of high-confidence data is much quicker than field-by-field review.

**8. Implement a two-mode interface**

- **Fast Mode:** Simplified view, minimal options, focus on uploading and reviewing
- **Advanced Mode:** Full access to templates, detailed provenance, all customization options

Let users toggle between modes. Default new users to Fast Mode.

**Rationale:** New users aren't overwhelmed. Power users get full control.

**9. Add mobile-responsive design**

Support tablet use, especially for portrait orientation during assessments. Simplify the interface for smaller screens.

**Rationale:** Captures a real use case (note-taking during sessions) that desktop-only interfaces ignore.

### Lower-Priority But Valuable

**10. Quick-entry shortcuts and autocomplete**

- "WNL" automatically expands to "within normal limits"
- "s/p" expands to "status post"
- Age calculation from DOB (SLP enters DOB, age automatically populates)
- Common phrases appear as autocomplete suggestions

**Rationale:** Speeds up data entry for repetitive text.

**11. Collaborative review features**

Add a "Review" workflow for supervisors or other clinicians:
- Share report for review without giving full edit access
- Supervisor can leave comments and approval status
- Original SLP sees feedback and approves final version

**Rationale:** Critical for Clinical Fellows and supervisory workflows. Currently missing entirely.

**12. Keyboard shortcuts for power users**

- Tab to move between fields
- Cmd+S to save (even though it auto-saves)
- Cmd+G to generate narrative
- Alt+P to toggle provenance view

**Rationale:** Power users can work faster.

---

## Information Architecture Recommendations

### Flatten the Navigation Hierarchy

Current hierarchy: Report → Sections → Fields (three levels deep)

Recommendation: Report → Data Dashboard → Section Editing (two levels, with optional third level for detail)

The dashboard should be the landing view after report creation, showing all sections at once. Clicking a section opens detailed editing, but returning to the dashboard is one click, not multiple navigations.

### Move from Section-Centric to Report-Centric Views

The interface currently prioritizes sections as the primary unit. This works for editing but not for initial data population.

Recommendation: Reorder the mental model:
1. **Report level:** View entire report, see all sections, assess completion
2. **Section level:** Edit individual section, see section-specific recommendations
3. **Field level:** Edit individual fields (rarely needed)

The "Report" level view is almost entirely missing from the current interface.

### Consider a Wizard Flow for New Users

For first-time users, guide them through a structured workflow:
1. "Upload your assessment materials"
2. "Review extracted data"
3. "Generate report"
4. "Make edits"
5. "Export and share"

For experienced users, skip the wizard and go straight to the dashboard.

**Rationale:** Reduces onboarding friction. Experienced users aren't constrained.

---

## Conclusion

The Linguosity interface has solid technical foundations and thoughtful architectural choices (structured schemas, provenance tracking, auto-save). However, the user experience does not align with the app's stated goal: getting SLPs from raw data to complete reports as quickly as possible.

### The Core Problem

The interface currently feels like "form-filling software with AI features attached" rather than "AI-powered report assistant supervised by clinician." The default workflow asks SLPs to manually enter data into forms, with AI help available in a secondary drawer. This is backwards. AI extraction should be the default. SLP clinical review should be the primary interaction.

### The Path Forward

1. **Invert the workflow:** Make file upload and AI extraction the starting point, not the endpoint
2. **Eliminate manual data entry:** Structured data should be extracted automatically, with verification as the SLP's primary task
3. **Optimize for speed:** Every step should move toward "complete report in 15 minutes"
4. **Add report-level views:** Show progress, completion status, and overview at a glance
5. **Simplify cognitive load:** Reduce tab proliferation, hide power-user features, default to streamlined views

### Why This Matters

The competitive advantage of Linguosity is not that it generates text (ChatGPT can do that). It's that it should be **faster and simpler than the alternatives**. The current interface doesn't deliver that speed advantage clearly enough. With these UX improvements, the app can shift from "interesting tool" to "essential workflow accelerator."

The goal is not to build a perfect feature-complete interface. The goal is to respect SLPs' time and build an interface that gets them from "raw assessment data" to "complete, ready-to-export report" faster than any other option on the market.

Right now, the interface doesn't quite get there. With the improvements outlined above, it absolutely could.
