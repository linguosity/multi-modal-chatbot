# Accessibility Audit (WCAG 2.1 AA)

This document details the accessibility audit of UI components found in `src/components/ui/`, focusing on WCAG 2.1 AA guidelines.

## General Observations

*   **Radix UI Primitives:** Many components are built on Radix UI, which provides a strong foundation for accessibility (keyboard navigation, ARIA roles, focus management). The audit will verify correct implementation and customization.
*   **Tailwind CSS:** Styling is managed by Tailwind. Focus indicators (`focus-visible:ring-2 focus-visible:ring-ring`) are generally well-implemented. Color contrast needs to be verified against the application's palette.
*   **Icons:** Icons from `lucide-react` are used. Their accessibility (decorative vs. informative) will be assessed per component.

## Component-Specific Audit

---

### 1. `accordion.tsx`
*   **Powered by:** Radix UI Accordion.
*   **Keyboard Navigation:** Expected to be fully keyboard navigable (Space/Enter to toggle, arrow keys to navigate triggers).
*   **ARIA Attributes:** Radix typically handles `aria-expanded`, `aria-controls`, `aria-disabled`, and heading roles correctly.
    *   `AccordionTrigger` is a `<button>` inside an `<AccordionPrimitive.Header>` (which should render an `<h3>` or appropriate heading level by default, or be configurable). The `AccordionPrimitive.Header` is a `div` in this implementation, which is acceptable as long as the trigger itself is a button.
    *   The `ChevronDown` icon inside the trigger has `transition-transform duration-200`, which is fine. It's decorative.
*   **Color Contrast:**
    *   Trigger text (`font-medium`) vs. background: Depends on usage context.
    *   Content text (`text-sm`) vs. background: Depends on usage context.
*   **Focus Management:** Radix should manage focus between triggers and within content.
*   **Verdict:** Likely **Accessible**. Radix UI foundation is strong.

---

### 2. `alert.tsx`
*   **ARIA Attributes:**
    *   `role="alert"` is correctly applied to the main `div`. This ensures assistive technologies announce the alert content.
    *   `AlertTitle` is an `<h5>`. This is semantically appropriate.
    *   Icons within alerts: The SVG is directly part of the `alertVariants`. It's likely decorative. If it conveys meaning (e.g., error icon), it should have an appropriate accessible name or be explicitly hidden if the text makes it redundant. Given `[&>svg]:text-foreground` and `[&>svg]:text-destructive`, the icon color changes with variant, implying it might be more than decorative.
        *   **Recommendation:** Add `aria-hidden="true"` to decorative icons if their meaning is conveyed by text. If the icon itself is critical, provide an accessible name (e.g., via `<title>` or `aria-label` if it's an interactive element, though unlikely for alert icons).
*   **Color Contrast:**
    *   `default` variant: `text-foreground` on `bg-background`. Contrast should be fine as these are base theme colors.
    *   `destructive` variant:
        *   Text: `text-destructive` on `bg-background` (assuming default alert background unless overridden).
            *   Light mode: `var(--destructive)` (0 84.2% 60.2%) on `var(--background)` (40 30% 97%). This needs a contrast check.
            *   Dark mode: `var(--destructive)` (0 62.8% 42%) on `var(--background)` (220 15% 16%). This needs a contrast check.
        *   Border: `border-destructive/50`.
        *   Icon: `[&>svg]:text-destructive`.
        *   **Recommendation:** Verify contrast for `destructive` text on its background. The variable `--destructive-foreground` is defined but not used in the `destructive` alert variant's text color, which might be an oversight. If `destructive` alerts are meant to be on a `bg-destructive` background, then `text-destructive-foreground` should be used. The current implementation `text-destructive` on `bg-background` is more likely.
*   **Verdict:** Mostly **Accessible**. Key improvement area is icon handling and contrast verification for the destructive variant.

---

### 3. `animated-grid.tsx`
*   **Keyboard Navigation:**
    *   The component itself is a `motion.div`. Interactive elements *within* the grid (children) are responsible for their own keyboard accessibility.
    *   If `handleRemoveItem` is triggered by an interactive element (e.g., a button within a child card), that element must be keyboard accessible. The `LockableCard` component, often used with this, has a button.
*   **ARIA Attributes:**
    *   `AnimatePresence` and `motion.div` are for visual effects. No specific ARIA roles seem required for the grid container itself beyond what its children might need.
    *   `layout` prop on `motion.div` implies visual reordering, which should not affect screen reader order unless DOM order also changes.
*   **Focus Management:** If items are removed, focus needs to be managed (e.g., moved to the next item or a stable parent element). This is not explicitly handled by `AnimatedGrid` itself but would be the responsibility of the parent context implementing it or the child components.
*   **Verdict:** **Depends on children**. The grid itself is a layout/animation component. Accessibility relies on its children and how interactions like `onRemove` are implemented.

---

### 4. `avatar.tsx`
*   **Powered by:** Radix UI Avatar.
*   **Image Accessibility:**
    *   `AvatarImage`: Radix likely handles the `alt` attribute if provided. If the image is purely decorative, `alt=""` would be appropriate. If it's informative (e.g., user's profile picture with their name adjacent), `alt=""` is also fine as the information is provided elsewhere. If the image is the *only* way to identify the user (e.g., in a list of avatars with no names), it would need a descriptive `alt` text.
    *   `AvatarFallback`: Provides content when the image fails to load or is not provided. This is good for accessibility. Radix usually implements this such that the fallback is announced if the image is not available.
*   **Color Contrast:**
    *   Fallback: `bg-muted` with foreground text. Contrast of text within fallback vs. `bg-muted` needs to be checked. Default Radix fallbacks often use initials, which should have good contrast.
*   **Verdict:** Likely **Accessible**. Radix UI foundation is strong. Ensure proper `alt` text usage based on context.

---

### 5. `badge.tsx`
*   **ARIA Attributes:**
    *   It's a `div`, which is generally fine for a non-interactive element. If badges are used to convey status that isn't otherwise obvious from text (e.g., "new", "updated"), they might benefit from `aria-label` or visually hidden text for screen reader users, though this is often a higher-level implementation detail.
*   **Color Contrast:** Uses `cva` for variants.
    *   `default`: `bg-primary` and `text-primary-foreground`. (Sage Green with White text) - Likely OK.
    *   `secondary`: `bg-secondary` and `text-secondary-foreground`. (Muted Plum with White text) - Likely OK.
    *   `destructive`: `bg-destructive` and `text-destructive-foreground`. (Red with Light text) - Likely OK.
    *   `outline`: `text-foreground` on (presumably) `bg-transparent` or `bg-background`. This should be fine.
    *   **Recommendation:** Confirm all combinations meet 4.5:1 for small text.
*   **Focus Management:** Badges have focus rings defined (`focus:ring-ring`), but they are `div`s. If a badge were to be interactive (e.g., clickable to filter), it should be a `<button>` or `<a>`. Currently, they are not interactive.
*   **Verdict:** Likely **Accessible** as a static element. Contrast should be verified.

---

### 6. `breadcrumb.tsx`
*   **ARIA Attributes:**
    *   `<nav aria-label="breadcrumb">`: Correctly applied.
    *   `<ol>` for `BreadcrumbList`: Correct.
    *   `<li>` for `BreadcrumbItem`: Correct.
    *   `BreadcrumbLink`: Renders as an `<a>` tag. If it's the current page, it should ideally not be a link or have `aria-current="page"`.
    *   `BreadcrumbPage`: Renders as a `<span>` with `role="link"`, `aria-disabled="true"`, and `aria-current="page"`. This is excellent for the current page item.
    *   `BreadcrumbSeparator`: `aria-hidden="true"` is correctly applied as it's decorative.
    *   `BreadcrumbEllipsis`: Contains a `<span>` with `sr-only` text "More", which is good. The outer `span` is `aria-hidden="true"`, which seems contradictory. The `MoreHorizontal` icon itself should be `aria-hidden="true"`, but the `sr-only` text provides the accessible name for the concept. If the ellipsis is interactive (e.g., a button to show more items), it should be a button element. Currently, it's a span.
        *   **Recommendation:** If `BreadcrumbEllipsis` is interactive, make it a button. If not, the `sr-only` "More" text is sufficient, and the icon should be hidden. The parent `span` having `aria-hidden="true"` would hide the "More" text too. This needs adjustment. The `sr-only` text should be perceivable.
*   **Color Contrast:**
    *   Links (`hover:text-foreground`) vs. background: Standard link behavior.
    *   Current page (`text-foreground`) vs. background: Should be fine.
    *   Separator (`text-muted-foreground`) vs. background: This is a common practice for deemphasizing separators; usually acceptable.
*   **Verdict:** Mostly **Accessible**. The `BreadcrumbEllipsis` `aria-hidden` usage needs review.

---

### 7. `button.tsx`
*   **Powered by:** Radix UI Slot for `asChild` prop.
*   **Keyboard Navigation:** Standard button behavior (Space/Enter to activate). Focus visible styles are applied.
*   **ARIA Attributes:**
    *   Renders as `<button>` or the child component if `asChild` is true.
    *   `disabled` attribute correctly managed via `disabled:opacity-50 disabled:pointer-events-none`.
    *   Icons: `[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`. Assumes icons are decorative. If an icon-only button is used, it must have an `aria-label`.
        *   **Recommendation:** For icon-only buttons (e.g., `size="icon"`), ensure an `aria-label` is provided by the implementing code to give the button an accessible name.
*   **Color Contrast:** Variants need checking:
    *   `default`: `bg-primary` with `text-primary-foreground`. Likely OK.
    *   `destructive`: `bg-destructive` with `text-destructive-foreground`. Likely OK.
    *   `outline`: `border-input bg-background` with text `text-accent-foreground` on hover with `bg-accent`.
        *   Resting: `text-foreground` (implicit) on `bg-background`. OK.
        *   Hover: `text-accent-foreground` on `bg-accent`. This needs checking.
            *   Light: `var(--accent-foreground)` (40 30% 94%) on `var(--accent)` (15 55% 64%).
            *   Dark: `var(--accent-foreground)` (40 30% 94%) on `var(--accent)` (15 55% 72%).
    *   `secondary`: `bg-secondary` with `text-secondary-foreground`. Likely OK.
    *   `ghost`: `text-accent-foreground` on `bg-accent` (on hover). Same as outline hover.
    *   `link`: `text-primary` on `bg-background` (implicit). Needs checking.
        *   Light: `var(--primary)` (150 14% 45%) on `var(--background)` (40 30% 97%).
        *   Dark: `var(--primary)` (150 14% 62%) on `var(--background)` (220 15% 16%).
*   **Verdict:** Likely **Accessible**. Key is ensuring icon-only buttons have accessible names and verifying contrast for `outline`, `ghost` (hover), and `link` variants.

---

### 8. `calendar.tsx`
*   **Powered by:** `react-day-picker`. This library is generally good for accessibility.
*   **Keyboard Navigation:** `react-day-picker` handles keyboard navigation for selecting dates, moving between months/years.
*   **ARIA Attributes:** `react-day-picker` manages ARIA attributes for roles (grid, cell), states (aria-selected, aria-disabled), and labels.
    *   Nav buttons (`nav_button_previous`, `nav_button_next`) are `button` elements (from `buttonVariants`) and contain `ChevronLeft`/`ChevronRight` icons. These should ideally have `aria-label`s like "Previous month" and "Next month". `react-day-picker` might handle this via its own props or defaults.
        *   **Recommendation:** Verify that navigation buttons have accessible names.
*   **Color Contrast:**
    *   `day_selected`: `bg-primary text-primary-foreground`. Likely OK.
    *   `day_today`: `bg-accent text-accent-foreground`. Needs checking (same as Button outline/ghost hover).
    *   `day_outside`, `day_disabled`: `text-muted-foreground`. Contrast of muted text on background needs checking.
    *   `head_cell`: `text-muted-foreground`.
*   **Focus Management:** `react-day-picker` should handle focus within the calendar.
*   **Verdict:** Likely **Accessible**. Relies on `react-day-picker`'s accessibility features. Contrast for today/disabled/outside days and nav button labeling are areas to double-check.

---

### 9. `card.tsx`
*   **ARIA Attributes:**
    *   `Card` is a `div`. `CardTitle` is an `h3`. `CardDescription` is a `p`. This is semantically appropriate.
    *   No interactive elements by default, so no complex ARIA needed for the card structure itself.
    *   The `isLocked` prop changes opacity. If this visually indicates non-interactivity of content within the card, children elements should also be `disabled` or have appropriate ARIA states.
*   **Color Contrast:**
    *   `text-card-foreground` on `bg-card` (effectively `--foreground` on `--background`). Should be fine.
    *   `CardDescription`: `text-muted-foreground`. Contrast needs checking.
*   **Verdict:** Likely **Accessible** as a content container.

---

### 10. `collapsible.tsx`
*   **Powered by:** Radix UI Collapsible.
*   **Keyboard Navigation:** Expected to be keyboard navigable (Space/Enter on trigger).
*   **ARIA Attributes:** Radix manages `aria-expanded`, `aria-controls`.
*   **Color Contrast:** Trigger/content styling will depend on implementation.
*   **Focus Management:** Radix manages focus.
*   **Verdict:** Likely **Accessible**.

---

### 11. `dialog.tsx`
*   **Powered by:** Radix UI Dialog.
*   **Keyboard Navigation:** Expected: Esc to close, Tab confined to dialog.
*   **ARIA Attributes:** Radix handles `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (for `DialogTitle`), `aria-describedby` (for `DialogDescription`).
    *   Close button: `DialogPrimitive.Close` is a button with an `X` icon and `sr-only` text "Close". This is excellent.
*   **Color Contrast:**
    *   `DialogTitle` (`text-lg font-semibold`) on `bg-background`.
    *   `DialogDescription` (`text-sm text-muted-foreground`) on `bg-background`. (Contrast needs checking).
*   **Focus Management:** Radix should trap focus within the dialog and restore focus on close.
*   **Verdict:** Likely **Accessible**. Contrast of description text is a minor check.

---

### 12. `dropdown-menu.tsx`
*   **Powered by:** Radix UI DropdownMenu.
*   **Keyboard Navigation:** Full keyboard support expected (arrows, Enter, Space, Esc).
*   **ARIA Attributes:** Radix handles `role="menu"`, `role="menuitem"`, `aria-haspopup`, etc.
    *   Icons (`Check`, `ChevronRight`, `Circle`) within items are decorative or indicate selection state, which Radix manages.
*   **Color Contrast:**
    *   Items: `text-popover-foreground` on `bg-popover`. (Standard contrast).
    *   Focus/active items: `bg-accent text-accent-foreground`. (Needs checking - see Button outline/ghost hover).
    *   `DropdownMenuLabel`: `font-semibold`.
    *   `DropdownMenuShortcut`: `opacity-60`. Contrast of shortcut text needs checking.
*   **Focus Management:** Radix manages focus.
*   **Verdict:** Likely **Accessible**. Contrast for focused items and shortcuts are points to verify.

---

### 13. `dropdown.tsx` (Custom Component)
*   **Keyboard Navigation:**
    *   Trigger: The `div` wrapping `trigger` which has `onClick={() => setIsOpen(!isOpen)}` is not inherently keyboard focusable or operable. If `trigger` is a button (as `DropdownTrigger` component suggests by wrapping `Button`), then it's fine. If `trigger` can be any generic ReactNode, this is a problem.
        *   **Recommendation:** Ensure the trigger element is always an interactive element like a button. The `DropdownTrigger` sub-component does this correctly. If `Dropdown` can be used without `DropdownTrigger`, its trigger mechanism needs to be a button or have `tabindex="0"` and keyboard event handlers (Enter/Space).
    *   Items: Rendered as `<button>`. This is good. Arrow key navigation between items is not implemented.
        *   **Recommendation:** Implement arrow key navigation for items within the dropdown when open.
*   **ARIA Attributes:**
    *   `role="menu"` and `aria-orientation="vertical"` on the item container are good.
    *   `role="menuitem"` on item buttons is good.
    *   The trigger should have `aria-haspopup="true"` and `aria-expanded={isOpen}`.
        *   **Recommendation:** Add `aria-haspopup="true"` and `aria-expanded={isOpen}` to the trigger element.
*   **Color Contrast:**
    *   Items: `text-gray-700` on `bg-white`. OK. Hover `bg-gray-100`. OK.
*   **Focus Management:**
    *   When the dropdown opens, focus should ideally move to the first item or the list itself.
    *   When it closes, focus should return to the trigger.
    *   Clicking outside to close is implemented, which is good. Esc key to close is not explicitly mentioned but is standard.
        *   **Recommendation:** Implement focus management: move focus into the menu on open, and return focus to trigger on close. Add Esc key to close.
*   **Verdict:** **Partially Accessible**. Requires improvements in keyboard navigation for the trigger (if not a button), item navigation, ARIA attributes for the trigger, and focus management.

---

### 14. `form.tsx`
*   **Powered by:** `react-hook-form` and Radix UI Label.
*   **Form Accessibility:**
    *   `FormLabel` uses Radix Label, which connects to form elements via `htmlFor`. The `useFormField` hook generates IDs (`formItemId`, `formDescriptionId`, `formMessageId`) for connecting label, input, description, and error messages. This is excellent.
    *   `FormControl` uses `aria-describedby` to link to description and error messages, and `aria-invalid={!!error}`. This is excellent.
    *   `FormMessage` conditionally renders error messages.
*   **Color Contrast:**
    *   Error text: `text-destructive` (on default background). Needs checking.
    *   Label with error: `text-destructive`. Needs checking.
    *   `FormDescription`: `text-muted-foreground`. Needs checking.
*   **Verdict:** Likely **Accessible**. Strong foundation for accessible forms. Color contrasts for error/description text are main check points.

---

### 15. `glossary-drawer.tsx`
*   **Uses:** `Sheet` component (Radix-based Dialog).
*   **Keyboard Navigation:**
    *   Trigger `Button`: Accessible.
    *   Interactive elements within the sheet (Buttons for Edit/Save/Close, Inputs, Textareas, Term-Delete buttons, Add Term button) must be keyboard accessible. They are standard `Button`, `Input`, `Textarea` components, which are generally good.
    *   Search input is `Input`.
*   **ARIA Attributes:**
    *   `Sheet` handles dialog roles. `SheetTitle` is used.
    *   Labels for `Input` and `Textarea` in edit mode are present (`<Label>`).
    *   Delete term button: `Trash2` icon. Needs `aria-label="Delete term [term name]"` or similar.
        *   **Recommendation:** Add specific `aria-label` to delete buttons.
    *   Add Term button: Text "Add Term" is clear.
*   **Color Contrast:** Many custom color values used:
    *   Trigger: `text-[#6C8578]` (Primary) on default. OK.
    *   Sheet Header `text-xl font-display font-medium text-foreground`. OK.
    *   Edit button: `text-[#6C8578]`. Save button: `text-[#3C6E58]`. These specific hex codes need contrast checks against their hover backgrounds (`#E6E0D6/50`, `#DCE4DF/70`).
    *   Search input: `border-[#E6E0D6] bg-white`. OK.
    *   Term display: `font-medium text-[#5A7164] font-display`. Definition: `text-muted-foreground`. Both need contrast checks.
    *   Labels in edit: `text-[#5A7164]`.
    *   Delete button icon: `text-[#9C4226]`. Needs check.
    *   Add Term button: `text-[#3C6E58]` on `bg-[#F6F8F7]`. Needs check.
*   **Focus Management:** `Sheet` should handle focus trapping. When new term fields appear or terms are deleted, focus should be managed logically.
*   **Verdict:** **Partially Accessible**. Relies on `Sheet` for base accessibility. Color contrast for various custom text/icon colors needs thorough verification. Icon buttons need accessible names.

---

### 16. `hover-card.tsx`
*   **Powered by:** Radix UI HoverCard.
*   **Keyboard Navigation:** Radix typically ensures content is not activated by keyboard focus alone, usually requiring a specific interaction if any. Hover cards are often not keyboard-triggerable by design (they react to mouse hover). If content is critical, it should be accessible via other means.
*   **ARIA Attributes:** Radix manages any necessary ARIA for popups.
*   **Verdict:** Likely **Accessible** for mouse users. Ensure information in hover card is available through other means for keyboard-only users if it's critical.

---

### 17. `icons.tsx`
*   **Image Accessibility:**
    *   `IconSeparator`: `aria-hidden="true"`. Correct as it's decorative.
    *   `IconNextChat`, `IconVercel`: These are logos. `aria-label` is present for Vercel. If they are just decorative, `aria-hidden="true"` might be better. If they are links, the link itself should have the accessible name.
    *   `IconArrowUp`: No `aria-label` or `aria-hidden`. If used as a standalone icon button, it needs an accessible name. If purely decorative alongside text, needs `aria-hidden="true"`.
    *   `IconSpinner`: `animate-spin` class. Decorative, so `aria-hidden="true"` would be good, or `role="status"` with `aria-label="Loading"` if it's indicating a loading state.
    *   `IconGoogle`: `role="img"`. If this is purely for branding, this is okay. If it's an interactive element (e.g. "Sign in with Google" button), the button itself should convey this.
    *   **Recommendation:** Ensure all icons used purely decoratively have `aria-hidden="true"`. If an icon conveys meaning or is interactive, it must have an accessible name provided by the parent component (e.g., `aria-label` on a button). The `spinner` could have `role="status"` if it's indicating loading.

*   **Verdict:** **Context-dependent**. The file provides icons; their accessibility depends on how they are used. Recommendations are for usage patterns.

---

### 18. `input.tsx`
*   **Keyboard Navigation:** Standard input behavior. Focus visible styles are applied.
*   **ARIA Attributes:**
    *   `type` attribute is passed.
    *   `disabled` attribute correctly managed.
    *   Placeholder text is present (`placeholder:text-muted-foreground`). Placeholders are not substitutes for labels.
*   **Form Accessibility:** Assumes used with `<Label>` (from `form.tsx` or standalone).
*   **Color Contrast:**
    *   Text on `bg-background`. OK.
    *   Placeholder (`text-muted-foreground`) on `bg-background`. Needs checking.
    *   Border (`border-input`).
*   **Verdict:** Likely **Accessible** when used with a proper label. Placeholder contrast needs checking.

---

### 19. `label.tsx`
*   **Powered by:** Radix UI Label.
*   **Form Accessibility:** Radix ensures the label is correctly associated with its input control (via `htmlFor` if the input has an ID).
*   **Color Contrast:** `text-sm font-medium`. Contrast depends on background.
*   **Verdict:** Likely **Accessible**.

---

### 20. `lockable-card.tsx`
*   **Uses:** `Card`, `Button`, `framer-motion`.
*   **Keyboard Navigation:**
    *   The lock/unlock button is a `Button` component, so it's keyboard accessible.
*   **ARIA Attributes:**
    *   Lock/Unlock Button: `aria-label` is correctly set: "Unlock to remove" or "Remove card". This is excellent.
    *   The card itself (`motion.div` wrapping `Card`) doesn't have specific ARIA attributes related to the locked state. If "locked" means child elements are not interactive, they should also be `disabled` or have `aria-disabled="true"`.
        *   **Recommendation:** If the card's content becomes non-interactive when locked, ensure this state is conveyed to assistive technologies for the elements within the card too.
*   **Color Contrast:**
    *   Title/Description: Standard `Card` contrast.
    *   Unlock icon: `text-red-500`. Contrast against button background (ghost, likely transparent or accent on hover) needs checking.
*   **Focus Management:** If the card is removed, focus should move to a logical place. This is handled by `AnimatedGrid` or parent logic.
*   **Verdict:** Mostly **Accessible**. Main area is ensuring the locked state appropriately affects child controls if applicable.

---

### 21. `navigation-menu.tsx`
*   **Powered by:** Radix UI NavigationMenu.
*   **Keyboard Navigation:** Full keyboard support expected.
*   **ARIA Attributes:** Radix handles `aria-haspopup`, `aria-expanded`, etc.
    *   `ChevronDown` icon in trigger: `aria-hidden="true"`. Correct.
*   **Color Contrast:**
    *   Trigger: `bg-background` text on `bg-accent` (hover/focus/open). Needs checking (same as Button outline/ghost hover).
    *   Content: `bg-popover text-popover-foreground`. Standard.
*   **Verdict:** Likely **Accessible**. Contrast for trigger states is a point to verify.

---

### 22. `popover.tsx`
*   **Powered by:** Radix UI Popover.
*   **Keyboard Navigation:** Typically Esc to close. Trigger should be keyboard accessible. Content accessible depending on Radix implementation (usually not directly focusable unless it contains focusable elements).
*   **ARIA Attributes:** Radix handles dialog-like roles if modal, or tooltip-like attributes.
*   **Focus Management:** Radix should manage focus (e.g., return to trigger on close).
*   **Verdict:** Likely **Accessible**.

---

### 23. `progress-bar.tsx`
*   **ARIA Attributes:**
    *   A progress bar should ideally have `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, and `aria-valuemax="100"`.
    *   If it's indeterminate (like this one, which jumps to 10 then 100), it might not need `aria-valuenow` but should still have the role.
    *   It's a `div`.
    *   **Recommendation:** Add `role="progressbar"`, `aria-valuemin="0"`, `aria-valuemax="100"`, and update `aria-valuenow={progress}`. If the progress is purely visual and very short-lived, it might be considered decorative, but `role="progressbar"` is still good practice.
*   **Color Contrast:** The bar itself (`backgroundColor: color`) against the page background. The default color is `#A87C39`. This is a visual element, so high contrast isn't strictly required for the bar itself, but it should be perceivable.
*   **Verdict:** **Needs Improvement**. Add ARIA attributes for progressbar role and values.

---

### 24. `radio-group.tsx`
*   **Powered by:** Radix UI RadioGroup.
*   **Keyboard Navigation:** Standard radio group navigation (arrows to change selection, Tab to move in/out).
*   **ARIA Attributes:** Radix handles `role="radiogroup"`, `role="radio"`, `aria-checked`, `aria-disabled`.
    *   `Circle` icon is decorative for the checked state.
*   **Form Accessibility:** Items are associated with labels (expected in implementation).
*   **Verdict:** Likely **Accessible**.

---

### 25. `select.tsx`
*   **Powered by:** Radix UI Select.
*   **Keyboard Navigation:** Full keyboard support expected.
*   **ARIA Attributes:** Radix handles all necessary roles and states.
    *   Icons `Check`, `ChevronDown`, `ChevronUp` are handled by Radix.
*   **Color Contrast:**
    *   Trigger: `text-sm` on `bg-background`. Placeholder `text-muted-foreground`.
    *   Items: `text-sm` on `bg-popover`. Focused item `bg-accent text-accent-foreground` (needs check).
*   **Focus Management:** Radix manages focus.
*   **Verdict:** Likely **Accessible**. Contrast for focused items and placeholder needs checking.

---

### 26. `separator.tsx`
*   **Powered by:** Radix UI Separator.
*   **ARIA Attributes:** Radix typically sets `role="separator"` if `decorative` is false (default is true here). For decorative separators, `aria-hidden="true"` is appropriate or no role. Since `decorative = true` is passed, it implies it is decorative.
*   **Color Contrast:** `bg-border`. This is a visual line, contrast is for visibility, not readability of text.
*   **Verdict:** Likely **Accessible** as a decorative element.

---

### 27. `settings-sidebar-nav.tsx`
*   **Uses:** Next.js `Link`, `buttonVariants`.
*   **Keyboard Navigation:** Links are navigable. Active link style changes.
*   **ARIA Attributes:**
    *   Current page indication: `pathname === item.href` styling is visual. `aria-current="page"` should be applied to the active link.
        *   **Recommendation:** Add `aria-current="page"` to the active `Link` component.
*   **Color Contrast:**
    *   Links: `buttonVariants({ variant: "ghost" })`. Text color (default foreground) on transparent background. Hover `underline`. OK.
    *   Active link: `bg-muted`. Text color (default foreground) on `bg-muted`. Check contrast of foreground on muted.
*   **Verdict:** **Needs Improvement**. Add `aria-current="page"` for active links. Check active link contrast.

---

### 28. `sheet.tsx`
*   **Powered by:** Radix UI Dialog (Sheet is a conceptual variant).
*   **Keyboard Navigation:** Expected: Esc to close, Tab confined.
*   **ARIA Attributes:** Radix handles dialog roles.
    *   Close button: `X` icon with `sr-only` "Close". Excellent.
    *   `hideCloseButton` prop: If true, ensure there's another keyboard-accessible way to close the sheet.
*   **Focus Management:** Radix should trap focus and restore on close.
*   **Verdict:** Likely **Accessible**. If `hideCloseButton` is used, ensure alternative closing methods are accessible.

---

### 29. `sidebar.tsx`
*   **Complex component.** Uses `Sheet` for mobile, custom logic for desktop.
*   **Keyboard Navigation:**
    *   `SidebarTrigger` is a `Button` (`PanelLeft` icon with `sr-only` "Toggle Sidebar"). Accessible.
    *   `SidebarRail` is a `button` for toggling, `aria-label`, `title`. Accessible.
    *   `SidebarMenuButton` is a `button` or `Slot`. Tooltips are provided for icon-only state. Good.
    *   `SidebarMenuAction` is a `button`. Good.
    *   Keyboard shortcut `Cmd/Ctrl+B` to toggle: Good.
*   **ARIA Attributes:**
    *   Mobile (`Sheet`): Handles ARIA. `SheetHeader` with `sr-only` title/description. Good.
    *   Desktop:
        *   `data-state="expanded|collapsed"` is used for styling.
        *   `SidebarMenuButton` uses `data-active={isActive}`. `aria-current` might be more appropriate if these are navigation links. If they are just actions, `aria-pressed` might be relevant if they are toggle buttons.
            *   **Recommendation:** If menu buttons represent navigation, use `aria-current="page"` for the active one. If they are toggle buttons, manage `aria-pressed`.
        *   `SidebarMenuSubButton` (renders as `<a>`): Same recommendation for `aria-current`.
    *   `TooltipContent` has `hidden={state !== "collapsed" || isMobile}`. This is for visual hiding; ARIA for tooltips handled by Radix.
*   **Color Contrast:**
    *   Many specific theme colors used (`bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent`, `text-sidebar-accent-foreground`, `bg-sidebar-border`). These all need to be checked against each other based on the actual color values assigned to these sidebar-specific theme variables from `globals.css`.
    *   `SidebarGroupLabel`: `text-sidebar-foreground/70`. Opacity might cause contrast issues.
    *   `SidebarInput`: `bg-background` (within sidebar potentially `bg-sidebar`).
*   **Focus Management:**
    *   Mobile: Handled by `Sheet`.
    *   Desktop: Focus appears to be handled by standard browser behavior on buttons. Tooltips behavior from Radix.
*   **Verdict:** Mostly **Accessible**, very detailed. Key areas: `aria-current` for navigation-like menu buttons, and thorough color contrast verification of all sidebar-specific theme variable combinations.

---

### 30. `skeleton.tsx`
*   **ARIA Attributes:**
    *   It's a `div` with `animate-pulse`. For screen reader users, skeletons can be confusing if not handled correctly. They should either be hidden from screen readers (`aria-hidden="true"`) if the loading is very fast or if there's accompanying loading text, or use `aria-busy="true"` on the region being loaded.
    *   **Recommendation:** Add `aria-hidden="true"` to the skeleton `div` if the content it's masking will load quickly or if there's a textual loading indicator. Alternatively, the container of the content being loaded could have `aria-busy="true"`.
*   **Verdict:** **Needs Improvement**. Add appropriate ARIA for loading state.

---

### 31. `slider.tsx`
*   **Powered by:** Radix UI Slider.
*   **Keyboard Navigation:** Arrow keys to change value.
*   **ARIA Attributes:** Radix handles `role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-orientation`.
*   **Color Contrast:**
    *   Thumb (`border-primary bg-background`) against Track (`bg-secondary`).
    *   Range fill (`bg-primary`) against Track (`bg-secondary`).
    *   These are visual indicators of state/position, contrast helps perception but isn't like text contrast.
*   **Verdict:** Likely **Accessible**.

---

### 32. `spinner.tsx`
*   **Image Accessibility (Icon):**
    *   SVG with `animate-spin`.
    *   **Recommendation:** Add `role="status"` and an `aria-label="Loading..."` (or similar) if the spinner is meant to convey a loading state to screen readers. If it's purely decorative alongside other loading text, `aria-hidden="true"` is appropriate. The `Icons.spinner` component in `icons.tsx` should be the one to get these attributes.
*   **Verdict:** **Needs Improvement** (via `icons.tsx`). Add ARIA role/label.

---

### 33. `switch.tsx`
*   **Powered by:** Radix UI Switch.
*   **Keyboard Navigation:** Space to toggle.
*   **ARIA Attributes:** Radix handles `role="switch"`, `aria-checked`.
*   **Color Contrast:**
    *   Checked: Thumb (`bg-background`) on Track (`bg-primary`).
    *   Unchecked: Thumb (`bg-background`) on Track (`bg-input`).
*   **Verdict:** Likely **Accessible**.

---

### 34. `table.tsx`
*   **ARIA Attributes:**
    *   Uses native HTML table elements (`<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`, `<caption>`). This is good for semantics.
    *   `TableHead` (`th`): Scope attributes (`scope="col"` or `scope="row"`) are not explicitly added but are crucial for complex tables. For simple tables, they might be inferred.
        *   **Recommendation:** For `TableHead` components, encourage or add `scope="col"` (or `scope="row"` if it's a row header).
    *   The outer `div` with `overflow-auto` is good for responsiveness.
*   **Color Contrast:**
    *   `TableHead`: `text-muted-foreground`. Needs contrast check.
    *   Cell text on background. Standard.
    *   Hover/selected rows `bg-muted/50` or `bg-muted`. Text contrast on these backgrounds.
*   **Verdict:** Mostly **Accessible**. Adding `scope` attributes to headers would be a good enhancement. Contrast for header text and text on hover/selected rows needs checking.

---

### 35. `tabs.tsx`
*   **Powered by:** Radix UI Tabs.
*   **Keyboard Navigation:** Arrow keys to switch tabs, Enter/Space to activate.
*   **ARIA Attributes:** Radix handles `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`.
*   **Color Contrast:**
    *   `TabsList`: `bg-muted text-muted-foreground`. (Inactive tabs text color). Needs checking.
    *   `TabsTrigger` (active): `bg-background text-foreground shadow-sm`. OK.
    *   `TabsTrigger` (inactive): `text-muted-foreground` on `bg-muted`. Needs checking.
*   **Focus Management:** Radix manages focus.
*   **Verdict:** Likely **Accessible**. Contrast for active/inactive tabs text needs checking.

---

### 36. `textarea.tsx`
*   **Keyboard Navigation:** Standard textarea behavior. Focus visible styles applied.
*   **ARIA Attributes:** Placeholder `placeholder:text-muted-foreground`.
*   **Form Accessibility:** Assumes used with `<Label>`.
*   **Color Contrast:** Placeholder text contrast.
*   **Verdict:** Likely **Accessible** when used with a proper label. Placeholder contrast.

---

### 37. `toggle.tsx`
*   **Powered by:** Radix UI Toggle.
*   **Keyboard Navigation:** Standard button behavior.
*   **ARIA Attributes:** Radix handles `aria-pressed` state.
    *   Icons: Similar to `Button`, if icon-only, needs `aria-label`.
*   **Color Contrast:**
    *   `default` variant (transparent bg): Text (foreground) on background. Hover `bg-muted text-muted-foreground` (needs check).
    *   `outline` variant: Similar to Button outline.
    *   `data-[state=on]:bg-accent data-[state=on]:text-accent-foreground` (needs check).
*   **Verdict:** Likely **Accessible**. Ensure `aria-label` for icon-only toggles. Check contrast for variants, especially hover and on states.

---

### 38. `tooltip.tsx`
*   **Powered by:** Radix UI Tooltip.
*   **Keyboard Navigation:** Tooltips are typically not triggered by keyboard focus alone. Content should be supplemental.
*   **ARIA Attributes:** Radix handles `role="tooltip"`, etc.
*   **Color Contrast:** `bg-popover px-3 py-1.5 text-sm text-popover-foreground`. Standard.
*   **Verdict:** Likely **Accessible**.

## Summary of Common Recommendations:

1.  **Color Contrast Verification:**
    *   `text-muted-foreground` on various backgrounds (default, card, popover).
    *   `text-accent-foreground` on `bg-accent` (used in hover/active states for Button, DropdownMenu, NavigationMenu, Toggle, Calendar's today).
    *   `text-primary` (as link color) on `bg-background`.
    *   `text-destructive` on `bg-background` (for Alert, Form error states).
    *   Sidebar specific theme colors.
    *   Placeholder text color (`text-muted-foreground`) in Input/Textarea.
2.  **Icon Accessibility:**
    *   Ensure all purely decorative icons (Lucide icons, SVGs in `icons.tsx`) have `aria-hidden="true"`.
    *   Ensure all interactive icon-only buttons (Button, Toggle, icons in GlossaryDrawer, etc.) have clear `aria-label` attributes.
    *   Spinners/Loaders (`spinner.tsx`, potentially `progress-bar.tsx`) should have appropriate ARIA roles like `status` or `progressbar` and accessible labels if they convey information beyond being decorative.
3.  **ARIA Attributes for Custom/Complex Components:**
    *   `Custom Dropdown`: Needs `aria-expanded`, `aria-haspopup` on trigger, and better keyboard navigation/focus management.
    *   `BreadcrumbEllipsis`: Review `aria-hidden` if it's meant to be interactive or convey "More".
    *   `SettingsSidebarNav`: Active links need `aria-current="page"`.
    *   `SidebarMenuButton`/`SidebarMenuSubButton`: Use `aria-current="page"` if they function as navigation links.
    *   `TableHead`: Add `scope="col"` or `scope="row"`.
    *   `Skeleton`: Add `aria-hidden="true"` or manage `aria-busy` on content region.
4.  **Form Element Associations:** While `form.tsx` is good, always ensure `Input`, `Textarea`, `Select`, `RadioGroup`, `Switch` are correctly associated with `Label` components in all actual form implementations.

This audit provides a component-by-component analysis. Remediation should prioritize critical issues like missing labels for inputs, insufficient color contrast for essential text, and lack of keyboard accessibility for interactive elements.
