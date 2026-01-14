'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { MarkDisplay } from '@/components/common/MarkDisplay'
import { Scale, FileText, Gavel, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

interface Report {
  id: string
  reason: string
  evidence: string | null
  status: string
  reporter: { nickname: string }
  reported: { nickname: string }
  order?: { orderNumber: string }
  createdAt: string
}

interface Trial {
  id: string
  scheduledAt: string
  verdict: string | null
  fineAmount: number | null
  fineReduced: boolean
  finalFine: number | null
  status: string
  report: {
    reason: string
    reporter: { nickname: string }
    reported: { nickname: string }
  }
  defendant: { nickname: string }
  plaintiff: { nickname: string }
  createdAt: string
}

export default function TrialPage() {
  const { data: session } = useSession()
  const [reports, setReports] = useState<Report[]>([])
  const [trials, setTrials] = useState<Trial[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [reportsRes, trialsRes] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/trials')
      ])

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json()
        setReports(reportsData)
      }

      if (trialsRes.ok) {
        const trialsData = await trialsRes.json()
        setTrials(trialsData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" />대기중</Badge>
      case 'REVIEWING':
        return <Badge variant="warning"><AlertTriangle className="mr-1 h-3 w-3" />검토중</Badge>
      case 'SCHEDULED':
        return <Badge><Gavel className="mr-1 h-3 w-3" />재판 예정</Badge>
      case 'IN_TRIAL':
        return <Badge variant="destructive"><Scale className="mr-1 h-3 w-3" />재판중</Badge>
      case 'COMPLETED':
        return <Badge variant="secondary"><CheckCircle className="mr-1 h-3 w-3" />완료</Badge>
      case 'DISMISSED':
        return <Badge variant="outline">기각</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const myId = session?.user?.id
  const myNickname = (session?.user as { nickname?: string })?.nickname
  const myReports = reports.filter(r => r.reporter.nickname === myNickname)
  const againstMe = reports.filter(r => r.reported.nickname === myNickname)
  const myTrials = trials.filter(t =>
    t.plaintiff.nickname === myNickname ||
    t.defendant.nickname === myNickname
  )

  const scheduledTrials = trials.filter(t => t.status === 'SCHEDULED')
  const completedTrials = trials.filter(t => t.status === 'COMPLETED')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">재판소</h1>
          <p className="text-gray-600">공정한 재판으로 분쟁을 해결합니다</p>
        </div>
        <Link href="/trial/report">
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            신고하기
          </Button>
        </Link>
      </div>

      {scheduledTrials.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-800 flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              예정된 재판 ({scheduledTrials.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scheduledTrials.map(trial => (
              <Card key={trial.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {trial.plaintiff.nickname} vs {trial.defendant.nickname}
                      </p>
                      <p className="text-sm text-gray-600">{trial.report.reason}</p>
                      <p className="text-sm text-purple-600 mt-1">
                        예정: {new Date(trial.scheduledAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                    {getStatusBadge(trial.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="my-reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-reports">
            내가 한 신고
            {myReports.length > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {myReports.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="against-me">
            나를 신고
            {againstMe.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {againstMe.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-trials">내 재판</TabsTrigger>
          <TabsTrigger value="records">판결 기록</TabsTrigger>
        </TabsList>

        <TabsContent value="my-reports" className="space-y-4">
          {myReports.length > 0 ? (
            <div className="space-y-3">
              {myReports.map(report => (
                <Card key={report.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{report.reported.nickname}님 신고</p>
                        <p className="text-sm text-gray-600">{report.reason}</p>
                        {report.order && (
                          <p className="text-xs text-gray-400 mt-1">
                            주문: {report.order.orderNumber}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="h-12 w-12 text-gray-400" />}
              title="신고 내역이 없습니다"
              description="문제가 있으면 신고하기를 눌러주세요"
            />
          )}
        </TabsContent>

        <TabsContent value="against-me" className="space-y-4">
          {againstMe.length > 0 ? (
            <div className="space-y-3">
              {againstMe.map(report => (
                <Card key={report.id} className="border-red-200">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{report.reporter.nickname}님이 신고</p>
                        <p className="text-sm text-gray-600">{report.reason}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(report.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle className="h-12 w-12 text-green-400" />}
              title="신고당한 적이 없습니다"
              description="깨끗한 기록을 유지하세요!"
            />
          )}
        </TabsContent>

        <TabsContent value="my-trials" className="space-y-4">
          {myTrials.length > 0 ? (
            <div className="space-y-3">
              {myTrials.map(trial => {
                const isDefendant = trial.defendant.nickname === myNickname
                return (
                  <Card key={trial.id} className={isDefendant ? 'border-red-200' : ''}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {trial.plaintiff.nickname} vs {trial.defendant.nickname}
                            </p>
                            <Badge variant={isDefendant ? 'destructive' : 'default'}>
                              {isDefendant ? '피고' : '원고'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{trial.report.reason}</p>
                          {trial.verdict && (
                            <div className="mt-2 p-2 bg-gray-50 rounded">
                              <p className="text-sm font-medium">판결: {trial.verdict}</p>
                              {trial.finalFine && trial.finalFine > 0 && (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm text-red-600">벌금:</span>
                                  <MarkDisplay amount={trial.finalFine} size="sm" />
                                  {trial.fineReduced && (
                                    <Badge variant="success" className="text-xs">30% 감면</Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {getStatusBadge(trial.status)}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Scale className="h-12 w-12 text-gray-400" />}
              title="참여한 재판이 없습니다"
              description=""
            />
          )}
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          {completedTrials.length > 0 ? (
            <div className="space-y-3">
              {completedTrials.map(trial => (
                <Card key={trial.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {trial.plaintiff.nickname} vs {trial.defendant.nickname}
                        </p>
                        <p className="text-sm text-gray-600">{trial.report.reason}</p>
                        {trial.verdict && (
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <p className="text-sm font-medium">판결: {trial.verdict}</p>
                            {trial.finalFine && trial.finalFine > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm">벌금:</span>
                                <MarkDisplay amount={trial.finalFine} size="sm" />
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(trial.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      {getStatusBadge(trial.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Gavel className="h-12 w-12 text-gray-400" />}
              title="판결 기록이 없습니다"
              description=""
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
