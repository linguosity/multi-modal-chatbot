'use client'

import { ChevronDown, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Breadcrumb, useBreadcrumbs } from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

// Placeholder functions
const save = () => console.log('Save clicked');
const saveAndClose = () => console.log('Save & Close clicked');
const exportPdf = () => console.log('Export PDF clicked');

export default function Header() {
  const pathname = usePathname();
  const breadcrumbItems = useBreadcrumbs(pathname, {});

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between
                       bg-white/95 backdrop-blur border-b px-4 py-2">
      <Breadcrumb items={breadcrumbItems} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm">
            <Save className="mr-2 size-4" />
            Save Report
            <ChevronDown className="ml-1 size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={save}>Save</DropdownMenuItem>
          <DropdownMenuItem onClick={saveAndClose}>Save & Close</DropdownMenuItem>
          <DropdownMenuItem onClick={exportPdf}>Export PDF</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
