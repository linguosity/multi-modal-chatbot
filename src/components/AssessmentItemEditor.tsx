import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, BarChart3, User, Calendar, Target, AlertCircle, StickyNote } from 'lucide-react';
import { FieldHighlight } from './ui/FieldHighlight';
import { FieldSchema } from '@/lib/structured-schemas';

interface AssessmentItem {
  type?: 'Standardized Test' | 'Informal Assessment' | 'Observation' | 'Interview';
  title?: string;
  completed?: boolean;
  author?: string;
  year_published?: number;
  date_tested?: string;
  target_population?: string;
  domains_assessed?: string[];
  standard_score?: number;
  percentile?: number;
  confidence_interval?: string;
  qualitative_description?: string;
  examples_of_items?: string;
  notes?: string;
}

interface AssessmentItemEditorProps {
  item: AssessmentItem;
  onChange: (item: AssessmentItem) => void;
  onRemove: () => void;
  sectionId: string;
  itemIndex: number;
  schemaFields: FieldSchema[];
  isNewItem: boolean;
}

export function AssessmentItemEditor({
  item,
  onChange,
  onRemove,
  sectionId,
  itemIndex,
  schemaFields,
  isNewItem,
}: AssessmentItemEditorProps) {
  const [activeTab, setActiveTab] = useState<'tool' | 'results' | 'details' | 'domains'>('tool');

  // Check if this assessment type should show quantitative scores
  const isStandardizedTest = item.type === 'Standardized Test';

  const updateField = (fieldKey: string, value: any) => {
    onChange({ ...item, [fieldKey]: value });
  };



  const hasContent = (value: any): boolean => {
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'number' && value === 0) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Standardized Test': return <BarChart3 className="h-4 w-4" />;
      case 'Informal Assessment': return <FileText className="h-4 w-4" />;
      case 'Observation': return <Target className="h-4 w-4" />;
      case 'Interview': return <User className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };



  return (
    <div className="max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { id: 'tool', name: 'Tool', icon: '🔧' },
            { id: 'results', name: 'Results', icon: '📊' },
            { id: 'details', name: 'Details', icon: '📋' },
            { id: 'domains', name: 'Domains', icon: '🎯' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-[var(--clr-accent)] text-[var(--clr-accent)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Tool Tab */}
        {activeTab === 'tool' && (
          <div className="bg-white p-4 rounded-lg border border-slate-200">
        <FieldHighlight sectionId={sectionId} fieldPath={`assessment_items.${itemIndex}.title`}>
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Assessment Tool</label>
            <input
              type="text"
              value={item.title || ''}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="PLS-5, GFTA-3, Language Sample..."
              className="w-full px-3 py-2 text-lg font-medium border-0 border-b-2 border-slate-200 focus:border-[var(--clr-accent)] focus:outline-none bg-transparent"
            />
          </div>
        </FieldHighlight>

        <div className="grid grid-cols-2 gap-3">
          <FieldHighlight sectionId={sectionId} fieldPath={`assessment_items.${itemIndex}.type`}>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Type</label>
              <select
                value={item.type || ''}
                onChange={(e) => updateField('type', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--clr-accent)] bg-white"
              >
                <option value="">Select...</option>
                <option value="Standardized Test">Standardized</option>
                <option value="Informal Assessment">Informal</option>
                <option value="Observation">Observation</option>
                <option value="Interview">Interview</option>
              </select>
            </div>
          </FieldHighlight>

          <FieldHighlight sectionId={sectionId} fieldPath={`assessment_items.${itemIndex}.date_tested`}>
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Date Tested</label>
              <input
                type="date"
                value={item.date_tested || ''}
                onChange={(e) => updateField('date_tested', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--clr-accent)]"
              />
            </div>
          </FieldHighlight>
        </div>
          </div>
        )}

        {/* Results Tab - Conditional content based on assessment type */}
        {activeTab === 'results' && (
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              {isStandardizedTest ? 'Test Scores & Results' : 'Assessment Results'}
            </h3>
            
            {isStandardizedTest ? (
              <>
                {/* Quantitative Scores - Only for Standardized Tests */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <FieldHighlight sectionId={sectionId} fieldPath={`assessment_items.${itemIndex}.standard_score`}>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">SS</label>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        value={item.standard_score || ''}
                        onChange={(e) => updateField('standard_score', parseInt(e.target.value) || undefined)}
                        placeholder="85"
                        className="w-full px-2 py-1.5 text-sm text-center border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--clr-accent)]"
                      />
                    </div>
                  </FieldHighlight>

                  <FieldHighlight sectionId={sectionId} fieldPath={`assessment_items.${itemIndex}.percentile`}>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">%ile</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.percentile || ''}
                        onChange={(e) => updateField('percentile', parseInt(e.target.value) || undefined)}
                        placeholder="16"
                        className="w-full px-2 py-1.5 text-sm text-center border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--clr-accent)]"
                      />
                    </div>
                  </FieldHighlight>

                  <FieldHighlight sectionId={sectionId} fieldPath={`assessment_items.${itemIndex}.confidence_interval`}>
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-400 mb-1">Confidence Interval</label>
                      <input
                        type="text"
                        value={item.confidence_interval || ''}
                        onChange={(e) => updateField('confidence_interval', e.target.value)}
                        placeholder="80-90"
                        className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--clr-accent)]"
                      />
                    </div>
                  </FieldHighlight>
                </div>
              </>
            ) : null}

            {/* Qualitative Results - For all assessment types */}
            <FieldHighlight sectionId={sectionId} fieldPath={`assessment_items.${itemIndex}.qualitative_description`}>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {isStandardizedTest 
                    ? 'Results & Interpretation' 
                    : item.type === 'Observation' 
                      ? 'Observation Results'
                      : item.type === 'Interview'
                        ? 'Interview Results'
                        : 'Assessment Results'
                  }
                </label>
                <textarea
                  value={item.qualitative_description || ''}
                  onChange={(e) => updateField('qualitative_description', e.target.value)}
                  rows={isStandardizedTest ? 3 : 5}
                  placeholder={
                    isStandardizedTest 
                      ? 'Below average performance in receptive language skills...'
                      : item.type === 'Observation'
                        ? 'Student demonstrated difficulty with turn-taking during group activities...'
                        : item.type === 'Interview'
                          ? 'Parent reports concerns about child\'s communication at home...'
                          : 'Assessment findings and observations...'
                  }
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--clr-accent)] resize-none"
                />
              </div>
            </FieldHighlight>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="bg-white p-4 rounded-lg border border-slate-200">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Test Details</h3>
        
        <div className="grid grid-cols-3 gap-3 mb-3">
          <FieldHighlight sectionId={sectionId} fieldPath={`assessment_items.${itemIndex}.author`}>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Author</label>
              <input
                type="text"
                value={item.author || ''}
                onChange={(e) => updateField('author', e.target.value)}
                placeholder="Zimmerman"
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--clr-accent)]"
              />
            </div>
          </FieldHighlight>

          <FieldHighlight sectionId={sectionId} fieldPath={`assessment_items.${itemIndex}.year_published`}>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Year</label>
              <input
                type="number"
                min="1900"
                max="2030"
                value={item.year_published || ''}
                onChange={(e) => updateField('year_published', parseInt(e.target.value) || undefined)}
                placeholder="2011"
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--clr-accent)]"
              />
            </div>
          </FieldHighlight>

          <FieldHighlight sectionId={sectionId} fieldPath={`assessment_items.${itemIndex}.completed`}>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.completed || false}
                  onChange={(e) => updateField('completed', e.target.checked)}
                  className="w-4 h-4 text-[var(--clr-accent)] border-slate-300 rounded focus:ring-[var(--clr-accent)]"
                />
                <span className="text-xs text-slate-500">Complete</span>
              </label>
            </div>
          </FieldHighlight>
        </div>

        <FieldHighlight sectionId={sectionId} fieldPath={`assessment_items.${itemIndex}.target_population`}>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Target Population</label>
            <input
              type="text"
              value={item.target_population || ''}
              onChange={(e) => updateField('target_population', e.target.value)}
              placeholder="Birth through 7;11"
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--clr-accent)]"
            />
          </div>
        </FieldHighlight>
          </div>
        )}

        {/* Domains Tab */}
        {activeTab === 'domains' && (
          <div className="bg-white p-4 rounded-lg border border-slate-200">
        <FieldHighlight sectionId={sectionId} fieldPath={`assessment_items.${itemIndex}.domains_assessed`}>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Domains Assessed</label>
            <div className="grid grid-cols-3 gap-2">
              {['Articulation', 'Receptive Language', 'Expressive Language', 'Pragmatic Language', 'Voice', 'Fluency'].map((domain) => (
                <label key={domain} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(item.domains_assessed || []).includes(domain)}
                    onChange={(e) => {
                      const current = item.domains_assessed || [];
                      if (e.target.checked) {
                        updateField('domains_assessed', [...current, domain]);
                      } else {
                        updateField('domains_assessed', current.filter(d => d !== domain));
                      }
                    }}
                    className="w-3 h-3 text-[var(--clr-accent)] border-slate-300 rounded focus:ring-[var(--clr-accent)]"
                  />
                  <span className="text-slate-600">{domain}</span>
                </label>
              ))}
            </div>
          </div>
        </FieldHighlight>
          </div>
        )}

        {/* Notes - Show in any tab if they have content */}
        {(hasContent(item.examples_of_items) || hasContent(item.notes)) && (
        <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
          <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Additional Information</h3>
          
          {hasContent(item.examples_of_items) && (
            <FieldHighlight sectionId={sectionId} fieldPath={`assessment_items.${itemIndex}.examples_of_items`}>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Examples of Items</label>
                <textarea
                  value={item.examples_of_items || ''}
                  onChange={(e) => updateField('examples_of_items', e.target.value)}
                  rows={2}
                  placeholder="Specific test items or observations..."
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--clr-accent)] resize-none"
                />
              </div>
            </FieldHighlight>
          )}

          {hasContent(item.notes) && (
            <FieldHighlight sectionId={sectionId} fieldPath={`assessment_items.${itemIndex}.notes`}>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Additional Notes</label>
                <textarea
                  value={item.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={2}
                  placeholder="Additional observations..."
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-[var(--clr-accent)] resize-none"
                />
              </div>
            </FieldHighlight>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
