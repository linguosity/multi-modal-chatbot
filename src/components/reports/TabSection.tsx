'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Pencil, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabSectionProps {
  id: string;
  title: string;
  contentTab: {
    title: string;
    content: string;
  };
  synthesisTab: {
    title: string;
    content: string;
  };
  isLocked?: boolean;
  onLock?: (id: string, locked: boolean) => void;
  onSave?: (content: string) => void;
  onToggleSynthesis?: (id: string) => void;
  className?: string;
  color?: 'purple' | 'blue' | 'green' | 'amber' | 'gray';
  renderEditMode?: (props: {
    value: string;
    onChange: (value: string) => void;
  }) => React.ReactNode;
  renderViewMode?: (props: { content: string }) => React.ReactNode;
}

export function TabSection({
  id,
  title,
  contentTab,
  synthesisTab,
  isLocked = false,
  onLock,
  onSave,
  onToggleSynthesis,
  className = "",
  color = 'gray',
  renderEditMode,
  renderViewMode
}: TabSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(contentTab.content);
  const [tempContent, setTempContent] = useState(contentTab.content);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "synthesis">("content");
  const [hovered, setHovered] = useState(false);

  // Color variants
  const colorVariants = {
    purple: {
      border: "border-purple-100",
      bg: "bg-purple-50/30",
      header: "bg-purple-50",
      title: "text-purple-800"
    },
    blue: {
      border: "border-blue-100",
      bg: "bg-blue-50/30",
      header: "bg-blue-50",
      title: "text-blue-800"
    },
    green: {
      border: "border-green-100",
      bg: "bg-green-50/30",
      header: "bg-green-50",
      title: "text-green-800"
    },
    amber: {
      border: "border-amber-100",
      bg: "bg-amber-50/30",
      header: "bg-amber-50",
      title: "text-amber-800"
    },
    gray: {
      border: "border-gray-100",
      bg: "bg-gray-50/30",
      header: "bg-gray-50",
      title: "text-gray-800"
    }
  };

  const variant = colorVariants[color];

  const handleChange = (value: string) => {
    setTempContent(value);
    setHasChanges(value !== content);
  };

  const handleSave = () => {
    setContent(tempContent);
    if (onSave) {
      onSave(tempContent);
    }
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setTempContent(content);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleEdit = () => {
    if (!isLocked) {
      setIsEditing(true);
    }
  };

  const handleLock = () => {
    if (onLock) {
      onLock(id, !isLocked);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "content" | "synthesis");
    
    // If switching to synthesis tab and onToggleSynthesis exists, call it
    if (value === "synthesis" && onToggleSynthesis) {
      onToggleSynthesis(id);
    }
  };

  return (
    <div className="w-full mb-6">
      <Card
        className={cn(
          "border shadow-sm transition-all",
          variant.border,
          variant.bg,
          isLocked ? "opacity-90" : "",
          isEditing ? "border-2 border-blue-400 shadow-md" : "",
          className
        )}
      >
        <CardHeader className={cn("py-2 px-3 flex flex-row items-center justify-between", variant.header)}>
          <CardTitle className={cn("text-sm font-medium", variant.title)}>{title}</CardTitle>
          <div
            className={cn("flex items-center gap-1 transition-opacity", 
              (hovered || isEditing) ? "opacity-100" : "opacity-0")}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            {!isEditing && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleEdit}
                title="Edit content"
                disabled={isLocked}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            {onLock && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleLock}
                title={isLocked ? "Unlock section" : "Lock section"}
              >
                {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 text-xs">
          {isEditing ? (
            <div className="editing-interface pb-4">
              {renderEditMode ? (
                renderEditMode({
                  value: tempContent,
                  onChange: handleChange,
                })
              ) : (
                <textarea
                  className="w-full min-h-[150px] p-3 border rounded focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  value={tempContent}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder="Enter content here..."
                />
              )}
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleSave} disabled={!hasChanges}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <Tabs
              defaultValue="content"
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">{contentTab.title}</TabsTrigger>
                <TabsTrigger value="synthesis">{synthesisTab.title}</TabsTrigger>
              </TabsList>
              <TabsContent value="content">
                <div className="mt-4">
                  {renderViewMode ? (
                    renderViewMode({ content })
                  ) : content ? (
                    <div className="whitespace-pre-wrap">{content}</div>
                  ) : (
                    <div className="text-gray-400 italic">No content yet. Click edit to add content.</div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="synthesis">
                <div className="mt-4 prose prose-sm">
                  {synthesisTab.content ? (
                    <div className="whitespace-pre-wrap">{synthesisTab.content}</div>
                  ) : (
                    <div className="text-gray-400 italic">No synthesis available yet. We're working on generating one.</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TabSection;