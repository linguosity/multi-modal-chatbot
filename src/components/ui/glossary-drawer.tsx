"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { BookText, X, Edit, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Interface for glossary terms
interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

interface GlossaryDrawerProps {
  className?: string;
  initialTerms?: GlossaryTerm[];
  onSave?: (terms: GlossaryTerm[]) => void;
}

const GlossaryDrawer: React.FC<GlossaryDrawerProps> = ({
  className,
  initialTerms = [
    {
      id: "1",
      term: "Articulation",
      definition: "The physical production of speech sounds."
    },
    {
      id: "2",
      term: "Phonology",
      definition: "The study of how sounds are organized and used in natural languages."
    },
    {
      id: "3",
      term: "Receptive Language",
      definition: "The ability to understand words and language, including listening and reading."
    },
    {
      id: "4",
      term: "Expressive Language",
      definition: "The ability to put thoughts into words and sentences in a way that makes sense and is grammatically accurate."
    },
    {
      id: "5",
      term: "Pragmatic Language",
      definition: "Social language skills that we use in our daily interactions with others, including what we say, how we say it, and our body language."
    }
  ],
  onSave
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [terms, setTerms] = useState<GlossaryTerm[]>(initialTerms);
  const [editableTerms, setEditableTerms] = useState<GlossaryTerm[]>(initialTerms);
  const [newTerm, setNewTerm] = useState({ term: "", definition: "" });
  const [searchQuery, setSearchQuery] = useState("");

  // Filter terms based on search query
  const filteredTerms = terms.filter(
    term => 
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) || 
      term.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Enter edit mode
  const handleEdit = () => {
    setEditableTerms([...terms]);
    setIsEditing(true);
  };

  // Save changes
  const handleSave = () => {
    // Filter out terms with empty values
    const validTerms = editableTerms.filter(term => term.term.trim() !== "" && term.definition.trim() !== "");
    setTerms(validTerms);
    setIsEditing(false);
    
    // If there's a save callback, call it
    if (onSave) {
      onSave(validTerms);
    }
  };

  // Update a term
  const handleTermChange = (id: string, field: 'term' | 'definition', value: string) => {
    setEditableTerms(
      editableTerms.map(term => 
        term.id === id ? { ...term, [field]: value } : term
      )
    );
  };

  // Delete a term
  const handleDeleteTerm = (id: string) => {
    setEditableTerms(editableTerms.filter(term => term.id !== id));
  };

  // Add a new term
  const handleAddTerm = () => {
    if (newTerm.term.trim() === "" || newTerm.definition.trim() === "") return;
    
    const newId = `term_${Date.now()}`;
    setEditableTerms([...editableTerms, { ...newTerm, id: newId }]);
    setNewTerm({ term: "", definition: "" });
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsOpen(false);
    setIsEditing(false);
    setSearchQuery("");
    setEditableTerms([...terms]); // Reset editable terms to original terms
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "flex items-center gap-2 text-sm text-[#6C8578] hover:bg-[#E6E0D6]/50 rounded-md",
            className
          )}
          onClick={() => setIsOpen(true)}
        >
          <BookText className="w-4 h-4" />
          Glossary
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        side="right"
        hideCloseButton={true}
        className="w-[400px] max-w-full p-0 border-l border-[#E6E0D6] bg-[#F8F7F4] shadow-lg overflow-hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-[#E6E0D6]">
            <SheetTitle className="text-xl font-display font-medium text-foreground">Parent-Friendly Glossary</SheetTitle>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[#6C8578] hover:bg-[#E6E0D6]/50"
                  onClick={handleEdit}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[#3C6E58] hover:bg-[#DCE4DF]/70"
                  onClick={handleSave}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              )}
              <SheetClose asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:bg-[#E6E0D6]/50"
                  onClick={handleDialogClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </SheetClose>
            </div>
          </div>
          
          {/* Search */}
          <div className="px-6 py-4 border-b border-[#E6E0D6]">
            <Input
              type="search"
              placeholder="Search terms..."
              className="border-[#E6E0D6] bg-white focus-visible:ring-[#6C8578] focus-visible:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isEditing}
            />
          </div>
          
          {/* Glossary content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!isEditing ? (
              <div className="space-y-5">
                {filteredTerms.length > 0 ? (
                  filteredTerms.map((item) => (
                    <div key={item.id} className="pb-4 border-b border-[#E6E0D6] last:border-0">
                      <p className="font-medium text-[#5A7164] font-display">{item.term}</p>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.definition}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    {searchQuery ? "No terms found" : "No terms available"}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* List of editable terms */}
                {editableTerms.map((item) => (
                  <div key={item.id} className="pb-5 border-b border-[#E6E0D6] last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <Label className="text-[#5A7164] mb-1">Term</Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-[#9C4226] hover:bg-[#F9EFED] rounded-full -mt-1"
                        onClick={() => handleDeleteTerm(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Input
                      value={item.term}
                      onChange={(e) => handleTermChange(item.id, 'term', e.target.value)}
                      className="mb-3 border-[#E6E0D6]"
                    />
                    <Label className="text-[#5A7164] mb-1">Definition</Label>
                    <Textarea
                      value={item.definition}
                      onChange={(e) => handleTermChange(item.id, 'definition', e.target.value)}
                      className="min-h-[80px] border-[#E6E0D6]"
                    />
                  </div>
                ))}
                
                {/* Add new term */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-[#6C8578]">Add New Term</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-[#5A7164] mb-1">Term</Label>
                      <Input
                        value={newTerm.term}
                        onChange={(e) => setNewTerm({...newTerm, term: e.target.value})}
                        placeholder="Enter new term..."
                        className="border-[#E6E0D6]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#5A7164] mb-1">Definition</Label>
                      <Textarea
                        value={newTerm.definition}
                        onChange={(e) => setNewTerm({...newTerm, definition: e.target.value})}
                        placeholder="Enter definition..."
                        className="min-h-[80px] border-[#E6E0D6]"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs border-[#DCE4DF] bg-[#F6F8F7] text-[#3C6E58] hover:bg-[#DCE4DF]"
                      onClick={handleAddTerm}
                      disabled={!newTerm.term.trim() || !newTerm.definition.trim()}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Term
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-[#E6E0D6] bg-[#F1EEE9]/70 text-xs text-muted-foreground text-center">
            These definitions use simple language to help parents and guardians understand technical terms.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { GlossaryDrawer };