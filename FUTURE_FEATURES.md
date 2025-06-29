# Future Features and Ideas for Linguosity

This document serves as a backlog for ideas and features that are beyond the current scope but are valuable for future development.

## AI-Driven Dynamic Checklists

**Idea:** Implement a system where the AI can extract specific, repeatable entities (e.g., "referred by" organizations, "referred to" schools, common assessment tools) from unstructured text input. These extracted entities would then be used to dynamically generate interactive checklists or dropdowns in the UI.

**Benefit:** Significantly reduce repetitive typing for SLPs by allowing them to select common phrases or entities rather than re-typing them for each report. This would also improve data consistency.

**Example Workflow:**
1. SLP inputs notes for "Reason for Referral" including "referred by San Gabriel Valley Regional Center" and "referred to Covina Valley Unified."
2. AI processes this, identifies "San Gabriel Valley Regional Center" and "Covina Valley Unified" as potential reusable entities.
3. These entities are added to a dynamic checklist/dropdown for "Referred By" and "Referred To" fields.
4. In future reports, the SLP can simply check a box or select from a dropdown to insert these common phrases.

## PII Handling Strategy (Placeholders)

**Idea:** Ensure that Personally Identifiable Information (PII) such as student names, evaluator names, etc., are never sent to the AI API. Instead, use generic placeholders (e.g., `[Student Name]`, `[Evaluator Name]`) during AI interaction and content generation.

**Implementation:**
1. Store actual PII securely in the Supabase database.
2. AI prompts and generated content will only contain placeholders.
3. A final find-and-replace operation will occur during the DOCX export process, substituting placeholders with actual PII from the database.

**Benefit:** Maintain strict privacy and security by keeping sensitive data out of the AI's processing pipeline.

## Manual Section Selection for AI Updates

**Idea:** Provide users with the option to manually select specific report sections that the AI should focus on when generating content from unstructured input. This would give users more granular control over the AI's behavior, especially for complex or nuanced inputs.

**Benefit:** Offer an alternative workflow for users who prefer explicit control, or for scenarios where the AI's autonomous section selection might not be perfectly accurate. This could complement the primary AI-driven autonomous update feature.