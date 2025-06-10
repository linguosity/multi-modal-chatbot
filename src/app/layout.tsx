console.log('[LAYOUT] Root layout - Starting to load');

import type { Metadata } from "next";
// import { Inter, Source_Sans_3, Cormorant_Garamond } from "next/font/google";
console.log('[LAYOUT] Root layout - About to import globals.css');
import "./globals.css";
console.log('[LAYOUT] Root layout - globals.css imported');
import { SidebarProvider } from "@/components/ui/sidebar";
import { ProgressProvider } from "./progress-provider";
import { LoadingBar } from "./loading-bar";
import { Providers } from "./providers";

// Temporarily disable fonts to debug
// const inter = Inter({ 
//   subsets: ["latin"],
//   variable: "--font-inter",
//   display: "swap",
// });

// const sourceSans = Source_Sans_3({
//   subsets: ["latin"],
//   variable: "--font-source-sans",
//   display: "swap",
// });

// const cormorant = Cormorant_Garamond({
//   subsets: ["latin"],
//   variable: "--font-cormorant",
//   display: "swap",
//   weight: ["300", "400", "500", "600", "700"],
// });

export const metadata: Metadata = {
  title: "Linguosity - Speech & Language Tools",
  description: "AI-powered speech and language report writing and assessment tools for professionals",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    console.log('[LAYOUT] Root layout - Rendering function called');
    const defaultOpen = false; // For sidebar
    
    return (
        <html lang="en">
            <body>
                <SidebarProvider defaultOpen={defaultOpen}>
                    <ProgressProvider>
                        <LoadingBar />
                        <Providers>
                            {children}
                        </Providers>
                    </ProgressProvider>
                </SidebarProvider>
            </body>
        </html>
    );
}