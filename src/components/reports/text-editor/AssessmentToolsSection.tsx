import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BookOpen, Plus, Search } from "lucide-react";
import { AssessmentTool } from '@/lib/assessment-tools';

interface AssessmentToolsSectionProps {
  assessmentProcedures: {
    overviewOfAssessmentMethods: string;
    assessmentToolsUsed: string[];
  };
  observations: {
    [key: string]: string | undefined;
  };
  onAddTool: (toolId: string) => void;
  onOpenLibrary: () => void;
  allTools: Record<string, AssessmentTool>;
}

/**
 * Component for displaying all assessment tools, including observations
 */
export const AssessmentToolsSection: React.FC<AssessmentToolsSectionProps> = ({ 
  assessmentProcedures, 
  observations,
  onAddTool,
  onOpenLibrary,
  allTools
}) => {
  const [toolSearchQuery, setToolSearchQuery] = React.useState('');
  const [showToolSearchResults, setShowToolSearchResults] = React.useState(false);
  const [toolSearchResults, setToolSearchResults] = React.useState<any[]>([]);
  const [quickToolForm, setQuickToolForm] = React.useState({
    name: '',
    id: '',
    domains: [] as string[]
  });

  // Filter observations to show non-empty ones
  const validObservations = Object.entries(observations || {}).filter(([_, content]) => content);
  
  return (
    <div id="assessment-tools" className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-green-800">Assessment Tools</h4>
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                size="sm"
                variant="outline"
                className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Tool
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="end">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Add Assessment Tool</h3>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label htmlFor="quick-tool-name" className="text-xs">Tool Name</label>
                    <Input 
                      id="quick-tool-name" 
                      placeholder="E.g., CELF-5" 
                      className="h-8 text-xs"
                      value={quickToolForm.name}
                      onChange={(e) => setQuickToolForm({
                        ...quickToolForm,
                        name: e.target.value,
                        id: e.target.value.toLowerCase().replace(/\s+/g, '_')
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="quick-tool-id" className="text-xs">ID/Acronym</label>
                    <Input 
                      id="quick-tool-id" 
                      placeholder="E.g., celf5" 
                      className="h-8 text-xs"
                      value={quickToolForm.id}
                      onChange={(e) => setQuickToolForm({
                        ...quickToolForm,
                        id: e.target.value.toLowerCase().replace(/\s+/g, '_')
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Domains</label>
                    <div className="flex flex-wrap gap-1">
                      {["receptive", "expressive", "pragmatic", "articulation"].map(domain => (
                        <Button 
                          key={domain}
                          variant={quickToolForm.domains.includes(domain) ? "default" : "outline"}
                          size="sm" 
                          className={`h-6 text-xs py-0 ${
                            quickToolForm.domains.includes(domain) 
                              ? "bg-green-600 hover:bg-green-700 text-white" 
                              : ""
                          }`}
                          onClick={() => {
                            setQuickToolForm(prev => {
                              if (prev.domains.includes(domain)) {
                                return {
                                  ...prev,
                                  domains: prev.domains.filter(d => d !== domain)
                                };
                              } else {
                                return {
                                  ...prev,
                                  domains: [...prev.domains, domain]
                                };
                              }
                            });
                          }}
                        >
                          {domain.charAt(0).toUpperCase() + domain.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-2 flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={onOpenLibrary}
                  >
                    Show full editor
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs h-7 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      if (!quickToolForm.name || !quickToolForm.id) {
                        return;
                      }
                      
                      // Create tool object
                      const newToolData = {
                        id: quickToolForm.id,
                        name: quickToolForm.name,
                        year: new Date().getFullYear().toString(),
                        authors: ['User Added'],
                        targetPopulation: '',
                        targetAgeRange: '',
                        type: 'mixed' as const,
                        domains: quickToolForm.domains,
                        description: `Custom tool added via quick form on ${new Date().toLocaleDateString()}`
                      };
                      
                      // Check if localStorage has customAssessmentTools
                      let customTools = {};
                      try {
                        const storedTools = localStorage.getItem('customAssessmentTools');
                        if (storedTools) {
                          customTools = JSON.parse(storedTools);
                        }
                        
                        // Add new tool
                        customTools = {
                          ...customTools,
                          [quickToolForm.id]: newToolData
                        };
                        
                        // Save back to localStorage
                        localStorage.setItem('customAssessmentTools', JSON.stringify(customTools));
                        
                        // Add to report
                        onAddTool(quickToolForm.id);
                        
                        // Reset form
                        setQuickToolForm({
                          name: '',
                          id: '',
                          domains: []
                        });
                        
                        // Close popover by clicking outside
                        document.body.click();
                      } catch (e) {
                        console.error('Error adding custom tool:', e);
                      }
                    }}
                  >
                    Add Tool
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            onClick={onOpenLibrary}
            size="sm"
            variant="outline"
            className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50"
          >
            Browse Library
          </Button>
        </div>
      </div>
      
      {/* Inline Search */}
      <div className="relative mb-3">
        <div className="flex items-center border rounded-md overflow-hidden mb-2">
          <div className="pl-3 text-gray-500">
            <Search className="h-4 w-4" />
          </div>
          <Input
            placeholder="Search assessment tools..."
            className="border-0 focus-visible:ring-0 text-sm h-9"
            value={toolSearchQuery}
            onChange={(e) => {
              setToolSearchQuery(e.target.value);
              
              if (e.target.value.trim()) {
                // Filter tools based on query
                try {
                  const results = Object.values(allTools).filter((tool: any) => 
                    tool.name.toLowerCase().includes(e.target.value.toLowerCase()) || 
                    tool.id.toLowerCase().includes(e.target.value.toLowerCase()) ||
                    (tool.authors || []).some((author: string) => 
                      author.toLowerCase().includes(e.target.value.toLowerCase())
                    )
                  );
                  
                  setToolSearchResults(results);
                  setShowToolSearchResults(true);
                } catch (error) {
                  console.error('Error searching tools:', error);
                  setToolSearchResults([]);
                }
              } else {
                setShowToolSearchResults(false);
              }
            }}
            onFocus={() => {
              if (toolSearchQuery.trim()) {
                setShowToolSearchResults(true);
              }
            }}
            onBlur={() => {
              // Delay hiding to allow clicking on results
              setTimeout(() => setShowToolSearchResults(false), 200);
            }}
          />
        </div>
        
        {/* Search Results - Dynamically generated from found tools */}
        {showToolSearchResults && toolSearchResults.length > 0 && (
          <div className="absolute w-full bg-white border rounded-md shadow-md p-1 z-10 max-h-[250px] overflow-y-auto">
            <div className="text-xs text-gray-500 px-2 py-1.5">
              Found {toolSearchResults.length} assessment tools
            </div>
            
            {toolSearchResults.map((tool, i) => (
              <div 
                key={i}
                className="px-2 py-1.5 hover:bg-gray-100 rounded-sm cursor-pointer flex items-center text-sm"
                onClick={() => {
                  // Add the tool to the report
                  onAddTool(tool.id);
                  setToolSearchQuery('');
                  setShowToolSearchResults(false);
                }}
              >
                {tool.type === 'quantitative' ? (
                  <BookOpen className="h-3.5 w-3.5 mr-2 text-blue-500" />
                ) : (
                  <BookOpen className="h-3.5 w-3.5 mr-2 text-green-500" />
                )}
                <div className="flex flex-col">
                  <span>{tool.name}</span>
                  <span className="text-xs text-gray-500">
                    {tool.authors?.length > 0 ? tool.authors[0] + (tool.authors.length > 1 ? ' et al.' : '') : ''} 
                    {tool.year ? ` (${tool.year})` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {showToolSearchResults && toolSearchResults.length === 0 && toolSearchQuery.trim() !== '' && (
          <div className="absolute w-full bg-white border rounded-md shadow-md p-3 z-10">
            <div className="text-sm text-center">
              <p className="text-gray-600 mb-2">No matching assessment tools found</p>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={onOpenLibrary}
              >
                Add New Tool
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Methods Overview Card */}
      <Card className="border border-green-100 shadow-sm bg-green-50/30 mb-3">
        <CardHeader className="py-2 px-3 bg-green-50">
          <CardTitle className="text-sm font-medium text-green-800">Validity Statement</CardTitle>
        </CardHeader>
        <CardContent className="p-3 text-xs">
          <p>{assessmentProcedures.overviewOfAssessmentMethods || 
            "A combination of standardized tests, language samples, and observations were used to assess the student's communication skills."}</p>
        </CardContent>
      </Card>
      
      {/* Observations Section */}
      {validObservations.length > 0 && (
        <div className="mb-4">
          {/*<h5 className="text-xs font-medium text-green-800 mb-2">Observations</h5>*/}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {validObservations.map(([obsKey, content]) => (
              <Card key={obsKey} className="border border-green-100 shadow-sm bg-green-50/30">
                <CardHeader className="py-2 px-3 bg-green-50">
                  <CardTitle className="text-sm font-medium text-green-800">
                    {obsKey.charAt(0).toUpperCase() + obsKey.slice(1).replace(/([A-Z])/g, ' $1')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 text-xs">
                  <p>{content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Assessment Tools Display */}
      {assessmentProcedures.assessmentToolsUsed?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {assessmentProcedures.assessmentToolsUsed.map(toolId => {
            // Get tool details if available
            const toolDetails = allTools?.[toolId];
            
            return (
              <Card key={toolId} className="border border-green-100 shadow-sm bg-green-50/30">
  <CardHeader className="py-2 px-3 bg-green-50">
    <CardTitle className="text-sm font-medium text-green-800">
      {toolDetails ? (
        <>
          {(toolDetails.authors?.length > 0 || toolDetails.year) && (
            <>
              {toolDetails.name}; {toolDetails.authors?.[0] || 'Unknown'}, {toolDetails.year || 'n.d.'}
            </>
          )}
        </>
      ) : (
        toolId.toUpperCase()
      )}
    </CardTitle>
  </CardHeader>
  <CardContent className="p-3 text-xs">
    {toolDetails ? (
      <div className="space-y-1">
        {toolDetails.targetAgeRange && (
          <p><span className="font-medium">Ages:</span> {toolDetails.targetAgeRange}</p>
        )}
        {toolDetails.domains?.length > 0 && (
          <p><span className="font-medium">Domains:</span> {toolDetails.domains.map(d => 
            d.charAt(0).toUpperCase() + d.slice(1)
          ).join(', ')}</p>
        )}
      </div>
    ) : (
      <p className="text-green-800">Tool ID: {toolId}</p>
    )}
  </CardContent>
</Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center bg-white rounded-md border border-dashed border-green-200 p-6">
          <p className="text-gray-500 mb-3">No assessment tools selected yet</p>
          <Button
            onClick={onOpenLibrary}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            Browse Assessment Library
          </Button>
        </div>
      )}
      
      {/* Hidden button for the modal - activated by other buttons */}
      <button 
        id="assessment-search-modal"
        className="hidden"
        onClick={onOpenLibrary}
      />
    </div>
  );
};

export default AssessmentToolsSection;