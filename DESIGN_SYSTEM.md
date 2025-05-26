# Design System Documentation

This document outlines the design system used in the application, based on the analysis of `src/app/globals.css` and UI components in `src/components/ui/`.

## 1. Color Palette

Colors are defined as CSS variables and have distinct values for light and dark modes.

| Variable Name              | Light Mode (HSL / Hex)        | Dark Mode (HSL / Hex)          | Description                               |
| -------------------------- | ----------------------------- | ------------------------------ | ----------------------------------------- |
| `--background`             | `40 30% 97%` / `#F8F7F4`      | `220 15% 16%` / `#222429`      | Main background color                     |
| `--foreground`             | `0 0% 20%` / `#333333`        | `40 30% 94%` / `#F2EFE6`      | Main text/icon color                      |
| `--card`                   | `40 30% 97%` / `#F8F7F4`      | `220 15% 16%` / `#222429`      | Card background color                     |
| `--card-foreground`        | `0 0% 20%` / `#333333`        | `40 30% 94%` / `#F2EFE6`      | Card text/icon color                      |
| `--popover`                | `40 30% 97%` / `#F8F7F4`      | `220 15% 16%` / `#222429`      | Popover background color                  |
| `--popover-foreground`     | `0 0% 20%` / `#333333`        | `40 30% 94%` / `#F2EFE6`      | Popover text/icon color                   |
| `--primary`                | `150 14% 45%` / `#6C8578`     | `150 14% 62%` / `#9AB5A9`     | Primary brand color (Sage Green)          |
| `--primary-foreground`     | `0 0% 100%`                   | `0 0% 9%`                      | Text/icon color on primary background     |
| `--secondary`              | `300 10% 40%` / `#785F73`     | `300 10% 57%` / `#A18E9A`     | Secondary brand color (Muted Plum)        |
| `--secondary-foreground`   | `0 0% 100%`                   | `0 0% 9%`                      | Text/icon color on secondary background   |
| `--muted`                  | `40 20% 92%` / `#F1EEE9`      | `220 10% 22%` / `#303136`     | Muted color for subtle elements           |
| `--muted-foreground`       | `0 0% 45%` / `#737373`        | `40 15% 70%`                   | Text/icon color for muted elements        |
| `--accent`                 | `15 55% 64%` / `#E18C73`      | `15 55% 72%` / `#F3B29D`      | Accent color (Softer Sienna)              |
| `--accent-foreground`      | `40 30% 94%`                  | `40 30% 94%`                   | Text/icon color on accent background      |
| `--destructive`            | `0 84.2% 60.2%`               | `0 62.8% 42%`                  | Color for destructive actions             |
| `--destructive-foreground` | `210 40% 98%`                 | `40 30% 94%`                   | Text/icon color on destructive background |
| `--border`                 | `40 15% 85%` / `#E6E0D6`      | `220 12% 24%`                  | Default border color                      |
| `--input`                  | `40 15% 85%`                  | `220 12% 24%`                  | Input border color                        |
| `--ring`                   | `150 14% 45%`                 | `150 14% 62%`                  | Focus ring color                          |

**Chart Colors:**

| Variable Name | Light Mode      | Dark Mode       | Description          |
| ------------- | --------------- | --------------- | -------------------- |
| `--chart-1`   | `15 55% 64%`    | `15 55% 72%`    | Chart color 1        |
| `--chart-2`   | `150 14% 45%`   | `150 14% 62%`   | Chart color 2        |
| `--chart-3`   | `45 70% 60%`    | `45 70% 65%`    | Warm Gold            |
| `--chart-4`   | `25 85% 55%`    | `25 85% 60%`    | Terracotta           |
| `--chart-5`   | `195 25% 50%`   | `195 25% 60%`   | Dusty Blue           |

**Sidebar Colors:**

| Variable Name                  | Light Mode      | Dark Mode       | Description                      |
| ------------------------------ | --------------- | --------------- | -------------------------------- |
| `--sidebar-background`         | `40 25% 95%`    | `220 15% 14%`   | Sidebar background color         |
| `--sidebar-foreground`         | `0 0% 25%`      | `40 30% 94%`    | Sidebar text/icon color          |
| `--sidebar-primary`            | `150 14% 45%`   | `150 14% 62%`   | Sidebar primary color            |
| `--sidebar-primary-foreground` | `0 0% 100%`     | `0 0% 9%`       | Text/icon on sidebar primary     |
| `--sidebar-accent`             | `40 20% 90%`    | `220 12% 20%`   | Sidebar accent color             |
| `--sidebar-accent-foreground`  | `0 0% 20%`      | `40 30% 94%`    | Text/icon on sidebar accent      |
| `--sidebar-border`             | `40 15% 85%`    | `220 12% 24%`   | Sidebar border color             |
| `--sidebar-ring`               | `150 14% 45%`   | `150 14% 62%`   | Sidebar focus ring color         |

## 2. Typography

The application uses two main font families and defines several typographic utility classes.

*   **Primary Font (`font-sans`)**: `var(--font-inter)`, `var(--font-source-sans)`, `system-ui`, `sans-serif`. Used for general body text.
*   **Display Font (`font-display`)**: `var(--font-cormorant)`, `serif`. Used for headings and special text elements.

**Typographic Styles (from `globals.css`):**

*   **Headings (`h1, h2, h3, h4, h5, h6`)**:
    *   Font: `font-display`
*   **`.section-title`**:
    *   Font: `font-display`
    *   Size: `text-2xl` (1.5rem)
    *   Weight: `font-medium`
    *   Tracking: `tracking-tight`
    *   Color: `text-foreground`
    *   Decoration: `border-b border-muted pb-2 mb-4`
*   **`.section-header`**:
    *   Font: `font-display`
    *   Size: `text-xl` (1.25rem)
    *   Weight: `font-medium`
    *   Tracking: `tracking-tight`
    *   Decoration: `border-b border-muted pb-1 mb-3`

**Typographic Styles (observed in components):**

*   **`AlertTitle`**: `font-medium leading-none tracking-tight` (typically applied to an `h5`).
*   **`CardTitle`**: `text-2xl font-semibold leading-none tracking-tight` (applied to an `h3`).
*   **`CardDescription`**: `text-sm text-muted-foreground`.
*   **`Button`**: `text-sm font-medium`.
*   **`DialogTitle`**: `text-lg font-semibold leading-none tracking-tight`.
*   **`DialogDescription`**: `text-sm text-muted-foreground`.
*   **`Input`**: `text-base` (1rem) / `md:text-sm` (0.875rem on medium screens and up).
*   **`Label`**: `text-sm font-medium leading-none`.
*   **`TableHead`**: `font-medium text-muted-foreground`.
*   **`TabsTrigger`**: `text-sm font-medium`.

## 3. Spacing and Sizing

Spacing is primarily managed by Tailwind CSS utility classes. A global border radius variable is defined.

*   **`--radius`**: `0.75rem`. This variable is defined in `:root`.
    *   Components like `Button`, `Input`, `SelectTrigger`, `TabsTrigger`, `Textarea` use `rounded-md` (Tailwind default: `0.375rem`).
    *   `Card`, `Alert` use `rounded-lg` (Tailwind default: `0.5rem`).
    *   `Avatar`, `Badge`, `Switch` use `rounded-full`.
    *   It's unclear if Tailwind's default `rounded-md` and `rounded-lg` are customized to use `--radius`. Assuming Tailwind defaults for now. The `Sidebar` component uses `rounded-lg` for its floating variant.

**Common Spacing Patterns (from Tailwind classes):**

*   **Padding:**
    *   `p-1`: `DropdownMenuContent`, `Select.Viewport`, `TabsList`.
    *   `p-2`: `SidebarHeader`, `SidebarFooter`, `SidebarGroup`. `SidebarMenuButton` (default size).
    *   `p-3`: `Calendar`.
    *   `p-4`: `Alert`, `HoverCardContent`, `PopoverContent`, `TableCell`, `TableHead`.
    *   `p-6`: `CardHeader`, `CardContent`, `CardFooter`, `DialogContent`, `SheetContent`.
    *   `px-2.5 py-0.5`: `Badge`.
    *   `px-3 py-1.5`: `TabsTrigger`.
    *   `px-3 py-2`: `Input`, `SelectTrigger`, `Textarea`.
    *   `px-4 py-2`: `Button` (default size).
    *   `py-4`: `AccordionTrigger`.
    *   `pb-4 pt-0`: `AccordionContent` inner div.
*   **Margin:**
    *   `mb-1`: `AlertTitle`.
    *   `mb-4` (1rem): Used in `.section-title`.
    *   `mb-3` (0.75rem): Used in `.section-header`.
    *   `-mx-1 my-1`: `DropdownMenuSeparator`, `SelectSeparator`.
*   **Gaps (for flex/grid):**
    *   `gap-1`: `SidebarMenu`.
    *   `gap-1.5`: `BreadcrumbList`.
    *   `gap-2`: `Button`, `DropdownMenuSubTrigger`, `DropdownMenuItem`, `RadioGroup`, `SidebarHeader`, `SidebarFooter`, `SidebarContent`, `Toggle` (default).
    *   `gap-4`: `DialogContent`, `Sheet` (base for variants). `AnimatedGrid` (default).
*   **Height/Width (specific sizing):**
    *   `h-4 w-4`: `AccordionTrigger` (ChevronDown icon), `Dialog` (X icon), `DropdownMenuCheckboxItem` (Check icon), `Select` (ChevronDown/Up icons), `SidebarMenuButton` (icons).
    *   `h-7 w-7`: `Calendar` nav buttons.
    *   `h-8`: `SidebarInput`, `SidebarMenuButton` (default size).
    *   `h-9 w-9`: `Calendar` day cells, `Button` (sm size icon).
    *   `h-9 rounded-md px-3`: `Button` (sm size).
    *   `h-10 w-10`: `Button` (icon size).
    *   `h-10`: `Button` (default size), `Input`, `SelectTrigger`, `TabsList`, `Toggle` (default size).
    *   `h-11 rounded-md px-8`: `Button` (lg size).
    *   `h-12 px-4`: `TableHead`.
    *   `min-h-[80px]`: `Textarea`.
    *   SVG icons in buttons: `size-4` (1rem width and height).
    *   Sidebar width: `16rem` (normal), `18rem` (mobile), `3rem` (icon-only collapsed).
*   **Internal Spacing (e.g. `space-y`):**
    *   `space-y-1.5`: `CardHeader`, `DialogHeader`.
    *   `space-y-2`: `FormItem`.
    *   `space-y-4`: `Calendar` months/month.

## 4. Component Inventory

List of components found in `src/components/ui/`.

*   **`accordion.tsx`**: (Radix UI based) A vertically stacked set of interactive headings that each reveal a section of content.
    *   **Parts:** `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`.
    *   **Styling:** `border-b` on items, `py-4` on trigger, animated content.
*   **`alert.tsx`**: Displays a prominent message to the user. Uses `cva` for variants.
    *   **Parts:** `Alert`, `AlertTitle`, `AlertDescription`.
    *   **Variants:** `default` (standard background/text), `destructive` (uses destructive colors, red-tinged border).
    *   **Styling:** `rounded-lg border p-4`, icon positioning.
*   **`animated-grid.tsx`**: A component for displaying items in a grid (`grid-cols-1 md:grid-cols-3 gap-6`) with `framer-motion` animations for item presence. Children can be enhanced with an `onRemove` prop.
*   **`avatar.tsx`**: (Radix UI based) Displays an image representing a user or entity, with a fallback.
    *   **Parts:** `Avatar`, `AvatarImage`, `AvatarFallback`.
    *   **Styling:** `h-10 w-10 rounded-full`, fallback `bg-muted`.
*   **`badge.tsx`**: Small labels used for counts, statuses, or categories. Uses `cva` for variants.
    *   **Variants:** `default` (primary bg/text), `secondary` (secondary bg/text), `destructive` (destructive bg/text), `outline` (transparent bg, foreground text).
    *   **Styling:** `rounded-full border px-2.5 py-0.5 text-xs font-semibold`.
*   **`breadcrumb.tsx`**: (Radix UI's Slot based) Navigation aid showing user's location.
    *   **Parts:** `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`.
    *   **Styling:** `text-sm text-muted-foreground`, `gap-1.5 sm:gap-2.5`. Separator defaults to `ChevronRight` icon.
*   **`button.tsx`**: (Radix UI's Slot based) Interactive element. Uses `cva` for variants.
    *   **Variants (Style):** `default` (primary), `destructive`, `outline`, `secondary`, `ghost` (hover accent), `link` (underline).
    *   **Variants (Size):** `default` (h-10 px-4 py-2), `sm` (h-9 px-3), `lg` (h-11 px-8), `icon` (h-10 w-10).
    *   **Styling:** `gap-2` for icon and text.
*   **`calendar.tsx`**: (react-day-picker based) A component for selecting dates, styled to match the theme.
    *   **Styling:** Uses `buttonVariants` for nav buttons and day cells, custom classes for layout and selected states. Icons `ChevronLeft`, `ChevronRight`.
*   **`card.tsx`**: A container for grouping related information.
    *   **Parts:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
    *   **Props:** `isLocked` (boolean, visual style change: `opacity-90`).
    *   **Styling:** `rounded-lg shadow-sm`, header `space-y-1.5 p-6`, content/footer `p-6 pt-0`.
*   **`collapsible.tsx`**: (Radix UI based) A component that can expand or collapse its content.
    *   **Parts:** `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`.
*   **`dialog.tsx`**: (Radix UI based) A modal overlay.
    *   **Parts:** `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`.
    *   **Styling:** `bg-background/80 backdrop-blur-sm` for overlay, content `rounded-lg border bg-background p-6 shadow-lg`. `X` icon for close.
*   **`dropdown-menu.tsx`**: (Radix UI based) A list of options that appears when a user interacts with a trigger.
    *   **Parts:** Many, including `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuSub`.
    *   **Styling:** Content `rounded-md border bg-popover p-1 shadow-md`, items `rounded-sm px-2 py-1.5 text-sm gap-2`.
*   **`dropdown.tsx`**: A custom dropdown component (not Radix UI based).
    *   **Parts:** `Dropdown` (wrapper), `DropdownTrigger` (uses `Button` component).
    *   **Functionality:** Manages its own open/close state. Items are buttons.
*   **`form.tsx`**: (react-hook-form and Radix UI based) Provides structure and accessibility for forms.
    *   **Parts:** `Form` (FormProvider), `FormField` (Controller), `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`.
    *   **Styling:** `FormLabel` is `text-destructive` on error. `FormMessage` is `text-sm font-medium text-destructive`.
*   **`glossary-drawer.tsx`**: A drawer/sheet component for displaying and managing glossary terms. Uses `Sheet` component.
    *   **Functionality:** Includes search, edit, add, delete terms.
    *   **Styling:** Custom styling for header, content sections, uses `Input`, `Textarea`, `Button`.
*   **`hover-card.tsx`**: (Radix UI based) A pop-up that appears on hover.
    *   **Parts:** `HoverCard`, `HoverCardTrigger`, `HoverCardContent`.
    *   **Styling:** Content `rounded-md border bg-popover p-4 shadow-md w-64`.
*   **`icons.tsx`**: A collection of SVG icons. Exports an `Icons` object with lowercase keys (e.g., `Icons.spinner`).
    *   **Icons:** `separator`, `nextChat`, `vercel`, `arrowUp`, `spinner` (`animate-spin`), `google`.
*   **`input.tsx`**: A standard text input field.
    *   **Styling:** `h-10 rounded-md border px-3 py-2 text-base md:text-sm`.
*   **`label.tsx`**: (Radix UI based) A text label, typically for form inputs.
    *   **Styling:** `text-sm font-medium leading-none`.
*   **`lockable-card.tsx`**: A card variant using `framer-motion` for animations, can be visually "locked" or prepared for removal.
    *   **Props:** `title`, `description`, `onRemove`, `index`.
    *   **Functionality:** Toggle lock state; unlock allows removal. Uses `Lock` and `Unlock` icons.
*   **`navigation-menu.tsx`**: (Radix UI based) A menu for site navigation.
    *   **Parts:** `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger` (with `ChevronDown`), `NavigationMenuContent`, `NavigationMenuLink`, `NavigationMenuViewport`, `NavigationMenuIndicator`.
    *   **Styling:** Uses `cva` for trigger style. Content has animation classes.
*   **`popover.tsx`**: (Radix UI based) A floating element that appears near a trigger.
    *   **Parts:** `Popover`, `PopoverTrigger`, `PopoverContent`.
    *   **Styling:** Content `rounded-md border bg-popover p-4 shadow-md w-72`.
*   **`progress-bar.tsx`**: A visual indicator of progress for a task, typically page loading.
    *   **Functionality:** Responds to Next.js route changes (`usePathname`, `useSearchParams`).
    *   **Styling:** Fixed position, configurable color (default `#A87C39`), height, duration.
*   **`radio-group.tsx`**: (Radix UI based) A set of radio buttons.
    *   **Parts:** `RadioGroup`, `RadioGroupItem` (with `Circle` icon).
    *   **Styling:** Item `rounded-full border border-primary`.
*   **`select.tsx`**: (Radix UI based) A dropdown list for selecting one option from many.
    *   **Parts:** `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger` (with `ChevronDown`), `SelectContent`, `SelectItem` (with `Check` indicator), `SelectLabel`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`.
    *   **Styling:** Trigger `h-10 rounded-md border px-3 py-2`, content `rounded-md border bg-popover shadow-md`.
*   **`separator.tsx`**: (Radix UI based) A visual divider.
    *   **Props:** `orientation` (`horizontal` or `vertical`).
    *   **Styling:** `bg-border`. Horizontal `h-[1px] w-full`, vertical `h-full w-[1px]`.
*   **`settings-sidebar-nav.tsx`**: A specialized navigation component for settings pages.
    *   **Functionality:** Uses Next.js `Link` and `usePathname`. Items are links styled like buttons.
    *   **Styling:** Uses `buttonVariants({ variant: "ghost" })`. Active state `bg-muted`.
*   **`sheet.tsx`**: (Radix UI based Dialog) A side panel that slides in.
    *   **Parts:** `Sheet`, `SheetTrigger`, `SheetClose`, `SheetPortal`, `SheetOverlay`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`.
    *   **Variants (Side):** `top`, `bottom`, `left`, `right`.
    *   **Styling:** Overlay `bg-[#2A2723]/50 backdrop-blur-sm`, content `bg-background p-6 shadow-lg`. `X` icon for close.
*   **`sidebar.tsx`**: A comprehensive, themable, and configurable sidebar component.
    *   **Context:** `SidebarProvider`, `useSidebar`.
    *   **Parts:** `Sidebar`, `SidebarTrigger` (`PanelLeft` icon), `SidebarRail`, `SidebarInset`, `SidebarInput`, `SidebarHeader`, `SidebarFooter`, `SidebarSeparator`, `SidebarContent`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupAction`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubItem`, `SidebarMenuSubButton`.
    *   **Functionality:** Collapsible (offcanvas, icon), responsive (mobile via `Sheet`), keyboard shortcuts, cookie persistence for state.
    *   **Styling:** Highly customizable with CSS variables (`--sidebar-width`, etc.) and Tailwind utility classes. Uses theme colors like `bg-sidebar`, `text-sidebar-foreground`.
*   **`skeleton.tsx`**: Placeholder loading state visuals.
    *   **Styling:** `animate-pulse rounded-md bg-muted`.
*   **`slider.tsx`**: (Radix UI based) A control for selecting a value from a range.
    *   **Parts:** `Slider` (Root), `Track`, `Range`, `Thumb`.
    *   **Styling:** Track `bg-secondary`, range `bg-primary`, thumb `border-primary bg-background`.
*   **`spinner.tsx`**: An animated loading indicator (SVG based).
    *   **Styling:** `animate-spin`.
*   **`switch.tsx`**: (Radix UI based) A toggle control.
    *   **Parts:** `Switch` (Root), `Thumb`.
    *   **Styling:** `rounded-full border-2`. Checked state `bg-primary`, unchecked `bg-input`. Thumb `bg-background shadow-lg`.
*   **`table.tsx`**: Components for displaying tabular data.
    *   **Parts:** `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption`.
    *   **Styling:** `w-full caption-bottom text-sm`. Rows `border-b hover:bg-muted/50`. Header `text-muted-foreground`.
*   **`tabs.tsx`**: (Radix UI based) A component for organizing content into switchable sections.
    *   **Parts:** `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
    *   **Styling:** List `rounded-md bg-muted p-1`, trigger `rounded-sm px-3 py-1.5 text-sm font-medium`. Active trigger `bg-background text-foreground shadow-sm`.
*   **`textarea.tsx`**: A multi-line text input field.
    *   **Styling:** `min-h-[80px] rounded-md border px-3 py-2 text-sm`.
*   **`toggle.tsx`**: (Radix UI based) A button that can be toggled on or off. Uses `cva` for variants.
    *   **Variants (Style):** `default` (transparent bg), `outline` (border, transparent bg).
    *   **Variants (Size):** `default` (h-10 px-3), `sm` (h-9 px-2.5), `lg` (h-11 px-5).
    *   **Styling:** `gap-2`. On state `bg-accent text-accent-foreground`.
*   **`tooltip.tsx`**: (Radix UI based) A small pop-up that displays brief information on hover.
    *   **Parts:** `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`.
    *   **Styling:** Content `rounded-md border bg-popover px-3 py-1.5 text-sm shadow-md`.

---
This concludes the analysis of the provided UI components. The `DESIGN_SYSTEM.md` file now contains a comprehensive overview of colors, typography, spacing, and a detailed inventory of components with their descriptions and variants.I have updated the `DESIGN_SYSTEM.md` file with detailed information about each UI component, including its purpose, parts (if applicable), variants, and key styling/functional aspects. I've also expanded the Typography and Spacing sections with observations from these components.

The documentation now provides a good overview of the existing design system based on the code analysis.
