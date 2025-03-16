'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { IconSeparator } from '@/components/ui/icons'
import EnvCard from './cards/envcard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Menu, FileText, Home, MessageSquare, ClipboardCheck, User, LogOut, PanelLeft } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useSidebar, SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

export function Header() {
  const pathname = usePathname();
  
  // Check if we're in a path that uses the sidebar
  const hasSidebar = pathname?.startsWith('/dashboard') || 
                   pathname?.startsWith('/reports') || 
                   pathname?.startsWith('/eligibility');
                   
  // Only show sidebar trigger button on dashboard and related pages
  const sidebarTrigger = hasSidebar ? (
    <>
      {/* Mobile menu toggle - shown on mobile only */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden mr-2"
        asChild
      >
        <Link href={pathname || '/'}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle mobile menu</span>
        </Link>
      </Button>

      {/* Sidebar toggle button - hidden on mobile, shown on desktop */}
      <SidebarTrigger className="hidden md:flex mr-2" />
    </>
  ) : null;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-white">  
      <div className="flex items-center">
        {sidebarTrigger}
        
        <EnvCard />
        
        <Link href="/" rel="nofollow" className="mr-2 font-bold text-lg">
          Linguosity
        </Link>
      </div>
      
      {/* Hidden on mobile, visible on desktop */}
      <div className="hidden md:flex items-center space-x-1 mx-4">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: pathname === '/dashboard' ? 'default' : 'ghost' }),
            "font-normal"
          )}
        >
          <Home className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        
        <Link
          href="/reports"
          className={cn(
            buttonVariants({ variant: pathname?.startsWith('/reports') ? 'default' : 'ghost' }),
            "font-normal"
          )}
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>Reports</span>
        </Link>
        
        <Link
          href="/eligibility"
          className={cn(
            buttonVariants({ variant: pathname?.startsWith('/eligibility') ? 'default' : 'ghost' }),
            "font-normal"
          )}
        >
          <ClipboardCheck className="mr-2 h-4 w-4" />
          <span>Eligibility</span>
        </Link>
        
        <Link
          href="/chat"
          className={cn(
            buttonVariants({ variant: pathname?.startsWith('/chat') ? 'default' : 'ghost' }),
            "font-normal"
          )}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>AI Assistant</span>
        </Link>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Mobile menu dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 md:hidden">
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="flex items-center cursor-pointer">
                <Home className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href="/reports" className="flex items-center cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                <span>Reports</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href="/eligibility" className="flex items-center cursor-pointer">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                <span>Eligibility</span>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href="/chat" className="flex items-center cursor-pointer">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>AI Assistant</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* User avatar and dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatar.png" alt="User" />
                <AvatarFallback>SL</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">Sarah Lewis</p>
                <p className="text-sm text-muted-foreground">slewis@example.com</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/logout" className="flex items-center cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
