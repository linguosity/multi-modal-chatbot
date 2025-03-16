'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { PdfUploader } from '@/components/reports/PdfUploader';

/**
 * A simple demo of the Claude Report Generator
 */
export default function SimpleClaudeDemoPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Record<string, string>>({
    parentConcern: "Parent reports that the student has difficulty with speech clarity and frustration when not understood.",
    pragmaticLanguage: "Student demonstrates appropriate eye contact and turn-taking during structured activities.",
    receptiveLanguage: "Student follows simple 1-2 step directions with occasional need for repetition.",
    expressiveLanguage: "Student uses 3-4 word sentences to communicate basic needs and wants.",
    articulation: "Student demonstrates multiple phonological processes including fronting and stopping that affect overall intelligibility.",
    assessmentData: "Formal testing is scheduled for next week.",
    recommendations: "Weekly speech therapy sessions are recommended to address articulation errors."
  });
  const [activeTab, setActiveTab] = useState<'text' | 'pdf'>('text');
  const [updatedField, setUpdatedField] = useState<string | null>(null);

  /**
   * Handle form submission for text input
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Make a simple determination about which field to update
      const inputLower = input.toLowerCase();
      let targetField = 'articulation';
      
      if (inputLower.includes('parent') || inputLower.includes('concern') || inputLower.includes('worried')) {
        targetField = 'parentConcern';
      } else if (inputLower.includes('direction') || inputLower.includes('understand') || inputLower.includes('follow')) {
        targetField = 'receptiveLanguage';
      } else if (inputLower.includes('express') || inputLower.includes('sentence') || inputLower.includes('speak')) {
        targetField = 'expressiveLanguage';
      } else if (inputLower.includes('social') || inputLower.includes('eye contact') || inputLower.includes('turn')) {
        targetField = 'pragmaticLanguage';
      } else if (inputLower.includes('front') || inputLower.includes('back') || 
                inputLower.includes('intelligible') || inputLower.includes('articulation')) {
        targetField = 'articulation';
      } else if (inputLower.includes('assess') || inputLower.includes('test') || 
                inputLower.includes('score') || inputLower.includes('percentile')) {
        targetField = 'assessmentData';
      } else if (inputLower.includes('recommend') || inputLower.includes('suggest') || 
                inputLower.includes('therapy') || inputLower.includes('treatment')) {
        targetField = 'recommendations';
      }
      
      // Simulate a delay for realism
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create professional content based on the input
      let updatedContent = '';
      const existingContent = result[targetField] || '';
      
      if (targetField === 'articulation') {
        if (inputLower.includes('fronting') && inputLower.includes('backing')) {
          updatedContent = `${existingContent} During playground observation, the student demonstrated both fronting and backing processes in spontaneous conversation. Speech was approximately 50% intelligible to an unfamiliar listener, which significantly impacts functional communication.`;
        } else {
          updatedContent = `${existingContent} ${input}`;
        }
      } else {
        // For other fields, append with proper formatting
        updatedContent = existingContent ? `${existingContent} ${input}` : input;
      }
      
      // Clean up any double spaces
      updatedContent = updatedContent.replace(/\s\s+/g, ' ').trim();
      
      // Update the result
      setResult(prev => ({
        ...prev,
        [targetField]: updatedContent
      }));
      
      // Highlight the updated field
      setUpdatedField(targetField);
      setTimeout(() => setUpdatedField(null), 3000);
      
      // Clear the input field
      setInput('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle PDF uploads
   */
  const handlePdfUpload = async (pdfData: string) => {
    setIsLoading(true);
    
    try {
      // Simulate a delay for realism
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock PDF data extraction with an update to assessmentData
      const updatedContent = `${result.assessmentData} PDF assessment data extracted: CELF-5 test results show scores in the 15th percentile for word classes and 18th percentile for formulated sentences.`;
      
      // Update the result
      setResult(prev => ({
        ...prev,
        'assessmentData': updatedContent.trim()
      }));
      
      // Highlight the updated field
      setUpdatedField('assessmentData');
      setTimeout(() => setUpdatedField(null), 3000);
    } catch (error) {
      console.error('Error processing PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get the display name for a section key
   */
  const getSectionDisplayName = (key: string): string => {
    const displayNames: Record<string, string> = {
      parentConcern: 'Parent Concern',
      receptiveLanguage: 'Receptive Language',
      expressiveLanguage: 'Expressive Language',
      pragmaticLanguage: 'Pragmatic Language',
      articulation: 'Articulation',
      assessmentData: 'Assessment Data',
      recommendations: 'Recommendations'
    };
    
    return displayNames[key] || key;
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-medium mb-2">Claude Report Generator</h1>
        <p className="text-gray-600 text-sm">
          Enter a single observation or upload a PDF document to update your speech-language report.
        </p>
      </header>
      
      <div className="flex flex-col md:flex-row md:gap-6">
        <div className="w-full md:w-1/2 mb-6 md:mb-0">
          <div className="bg-white shadow-sm border-0 overflow-hidden rounded-lg mb-6">
            <div className="bg-white border-b pb-3 px-4 pt-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                Claude Editor
                <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  Demo
                </span>
              </h2>
            </div>
            
            <div className="p-0">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-2 px-4 text-sm font-medium transition-colors
                    ${activeTab === 'text' 
                      ? 'text-purple-700 border-b-2 border-purple-700' 
                      : 'text-gray-500 hover:text-purple-600'
                    }`}
                >
                  Text Input
                </button>
                <button
                  onClick={() => setActiveTab('pdf')}
                  className={`flex-1 py-2 px-4 text-sm font-medium transition-colors
                    ${activeTab === 'pdf' 
                      ? 'text-purple-700 border-b-2 border-purple-700' 
                      : 'text-gray-500 hover:text-purple-600'
                    }`}
                >
                  PDF Upload
                </button>
              </div>
              
              <div className="p-4">
                {activeTab === 'text' ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter a single observation or assessment result..."
                        className="border rounded-lg h-12 px-4 w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        disabled={isLoading}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isLoading || !input.trim()} 
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-2 transition-colors"
                      >
                        {isLoading ? (
                          <>
                            <Spinner className="h-4 w-4 mr-2" />
                            Updating...
                          </>
                        ) : (
                          'Update Report'
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <PdfUploader 
                      onUpload={handlePdfUpload} 
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border text-sm">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <svg className="mr-2 text-purple-600" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Try these examples:
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li className="cursor-pointer hover:text-purple-600" onClick={() => setInput("Student produced /t/ for /k/ and /d/ for /g/ in all word positions")}>
                • "Student produced /t/ for /k/ and /d/ for /g/ in all word positions"
              </li>
              <li className="cursor-pointer hover:text-purple-600" onClick={() => setInput("Parent reports concerns about stuttering during class presentations")}>
                • "Parent reports concerns about stuttering during class presentations"
              </li>
              <li className="cursor-pointer hover:text-purple-600" onClick={() => setInput("Student follows 2-step directions when given visual supports")}>
                • "Student follows 2-step directions when given visual supports"
              </li>
            </ul>
          </div>
        </div>
        
        <div className="w-full md:w-1/2">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="border-b px-4 py-3 flex justify-between items-center">
              <h2 className="font-medium text-gray-900">Current Report</h2>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Live Preview
              </span>
            </div>
            <div className="p-0">
              {Object.entries(result).map(([key, value]) => (
                <div 
                  key={key}
                  className={`p-4 border-b last:border-b-0 transition-colors ${updatedField === key ? 'bg-green-50' : ''}`}
                >
                  <h3 className="font-medium text-gray-900 mb-1">{getSectionDisplayName(key)}</h3>
                  <p className="text-gray-700 text-sm">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}