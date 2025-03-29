import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ReportConclusion } from '@/types/reportTypes';

interface ConclusionSectionProps {
  conclusion: ReportConclusion;
  onToggleDomainEligibility: (domain: string, value: boolean) => void;
}

/**
 * Component for displaying conclusion and recommendations
 */
export const ConclusionSection: React.FC<ConclusionSectionProps> = ({ 
  conclusion,
  onToggleDomainEligibility 
}) => {
  if (!conclusion) return null;

  return (
    <div className="mb-8">
      <h3 className="text-base font-semibold text-amber-700 mb-3 pb-1 border-b border-amber-200">Conclusion & Recommendations</h3>
      <div className="grid grid-cols-1 gap-3">
        {/* Eligibility subsection */}
        {conclusion.eligibility && (
          <Card id="eligibility" className="border border-amber-100 shadow-sm bg-amber-50/30">
            <CardHeader className="py-2 px-3 bg-amber-50">
              <CardTitle className="text-sm font-medium text-amber-800">Eligibility Determination</CardTitle>
            </CardHeader>
            <CardContent className="p-3 text-[11px]">
              <p className="mb-2 font-medium">{conclusion.eligibility.californiaEdCode}</p>
              
              <h5 className="text-xs font-semibold mb-1 text-gray-600">Domain Eligibility</h5>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(conclusion.eligibility.domains).map(([domain, isEligible]) => (
                  <div 
                    key={domain} 
                    className="flex items-center gap-2 p-2 border rounded bg-white hover:bg-gray-50 cursor-pointer"
                    onClick={() => onToggleDomainEligibility(domain, !isEligible)}
                  >
                    <input 
                      type="checkbox" 
                      checked={isEligible} 
                      className="h-3 w-3 text-green-600 rounded" 
                      onChange={(e) => {
                        onToggleDomainEligibility(domain, e.target.checked);
                        // Stop event from propagating to the parent div
                        e.stopPropagation();
                      }}
                    />
                    <div className="flex-1 font-medium text-[10px]">
                      {domain.charAt(0).toUpperCase() + domain.slice(1)}
                    </div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isEligible ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Conclusion summary */}
        {conclusion.conclusion && conclusion.conclusion.summary && (
          <Card id="summary" className="border border-amber-100 shadow-sm bg-amber-50/30">
            <CardHeader className="py-2 px-3 bg-amber-50">
              <CardTitle className="text-sm font-medium text-amber-800">Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-3 text-xs">
              <p>{conclusion.conclusion.summary}</p>
            </CardContent>
          </Card>
        )}
        
        {/* Recommendations */}
        {conclusion.recommendations && (
          <div id="recommendations" className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Services */}
            <Card className="border border-amber-100 shadow-sm bg-amber-50/30">
              <CardHeader className="py-2 px-3 bg-amber-50">
                <CardTitle className="text-sm font-medium text-amber-800">Services</CardTitle>
              </CardHeader>
              <CardContent className="p-3 text-xs">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="font-medium pr-2">Type:</td>
                      <td>{conclusion.recommendations.services.typeOfService}</td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-2">Frequency:</td>
                      <td>{conclusion.recommendations.services.frequency}</td>
                    </tr>
                    <tr>
                      <td className="font-medium pr-2">Setting:</td>
                      <td>{conclusion.recommendations.services.setting}</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
            
            {/* Accommodations & Strategies */}
            <Card className="border border-amber-100 shadow-sm bg-amber-50/30">
              <CardHeader className="py-2 px-3 bg-amber-50">
                <CardTitle className="text-sm font-medium text-amber-800">Accommodations & Strategies</CardTitle>
              </CardHeader>
              <CardContent className="p-3 text-xs">
                {conclusion.recommendations.accommodations.length > 0 && (
                  <div className="mb-2">
                    <h5 className="text-xs font-semibold mb-1 text-gray-600">Accommodations</h5>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {conclusion.recommendations.accommodations.map((rec, index) => (
                        <li key={index} className="text-gray-800">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {conclusion.recommendations.facilitationStrategies.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold mb-1 text-gray-600">Facilitation Strategies</h5>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {conclusion.recommendations.facilitationStrategies.map((strat, index) => (
                        <li key={index} className="text-gray-800">{strat}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConclusionSection;