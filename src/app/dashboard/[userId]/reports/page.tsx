'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, FileText, Search } from 'lucide-react';
import { useReports } from '@/components/contexts/reports-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Mock data for reports
const MOCK_REPORTS = [
  {
    id: '123',
    title: 'John Smith Speech-Language Report',
    type: 'speech-language',
    createDate: '2024-03-15',
    updateDate: '2024-03-18',
    studentName: 'John Smith',
    studentAge: '8'
  },
  {
    id: '456',
    title: 'Emma Johnson Speech-Language Report',
    type: 'speech-language',
    createDate: '2024-02-20',
    updateDate: '2024-03-10',
    studentName: 'Emma Johnson',
    studentAge: '5'
  }
];

export default function UserReportsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  
  // State for reports
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Clear section groups in the reports context
  const { setSectionGroups } = useReports();
  useEffect(() => {
    setSectionGroups([]);
  }, [setSectionGroups]);
  
  // Load reports (mock data for now)
  useEffect(() => {
    // Simulate API delay
    const timer = setTimeout(() => {
      // In a real app, you'd filter by userId here
      setReports(MOCK_REPORTS.map(report => ({
        ...report,
        userId
      })));
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [userId]);
  
  // Handle creating a new report
  const handleNewReport = () => {
    router.push(`/dashboard/${userId}/reports/new`);
  };
  
  // Handle viewing a report
  const handleViewReport = (reportId: string) => {
    router.push(`/dashboard/${userId}/reports/${reportId}`);
  };
  
  // Filter reports based on search query
  const filteredReports = reports.filter(report => 
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.studentName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Reports</h1>
        <Button onClick={handleNewReport}>
          <Plus className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {filteredReports.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No reports found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'No reports match your search criteria' : 'Create your first report to get started'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={handleNewReport}
                  className="mt-4"
                >
                  Create a report
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription>
                      Updated: {new Date(report.updateDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Student: {report.studentName}, Age: {report.studentAge}</p>
                    <p className="text-sm text-muted-foreground">Type: {report.type}</p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleViewReport(report.id)}
                    >
                      Open Report
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}