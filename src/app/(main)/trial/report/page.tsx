'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  nickname: string
}

interface Order {
  id: string
  orderNumber: string
  customRequest: string
  shop: { name: string; owner: { nickname: string } }
}

export default function ReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')

  const [users, setUsers] = useState<User[]>([])
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [reportForm, setReportForm] = useState({
    reportedId: '',
    orderId: orderId || '',
    reason: '',
    evidence: ''
  })

  useEffect(() => {
    fetchData()
  }, [orderId])

  const fetchData = async () => {
    try {
      const usersRes = await fetch('/api/users/list')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }

      if (orderId) {
        const orderRes = await fetch(`/api/orders?orderId=${orderId}`)
        if (orderRes.ok) {
          const orderData = await orderRes.json()
          setOrder(orderData)
          setReportForm(prev => ({
            ...prev,
            reportedId: orderData.shop.owner.id || '',
            orderId: orderData.id
          }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!reportForm.reportedId) {
      toast.error('신고 대상을 선택해주세요')
      return
    }
    if (!reportForm.reason.trim()) {
      toast.error('신고 사유를 입력해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedId: reportForm.reportedId,
          orderId: reportForm.orderId || null,
          reason: reportForm.reason,
          evidence: reportForm.evidence || null
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '신고 실패')
      }

      toast.success('신고가 접수되었습니다. 재판관이 검토합니다.')
      router.push('/trial')
    } catch (error) {
      const message = error instanceof Error ? error.message : '신고 실패'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/trial">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            재판소로
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            신고하기
          </CardTitle>
          <CardDescription>
            문제가 있는 사용자를 신고해주세요. 재판관이 검토 후 재판을 진행합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {order && (
            <div className="bg-amber-50 p-4 rounded-lg">
              <p className="text-sm text-amber-800 font-medium">관련 주문</p>
              <p className="text-sm">{order.shop.name} ({order.shop.owner.nickname})</p>
              <p className="text-xs text-gray-600 mt-1">{order.customRequest}</p>
              <p className="text-xs text-gray-400">{order.orderNumber}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">신고 대상</label>
            <select
              className="w-full p-2 border rounded-md"
              value={reportForm.reportedId}
              onChange={(e) => setReportForm({ ...reportForm, reportedId: e.target.value })}
              disabled={!!order}
            >
              <option value="">선택하세요</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.nickname}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">신고 사유</label>
            <Textarea
              value={reportForm.reason}
              onChange={(e) => setReportForm({ ...reportForm, reason: e.target.value })}
              placeholder="어떤 문제가 있었는지 상세히 설명해주세요"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">증거 (선택)</label>
            <Textarea
              value={reportForm.evidence}
              onChange={(e) => setReportForm({ ...reportForm, evidence: e.target.value })}
              placeholder="스크린샷 링크나 추가 설명을 입력하세요"
              rows={3}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-800">신고 안내</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>허위 신고는 오히려 불이익을 받을 수 있습니다</li>
                  <li>재판관이 검토 후 재판 일정을 공지합니다</li>
                  <li>유죄 판결 시 벌금이 부과될 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            신고 접수
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
