import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface Domain {
  name: string;
  id: string;
  description?: string;
  code?: string;
  selected: boolean;
}

interface EdCodeInfo {
  title: string;
  code: string;
  content: string;
}

interface EligibilityToggleCardProps {
  title?: string;
  domains: Domain[];
  edCodeInfo: Record<string, EdCodeInfo>;
  onChange?: (domains: Domain[]) => void;
}

export const EligibilityToggleCard: React.FC<EligibilityToggleCardProps> = ({
  title = "Eligibility Determination",
  domains = [],
  edCodeInfo = {},
  onChange
}) => {
  const [activeDomains, setActiveDomains] = useState<Domain[]>(domains);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  // Handle domain toggle
  const handleToggleDomain = (domainId: string, checked: boolean) => {
    const updatedDomains = activeDomains.map(domain => 
      domain.id === domainId ? { ...domain, selected: checked } : domain
    );
    
    setActiveDomains(updatedDomains);
    
    if (onChange) {
      onChange(updatedDomains);
    }
    
    // Auto-select this domain to show its details
    if (checked) {
      setSelectedDomain(domainId);
    } else if (selectedDomain === domainId) {
      // If we're deselecting the currently selected domain, clear the selection
      setSelectedDomain(null);
    }
  };

  // Check if we have any selected domains
  const hasSelectedDomains = activeDomains.some(domain => domain.selected);

  return (
    <Card className="bg-[#F8F7F4] border border-[#E6E0D6] rounded-lg shadow-sm mb-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-display font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      
      <Separator className="mb-4 bg-[#E6E0D6]" />
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-12 gap-6">
          {/* Left column - Domain toggles */}
          <div className="col-span-12 md:col-span-4 space-y-4 border-r border-[#E6E0D6] pr-6">
            <p className="text-sm text-muted-foreground mb-4">
              Select the domains that qualify the student for special education services.
            </p>
            
            {activeDomains.map(domain => (
              <div 
                key={domain.id} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                  domain.selected ? "bg-[#F0F3F2]" : "hover:bg-[#F0F3F2]/50",
                  selectedDomain === domain.id ? "border border-[#DCE4DF]" : "border border-transparent"
                )}
                onClick={() => domain.selected && setSelectedDomain(domain.id)}
              >
                <div className="flex-1 mr-3">
                  <Label 
                    htmlFor={`toggle-${domain.id}`} 
                    className="font-medium text-sm cursor-pointer"
                  >
                    {domain.name}
                  </Label>
                  {domain.description && (
                    <p className="text-xs text-muted-foreground mt-1">{domain.description}</p>
                  )}
                </div>
                <Switch 
                  id={`toggle-${domain.id}`}
                  checked={domain.selected}
                  onCheckedChange={(checked) => handleToggleDomain(domain.id, checked)}
                  className="data-[state=checked]:bg-[#6C8578]"
                />
              </div>
            ))}
            
            {activeDomains.length === 0 && (
              <div className="text-center p-4 text-muted-foreground">
                No domains available for eligibility determination.
              </div>
            )}
          </div>
          
          {/* Right column - Ed Code details */}
          <div className="col-span-12 md:col-span-8 pl-0 md:pl-6">
            {selectedDomain && activeDomains.find(d => d.id === selectedDomain)?.selected ? (
              <div className="animate-fadeIn">
                <h3 className="text-lg font-display font-medium text-[#5A7164] mb-3">
                  {edCodeInfo[selectedDomain]?.title || activeDomains.find(d => d.id === selectedDomain)?.name}
                </h3>
                
                {edCodeInfo[selectedDomain]?.code && (
                  <div className="bg-[#F0F3F2] rounded-md px-4 py-3 mb-4">
                    <p className="text-xs font-medium text-[#3C6E58]">
                      Education Code: {edCodeInfo[selectedDomain].code}
                    </p>
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {edCodeInfo[selectedDomain]?.content || (
                    <p>No additional information available for this eligibility category.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className={cn(
                "flex flex-col items-center justify-center text-center p-8",
                hasSelectedDomains ? "text-muted-foreground" : "text-[#A87C39]"
              )}>
                <div className="rounded-full bg-[#F1EEE9] p-4 mb-4">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className={cn(
                      "w-6 h-6",
                      hasSelectedDomains ? "text-[#6C8578]" : "text-[#A87C39]"
                    )}
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                </div>
                {hasSelectedDomains ? (
                  <p className="font-medium">Select a domain to view eligibility details</p>
                ) : (
                  <p className="font-medium">Select qualifying domains on the left</p>
                )}
                <p className="text-sm mt-2">
                  {hasSelectedDomains ? 
                    "Click on a selected domain to view detailed education code information" : 
                    "Toggle domains that qualify the student for special education services"}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EligibilityToggleCard;