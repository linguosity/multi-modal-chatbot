'use client';

import { useState } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Sample assessment tools data
const assessmentTools = [
  {
    id: 'celf-5',
    name: 'CELF-5',
    fullName: 'Clinical Evaluation of Language Fundamentals, 5th Edition',
    category: 'Language',
  },
  {
    id: 'gfta-3',
    name: 'GFTA-3',
    fullName: 'Goldman-Fristoe Test of Articulation, 3rd Edition',
    category: 'Articulation',
  },
  {
    id: 'taps-4',
    name: 'TAPS-4',
    fullName: 'Test of Auditory Processing Skills, 4th Edition',
    category: 'Auditory Processing',
  },
  {
    id: 'casl-2',
    name: 'CASL-2',
    fullName: 'Comprehensive Assessment of Spoken Language, 2nd Edition',
    category: 'Language',
  },
  {
    id: 'ctopp-2',
    name: 'CTOPP-2',
    fullName: 'Comprehensive Test of Phonological Processing, 2nd Edition',
    category: 'Phonological Processing',
  },
  {
    id: 'tops-3e',
    name: 'TOPS-3E',
    fullName: 'Test of Problem Solving - 3rd Edition: Elementary',
    category: 'Problem Solving',
  },
  {
    id: 'tops-2a',
    name: 'TOPS-2A',
    fullName: 'Test of Problem Solving - 2nd Edition: Adolescent',
    category: 'Problem Solving',
  },
  {
    id: 'owls-2',
    name: 'OWLS-2',
    fullName: 'Oral and Written Language Scales, 2nd Edition',
    category: 'Language',
  },
  {
    id: 'ppvt-5',
    name: 'PPVT-5',
    fullName: 'Peabody Picture Vocabulary Test, 5th Edition',
    category: 'Vocabulary',
  },
  {
    id: 'told-p-5',
    name: 'TOLD-P:5',
    fullName: 'Test of Language Development - Primary, 5th Edition',
    category: 'Language',
  },
];

interface AssessmentDropdownProps {
  onSelect: (toolId: string) => void;
}

export function AssessmentDropdown({ onSelect }: AssessmentDropdownProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  // Filter tools based on search term
  const filteredTools = assessmentTools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tool.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group tools by category
  const groupedTools = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, typeof assessmentTools>);
  
  const handleSelect = (toolId: string) => {
    setSelectedTool(toolId);
    onSelect(toolId);
  };
  
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedTool ? 
              assessmentTools.find(t => t.id === selectedTool)?.name || 'Select Assessment Tool' : 
              'Select Assessment Tool'
            }
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[350px] p-2">
          <div className="p-2">
            <div className="flex items-center border rounded-md px-3 py-1">
              <Search className="h-4 w-4 text-muted-foreground mr-2" />
              <Input 
                className="border-0 p-0 shadow-none focus-visible:ring-0" 
                placeholder="Search assessment tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <DropdownMenuSeparator />
          {Object.entries(groupedTools).map(([category, tools]) => (
            <DropdownMenuGroup key={category}>
              <DropdownMenuLabel>{category}</DropdownMenuLabel>
              {tools.map(tool => (
                <DropdownMenuItem 
                  key={tool.id}
                  onClick={() => handleSelect(tool.id)}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span>{tool.name}</span>
                    <span className="text-xs text-muted-foreground">{tool.fullName}</span>
                  </div>
                  {selectedTool === tool.id && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </DropdownMenuGroup>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}