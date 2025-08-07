'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Report } from '@/lib/schemas/report'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { useToast } from '@/lib/context/ToastContext'

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean
    reportId: string
    reportTitle: string
  }>({
    isOpen: false,
    reportId: '',
    reportTitle: ''
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await fetch('/api/reports')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setReports(data)
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchReports()
  }, [])

  const handleCreateReport = () => {
    // For now, we'll just navigate to a new page or open a modal
    // Later, this will trigger the API call to create a new report
    router.push('/dashboard/reports/new')
  }

  const openDeleteDialog = (reportId: string, reportTitle: string) => {
    setDeleteDialog({
      isOpen: true,
      reportId,
      reportTitle
    })
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      reportId: '',
      reportTitle: ''
    })
  }

  const handleDeleteReport = async () => {
    setIsDeleting(true)
    
    try {
      const supabase = createBrowserSupabase()
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', deleteDialog.reportId)

      if (error) {
        console.error('Error deleting report:', error)
        showToast({
          type: 'error',
          title: 'Delete Failed',
          description: 'Failed to delete report. Please try again.'
        })
        return
      }

      // Remove the report from the local state
      setReports(reports.filter(report => report.id !== deleteDialog.reportId))
      
      // Show success message
      showToast({
        type: 'success',
        title: 'Report Deleted',
        description: `"${deleteDialog.reportTitle}" has been successfully deleted.`
      })
      
      // Close dialog
      closeDeleteDialog()
    } catch (err) {
      console.error('Exception deleting report:', err)
      showToast({
        type: 'error',
        title: 'Delete Failed',
        description: 'Failed to delete report. Please try again.'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading reports...</div>
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-medium">Your Reports</h1>
        <Button onClick={handleCreateReport}>Create New Report</Button>
      </div>

      {reports.length === 0 ? (
        <p>No reports found. Click "Create New Report" to get started.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">{report.title}</TableCell>
                <TableCell>{report.type}</TableCell>
                <TableCell>{report.status}</TableCell>
                <TableCell>
                  {report.updatedAt
                    ? new Date(report.updatedAt).toLocaleDateString()
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => router.push(`/dashboard/reports/${report.id}`)}>
                      View/Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openDeleteDialog(report.id, report.title)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteReport}
        title="Delete Report"
        message={`Are you sure you want to delete "${deleteDialog.reportTitle}"? This action cannot be undone.`}
        confirmText="Delete Report"
        cancelText="Cancel"
        variant="error"
        isLoading={isDeleting}
      />
    </div>
  )
}