# Role-Based Access Control (RBAC) Design

This document outlines the Role-Based Access Control (RBAC) model for the application, including role definitions, Supabase database schema changes, and data access strategies.

## 1. Role Definitions

Initially, two primary roles are defined. The system is designed to allow for more granular roles in the future if needed.

### a. `user`
*   **Description:** The default role for any registered user.
*   **Permissions & Access Levels:**
    *   **Stories:** Create, read, update, and delete their own stories. Cannot access or modify stories created by other users unless explicitly shared (future feature).
    *   **Lists:** Create, read, update, and delete their own lists.
    *   **Reports:** Generate and view reports based on their own data.
    *   **Profile:** Read and update their own profile information (e.g., email, password, associated profile data like name).
    *   **Settings:** Manage their own account settings (e.g., notification preferences).
    *   **General Access:** Access general application features and public content.

### b. `admin`
*   **Description:** A privileged role for application administrators.
*   **Permissions & Access Levels:**
    *   **All `user` permissions.**
    *   **User Management:** View all users. Potentially suspend or modify user roles (with caution and proper audit trails).
    *   **Content Management (Global):** Access, review, and potentially manage (e.g., delete for policy violations) any content created by any user (stories, lists, reports). This should be used judiciously.
    *   **Application Settings:** Manage global application settings (if any).
    *   **Analytics/Monitoring:** Access to application-wide analytics or monitoring dashboards (if implemented).
    *   **System Maintenance:** Access to features related to system health or maintenance.

### Potential Future Roles (Considerations)
As the application evolves, more granular roles might be beneficial:
*   **`editor` / `content_moderator`:** If there's a need for users who can review and edit content submitted by others without full admin privileges.
*   **`viewer` (for shared content):** If a sharing mechanism is implemented, this role could define read-only access to specific shared items.

## 2. Database Schema Changes

To manage user roles and other profile-specific data, a new table `profiles` will be created. This table will have a one-to-one relationship with the Supabase `auth.users` table.

### a. `profiles` Table
This table will store the user's assigned role and can be extended to hold other public user profile information.

*   **Table Name:** `profiles`
*   **Columns:**
    *   `id` (UUID, Primary Key): This **MUST** be the same as the `id` from the `auth.users` table. This creates the one-to-one link.
    *   `role` (TEXT, Not Null, Default: `'user'`): Stores the user's role (e.g., 'user', 'admin'). A `CHECK` constraint or a foreign key to a `roles` table (see section 2.c) can be used to ensure valid roles.
    *   `full_name` (TEXT, Nullable): User's full name.
    *   `avatar_url` (TEXT, Nullable): URL to the user's avatar image.
    *   `created_at` (TIMESTAMPTZ, Not Null, Default: `now()`): Timestamp of when the profile was created.
    *   `updated_at` (TIMESTAMPTZ, Not Null, Default: `now()`): Timestamp of when the profile was last updated.

*   **Foreign Key:**
    *   `profiles.id` references `auth.users.id` (with `ON DELETE CASCADE` to ensure profile is deleted if the auth user is deleted).

*   **RLS (Row Level Security):** This table **MUST** have RLS enabled.
    *   Users should only be able to read their own profile (unless they are an admin).
    *   Users should only be able to update their own profile (specific fields like `full_name`, `avatar_url`). Role changes should be restricted.

### b. Trigger for `updated_at`
A standard database trigger should be set up to automatically update the `updated_at` column whenever a row in the `profiles` table is modified.

```sql
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();
```

### c. Alternative: Separate `roles` and `user_roles` Tables (Many-to-Many)
For systems requiring users to have multiple roles simultaneously, or for more complex role management, a many-to-many relationship is better:

1.  **`roles` Table:**
    *   `id` (SERIAL, Primary Key) or `role_name` (TEXT, Primary Key)
    *   `name` (TEXT, Unique, Not Null): e.g., 'user', 'admin', 'editor'.
    *   `description` (TEXT, Nullable).
2.  **`user_roles` Table (Junction Table):**
    *   `user_id` (UUID, Primary Key, Foreign Key to `auth.users.id`).
    *   `role_id` (INTEGER or TEXT, Primary Key, Foreign Key to `roles.id` or `roles.role_name`).
    *   `assigned_at` (TIMESTAMPTZ, Default: `now()`).

**Decision:** For the current scope, the single `role` column in the `profiles` table is simpler to implement and manage. If multiple roles per user become a requirement, migrating to the many-to-many structure would be the next step. For now, we will proceed with the `profiles` table having a single `role` column.

## 3. Data Access Strategy

### a. Checking Roles in API Routes
1.  **JWT Custom Claims:** When a user authenticates, their role from the `profiles` table can be added as a custom claim to the JWT. This makes the role readily available in API routes without an extra database query. Supabase Functions (e.g., a trigger on `auth.users` insert, or a custom authentication hook) can be used to achieve this.
2.  **Database Query:** If the role is not in the JWT or needs re-verification, API routes can query the `profiles` table using the authenticated `user.id` to fetch the role.

**Example (Conceptual API Route Logic):**
```typescript
// import { getUserRoleFromToken } from './authUtils'; // or query DB
// import { User } from '@supabase/supabase-js';

async function handleSomeAdminAction(user: User) {
  // const role = await getUserRoleFromToken(user); // Or query DB: SELECT role FROM profiles WHERE id = user.id
  // For this example, assume role is fetched and available
  const userRole = user.app_metadata?.role || 'user'; // Example if role is in JWT app_metadata

  if (userRole !== 'admin') {
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
  }
  // Proceed with admin action
}
```

### b. Supabase Row Level Security (RLS)
RLS is critical for enforcing data access rules directly at the database level, providing a strong security foundation. RLS policies should be used in conjunction with application-level role checks.

*   **Enable RLS:** RLS **MUST** be enabled on all tables containing user-specific or sensitive data (e.g., `stories`, `lists`, `reports`, `profiles`).

*   **Policy Principle:** Policies should generally restrict access by default and then selectively grant permissions based on user ID and role.

*   **Example RLS Policy (for a `stories` table):**

    *   **Allow users to read their own stories:**
        ```sql
        CREATE POLICY "Allow individual read access to own stories"
        ON stories
        FOR SELECT
        USING (auth.uid() = user_id);
        ```

    *   **Allow users to create stories for themselves:**
        ```sql
        CREATE POLICY "Allow individual insert access to stories"
        ON stories
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
        ```

    *   **Allow users to update/delete their own stories:**
        ```sql
        CREATE POLICY "Allow individual update access to own stories"
        ON stories
        FOR UPDATE
        USING (auth.uid() = user_id);

        CREATE POLICY "Allow individual delete access to own stories"
        ON stories
        FOR DELETE
        USING (auth.uid() = user_id);
        ```

    *   **Allow admins to access all stories:**
        To implement this, we need a helper function in SQL to get the current user's role from the `profiles` table.

        ```sql
        -- Helper function to get user role (ensure this function is secure and efficient)
        CREATE OR REPLACE FUNCTION get_user_role(user_id_to_check uuid)
        RETURNS TEXT AS $$
        DECLARE
          user_role_value TEXT;
        BEGIN
          SELECT role INTO user_role_value FROM public.profiles WHERE id = user_id_to_check;
          RETURN user_role_value;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Policy for admin access (example for SELECT)
        CREATE POLICY "Allow admin full read access to stories"
        ON stories
        FOR SELECT
        USING (get_user_role(auth.uid()) = 'admin');
        ```
        *(Note: `SECURITY DEFINER` functions should be used with extreme caution and reviewed for security vulnerabilities. Alternatively, the role could be passed as a custom session variable if set up securely during authentication.)*

## 4. User Profile Data

As defined in section 2.a, the `profiles` table is designed to store additional user-specific public data beyond just the role. This is a common and recommended pattern with Supabase.

*   **Fields like `full_name` and `avatar_url` are included.**
*   Other preferences or non-sensitive public information can be added to this table as needed (e.g., `bio`, `website_url`, `theme_preference`).
*   Sensitive settings or data that requires more granular control should be stored in separate tables with appropriate RLS policies.

This RBAC design provides a starting point that can be expanded as the application's requirements grow. Prioritize implementing RLS policies for all relevant tables.I have created the `RBAC_DESIGN.md` document.

It includes:
1.  **Role Definitions:**
    *   Defined `user` and `admin` roles with their respective permissions.
    *   Briefly mentioned potential future roles like `editor` or `viewer`.
2.  **Database Schema Changes:**
    *   Proposed a `profiles` table linked one-to-one with `auth.users` via the user's ID.
    *   Specified columns for `profiles`: `id` (matches `auth.users.id`), `role` (TEXT, default 'user'), `full_name` (TEXT), `avatar_url` (TEXT), `created_at`, `updated_at`.
    *   Included a foreign key constraint and a trigger for `updated_at`.
    *   Discussed the alternative of a many-to-many role system (`roles` and `user_roles` tables) but recommended the single role in `profiles` for initial simplicity.
3.  **Data Access Strategy:**
    *   Described checking roles in API routes via JWT custom claims (preferred) or direct database query.
    *   Strongly recommended using Supabase Row Level Security (RLS) and provided conceptual examples for a `stories` table, including policies for individual access and admin access (with a helper SQL function `get_user_role`).
4.  **User Profile Data:**
    *   Confirmed that the `profiles` table is intended to store other user-specific data like `full_name` and `avatar_url`, and can be extended for other public profile information.

The design emphasizes integration with Supabase authentication and leveraging RLS for security.
The document is now ready for review.
