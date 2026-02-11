// app/(admin)/admin/moderation/page.tsx
"use client"

import { useState, useEffect } from "react"
import { adminAPI } from "@/lib/api/admin"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertTriangle, CheckCircle, XCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

export default function ModerationPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'pending' | 'reviewed' | 'all'>('pending')

  useEffect(() => {
    loadReports()
  }, [statusFilter])

  const loadReports = async () => {
    try {
      setLoading(true)
      const result = await adminAPI.getReports(
        1, 
        50, 
        statusFilter === 'all' ? undefined : statusFilter
      )
      setReports(result.reports || [])
    } catch (error: any) {
      console.error("Failed to load reports:", error)
      toast.error("Failed to load reports")
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (reportId: string) => {
    try {
      await adminAPI.updateReportStatus(reportId, 'resolved', 'approved')
      toast.success("Report marked as resolved")
      loadReports()
    } catch (error: any) {
      toast.error("Failed to resolve report")
    }
  }

  const handleDismiss = async (reportId: string) => {
    try {
      await adminAPI.updateReportStatus(reportId, 'dismissed', 'no_action')
      toast.success("Report dismissed")
      loadReports()
    } catch (error: any) {
      toast.error("Failed to dismiss report")
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Shield className="w-8 h-8 text-purple-500" />
          Content Moderation
        </h1>
        <p className="text-gray-400">Review and manage reported content</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Button
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('pending')}
          className={statusFilter === 'pending' ? 'bg-purple-600' : 'border-gray-700'}
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === 'reviewed' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('reviewed')}
          className={statusFilter === 'reviewed' ? 'bg-purple-600' : 'border-gray-700'}
        >
          Reviewed
        </Button>
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('all')}
          className={statusFilter === 'all' ? 'bg-purple-600' : 'border-gray-700'}
        >
          All Reports
        </Button>
      </div>

      {/* Reports */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">All Clear!</h3>
          <p className="text-gray-400">No {statusFilter !== 'all' ? statusFilter : ''} reports at the moment</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="bg-gray-900 border-gray-800 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-white">
                      {report.report_type} Report
                    </h3>
                    <Badge
                      variant="outline"
                      className={
                        report.status === 'pending'
                          ? 'border-yellow-500 text-yellow-400'
                          : report.status === 'resolved'
                          ? 'border-green-500 text-green-400'
                          : 'border-gray-500 text-gray-400'
                      }
                    >
                      {report.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">
                      <span className="text-gray-500">Reason:</span> {report.reason}
                    </p>
                    {report.description && (
                      <p className="text-gray-300">
                        <span className="text-gray-500">Details:</span> {report.description}
                      </p>
                    )}
                    <p className="text-gray-400">
                      Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {report.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolve(report.id)}
                      className="border-green-600 text-green-400 hover:bg-green-600/10"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDismiss(report.id)}
                      className="border-gray-600 text-gray-400 hover:bg-gray-600/10"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
