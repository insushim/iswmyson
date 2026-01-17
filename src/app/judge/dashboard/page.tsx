'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Gavel, FileText, Scale, AlertTriangle, Users, Coins, ArrowRight, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

interface Stats {
  pendingReports: number
  scheduledTrials: number
  pendingObjections: number
  totalUsers: number
  totalMarks: number
}

interface User {
  id: string
  nickname: string
}

export default function JudgeDashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])

  // 재판하기 폼
  const [showTrialForm, setShowTrialForm] = useState(false)
  const [trialForm, setTrialForm] = useState({
    defendantId: '',
    plaintiffId: '',
    reason: '',
    verdict: '' as '' | 'GUILTY' | 'NOT_GUILTY',
    fineAmount: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [trialResult, setTrialResult] = useState<{
    verdict: string
    fineAmount: number
    defendant: string
  } | null>(null)

  useEffect(() => {
    if (session?.user && !(session.user as { isJudge?: boolean }).isJudge) {
      toast.error('권능 권한이 없습니다')
      router.push('/')
      return
    }
    fetchStats()
    fetchUsers()
  }, [session, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/list')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const [reportsRes, trialsRes, objectionsRes] = await Promise.all([
        fetch('/api/reports?status=PENDING'),
        fetch('/api/trials?status=SCHEDULED'),
        fetch('/api/judge/objections')
      ])

      const reports = reportsRes.ok ? await reportsRes.json() : []
      const trials = trialsRes.ok ? await trialsRes.json() : []
      const objections = objectionsRes.ok ? await objectionsRes.json() : []

      setStats({
        pendingReports: Array.isArray(reports) ? reports.length : 0,
        scheduledTrials: Array.isArray(trials) ? trials.length : 0,
        pendingObjections: Array.isArray(objections) ? objections.filter((o: { objectionStatus: string }) => o.objectionStatus === 'PENDING').length : 0,
        totalUsers: 0,
        totalMarks: 0
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitTrial = async () => {
    if (!trialForm.defendantId) {
      toast.error('피고인을 선택해주세요')
      return
    }
    if (!trialForm.reason.trim()) {
      toast.error('재판 사유를 입력해주세요')
      return
    }
    if (!trialForm.verdict) {
      toast.error('판결을 선택해주세요')
      return
    }
    if (trialForm.verdict === 'GUILTY' && (!trialForm.fineAmount || parseInt(trialForm.fineAmount) <= 0)) {
      toast.error('유죄 판결 시 벌금을 입력해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/judge/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defendantId: trialForm.defendantId,
          plaintiffId: trialForm.plaintiffId || null,
          reason: trialForm.reason,
          verdict: trialForm.verdict,
          fineAmount: trialForm.verdict === 'GUILTY' ? parseInt(trialForm.fineAmount) : 0
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '재판 처리 실패')
      }

      const defendant = users.find(u => u.id === trialForm.defendantId)
      setTrialResult({
        verdict: trialForm.verdict === 'GUILTY' ? '유죄' : '무죄',
        fineAmount: trialForm.verdict === 'GUILTY' ? parseInt(trialForm.fineAmount) : 0,
        defendant: defendant?.nickname || ''
      })

      toast.success('재판이 완료되었습니다!')
      setTrialForm({ defendantId: '', plaintiffId: '', reason: '', verdict: '', fineAmount: '' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '재판 처리 실패'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gavel className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">권능 대시보드</h1>
              <p className="text-sm text-gray-500">심현보 전용</p>
            </div>
          </div>
          <Link href="/market">
            <Button variant="outline">일반 모드로</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/judge/dashboard/reports">
            <Card className={`border-2 hover:border-amber-300 transition-colors cursor-pointer ${
              stats?.pendingReports ? 'border-amber-200 bg-amber-50' : ''
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <FileText className="h-8 w-8 text-amber-500" />
                  {stats?.pendingReports ? (
                    <Badge variant="destructive">{stats.pendingReports}</Badge>
                  ) : null}
                </div>
                <CardTitle>신고 관리</CardTitle>
                <CardDescription>접수된 신고를 검토하고 재판을 시작하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">
                  바로가기 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/judge/dashboard/trials">
            <Card className={`border-2 hover:border-purple-300 transition-colors cursor-pointer ${
              stats?.scheduledTrials ? 'border-purple-200 bg-purple-50' : ''
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Scale className="h-8 w-8 text-purple-500" />
                  {stats?.scheduledTrials ? (
                    <Badge>{stats.scheduledTrials}</Badge>
                  ) : null}
                </div>
                <CardTitle>재판 관리</CardTitle>
                <CardDescription>예정된 재판을 진행하고 판결하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">
                  바로가기 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/judge/dashboard/objections">
            <Card className={`border-2 hover:border-green-300 transition-colors cursor-pointer ${
              stats?.pendingObjections ? 'border-green-200 bg-green-50' : ''
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <AlertTriangle className="h-8 w-8 text-green-500" />
                  {stats?.pendingObjections ? (
                    <Badge variant="objection">{stats.pendingObjections}</Badge>
                  ) : null}
                </div>
                <CardTitle>이의 제기</CardTitle>
                <CardDescription>거래 이의 제기를 검토하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">
                  바로가기 <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* 재판하기 섹션 */}
        <Card className="border-2 border-purple-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-purple-600" />
                  재판하기
                </CardTitle>
                <CardDescription>즉시 재판을 진행하고 판결을 내립니다</CardDescription>
              </div>
              {!showTrialForm && !trialResult && (
                <Button onClick={() => setShowTrialForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  재판 시작
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {trialResult ? (
              <div className="p-6 bg-purple-50 rounded-lg text-center space-y-4">
                <Gavel className="h-16 w-16 text-purple-600 mx-auto" />
                <h3 className="text-2xl font-bold text-purple-800">재판 결과</h3>
                <div className="space-y-2">
                  <p className="text-lg">
                    <span className="font-medium">{trialResult.defendant}</span>님에 대한 판결
                  </p>
                  <Badge
                    variant={trialResult.verdict === '유죄' ? 'destructive' : 'success'}
                    className="text-xl px-4 py-2"
                  >
                    {trialResult.verdict}
                  </Badge>
                  {trialResult.fineAmount > 0 && (
                    <p className="text-lg text-red-600">
                      벌금: <span className="font-bold">{trialResult.fineAmount.toLocaleString()}</span> 마크
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTrialResult(null)
                    setShowTrialForm(false)
                  }}
                >
                  확인
                </Button>
              </div>
            ) : showTrialForm ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">피고인 (필수)</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={trialForm.defendantId}
                      onChange={(e) => setTrialForm({ ...trialForm, defendantId: e.target.value })}
                    >
                      <option value="">선택하세요</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.nickname}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">원고 (선택)</label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={trialForm.plaintiffId}
                      onChange={(e) => setTrialForm({ ...trialForm, plaintiffId: e.target.value })}
                    >
                      <option value="">없음</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.nickname}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">재판 사유</label>
                  <Textarea
                    value={trialForm.reason}
                    onChange={(e) => setTrialForm({ ...trialForm, reason: e.target.value })}
                    placeholder="재판 사유를 입력하세요"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">판결</label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={trialForm.verdict === 'NOT_GUILTY' ? 'success' : 'outline'}
                      className="flex-1"
                      onClick={() => setTrialForm({ ...trialForm, verdict: 'NOT_GUILTY', fineAmount: '' })}
                    >
                      무죄
                    </Button>
                    <Button
                      type="button"
                      variant={trialForm.verdict === 'GUILTY' ? 'destructive' : 'outline'}
                      className="flex-1"
                      onClick={() => setTrialForm({ ...trialForm, verdict: 'GUILTY' })}
                    >
                      유죄
                    </Button>
                  </div>
                </div>

                {trialForm.verdict === 'GUILTY' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">벌금 (마크)</label>
                    <Input
                      type="number"
                      value={trialForm.fineAmount}
                      onChange={(e) => setTrialForm({ ...trialForm, fineAmount: e.target.value })}
                      placeholder="벌금 금액을 입력하세요"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowTrialForm(false)
                      setTrialForm({ defendantId: '', plaintiffId: '', reason: '', verdict: '', fineAmount: '' })
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmitTrial}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <LoadingSpinner size="sm" className="mr-2" /> : <Gavel className="mr-2 h-4 w-4" />}
                    판결 선고
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                오른쪽 위 "재판 시작" 버튼을 눌러 재판을 진행하세요
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>권능 안내</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">신고 처리</h3>
                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                  <li>신고 접수 확인</li>
                  <li>내용 검토 및 재판 일정 공지</li>
                  <li>재판 진행 및 판결</li>
                  <li>벌금 부과 (필요시)</li>
                </ol>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">이의 제기 처리</h3>
                <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1">
                  <li>이의 내용 확인</li>
                  <li>거래 내역 검토</li>
                  <li>승인 또는 기각 결정</li>
                  <li>마크 환불 처리 (승인시)</li>
                </ol>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium mb-2 text-purple-800">벌금 감면</h3>
              <p className="text-sm text-purple-700">
                피고인은 판결 후 30% 감면을 요청할 수 있습니다.
                권능의 재량에 따라 감면 여부를 결정합니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
