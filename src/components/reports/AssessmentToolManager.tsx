import { useState, useCallback } from 'react';
import { 
  Card, CardHeader, CardContent, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronDown, ChevronUp, Plus, BookOpen, 
  BarChart, Award, ClipboardCheck, Calendar, Users 
} from 'lucide-react';

import { AssessmentTool } from '@/lib/assessment-tools';
import { useAssessmentToolSearch } from '@/hooks/useAssessmentToolSearch';
import { AssessmentToolFilters } from './AssessmentToolFilters';
import { AssessmentToolForm } from './AssessmentToolForm';

interface AssessmentToolManagerProps {
  onSelectTool?: (tool: AssessmentTool) => void;
  selectedDomain?: string;
  isInPopover?: boolean;
}

// Domain options for filtering and form selection
const domainOptions = [
  { value: 'receptive', label: 'Receptive Language' },
  { value: 'expressive', label: 'Expressive Language' },
  { value: 'pragmatic', label: 'Pragmatic/Social Language' },
  { value: 'articulation', label: 'Articulation/Phonology' },
  { value: 'voice', label: 'Voice' },
  { value: 'fluency', label: 'Fluency' }
];

/**
 * Enhanced assessment tool search, display, and management component
 * Refactored to use custom hooks and extracted components
 */
export function AssessmentToolManager({
  onSelectTool,
  selectedDomain,
  isInPopover = false
}: AssessmentToolManagerProps) {
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    domainFilter,
    setDomainFilter,
    showFilters,
    setShowFilters,
    filteredTools,
    searchMetadata,
    clearFilters,
    addCustomTool
  } = useAssessmentToolSearch({ selectedDomain });

  const handleSaveTool = useCallback((tool: AssessmentTool) => {
    addCustomTool(tool);
    setIsAddingTool(false);
  }, [addCustomTool]);

  const handleSelectTool = useCallback((tool: AssessmentTool) => {
    onSelectTool?.(tool);
  }, [onSelectTool]);

  const toggleToolExpansion = useCallback((toolId: string) => {
    setExpandedTool(prev => prev === toolId ? null : toolId);
  }, []);

  const getToolTypeIcon = (type: string) => {
    switch (type) {
      case 'quantitative':
        return <BarChart className="h-4 w-4" />;
      case 'qualitative':
        return <ClipboardCheck className="h-4 w-4" />;
      case 'mixed':
        return <Award className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quantitative':
        return 'bg-blue-100 text-blue-800';
      case 'qualitative':
        return 'bg-green-100 text-green-800';
      case 'mixed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-4 ${isInPopover ? "max-w-full" : ""}`}>
      {/* Add Tool Form Modal */}
      {isAddingTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <AssessmentToolForm
            isOpen={isAddingTool}
            onClose={() => setIsAddingTool(false)}
            onSave={handleSaveTool}
            domainOptions={domainOptions}
          />
        </div>
      )}

      {/* Main Card */}
      <Card className={`shadow-sm ${isInPopover ? "border-0" : ""}`}>
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
        
        <CardContent className="space-y-4">
          {/* Filters Component */}
          <AssessmentToolFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            domainFilter={domainFilter}
            onDomainFilterChange={setDomainFilter}
            showFilters={showFilters}
            onShowFiltersChange={setShowFilters}
            onClearFilters={clearFilters}
            searchMetadata={searchMetadata}
            domainOptions={domainOptions}
          />

          {/* Assessment tool list */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {filteredTools.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No assessment tools found matching your criteria</p>
                <Button 
                  variant="link" 
                  onClick={clearFilters}
                  className="mt-1"
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              filteredTools.map((tool) => (
                <Card 
                  key={tool.id} 
                  className="border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                >
                  <CardContent className="p-4">
                    <div 
                      className="flex items-start justify-between"
                      onClick={() => toggleToolExpansion(tool.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getToolTypeIcon(tool.type)}
                          <h3 className="font-medium text-sm truncate">
                            {tool.name}
                          </h3>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getTypeColor(tool.type)}`}
                          >
                            {tool.type}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {tool.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                          {tool.domains.slice(0, 3).map((domain) => (
                            <Badge 
                              key={domain} 
                              variant="outline" 
                              className="text-xs"
                            >
                              {domainOptions.find(d => d.value === domain)?.label || domain}
                            </Badge>
                          ))}
                          {tool.domains.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{tool.domains.length - 3} more
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {tool.year}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {tool.targetAgeRange}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {onSelectTool && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTool(tool);
                            }}
                            className="h-7 px-2 text-xs"
                          >
                            Select
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                        >
                          {expandedTool === tool.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedTool === tool.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="space-y-3">
                          {tool.authors && tool.authors.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-700 mb-1">Authors:</h4>
                              <p className="text-xs text-gray-600">
                                {tool.authors.join(', ')}
                              </p>
                            </div>
                          )}

                          {tool.targetPopulation && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-700 mb-1">Target Population:</h4>
                              <p className="text-xs text-gray-600">{tool.targetPopulation}</p>
                            </div>
                          )}

                          {tool.subtests && tool.subtests.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-700 mb-1">Subtests:</h4>
                              <ul className="space-y-1">
                                {tool.subtests.slice(0, 3).map((subtest, index) => (
                                  <li key={index} className="text-xs text-gray-600">
                                    • {subtest.name}: {subtest.description}
                                  </li>
                                ))}
                                {tool.subtests.length > 3 && (
                                  <li className="text-xs text-gray-500">
                                    ... and {tool.subtests.length - 3} more subtests
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          {tool.caveats && tool.caveats.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-700 mb-1">Considerations:</h4>
                              <ul className="space-y-1">
                                {tool.caveats.slice(0, 2).map((caveat, index) => (
                                  <li key={index} className="text-xs text-gray-600">
                                    • {caveat}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}