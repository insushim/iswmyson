'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { MarkDisplay } from '@/components/common/MarkDisplay'
import { ScrollText, ArrowLeftRight, Gavel, Clock } from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  memo: string | null
  status: string
  createdAt: string
  sender: { nickname: string }
  receiver: { nickname: string }
}

interface Trial {
  id: string
  verdict: string | null
  fineAmount: number | null
  finalFine: number | null
  status: string
  createdAt: string
  scheduledAt: string | null
  report: {
    reason: string
  }
  defendant: { nickname: string }
  plaintiff: { nickname: string }
}

export default function RecordsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [trials, setTrials] = useState<Trial[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const [transRes, trialsRes] = await Promise.all([
        fetch('/api/records/transactions'),
        fetch('/api/records/trials')
      ])

      if (transRes.ok) {
        const data = await transRes.json()
        setTransactions(data.transactions || [])
      }

      if (trialsRes.ok) {
        const data = await trialsRes.json()
        setTrials(data.trials || [])
      }
    } catch (error) {
      console.error('Failed to fetch records:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">기록</h1>
        <p className="text-gray-600">모든 거래와 재판 기록을 확인하세요 (삭제 불가)</p>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            거래 기록
            <Badge variant="outline" className="ml-2">{transactions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="trials">
            <Gavel className="mr-2 h-4 w-4" />
            재판 기록
            <Badge variant="outline" className="ml-2">{trials.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {transactions.length === 0 ? (
            <EmptyState
              icon={<ArrowLeftRight className="h-12 w-12 text-gray-400" />}
              title="거래 기록이 없습니다"
              description="아직 기록된 거래가 없습니다"
            />
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <Card key={tx.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-blue-600">{tx.sender.nickname}</span>
                          <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-green-600">{tx.receiver.nickname}</span>
                        </div>
                        {tx.memo && (
                          <p className="text-sm text-gray-600">{tx.memo}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(tx.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <MarkDisplay amount={tx.amount} size="lg" />
                        <Badge
                          variant={tx.status === 'COMPLETED' ? 'success' : tx.status === 'PENDING' ? 'warning' : 'secondary'}
                          className="mt-1"
                        >
                          {tx.status === 'COMPLETED' ? '완료' : tx.status === 'PENDING' ? '대기중' : tx.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trials" className="space-y-4">
          {trials.length === 0 ? (
            <EmptyState
              icon={<Gavel className="h-12 w-12 text-gray-400" />}
              title="재판 기록이 없습니다"
              description="아직 기록된 재판이 없습니다"
            />
          ) : (
            <div className="space-y-3">
              {trials.map((trial) => (
                <Card key={trial.id} className={trial.verdict === '유죄' ? 'border-red-200' : ''}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{trial.plaintiff.nickname}</span>
                          <span className="text-gray-400">vs</span>
                          <span className="font-medium text-red-600">{trial.defendant.nickname}</span>
                        </div>
                        <p className="text-sm text-gray-600">{trial.report.reason}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(trial.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        {trial.verdict ? (
                          <Badge variant={trial.verdict === '유죄' ? 'destructive' : 'success'}>
                            {trial.verdict}
                          </Badge>
                        ) : (
                          <Badge variant="outline">진행중</Badge>
                        )}
                        {trial.finalFine && trial.finalFine > 0 && (
                          <div>
                            <p className="text-xs text-gray-500">벌금</p>
                            <MarkDisplay amount={trial.finalFine} size="sm" className="text-red-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
