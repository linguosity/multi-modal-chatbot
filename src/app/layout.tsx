import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Source_Sans_3, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

// Main body font
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Secondary body font option
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

// Elegant heading font
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

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
            <body className={`${inter.variable} ${sourceSans.variable} ${cormorant.variable} font-sans`}>
                <SidebarProvider defaultOpen={defaultOpen}>
                    {children}
                </SidebarProvider>
            </body>
        </html>
    );
}