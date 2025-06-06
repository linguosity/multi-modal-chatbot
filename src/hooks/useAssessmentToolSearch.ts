import { useState, useMemo, useCallback, useEffect } from 'react';
import { getAllAssessmentTools, AssessmentTool } from '@/lib/assessment-tools';

export type TabType = 'all' | 'formal' | 'informal';

export interface UseAssessmentToolSearchOptions {
  selectedDomain?: string;
  initialTab?: TabType;
}

export function useAssessmentToolSearch(options: UseAssessmentToolSearchOptions = {}) {
  const { selectedDomain, initialTab = 'all' } = options;

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [domainFilter, setDomainFilter] = useState<string | null>(selectedDomain || null);
  const [showFilters, setShowFilters] = useState(false);

  // Custom tools state
  const [customTools, setCustomTools] = useState<Record<string, AssessmentTool>>({});

  // Load custom tools from localStorage
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

  // Save custom tools to localStorage
  useEffect(() => {
    if (Object.keys(customTools).length > 0) {
      localStorage.setItem('customAssessmentTools', JSON.stringify(customTools));
    }
  }, [customTools]);

  // Get all tools including custom ones
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

  // Helper functions
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const clearFilters = useCallback(() => {
    setDomainFilter(null);
    setActiveTab('all');
    setSearchQuery('');
  }, []);

  const addCustomTool = useCallback((tool: AssessmentTool) => {
    setCustomTools(prev => ({
      ...prev,
      [tool.id]: tool
    }));
  }, []);

  const removeCustomTool = useCallback((toolId: string) => {
    setCustomTools(prev => {
      const newTools = { ...prev };
      delete newTools[toolId];
      return newTools;
    });
  }, []);

  const updateCustomTool = useCallback((toolId: string, updates: Partial<AssessmentTool>) => {
    setCustomTools(prev => ({
      ...prev,
      [toolId]: { ...prev[toolId], ...updates }
    }));
  }, []);

  // Search results metadata
  const searchMetadata = useMemo(() => {
    const totalCount = Object.keys(allTools).length;
    const filteredCount = filteredTools.length;
    const customCount = Object.keys(customTools).length;
    
    return {
      totalCount,
      filteredCount,
      customCount,
      hasFilter: searchQuery || domainFilter || activeTab !== 'all',
      isFiltered: filteredCount < totalCount
    };
  }, [allTools, filteredTools, customTools, searchQuery, domainFilter, activeTab]);

  return {
    // State
    searchQuery,
    activeTab,
    domainFilter,
    showFilters,
    customTools,
    
    // State setters
    setSearchQuery,
    setActiveTab,
    setDomainFilter,
    setShowFilters,
    
    // Computed values
    allTools,
    filteredTools,
    searchMetadata,
    
    // Actions
    clearSearch,
    clearFilters,
    addCustomTool,
    removeCustomTool,
    updateCustomTool
  };
}