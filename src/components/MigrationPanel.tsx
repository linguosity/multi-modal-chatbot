'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, RefreshCw, FileText } from 'lucide-react'

interface MigrationStatus {
  totalReports: number;
  reportsNeedingMigration: number;
  needsMigration: boolean;
  reportsToMigrate: Array<{ id: string; title: string }>;
}

interface MigrationResult {
  message: string;
  migratedCount: number;
  totalReports: number;
  results: Array<{
    reportId: string;
    title: string;
    status: 'success' | 'error' | 'skipped';
    error?: string;
    reason?: string;
  }>;
}

export const MigrationPanel: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check migration status on component mount
  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/migrate-reports');
      if (!response.ok) {
        throw new Error('Failed to check migration status');
      }
      const status = await response.json();
      setMigrationStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    setLoading(true);
    setError(null);
    setMigrationResult(null);
    try {
      const response = await fetch('/api/migrate-reports', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Migration failed');
      }
      const result = await response.json();
      setMigrationResult(result);
      // Refresh migration status
      await checkMigrationStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !migrationStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Checking migration status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={checkMigrationStatus} className="mt-4" variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!migrationStatus?.needsMigration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Migration Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            All your reports ({migrationStatus?.totalReports || 0}) are using the new rich text format. 
            No migration needed!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Report Migration Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="font-medium text-blue-900 mb-2">What's changing?</h4>
          <p className="text-sm text-blue-800 mb-2">
            We've upgraded the report editor to use a single, powerful rich text editor with templates 
            instead of the previous bullet points system.
          </p>
          <p className="text-sm text-blue-800">
            Your existing reports need to be migrated to the new format. This is a one-time process 
            that will convert your bullet points to rich text content.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Reports:</span>
            <span className="font-medium">{migrationStatus.totalReports}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Reports Needing Migration:</span>
            <span className="font-medium text-orange-600">{migrationStatus.reportsNeedingMigration}</span>
          </div>
        </div>

        {migrationStatus.reportsToMigrate.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Reports to be migrated:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {migrationStatus.reportsToMigrate.map((report) => (
                <div key={report.id} className="text-xs bg-gray-50 p-2 rounded">
                  {report.title}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={runMigration} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Migrate Reports
              </>
            )}
          </Button>
          <Button 
            onClick={checkMigrationStatus} 
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {migrationResult && (
          <Alert className="mt-4">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Migration Complete!</AlertTitle>
            <AlertDescription>
              {migrationResult.message}
              <div className="mt-2 space-y-1">
                {migrationResult.results.map((result, index) => (
                  <div key={index} className="text-xs flex items-center gap-2">
                    {result.status === 'success' && <CheckCircle className="h-3 w-3 text-green-600" />}
                    {result.status === 'error' && <AlertCircle className="h-3 w-3 text-red-600" />}
                    {result.status === 'skipped' && <span className="h-3 w-3 text-gray-400">-</span>}
                    <span>{result.title}: {result.status}</span>
                    {result.error && <span className="text-red-600">({result.error})</span>}
                    {result.reason && <span className="text-gray-500">({result.reason})</span>}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};