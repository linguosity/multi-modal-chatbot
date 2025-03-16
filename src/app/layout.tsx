import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Linguosity - Speech & Language Tools",
  description: "AI-powered speech and language report writing and assessment tools for professionals",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    // Get sidebar state from cookie
    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}