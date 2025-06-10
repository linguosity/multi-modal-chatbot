// src/components/ui/settings-sidebar-nav.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button" // Use button variants for styling

interface SettingsSidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
  }[]
}

export function SettingsSidebarNav({ className, items, ...props }: SettingsSidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }), // Apply button styling
            pathname === item.href
              ? "bg-muted hover:bg-muted" // Active state
              : "hover:bg-transparent hover:underline", // Inactive state
            "justify-start" // Align text left
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}