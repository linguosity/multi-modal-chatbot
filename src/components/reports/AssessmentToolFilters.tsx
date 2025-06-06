import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, X } from 'lucide-react';
import { TabType } from '@/hooks/useAssessmentToolSearch';

interface AssessmentToolFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  domainFilter: string | null;
  onDomainFilterChange: (domain: string | null) => void;
  showFilters: boolean;
  onShowFiltersChange: (show: boolean) => void;
  onClearFilters: () => void;
  searchMetadata: {
    totalCount: number;
    filteredCount: number;
    hasFilter: boolean;
    isFiltered: boolean;
  };
  domainOptions: Array<{ value: string; label: string }>;
}

export function AssessmentToolFilters({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  domainFilter,
  onDomainFilterChange,
  showFilters,
  onShowFiltersChange,
  onClearFilters,
  searchMetadata,
  domainOptions
}: AssessmentToolFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search assessment tools..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <Popover open={showFilters} onOpenChange={onShowFiltersChange}>
          <PopoverTrigger asChild>
            <Button
              variant={searchMetadata.hasFilter ? "default" : "outline"}
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {searchMetadata.hasFilter && (
                <span className="ml-1 bg-white text-black rounded-full px-1 text-xs">
                  !
                </span>
              )}
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Filter Options</h4>
                {searchMetadata.hasFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onClearFilters();
                      onShowFiltersChange(false);
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </div>
              
              {/* Domain Filter */}
              <div>
                <h5 className="text-sm font-medium mb-2">Domain</h5>
                <div className="grid grid-cols-1 gap-1">
                  <Button
                    variant={!domainFilter ? "default" : "ghost"}
                    size="sm"
                    className="justify-start"
                    onClick={() => onDomainFilterChange(null)}
                  >
                    All Domains
                  </Button>
                  {domainOptions.map((domain) => (
                    <Button
                      key={domain.value}
                      variant={domainFilter === domain.value ? "default" : "ghost"}
                      size="sm"
                      className="justify-start"
                      onClick={() => onDomainFilterChange(domain.value)}
                    >
                      {domain.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Tabs for Formal/Informal */}
      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as TabType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Tools</TabsTrigger>
          <TabsTrigger value="formal">Formal</TabsTrigger>
          <TabsTrigger value="informal">Informal</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {searchMetadata.filteredCount} of {searchMetadata.totalCount} tools
          {searchMetadata.isFiltered && (
            <span className="ml-1 text-blue-600">(filtered)</span>
          )}
        </span>
        
        {searchMetadata.hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}