'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AssessmentResultsProps {
  toolId: string;
  onSave: (results: any) => void;
}

export function AssessmentResults({ toolId, onSave }: AssessmentResultsProps) {
  const [scores, setScores] = useState({
    standardScore: '',
    percentile: '',
    ageEquivalent: '',
  });
  
  const [notes, setNotes] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      toolId,
      date: new Date().toISOString(),
      scores: [
        {
          type: 'Standard Score',
          value: parseInt(scores.standardScore),
          status: getScoreStatus(parseInt(scores.standardScore)),
        },
        {
          type: 'Percentile',
          value: parseInt(scores.percentile),
          status: getScoreStatus(parseInt(scores.standardScore)),
        },
      ],
      notes,
    });
  };
  
  // Helper function to determine status
  const getScoreStatus = (score: number) => {
    if (score < 85) return 'Below Average';
    if (score > 115) return 'Above Average';
    return 'Average';
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Results</CardTitle>
        <CardDescription>Record scores and clinical observations</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="standardScore">Standard Score</Label>
              <Input 
                id="standardScore"
                type="number" 
                value={scores.standardScore}
                onChange={(e) => setScores({...scores, standardScore: e.target.value})}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentile">Percentile</Label>
              <Input 
                id="percentile"
                type="number" 
                value={scores.percentile}
                onChange={(e) => setScores({...scores, percentile: e.target.value})}
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ageEquivalent">Age Equivalent</Label>
              <Input 
                id="ageEquivalent"
                value={scores.ageEquivalent}
                onChange={(e) => setScores({...scores, ageEquivalent: e.target.value})}
                placeholder="8;2"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Clinical Observations</Label>
            <Textarea 
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter observations and notes about the assessment"
              rows={4}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline">Cancel</Button>
            <Button type="submit">Save Results</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}