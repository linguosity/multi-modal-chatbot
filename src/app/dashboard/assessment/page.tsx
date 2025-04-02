'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AppSidebar,
} from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useState, useEffect } from "react";
import { AssessmentDropdown } from "@/components/assessment/assessment-dropdown";
import { AssessmentCard } from "@/components/assessment/assessment-card";
import { AssessmentResults } from "@/components/assessment/assessment-results";
import { PlusCircle } from "lucide-react";

export default function AssessmentDashboard() {
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [assessmentTools, setAssessmentTools] = useState<string[]>([]);
  
  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleSelectTool = (toolId: string) => {
    setSelectedTool(toolId);
  };
  
  const handleAddToReport = () => {
    if (selectedTool && !assessmentTools.includes(selectedTool)) {
      setAssessmentTools([...assessmentTools, selectedTool]);
      setSelectedTool(null);
    }
  };
  
  const handleSaveResults = (results: any) => {
    console.log('Saving results:', results);
    // Here you would typically save the results to your state or backend
  };
  
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <div className="p-4 md:p-6">
          {/* Header with breadcrumbs */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 -mx-6 -mt-6 mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Assessment Tools & Results</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          
          {/* Assessment Tool Selection */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Assessment Tool Selection</h2>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Select Assessment Tool</CardTitle>
                <CardDescription>
                  Choose from standardized assessment tools to record results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 flex-col md:flex-row">
                  <div className="flex-1">
                    {loading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <AssessmentDropdown onSelect={handleSelectTool} />
                    )}
                  </div>
                  <Button 
                    onClick={handleAddToReport} 
                    disabled={!selectedTool || assessmentTools.includes(selectedTool)}
                    className="shrink-0"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add to Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Selected Assessment Info */}
          {selectedTool && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Assessment Information</h2>
              <AssessmentCard toolId={selectedTool} />
            </div>
          )}
          
          {/* Added Assessment Tools */}
          {assessmentTools.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Assessment Tools in Report</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {assessmentTools.map((toolId) => (
                  <div key={toolId}>
                    <AssessmentCard toolId={toolId} />
                    <div className="mt-4">
                      <AssessmentResults 
                        toolId={toolId} 
                        onSave={handleSaveResults} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Empty State */}
          {!loading && assessmentTools.length === 0 && !selectedTool && (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No Assessment Tools Added</h3>
              <p className="text-muted-foreground mb-4">
                Select an assessment tool from the dropdown above to add it to your report.
              </p>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}