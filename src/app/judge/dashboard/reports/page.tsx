'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { ArrowLeft, FileText, Gavel, Clock, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Report {
  id: string
  reason: string
  evidence: string | null
  status: string
  reporter: { nickname: string }
  reported: { nickname: string }
  order?: { orderNumber: string; customRequest: string }
  createdAt: string
}

export default function JudgeReportsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [schedulingId, setSchedulingId] = useState<string | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')

  useEffect(() => {
    if (session?.user && !(session.user as { isJudge?: boolean }).isJudge) {
      router.push('/')
      return
    }
    fetchReports()
  }, [session, router])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleScheduleTrial = async (reportId: string) => {
    if (!scheduleDate.trim()) {
      toast.error('재판 일정을 입력해주세요')
      return
    }

    setProcessingId(reportId)
    try {
      const response = await fetch('/api/trials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          scheduledAt: scheduleDate
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '재판 예약 실패')
      }

      toast.success('재판이 예약되었습니다!')
      setSchedulingId(null)
      setScheduleDate('')
      fetchReports()
    } catch (error) {
      const message = error instanceof Error ? error.message : '재판 예약 실패'
      toast.error(message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDismiss = async (reportId: string) => {
    if (!confirm('이 신고를 기각하시겠습니까?')) return

    setProcessingId(reportId)
    try {
      const response = await fetch(`/api/reports/${reportId}/dismiss`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('신고가 기각되었습니다')
        fetchReports()
      }
    } catch (error) {
      toast.error('기각 실패')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />대기중</Badge>
      case 'SCHEDULED':
        return <Badge><Gavel className="mr-1 h-3 w-3" />재판 예정</Badge>
      case 'COMPLETED':
        return <Badge variant="secondary"><CheckCircle className="mr-1 h-3 w-3" />완료</Badge>
      case 'DISMISSED':
        return <Badge variant="outline"><XCircle className="mr-1 h-3 w-3" />기각</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const pendingReports = reports.filter(r => r.status === 'PENDING')
  const scheduledReports = reports.filter(r => r.status === 'SCHEDULED')
  const completedReports = reports.filter(r => ['COMPLETED', 'DISMISSED'].includes(r.status))

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/judge/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              대시보드
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">신고 관리</h1>
            <p className="text-sm text-gray-500">접수된 신고를 검토하고 재판을 시작하세요</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              대기중
              {pendingReports.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingReports.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="scheduled">
              재판 예정
              {scheduledReports.length > 0 && (
                <Badge className="ml-2">{scheduledReports.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">처리 완료</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingReports.length > 0 ? (
              pendingReports.map(report => (
                <Card key={report.id} className="border-amber-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {report.reporter.nickname} → {report.reported.nickname}
                        </CardTitle>
                        <CardDescription>
                          {new Date(report.createdAt).toLocaleString('ko-KR')}
                        </CardDescription>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">신고 사유</p>
                      <p className="font-medium">{report.reason}</p>
                    </div>
                    {report.evidence && (
                      <div>
                        <p className="text-sm text-gray-500">증거</p>
                        <p className="text-sm bg-gray-50 p-2 rounded">{report.evidence}</p>
                      </div>
                    )}
                    {report.order && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">관련 주문</p>
                        <p className="text-sm">{report.order.customRequest}</p>
                        <p className="text-xs text-gray-500">{report.order.orderNumber}</p>
                      </div>
                    )}

                    {schedulingId === report.id ? (
                      <div className="p-3 bg-purple-50 rounded-lg space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">재판 일정</label>
                          <Input
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            placeholder="예: 2024년 1월 15일 오후 3시"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleScheduleTrial(report.id)}
                            disabled={processingId === report.id}
                          >
                            {processingId === report.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Gavel className="mr-2 h-4 w-4" />
                            )}
                            재판 예약
                          </Button>
                          <Button variant="outline" onClick={() => setSchedulingId(null)}>
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                  {schedulingId !== report.id && (
                    <CardFooter className="gap-2">
                      <Button onClick={() => setSchedulingId(report.id)}>
                        <Gavel className="mr-2 h-4 w-4" />
                        재판 시작
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDismiss(report.id)}
                        disabled={processingId === report.id}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        기각
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))
            ) : (
              <EmptyState
                icon={<FileText className="h-12 w-12 text-gray-400" />}
                title="대기중인 신고가 없습니다"
                description=""
              />
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            {scheduledReports.length > 0 ? (
              scheduledReports.map(report => (
                <Card key={report.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {report.reporter.nickname} vs {report.reported.nickname}
                        </p>
                        <p className="text-sm text-gray-600">{report.reason}</p>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={<Gavel className="h-12 w-12 text-gray-400" />}
                title="예정된 재판이 없습니다"
                description=""
              />
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedReports.length > 0 ? (
              completedReports.map(report => (
                <Card key={report.id} className="opacity-75">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {report.reporter.nickname} → {report.reported.nickname}
                        </p>
                        <p className="text-sm text-gray-600">{report.reason}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={<CheckCircle className="h-12 w-12 text-gray-400" />}
                title="처리된 신고가 없습니다"
                description=""
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
