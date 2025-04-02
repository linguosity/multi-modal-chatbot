import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  AppSidebar,
} from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function Loading() {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <div className="p-4 md:p-6">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 -mx-6 -mt-6 mb-6">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex-1">
              <Skeleton className="h-5 w-1/3" />
            </div>
            <div className="flex space-x-4">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-36 rounded-md" />
            </div>
          </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Array(3).fill(null).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card text-card-foreground shadow p-6">
            <div className="flex flex-col space-y-1.5 pb-6">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-col space-y-1.5 pb-6">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array(2).fill(null).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card text-card-foreground shadow p-6">
            <div className="flex flex-col space-y-1.5 pb-6">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="space-y-4">
              {Array(3).fill(null).map((_, j) => (
                <div key={j} className="p-3 bg-muted/30 rounded-lg">
                  <Skeleton className="h-5 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}