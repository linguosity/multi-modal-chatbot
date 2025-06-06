import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { X, Save, Plus } from 'lucide-react';
import { AssessmentTool } from '@/lib/assessment-tools';

interface AssessmentToolFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tool: AssessmentTool) => void;
  initialTool?: Partial<AssessmentTool>;
  domainOptions: Array<{ value: string; label: string }>;
}

export function AssessmentToolForm({ 
  isOpen, 
  onClose, 
  onSave, 
  initialTool, 
  domainOptions 
}: AssessmentToolFormProps) {
  const [tool, setTool] = useState<Partial<AssessmentTool>>(
    initialTool || {
      type: 'quantitative',
      domains: [],
      authors: [],
      subtests: []
    }
  );

  const [newAuthor, setNewAuthor] = useState('');
  const [newDomain, setNewDomain] = useState('');

  const handleSave = useCallback(() => {
    if (!tool.name || !tool.id) {
      alert('Tool name and ID are required');
      return;
    }

    const toolId = tool.id || tool.name.toLowerCase().replace(/\s+/g, '_');
    
    const completeToolData: AssessmentTool = {
      id: toolId,
      name: tool.name,
      year: tool.year || 'N/A',
      authors: tool.authors || [],
      targetPopulation: tool.targetPopulation || '',
      targetAgeRange: tool.targetAgeRange || '',
      type: tool.type as 'quantitative' | 'qualitative' | 'mixed',
      domains: tool.domains || [],
      description: tool.description || '',
      subtests: tool.subtests || [],
      caveats: tool.caveats || [],
      references: tool.references || []
    };

    onSave(completeToolData);
    onClose();
    
    // Reset form
    setTool({
      type: 'quantitative',
      domains: [],
      authors: [],
      subtests: []
    });
  }, [tool, onSave, onClose]);

  const addAuthor = useCallback(() => {
    if (newAuthor.trim()) {
      setTool(prev => ({
        ...prev,
        authors: [...(prev.authors || []), newAuthor.trim()]
      }));
      setNewAuthor('');
    }
  }, [newAuthor]);

  const removeAuthor = useCallback((index: number) => {
    setTool(prev => ({
      ...prev,
      authors: prev.authors?.filter((_, i) => i !== index) || []
    }));
  }, []);

  const toggleDomain = useCallback((domain: string) => {
    setTool(prev => {
      const currentDomains = prev.domains || [];
      const newDomains = currentDomains.includes(domain)
        ? currentDomains.filter(d => d !== domain)
        : [...currentDomains, domain];
      
      return { ...prev, domains: newDomains };
    });
  }, []);

  if (!isOpen) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Add Custom Assessment Tool</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="toolName">Tool Name *</Label>
            <Input
              id="toolName"
              value={tool.name || ''}
              onChange={(e) => setTool(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Custom Language Assessment"
            />
          </div>
          
          <div>
            <Label htmlFor="toolId">Tool ID *</Label>
            <Input
              id="toolId"
              value={tool.id || ''}
              onChange={(e) => setTool(prev => ({ ...prev, id: e.target.value }))}
              placeholder="e.g., custom_lang_assess"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="toolYear">Year</Label>
            <Input
              id="toolYear"
              value={tool.year || ''}
              onChange={(e) => setTool(prev => ({ ...prev, year: e.target.value }))}
              placeholder="e.g., 2024"
            />
          </div>
          
          <div>
            <Label htmlFor="toolType">Type</Label>
            <select
              id="toolType"
              value={tool.type || 'quantitative'}
              onChange={(e) => setTool(prev => ({ 
                ...prev, 
                type: e.target.value as 'quantitative' | 'qualitative' | 'mixed' 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="quantitative">Quantitative</option>
              <option value="qualitative">Qualitative</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={tool.description || ''}
            onChange={(e) => setTool(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of what this tool assesses..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="targetPop">Target Population</Label>
            <Input
              id="targetPop"
              value={tool.targetPopulation || ''}
              onChange={(e) => setTool(prev => ({ ...prev, targetPopulation: e.target.value }))}
              placeholder="e.g., School-age children"
            />
          </div>
          
          <div>
            <Label htmlFor="ageRange">Age Range</Label>
            <Input
              id="ageRange"
              value={tool.targetAgeRange || ''}
              onChange={(e) => setTool(prev => ({ ...prev, targetAgeRange: e.target.value }))}
              placeholder="e.g., 5-12 years"
            />
          </div>
        </div>

        <div>
          <Label>Authors</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="Add author name"
              onKeyPress={(e) => e.key === 'Enter' && addAuthor()}
            />
            <Button
              onClick={addAuthor}
              size="sm"
              type="button"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tool.authors?.map((author, index) => (
              <div
                key={index}
                className="bg-gray-100 px-2 py-1 rounded-md text-sm flex items-center gap-1"
              >
                {author}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 w-4 h-4"
                  onClick={() => removeAuthor(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Domains</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {domainOptions.map((domain) => (
              <div key={domain.value} className="flex items-center space-x-2">
                <Switch
                  id={`domain-${domain.value}`}
                  checked={tool.domains?.includes(domain.value) || false}
                  onCheckedChange={() => toggleDomain(domain.value)}
                />
                <Label htmlFor={`domain-${domain.value}`} className="text-sm">
                  {domain.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Tool
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}