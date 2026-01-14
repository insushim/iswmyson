'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { MarkDisplay } from '@/components/common/MarkDisplay'
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import toast from 'react-hot-toast'

interface Transaction {
  id: string
  amount: number
  description: string | null
  status: string
  hasObjection: boolean
  objectionReason: string | null
  objectionStatus: string | null
  sender: { id: string; nickname: string; marks: number }
  receiver: { id: string; nickname: string; marks: number }
  createdAt: string
}

export default function JudgeObjectionsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [objections, setObjections] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user && !(session.user as { isJudge?: boolean }).isJudge) {
      router.push('/')
      return
    }
    fetchObjections()
  }, [session, router])

  const fetchObjections = async () => {
    try {
      const response = await fetch('/api/judge/objections')
      if (response.ok) {
        const data = await response.json()
        setObjections(data.objections || [])
      }
    } catch (error) {
      console.error('Failed to fetch objections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (transactionId: string) => {
    if (!confirm('이의를 승인하시겠습니까? 거래가 취소되고 마크가 환불됩니다.')) return

    setProcessingId(transactionId)
    try {
      const response = await fetch('/api/judge/objections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          action: 'approve'
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '승인 실패')
      }

      toast.success('이의가 승인되었습니다. 마크가 환불되었습니다.')
      fetchObjections()
    } catch (error) {
      const message = error instanceof Error ? error.message : '승인 실패'
      toast.error(message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (transactionId: string) => {
    if (!confirm('이의를 기각하시겠습니까?')) return

    setProcessingId(transactionId)
    try {
      const response = await fetch('/api/judge/objections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          action: 'reject'
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '기각 실패')
      }

      toast.success('이의가 기각되었습니다.')
      fetchObjections()
    } catch (error) {
      const message = error instanceof Error ? error.message : '기각 실패'
      toast.error(message)
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="objection"><AlertTriangle className="mr-1 h-3 w-3" />검토 대기</Badge>
      case 'APPROVED':
        return <Badge variant="success"><CheckCircle className="mr-1 h-3 w-3" />승인됨</Badge>
      case 'REJECTED':
        return <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3" />기각됨</Badge>
      default:
        return null
    }
  }

  const pendingObjections = objections.filter(o => o.objectionStatus === 'PENDING')
  const processedObjections = objections.filter(o => ['APPROVED', 'REJECTED'].includes(o.objectionStatus || ''))

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
            <h1 className="text-xl font-bold text-gray-900">이의 제기 관리</h1>
            <p className="text-sm text-gray-500">거래 이의 제기를 검토하고 처리하세요</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              검토 대기
              {pendingObjections.length > 0 && (
                <Badge variant="objection" className="ml-2">{pendingObjections.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="processed">처리 완료</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingObjections.length > 0 ? (
              pendingObjections.map(tx => (
                <Card key={tx.id} className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ArrowUpRight className="h-5 w-5 text-red-500" />
                          {tx.sender.nickname}
                          <span className="text-gray-400">→</span>
                          <ArrowDownLeft className="h-5 w-5 text-green-500" />
                          {tx.receiver.nickname}
                        </CardTitle>
                        <CardDescription>
                          {new Date(tx.createdAt).toLocaleString('ko-KR')}
                        </CardDescription>
                      </div>
                      {getStatusBadge(tx.objectionStatus)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-sm text-gray-500">거래 금액</span>
                      <MarkDisplay amount={tx.amount} size="lg" />
                    </div>

                    {tx.description && (
                      <div>
                        <p className="text-sm text-gray-500">거래 메모</p>
                        <p className="text-sm bg-white p-2 rounded">{tx.description}</p>
                      </div>
                    )}

                    <div className="p-3 bg-green-100 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">이의 제기 사유</p>
                      <p className="text-sm text-green-700">{tx.objectionReason}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-2 bg-white rounded">
                        <p className="text-gray-500">보낸 사람 잔액</p>
                        <MarkDisplay amount={tx.sender.marks} size="sm" />
                      </div>
                      <div className="p-2 bg-white rounded">
                        <p className="text-gray-500">받은 사람 잔액</p>
                        <MarkDisplay amount={tx.receiver.marks} size="sm" />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button
                      variant="success"
                      onClick={() => handleApprove(tx.id)}
                      disabled={processingId === tx.id}
                    >
                      {processingId === tx.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      승인 (환불)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(tx.id)}
                      disabled={processingId === tx.id}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      기각
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={<AlertTriangle className="h-12 w-12 text-gray-400" />}
                title="대기중인 이의 제기가 없습니다"
                description=""
              />
            )}
          </TabsContent>

          <TabsContent value="processed" className="space-y-4">
            {processedObjections.length > 0 ? (
              processedObjections.map(tx => (
                <Card key={tx.id} className="opacity-75">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {tx.sender.nickname} → {tx.receiver.nickname}
                        </p>
                        <p className="text-sm text-gray-600">{tx.objectionReason}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <MarkDisplay amount={tx.amount} size="sm" />
                          <span className="text-xs text-gray-400">
                            {new Date(tx.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(tx.objectionStatus)}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState
                icon={<CheckCircle className="h-12 w-12 text-gray-400" />}
                title="처리된 이의 제기가 없습니다"
                description=""
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
