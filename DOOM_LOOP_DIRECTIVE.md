
## Error Loop: HTML Nesting & Hydration Mismatch

**Error:** `Error: In HTML, <html> cannot be a child of <body>.` and similar messages like `<body> cannot contain a nested <html>.`

**Context:** This error occurred due to invalid HTML structure, specifically when `<html>` and `<body>` tags were rendered multiple times within the React component tree, leading to hydration failures in Next.js App Router.

**Root Cause:** In Next.js App Router, the `RootLayout` (typically `src/app/layout.tsx`) is the *only* place where `<html>` and `<body>` tags should be defined. Any nested layouts (e.g., `src/app/auth/layout.tsx`, `src/app/dashboard/layout.tsx`) must *not* re-render these tags. They should only render their `children` within a `div` or a React Fragment (`<>...</>`).

**Solution:** Removed the duplicate `<html>` and `<body>` tags from `src/app/auth/layout.tsx`, ensuring it only renders its children within a React Fragment.

**Tips for Future Prevention:**
*   **Single Source of Truth for HTML/BODY:** Always remember that `src/app/layout.tsx` is the canonical place for `<html>` and `<body>` tags in the App Router.
*   **Nested Layouts:** Nested layouts should *never* include `<html>` or `<body>` tags. They should only wrap their `children` in semantic HTML elements or React Fragments.
*   **Hydration Errors:** When encountering hydration errors, always check for mismatches between server-rendered HTML and client-side React rendering, especially focusing on invalid HTML nesting.
