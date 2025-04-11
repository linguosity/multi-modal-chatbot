// src/app/dashboard/settings/layout.tsx
import { Separator } from "@/components/ui/separator";
import { SettingsSidebarNav } from "@/components/ui/settings-sidebar-nav"; // We will create this component next

export const metadata = {
    title: "Settings - Linguosity",
    description: "Manage your account and preferences.",
};

// Define the navigation items for the settings sidebar
const sidebarNavItems = [
    {
        title: "Profile",
        href: "/dashboard/settings", // Root of settings often shows Profile
    },
    {
        title: "Account",
        href: "/dashboard/settings/account",
    },
    {
        title: "Notifications",
        href: "/dashboard/settings/notifications",
    },
    {
        title: "Reports",
        href: "/dashboard/settings/reports",
    },
    {
        title: "Lists",
        href: "/dashboard/settings/lists",
    },
    {
        title: "Stories",
        href: "/dashboard/settings/stories",
    },
];

interface SettingsLayoutProps {
    children: React.ReactNode;
}

// This layout wraps all pages under /dashboard/settings/*
export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        // Main container with padding
        <div className="space-y-6 p-6 md:p-10 pb-16">
            {/* Header */}
            <div className="space-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Settings
                </h1>
                <p className="text-muted-foreground">
                    Manage your account settings, profile, and preferences.
                </p>
            </div>

            <Separator className="my-6" />

            {/* Flex container for sidebar + content */}
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                {/* Settings Sidebar Navigation */}
                <aside className="-mx-4 lg:w-1/5">
                    <SettingsSidebarNav items={sidebarNavItems} />
                </aside>

                {/* Main Content Area (renders the specific page.tsx) */}
                <div className="flex-1 lg:max-w-2xl">
                    {children} {/* Child page content goes here */}
                </div>
            </div>
        </div>
    );
}