'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function Reports() {
  // Placeholder states for reports data
  const [reports, setReports] = useState([
    { id: 1, title: "Annual Evaluation - Alex Smith", date: "2025-03-01", type: "Initial", status: "Complete" },
    { id: 2, title: "Triennial - Jordan Taylor", date: "2025-02-28", type: "Triennial", status: "Complete" },
    { id: 3, title: "Progress Report - Casey Jones", date: "2025-02-15", type: "Progress", status: "Complete" },
    { id: 4, title: "Initial Assessment - Robin Garcia", date: "2025-01-20", type: "Initial", status: "Draft" },
    { id: 5, title: "Language Evaluation - Sam Johnson", date: "2025-01-10", type: "Annual", status: "Complete" },
    { id: 6, title: "Articulation Assessment - Taylor Kim", date: "2024-12-05", type: "Initial", status: "Complete" },
  ]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  
  // Filter reports based on search term and type
  const filteredReports = reports.filter(report => {
    const matchesTerm = report.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || report.type === filterType;
    return matchesTerm && matchesType;
  });
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Link href="/reports/new">
          <Button>New Report</Button>
        </Link>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filterType === "All" ? "default" : "outline"}
                onClick={() => setFilterType("All")}
              >
                All
              </Button>
              <Button 
                variant={filterType === "Initial" ? "default" : "outline"}
                onClick={() => setFilterType("Initial")}
              >
                Initial
              </Button>
              <Button 
                variant={filterType === "Annual" ? "default" : "outline"}
                onClick={() => setFilterType("Annual")}
              >
                Annual
              </Button>
              <Button 
                variant={filterType === "Triennial" ? "default" : "outline"}
                onClick={() => setFilterType("Triennial")}
              >
                Triennial
              </Button>
              <Button 
                variant={filterType === "Progress" ? "default" : "outline"}
                onClick={() => setFilterType("Progress")}
              >
                Progress
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4">
        {filteredReports.length > 0 ? (
          filteredReports.map(report => (
            <Link key={report.id} href={`/reports/${report.id}`}>
              <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-medium text-lg">{report.title}</h2>
                    <p className="text-sm text-muted-foreground">{new Date(report.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      report.status === "Complete" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {report.type}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center p-8 border rounded-lg">
            <p className="text-lg font-medium">No reports found</p>
            <p className="text-muted-foreground">Try adjusting your filters or create a new report</p>
          </div>
        )}
      </div>
    </div>
  );
}