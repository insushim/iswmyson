'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Gavel, FileText, Scale, AlertTriangle, Users, Coins, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface Stats {
  pendingReports: number
  scheduledTrials: number
  pendingObjections: number
  totalUsers: number
  totalMarks: number
}

export default function JudgeDashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user && !(session.user as { isJudge?: boolean }).isJudge) {
      toast.error('권능 권한이 없습니다')
      router.push('/')
      return
    }
    fetchStats()
  }, [session, router])

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
