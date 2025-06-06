// src/components/auth/NavUser.tsx
"use client"

import React from 'react';
import Link from 'next/link'; // Import Link
import { useRouter } from 'next/navigation'; // Or use server action redirect
import {
    Settings, // Changed icons
    Bell,
    LogOut,
    UserCircle, // Example icon for Account/Settings
    ChevronsUpDown,
} from "lucide-react"
import type { User } from '@supabase/supabase-js'; // Import Supabase User type

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar" // Ensure path is correct
import { logoutUser } from '@/app/auth/actions'; // Import your server action
import { Button } from '@/components/ui/button'; // Import Button if needed standalone

// Helper function to get initials from email/name
function getInitials(name?: string | null, email?: string | null): string {
    if (name) {
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    if (email) {
        return email.substring(0, 2).toUpperCase();
    }
    return '??';
}

export function NavUser({ user }: { user: User | null }) { // Accept Supabase User | null
    const { isMobile } = useSidebar();
    const router = useRouter(); // Get router if needed for client-side nav

    if (!user) {
        // Optionally render a login button or nothing if user is null
        // This shouldn't happen if placed in protected layout, but good practice
        return (
             <SidebarMenu>
                 <SidebarMenuItem>
                     <Button variant="outline" className="w-full" asChild>
                         <Link href="/auth">Sign In</Link>
                     </Button>
                 </SidebarMenuItem>
             </SidebarMenu>
        );
    }

    // Extract user details with fallbacks
    const userName = user.user_metadata?.full_name || user.user_metadata?.name || 'User';
    const userEmail = user.email || 'No email';
    const userAvatar = user.user_metadata?.avatar_url || null;
    const userInitials = getInitials(userName !== 'User' ? userName : null, userEmail);

    const handleLogout = async () => {
        await logoutUser();
        // Server action should handle redirect, but router.refresh() might be needed
        // Or trigger a client-side redirect if preferred: router.push('/auth');
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground justify-start" // Ensure content aligns left
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                                <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight ml-2"> {/* Added ml-2 */}
                                <span className="truncate font-semibold">{userName}</span>
                                <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" /> {/* Adjusted styling */}
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" // Use var for width
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        {/* Optional: Repeat user info in label */}
                        <DropdownMenuLabel className="font-normal">
                         <div className="flex items-center gap-2 px-1 py-1.5">
                            <Avatar className="h-8 w-8 rounded-lg">
                                {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                                <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
                           </Avatar>
                           <div className="grid flex-1 text-left text-sm leading-tight">
                               <span className="truncate font-semibold">{userName}</span>
                               <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                           </div>
                         </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                             {/* Settings Item */}
                             <DropdownMenuItem asChild>
                                 <Link href="/dashboard/settings">
                                     <Settings className="mr-2 h-4 w-4" />
                                     <span>Settings</span>
                                 </Link>
                             </DropdownMenuItem>
                             {/* Notifications Item (Example) */}
                             <DropdownMenuItem disabled>
                                 <Bell className="mr-2 h-4 w-4" />
                                 <span>Notifications</span>
                             </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        {/* Logout Item */}
                        <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}