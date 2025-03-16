'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

export default function Eligibility() {
  const eligibilityTypes = [
    {
      id: "articulation",
      title: "Articulation Disorder",
      description: "Evaluate students with difficulty producing speech sounds correctly",
      icon: "🗣️"
    },
    {
      id: "language",
      title: "Language Disorder",
      description: "Assess receptive and expressive language skills",
      icon: "📝"
    },
    {
      id: "fluency",
      title: "Fluency Disorder",
      description: "Evaluate stuttering and other fluency-related issues",
      icon: "⏱️"
    },
    {
      id: "voice",
      title: "Voice Disorder",
      description: "Address abnormal pitch, loudness, resonance, or quality",
      icon: "🔊"
    }
  ];
  
  const [recentEligibilities, setRecentEligibilities] = useState([
    { id: 1, student: "Riley Wilson", date: "2025-02-20", type: "Articulation", result: "Eligible" },
    { id: 2, student: "Morgan Lee", date: "2025-02-10", type: "Language", result: "Not Eligible" },
    { id: 3, student: "Jamie Smith", date: "2025-01-25", type: "Fluency", result: "Eligible" },
  ]);
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Eligibility Assistant</h1>
        <Link href="/eligibility/new">
          <Button>New Eligibility Assessment</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>California Education Code</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Our eligibility tools are based on California Education Code criteria for speech and language impairments in educational settings.</p>
            <Link href="/eligibility/regulations">
              <Button variant="outline">View Regulations</Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4">
              {recentEligibilities.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <div>
                    <h3 className="font-medium">{item.student}</h3>
                    <p className="text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {item.type}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.result === "Eligible" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {item.result}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link href="/eligibility/history">
                <Button variant="link">View All Assessments</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Eligibility Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {eligibilityTypes.map(type => (
            <Link key={type.id} href={`/eligibility/${type.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{type.icon}</span>
                    <CardTitle className="text-lg">{type.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>AI Eligibility Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Our AI assistant can help you interpret assessment results and determine eligibility based on educational standards. Upload assessment data or enter findings for instant analysis.
          </p>
          <div className="flex justify-center">
            <Link href="/eligibility/analyze">
              <Button>
                Start AI Analysis
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}