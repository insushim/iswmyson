'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { MarkDisplay } from '@/components/common/MarkDisplay'
import { ArrowLeft, Scale, Gavel, Clock, CheckCircle, AlertTriangle, Percent } from 'lucide-react'
import toast from 'react-hot-toast'

interface Trial {
  id: string
  scheduledAt: string
  verdict: string | null
  fineAmount: number | null
  fineReduced: boolean
  finalFine: number | null
  status: string
  report: {
    id: string
    reason: string
    evidence: string | null
    reporter: { nickname: string }
    reported: { nickname: string }
    order?: { orderNumber: string; customRequest: string }
  }
  defendant: { id: string; nickname: string }
  plaintiff: { id: string; nickname: string }
  createdAt: string
}

export default function JudgeTrialsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [trials, setTrials] = useState<Trial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [verdictingId, setVerdictingId] = useState<string | null>(null)
  const [verdictForm, setVerdictForm] = useState({
    verdict: '',
    fineAmount: ''
  })

  useEffect(() => {
    if (session?.user && !(session.user as { isJudge?: boolean }).isJudge) {
      router.push('/')
      return
    }
    fetchTrials()
  }, [session, router])

  const fetchTrials = async () => {
    try {
      const response = await fetch('/api/trials')
      if (response.ok) {
        const data = await response.json()
        setTrials(data)
      }
    } catch (error) {
      console.error('Failed to fetch trials:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerdict = async (trialId: string) => {
    if (!verdictForm.verdict.trim()) {
      toast.error('판결 내용을 입력해주세요')
      return
    }

    setProcessingId(trialId)
    try {
      const response = await fetch(`/api/trials/${trialId}/verdict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verdict: verdictForm.verdict,
          fineAmount: verdictForm.fineAmount ? parseInt(verdictForm.fineAmount) : 0
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '판결 실패')
      }

      toast.success('판결이 완료되었습니다!')
      setVerdictingId(null)
      setVerdictForm({ verdict: '', fineAmount: '' })
      fetchTrials()
    } catch (error) {
      const message = error instanceof Error ? error.message : '판결 실패'
      toast.error(message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReduceFine = async (trialId: string) => {
    if (!confirm('벌금을 30% 감면하시겠습니까?')) return

    setProcessingId(trialId)
    try {
      const response = await fetch(`/api/trials/${trialId}/reduce`, {
        method: 'POST'
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '감면 실패')
      }

      toast.success('벌금이 30% 감면되었습니다!')
      fetchTrials()
    } catch (error) {
      const message = error instanceof Error ? error.message : '감면 실패'
      toast.error(message)
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge><Clock className="mr-1 h-3 w-3" />재판 예정</Badge>
      case 'IN_TRIAL':
        return <Badge variant="destructive"><Scale className="mr-1 h-3 w-3" />재판중</Badge>
      case 'COMPLETED':
        return <Badge variant="secondary"><CheckCircle className="mr-1 h-3 w-3" />완료</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const scheduledTrials = trials.filter(t => t.status === 'SCHEDULED')
  const inTrialTrials = trials.filter(t => t.status === 'IN_TRIAL')
  const completedTrials = trials.filter(t => t.status === 'COMPLETED')

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
            <h1 className="text-xl font-bold text-gray-900">재판 관리</h1>
            <p className="text-sm text-gray-500">예정된 재판을 진행하고 판결하세요</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Tabs defaultValue="scheduled" className="space-y-4">
          <TabsList>
            <TabsTrigger value="scheduled">
              재판 예정
              {scheduledTrials.length > 0 && (
                <Badge className="ml-2">{scheduledTrials.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="in-trial">
              진행중
              {inTrialTrials.length > 0 && (
                <Badge variant="destructive" className="ml-2">{inTrialTrials.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">판결 완료</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="space-y-4">
            {scheduledTrials.length > 0 ? (
              scheduledTrials.map(trial => (
                <Card key={trial.id} className="border-purple-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {trial.plaintiff.nickname} vs {trial.defendant.nickname}
                        </CardTitle>
                        <CardDescription>
                          예정: {trial.scheduledAt}
                        </CardDescription>
                      </div>
                      {getStatusBadge(trial.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">신고 사유</p>
                      <p className="font-medium">{trial.report.reason}</p>
                    </div>
                    {trial.report.evidence && (
                      <div>
                        <p className="text-sm text-gray-500">증거</p>
                        <p className="text-sm bg-gray-50 p-2 rounded">{trial.report.evidence}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => setVerdictingId(trial.id)}>
                      <Gavel className="mr-2 h-4 w-4" />
                      판결하기
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={<Scale className="h-12 w-12 text-gray-400" />}
                title="예정된 재판이 없습니다"
                description=""
              />
            )}
          </TabsContent>

          <TabsContent value="in-trial" className="space-y-4">
            {inTrialTrials.length > 0 ? (
              inTrialTrials.map(trial => (
                <Card key={trial.id} className="border-red-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {trial.plaintiff.nickname} vs {trial.defendant.nickname}
                        </CardTitle>
                      </div>
                      {getStatusBadge(trial.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">신고 사유</p>
                      <p className="font-medium">{trial.report.reason}</p>
                    </div>

                    {verdictingId === trial.id ? (
                      <div className="p-4 bg-purple-50 rounded-lg space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">판결 내용</label>
                          <Textarea
                            value={verdictForm.verdict}
                            onChange={(e) => setVerdictForm({ ...verdictForm, verdict: e.target.value })}
                            placeholder="판결 내용을 입력하세요 (예: 유죄 - 주문 미이행)"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">벌금 (마크, 없으면 0)</label>
                          <Input
                            type="number"
                            value={verdictForm.fineAmount}
                            onChange={(e) => setVerdictForm({ ...verdictForm, fineAmount: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleVerdict(trial.id)}
                            disabled={processingId === trial.id}
                          >
                            {processingId === trial.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Gavel className="mr-2 h-4 w-4" />
                            )}
                            판결 선고
                          </Button>
                          <Button variant="outline" onClick={() => setVerdictingId(null)}>
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button onClick={() => setVerdictingId(trial.id)}>
                        <Gavel className="mr-2 h-4 w-4" />
                        판결하기
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={<Gavel className="h-12 w-12 text-gray-400" />}
                title="진행중인 재판이 없습니다"
                description=""
              />
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedTrials.length > 0 ? (
              completedTrials.map(trial => (
                <Card key={trial.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {trial.plaintiff.nickname} vs {trial.defendant.nickname}
                        </CardTitle>
                        <CardDescription>
                          {new Date(trial.createdAt).toLocaleDateString('ko-KR')}
                        </CardDescription>
                      </div>
                      {getStatusBadge(trial.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">판결</p>
                      <p className="font-medium">{trial.verdict}</p>
                      {trial.fineAmount && trial.fineAmount > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-gray-500">벌금:</span>
                          <MarkDisplay amount={trial.finalFine || trial.fineAmount} />
                          {trial.fineReduced && (
                            <Badge variant="success" className="text-xs">30% 감면</Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {trial.fineAmount && trial.fineAmount > 0 && !trial.fineReduced && (
                      <Button
                        variant="outline"
                        onClick={() => handleReduceFine(trial.id)}
                        disabled={processingId === trial.id}
                      >
                        <Percent className="mr-2 h-4 w-4" />
                        30% 감면 적용
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={<CheckCircle className="h-12 w-12 text-gray-400" />}
                title="완료된 재판이 없습니다"
                description=""
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
