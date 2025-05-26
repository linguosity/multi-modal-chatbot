# Dashboard Widgets & Data Points Design

This document outlines the proposed widgets, data requirements, and dynamic linking strategy for the main dashboard page (`src/app/dashboard/page.tsx`) to make it more informative and user-centric.

## 1. Proposed Widgets

The following widgets are proposed to provide users with an overview of their data and quick access to common actions:

### a. Quick Actions
*   **Description:** A prominent section with buttons for the most common actions a user might take.
*   **Content:**
    *   Button: "Create New Report"
    *   Button: "Create New Word List"
    *   Button: "Create New Story"
*   **Placement:** Likely at the top of the dashboard or in a sticky sidebar section for easy access.

### b. Recent Reports
*   **Description:** Displays a list of the user's most recently accessed or created reports.
*   **Content:**
    *   Shows the last 3-5 reports.
    *   Each item should display the report title (or an excerpt/ID if no title) and the date it was last modified or created.
    *   Each item should link directly to the respective report page (e.g., `/dashboard/[userId]/reports/[reportId]`).
*   **Empty State:** A message like "No reports created yet. Get started by creating a new report!" with a link to the "Create New Report" action.

### c. Recent Word Lists
*   **Description:** Displays a list of the user's most recently accessed or created word lists.
*   **Content:**
    *   Shows the last 3-5 word lists.
    *   Each item should display the list name and perhaps the number of words in it.
    *   Each item should link directly to the respective word list editing/viewing page (e.g., `/dashboard/[userId]/settings/lists/[listId]` or a dedicated view page if available).
*   **Empty State:** A message like "You haven't created any word lists yet. Create one now!" with a link to the "Create New Word List" action.

### d. Recent Stories
*   **Description:** Displays a list of the user's most recently accessed or created stories.
*   **Content:**
    *   Shows the last 3-5 stories.
    *   Each item should display the story title (or an excerpt/ID) and the date it was last modified or created.
    *   Each item should link directly to the respective story page (e.g., `/dashboard/[userId]/stories/[storyId]`).
*   **Empty State:** A message like "No stories found. Let's create your first story!" with a link to the "Create New Story" action.

### e. Usage Statistics Overview (Simple)
*   **Description:** Provides a simple overview of the user's activity.
*   **Content:**
    *   "Total Reports Created: [Number]"
    *   "Total Word Lists: [Number]"
    *   "Total Stories Written: [Number]"
*   **Placement:** Could be a smaller, less prominent widget or integrated into a user profile summary section.

### f. Getting Started Guide (For New Users)
*   **Description:** A dismissible widget aimed at new users to guide them through the initial steps.
*   **Content:**
    *   Brief welcome message.
    *   Link to "Create your first Word List".
    *   Link to "Generate your first Report".
    *   Link to "Write your first Story".
    *   Link to "Explore Settings".
    *   A "Dismiss" button to hide the widget (this preference could be saved in user settings or local storage).
*   **Visibility:** Only shown if the user is new (e.g., based on creation date or lack of activity) or if they haven't dismissed it.

## 2. Data Requirements for Each Widget

### a. Quick Actions
*   **Data Requirements:** None directly. Links will be static paths (but dynamically include `userId`).
*   **API Endpoints:** Not applicable for data fetching.

### b. Recent Reports
*   **Data Requirements:**
    *   List of 3-5 report objects, each containing:
        *   `reportId` (for link)
        *   `title` (or identifier)
        *   `lastModifiedAt` or `createdAt` (for display and sorting)
        *   `userId` (for link construction, though the endpoint would be user-specific)
*   **API Endpoints:**
    *   **Existing (Potentially):** `GET /api/users/{userId}/reports?sortBy=lastModifiedAt&order=desc&limit=5` (or similar, if list endpoints support sorting, ordering, and pagination/limiting).
    *   **New (Recommended):** `GET /api/me/recent-items?type=report&limit=5`
        *   This generic endpoint could be designed to fetch recent items for various types, simplifying client-side logic.
        *   The `/api/me/` prefix implies it acts on behalf of the authenticated user.

### c. Recent Word Lists
*   **Data Requirements:**
    *   List of 3-5 word list objects, each containing:
        *   `listId` (for link)
        *   `name`
        *   `wordCount` (optional, but useful)
        *   `lastModifiedAt` or `createdAt`
        *   `userId`
*   **API Endpoints:**
    *   **Existing (Potentially):** `GET /api/users/{userId}/lists?sortBy=lastModifiedAt&order=desc&limit=5` (if lists are managed via a generic list API). Or, if lists are part of settings, it might be a more specific endpoint. The current `src/app/api/lists/generate/route.ts` seems for generation, not listing. A dedicated CRUD API for lists might be needed.
    *   **New (Recommended if no suitable listing endpoint):** `GET /api/me/recent-items?type=wordlist&limit=5` (using the generic endpoint idea) or `GET /api/me/word-lists?sortBy=lastModifiedAt&order=desc&limit=5`.

### d. Recent Stories
*   **Data Requirements:**
    *   List of 3-5 story objects, each containing:
        *   `storyId` (for link)
        *   `title` (or identifier)
        *   `lastModifiedAt` or `createdAt`
        *   `userId`
*   **API Endpoints:**
    *   **Existing (Potentially):** `GET /api/stories/get` (if it supports `userId` filter, sorting, and limit) or a user-specific version like `GET /api/users/{userId}/stories?sortBy=lastModifiedAt&order=desc&limit=5`.
    *   **New (Recommended if existing is not suitable):** `GET /api/me/recent-items?type=story&limit=5`.

### e. Usage Statistics Overview
*   **Data Requirements:**
    *   Count of reports for the user.
    *   Count of word lists for the user.
    *   Count of stories for the user.
*   **API Endpoints:**
    *   **New (Recommended):** `GET /api/me/statistics`
        *   Response: `{ "reportsCount": X, "wordListsCount": Y, "storiesCount": Z }`
    *   **Alternative:** Could be derived from multiple `count` queries on existing list endpoints if they support returning total counts, but a dedicated statistics endpoint is cleaner.

### f. Getting Started Guide
*   **Data Requirements:**
    *   User's "newness" status (e.g., account creation date, flag if they've dismissed this guide, or counts from "Usage Statistics Overview" being zero).
*   **API Endpoints:**
    *   User profile data (e.g., from `GET /api/me/profile` which might include `createdAt` or a `showGettingStartedGuide` boolean).
    *   An endpoint to update the "dismissed getting started guide" status: `PATCH /api/me/profile` or `POST /api/me/preferences` with body `{"dismissedGettingStarted": true}`.

## 3. Dynamic Links

*   **Confirmation:** Yes, all navigation links generated on the dashboard page and within the main layout/sidebar (e.g., items in `appSuiteItems`) **MUST** use the authenticated user's ID.
*   **Implementation:** The `userId` should be fetched upon user authentication (e.g., from the Supabase session or user object) and then used to construct links dynamically.
    *   Example: Instead of `/dashboard/hardcodedId/reports`, links should be `/dashboard/${userId}/reports`.
    *   This applies to links generated by these new dashboard widgets and existing navigation elements.

## 4. Personalization Ideas (Future Consideration)

*   **Show/Hide Widgets:** Allow users to choose which widgets are visible on their dashboard.
*   **Reorder Widgets:** Enable drag-and-drop functionality for users to arrange widgets according to their preference.
*   **Configurable Widget Settings:** Some widgets might have settings (e.g., number of items to show in "Recent Reports").
*   **Widget Marketplace/Selection:** For advanced scenarios, allow users to add new types of widgets from a predefined list.
*   **Theme/Appearance Customization:** Beyond light/dark mode, allow minor appearance tweaks.

This design provides a solid foundation for an improved dashboard experience. Implementation should prioritize fetching data efficiently and ensuring all links are dynamic and user-specific.I have drafted the `DASHBOARD_WIDGETS_DESIGN.md` document.

It includes:
1.  **Proposed Widgets:**
    *   Quick Actions (buttons for New Report, New List, New Story)
    *   Recent Reports (list of last 3-5 reports with links)
    *   Recent Word Lists (list of last 3-5 word lists with links)
    *   Recent Stories (list of last 3-5 stories with links)
    *   Usage Statistics Overview (simple counts of reports, lists, stories)
    *   Getting Started Guide (for new users, dismissible)
2.  **Data Requirements for Each Widget:**
    *   Detailed the specific data fields needed for each widget.
    *   For API endpoints, I've suggested leveraging existing list endpoints if they support sorting/limiting, or proposed new, more specific endpoints like `GET /api/me/recent-items?type=report&limit=5` for recent items and `GET /api/me/statistics` for counts. I also noted the need for an endpoint to manage user preferences (like dismissing the "Getting Started" guide).
3.  **Dynamic Links:**
    *   Confirmed that all navigation links on the dashboard and in the main layout must use the authenticated user's ID dynamically.
4.  **Personalization Ideas (Future Consideration):**
    *   Listed ideas such as showing/hiding widgets, reordering widgets, configurable widget settings, and a widget marketplace.

The design focuses on enhancing user experience by providing relevant information and quick access to functionalities, while also considering API design for data retrieval.
The document is now ready.
