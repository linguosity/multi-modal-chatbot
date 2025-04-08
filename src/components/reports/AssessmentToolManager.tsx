import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  ChevronDown, ChevronUp, Plus, Search, Filter, ClipboardCheck, BookOpen, 
  BarChart, Award, X, PlusCircle, Save, Calendar, Users 
} from 'lucide-react';

import { 
  getAllAssessmentTools, 
  AssessmentTool, 
  formalAssessmentTools,
  informalAssessmentTools
} from '@/lib/assessment-tools';

/**
 * Enhanced assessment tool search, display, and management component
 */
export function AssessmentToolManager({
  onSelectTool,
  selectedDomain,
  isInPopover = false
}: {
  onSelectTool?: (tool: AssessmentTool) => void;
  selectedDomain?: string;
}) {
  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'formal' | 'informal'>('all');
  const [domainFilter, setDomainFilter] = useState<string | null>(selectedDomain || null);
  const [showFilters, setShowFilters] = useState(false);
  
  // State for the add/edit new tool form
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [newTool, setNewTool] = useState<Partial<AssessmentTool>>({
    type: 'quantitative',
    domains: [],
    authors: [],
    subtests: []
  });
  
  // State for local storage of custom tools
  const [customTools, setCustomTools] = useState<Record<string, AssessmentTool>>({});
  
  // Load custom tools from local storage on component mount
  useEffect(() => {
    const storedTools = localStorage.getItem('customAssessmentTools');
    if (storedTools) {
      try {
        setCustomTools(JSON.parse(storedTools));
      } catch (e) {
        console.error('Error loading custom assessment tools:', e);
      }
    }
  }, []);
  
  // Save custom tools to local storage when they change
  useEffect(() => {
    if (Object.keys(customTools).length > 0) {
      localStorage.setItem('customAssessmentTools', JSON.stringify(customTools));
    }
  }, [customTools]);
  
  // Get all tools, including custom ones
  const allTools = useMemo(() => {
    return {
      ...getAllAssessmentTools(),
      ...customTools
    };
  }, [customTools]);
  
  // Filtered tools based on search, tabs, and domain filter
  const filteredTools = useMemo(() => {
    let tools = Object.values(allTools);
    
    // Filter by tab selection
    if (activeTab === 'formal') {
      tools = tools.filter(tool => tool.type === 'quantitative');
    } else if (activeTab === 'informal') {
      tools = tools.filter(tool => tool.type === 'qualitative' || tool.type === 'mixed');
    }
    
    // Filter by domain if selected
    if (domainFilter) {
      tools = tools.filter(tool => tool.domains.includes(domainFilter));
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tools = tools.filter(tool => 
        tool.name.toLowerCase().includes(query) ||
        tool.id.toLowerCase().includes(query) ||
        (tool.description && tool.description.toLowerCase().includes(query)) ||
        tool.authors.some(author => author.toLowerCase().includes(query))
      );
    }
    
    // Sort by name
    return tools.sort((a, b) => a.name.localeCompare(b.name));
  }, [allTools, activeTab, domainFilter, searchQuery]);
  
  // Domain options for filtering and form selection
  const domainOptions = [
    { value: 'receptive', label: 'Receptive Language' },
    { value: 'expressive', label: 'Expressive Language' },
    { value: 'pragmatic', label: 'Pragmatic/Social Language' },
    { value: 'articulation', label: 'Articulation/Phonology' },
    { value: 'voice', label: 'Voice' },
    { value: 'fluency', label: 'Fluency' }
  ];
  
  // Handler for adding/updating a tool
  const handleSaveTool = useCallback(() => {
    if (!newTool.name || !newTool.id) {
      alert('Tool name and ID are required');
      return;
    }
    
    // Create a valid ID from the name if not provided
    const toolId = newTool.id || newTool.name.toLowerCase().replace(/\s+/g, '_');
    
    // Create the complete tool object
    const completeToolData: AssessmentTool = {
      id: toolId,
      name: newTool.name,
      year: newTool.year || 'N/A',
      authors: newTool.authors || [],
      targetPopulation: newTool.targetPopulation || '',
      targetAgeRange: newTool.targetAgeRange || '',
      type: newTool.type as 'quantitative' | 'qualitative' | 'mixed',
      domains: newTool.domains || [],
      description: newTool.description || '',
      subtests: newTool.subtests || [],
      caveats: newTool.caveats || [],
      references: newTool.references || []
    };
    
    // Save to custom tools
    setCustomTools(prev => ({
      ...prev,
      [toolId]: completeToolData
    }));
    
    // Reset form and close
    setNewTool({
      type: 'quantitative',
      domains: [],
      authors: [],
      subtests: []
    });
    setIsAddingTool(false);
  }, [newTool]);
  
  // Handler for toggling domain selection in the form
  const toggleDomain = (domain: string) => {
    setNewTool(prev => {
      const currentDomains = prev.domains || [];
      return {
        ...prev,
        domains: currentDomains.includes(domain)
          ? currentDomains.filter(d => d !== domain)
          : [...currentDomains, domain]
      };
    });
  };
  
  // Handler for adding a new author
  const addAuthor = () => {
    const authorName = prompt('Enter author name:');
    if (authorName) {
      setNewTool(prev => ({
        ...prev,
        authors: [...(prev.authors || []), authorName]
      }));
    }
  };
  
  // Handler for removing an author
  const removeAuthor = (index: number) => {
    setNewTool(prev => ({
      ...prev,
      authors: (prev.authors || []).filter((_, i) => i !== index)
    }));
  };
  
  // Handler for adding a new subtest
  const addSubtest = () => {
    setNewTool(prev => ({
      ...prev,
      subtests: [
        ...(prev.subtests || []),
        {
          name: '',
          description: '',
          domain: prev.domains?.[0] || undefined
        }
      ]
    }));
  };
  
  // Handler for updating a subtest
  const updateSubtest = (index: number, field: string, value: string) => {
    setNewTool(prev => {
      const updatedSubtests = [...(prev.subtests || [])];
      updatedSubtests[index] = {
        ...updatedSubtests[index],
        [field]: value
      };
      return {
        ...prev,
        subtests: updatedSubtests
      };
    });
  };
  
  // Handler for removing a subtest
  const removeSubtest = (index: number) => {
    setNewTool(prev => ({
      ...prev,
      subtests: (prev.subtests || []).filter((_, i) => i !== index)
    }));
  };
  
  return (
    <div className={`space-y-4 ${isInPopover ? "max-w-full" : ""}`}>
      {/* Tool search interface */}
      <Card className={`shadow-sm ${isInPopover ? "border-0" : "border-0"}`}>
        <CardHeader className={isInPopover ? "pb-2 px-2 pt-0" : "pb-3"}>
          <CardTitle className={`flex justify-between items-center ${isInPopover ? "text-sm" : "text-lg font-medium"}`}>
            <span>Assessment Tools</span>
            <Button 
              onClick={() => setIsAddingTool(true)} 
              size="sm" 
              className={`bg-green-600 hover:bg-green-700 ${isInPopover ? "h-7 text-xs" : ""}`}
            >
              <Plus className={`${isInPopover ? "h-3 w-3" : "h-4 w-4"} mr-1`} />
              Add Tool
            </Button>
          </CardTitle>
          <CardDescription className={isInPopover ? "text-xs" : ""}>
            Search for standardized tests and informal assessment tools
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-2">
          <div className="space-y-3">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name, acronym, or author..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            {/* Filters toggle */}
            <div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-gray-600 p-0 h-auto"
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filters
                {showFilters ? 
                  <ChevronUp className="h-3.5 w-3.5 ml-1" /> : 
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                }
              </Button>
              
              {showFilters && (
                <div className="mt-2 border rounded-md p-3 bg-gray-50">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium block">Filter by domain:</Label>
                    <div className="flex flex-wrap gap-2">
                      {domainOptions.map(domain => (
                        <Button
                          key={domain.value}
                          variant={domainFilter === domain.value ? "default" : "outline"}
                          size="sm"
                          className={`text-xs py-1 h-auto ${
                            domainFilter === domain.value 
                              ? "bg-purple-600 hover:bg-purple-700 text-white" 
                              : "text-gray-700"
                          }`}
                          onClick={() => setDomainFilter(
                            domainFilter === domain.value ? null : domain.value
                          )}
                        >
                          {domain.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Tabs */}
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as 'all' | 'formal' | 'informal')}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 mb-2">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="formal">Formal</TabsTrigger>
                <TabsTrigger value="informal">Informal</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
        
        <CardContent>
          {/* Results count */}
          <div className="text-sm text-gray-500 mb-3">
            {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} found
            {domainFilter && ` for ${domainOptions.find(d => d.value === domainFilter)?.label}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </div>
          
          {/* Assessment tool list */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {filteredTools.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No assessment tools found matching your criteria</p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchQuery('');
                    setDomainFilter(null);
                    setActiveTab('all');
                  }}
                  className="mt-1"
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              filteredTools.map(tool => (
                <AssessmentToolCard 
                  key={tool.id} 
                  tool={tool} 
                  onSelect={onSelectTool}
                  isCustom={!!customTools[tool.id]}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Add/edit tool modal */}
      {isAddingTool && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="sticky top-0 bg-white z-10 border-b">
              <div className="flex justify-between items-center">
                <CardTitle>Add Assessment Tool</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsAddingTool(false)}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Create a new assessment tool for your library
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* Basic Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center">
                    <ClipboardCheck className="mr-2 h-4 w-4 text-purple-600" />
                    Basic Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="tool-name">Tool Name</Label>
                      <Input 
                        id="tool-name"
                        value={newTool.name || ''}
                        onChange={e => setNewTool({...newTool, name: e.target.value})}
                        placeholder="e.g., Clinical Evaluation of Language Fundamentals (CELF-5)"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tool-id">Tool ID/Acronym</Label>
                      <Input 
                        id="tool-id"
                        value={newTool.id || ''}
                        onChange={e => setNewTool({...newTool, id: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                        placeholder="e.g., celf5"
                      />
                      <p className="text-xs text-gray-500">
                        Use lowercase with underscores for spaces
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="tool-year">Year</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input 
                          id="tool-year"
                          value={newTool.year || ''}
                          onChange={e => setNewTool({...newTool, year: e.target.value})}
                          placeholder="e.g., 2013"
                          className="pl-8"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tool-type">Assessment Type</Label>
                      <select
                        id="tool-type"
                        value={newTool.type as string}
                        onChange={e => setNewTool({
                          ...newTool, 
                          type: e.target.value as 'quantitative' | 'qualitative' | 'mixed'
                        })}
                        className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950"
                      >
                        <option value="quantitative">Quantitative (Standardized)</option>
                        <option value="qualitative">Qualitative (Informal)</option>
                        <option value="mixed">Mixed Methods</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex justify-between">
                      <span>Authors</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={addAuthor}
                        className="h-5 text-xs text-purple-600 hover:text-purple-700 p-0"
                      >
                        <PlusCircle className="h-3 w-3 mr-1" />
                        Add Author
                      </Button>
                    </Label>
                    
                    <div className="space-y-2">
                      {(newTool.authors || []).length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No authors added yet</p>
                      ) : (
                        (newTool.authors || []).map((author, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="flex-1 py-1 px-3 bg-gray-50 border rounded-md text-sm">
                              <div className="flex items-center">
                                <Users className="h-3 w-3 mr-2 text-gray-500" />
                                {author}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAuthor(index)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Target Population */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center">
                    <Users className="mr-2 h-4 w-4 text-purple-600" />
                    Target Population
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tool-population">Population Description</Label>
                    <Textarea 
                      id="tool-population"
                      value={newTool.targetPopulation || ''}
                      onChange={e => setNewTool({...newTool, targetPopulation: e.target.value})}
                      placeholder="e.g., Children and adolescents with suspected language disorders"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tool-age-range">Age Range</Label>
                    <Input 
                      id="tool-age-range"
                      value={newTool.targetAgeRange || ''}
                      onChange={e => setNewTool({...newTool, targetAgeRange: e.target.value})}
                      placeholder="e.g., 5-21 years"
                    />
                  </div>
                </div>
                
                <Separator />
                
                {/* Domains */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center">
                    <Award className="mr-2 h-4 w-4 text-purple-600" />
                    Assessment Domains
                  </h3>
                  
                  <div className="space-y-2">
                    <Label className="mb-2 block">Select all applicable domains:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {domainOptions.map(domain => (
                        <div key={domain.value} className="flex items-center space-x-2">
                          <Switch
                            id={`domain-${domain.value}`}
                            checked={(newTool.domains || []).includes(domain.value)}
                            onCheckedChange={() => toggleDomain(domain.value)}
                          />
                          <Label htmlFor={`domain-${domain.value}`} className="cursor-pointer">
                            {domain.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Description */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center">
                    <BookOpen className="mr-2 h-4 w-4 text-purple-600" />
                    Description & Details
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tool-description">Description</Label>
                    <Textarea 
                      id="tool-description"
                      value={newTool.description || ''}
                      onChange={e => setNewTool({...newTool, description: e.target.value})}
                      placeholder="Provide a brief overview of the assessment tool..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
                
                <Separator />
                
                {/* Subtests */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold flex items-center">
                      <BarChart className="mr-2 h-4 w-4 text-purple-600" />
                      Subtests/Components
                    </h3>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addSubtest}
                      className="h-8 text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Subtest
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {(newTool.subtests || []).length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No subtests added yet</p>
                    ) : (
                      (newTool.subtests || []).map((subtest, index) => (
                        <div key={index} className="border rounded-md p-3 bg-gray-50">
                          <div className="flex justify-between mb-2">
                            <h4 className="text-sm font-medium">Subtest {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSubtest(index)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor={`subtest-${index}-name`}>Name</Label>
                              <Input 
                                id={`subtest-${index}-name`}
                                value={subtest.name || ''}
                                onChange={e => updateSubtest(index, 'name', e.target.value)}
                                placeholder="e.g., Sentence Comprehension"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`subtest-${index}-domain`}>Primary Domain</Label>
                              <select
                                id={`subtest-${index}-domain`}
                                value={subtest.domain || ''}
                                onChange={e => updateSubtest(index, 'domain', e.target.value)}
                                className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950"
                              >
                                <option value="">Select a domain</option>
                                {domainOptions.map(domain => (
                                  <option 
                                    key={domain.value} 
                                    value={domain.value}
                                    disabled={!(newTool.domains || []).includes(domain.value)}
                                  >
                                    {domain.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor={`subtest-${index}-description`}>Description</Label>
                              <Textarea 
                                id={`subtest-${index}-description`}
                                value={subtest.description || ''}
                                onChange={e => updateSubtest(index, 'description', e.target.value)}
                                placeholder="Describe what this subtest measures..."
                                className="min-h-[60px]"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between border-t py-3 bg-gray-50">
              <Button 
                variant="outline" 
                onClick={() => setIsAddingTool(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveTool}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Save className="h-4 w-4 mr-1" />
                Save Tool
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Individual assessment tool card component
 */
function AssessmentToolCard({ 
  tool, 
  onSelect,
  isCustom = false
}: { 
  tool: AssessmentTool; 
  onSelect?: (tool: AssessmentTool) => void;
  isCustom?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  
  // Icon based on assessment type
  const TypeIcon = tool.type === 'quantitative' 
    ? BarChart 
    : (tool.type === 'qualitative' ? BookOpen : ClipboardCheck);
  
  return (
    <Card className={`border shadow-sm ${isCustom ? 'border-purple-200' : ''}`}>
      <CardHeader className="py-3 px-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-base font-medium flex items-center">
              <TypeIcon className={`h-4 w-4 mr-2 ${
                tool.type === 'quantitative' 
                  ? 'text-blue-600' 
                  : (tool.type === 'qualitative' ? 'text-green-600' : 'text-amber-600')
              }`} />
              <span>{tool.name}</span>
              {isCustom && (
                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Custom</span>
              )}
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              {tool.year !== 'N/A' && <span className="mr-2">{tool.year}</span>}
              {tool.authors?.length > 0 && (
                <span>
                  {tool.authors.length > 2 
                    ? `${tool.authors[0]} et al.` 
                    : tool.authors.join(', ')}
                </span>
              )}
            </CardDescription>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0 text-gray-500"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {/* Basic info always visible */}
      <CardContent className="py-0 px-4">
        <div className="text-sm mb-2">
          <div className="flex flex-wrap gap-1 mb-2">
            {tool.domains?.map(domain => (
              <span 
                key={domain} 
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
              >
                {domain.charAt(0).toUpperCase() + domain.slice(1)}
              </span>
            ))}
          </div>
          
          {/* Age range and population */}
          <div className="text-xs text-gray-600">
            {tool.targetAgeRange && <span className="mr-2">Ages: {tool.targetAgeRange}</span>}
            {tool.targetPopulation && <span>{tool.targetPopulation}</span>}
          </div>
          
          {/* Short description - visible even when collapsed */}
          {tool.description && !expanded && (
            <p className="mt-2 text-xs text-gray-700 line-clamp-2">
              {tool.description}
            </p>
          )}
        </div>
      </CardContent>
      
      {/* Extended details when expanded */}
      {expanded && (
        <>
          <CardContent className="px-4 pt-2">
            <Separator className="my-2" />
            
            {/* Full description */}
            {tool.description && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-600 mb-1">Description</h4>
                <p className="text-sm text-gray-700">{tool.description}</p>
              </div>
            )}
            
            {/* Subtests */}
            {tool.subtests && tool.subtests.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-600 mb-1">Subtests</h4>
                <div className="space-y-2">
                  {tool.subtests.map((subtest, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded-md">
                      <div className="flex flex-col">
                        <h5 className="text-sm font-medium">{subtest.name}</h5>
                        {subtest.domain && (
                          <span className="text-xs text-gray-500">
                            Domain: {subtest.domain.charAt(0).toUpperCase() + subtest.domain.slice(1)}
                          </span>
                        )}
                        {subtest.description && (
                          <p className="text-xs mt-1">{subtest.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Caveats */}
            {tool.caveats && tool.caveats.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-600 mb-1">Considerations</h4>
                <ul className="text-xs text-gray-700 pl-5 list-disc space-y-1">
                  {tool.caveats.map((caveat, index) => (
                    <li key={index}>{caveat}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="pt-0 pb-3 px-4">
            {onSelect && (
              <Button 
                onClick={() => onSelect(tool)}
                className="w-full bg-purple-600 hover:bg-purple-700 mt-2"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add to Report
              </Button>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
}