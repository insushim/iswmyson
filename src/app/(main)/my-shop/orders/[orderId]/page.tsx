'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { MarkDisplay } from '@/components/common/MarkDisplay'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { ArrowLeft, Send, Package, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Order {
  id: string
  orderNumber: string
  customRequest: string
  proposedPrice: number | null
  estimatedDate: string | null
  ownerMessage: string | null
  status: string
  isPaid: boolean
  isDelivered: boolean
  customer: { nickname: string }
  createdAt: string
}

export default function ShopOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [proposeForm, setProposeForm] = useState({
    proposedPrice: '',
    estimatedDate: '',
    ownerMessage: ''
  })

  const orderId = params.orderId as string

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders?orderId=${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
        if (data.proposedPrice) {
          setProposeForm({
            proposedPrice: data.proposedPrice.toString(),
            estimatedDate: data.estimatedDate || '',
            ownerMessage: data.ownerMessage || ''
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePropose = async () => {
    if (!proposeForm.proposedPrice || parseInt(proposeForm.proposedPrice) <= 0) {
      toast.error('가격을 입력해주세요')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/orders/${orderId}/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposedPrice: parseInt(proposeForm.proposedPrice),
          estimatedDate: proposeForm.estimatedDate || null,
          ownerMessage: proposeForm.ownerMessage || null
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '가격 제안 실패')
      }

      toast.success('가격을 제안했습니다!')
      fetchOrder()
    } catch (error) {
      const message = error instanceof Error ? error.message : '가격 제안 실패'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeliver = async () => {
    if (!confirm('배달 완료 처리하시겠습니까?')) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/orders/${orderId}/deliver`, {
        method: 'POST'
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '배달 완료 처리 실패')
      }

      toast.success('배달이 완료되었습니다!')
      router.push('/my-shop')
    } catch (error) {
      const message = error instanceof Error ? error.message : '배달 완료 처리 실패'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">주문을 찾을 수 없습니다.</p>
        <Link href="/my-shop">
          <Button variant="outline" className="mt-4">돌아가기</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/my-shop">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            내 가게로
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>주문 상세</CardTitle>
              <CardDescription>{order.orderNumber}</CardDescription>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">주문자</p>
            <p className="font-medium">{order.customer.nickname}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">주문 내용</p>
            <p className="font-medium whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
              {order.customRequest}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">주문 시간</p>
            <p className="font-medium">{new Date(order.createdAt).toLocaleString('ko-KR')}</p>
          </div>
        </CardContent>
      </Card>

      {order.status === 'PENDING' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">가격 제안하기</CardTitle>
            <CardDescription>주문 내용을 검토하고 가격을 제안해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">제안 가격 (마크)</label>
              <Input
                type="number"
                value={proposeForm.proposedPrice}
                onChange={(e) => setProposeForm({ ...proposeForm, proposedPrice: e.target.value })}
                placeholder="예: 5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">예상 완료일 (선택)</label>
              <Input
                value={proposeForm.estimatedDate}
                onChange={(e) => setProposeForm({ ...proposeForm, estimatedDate: e.target.value })}
                placeholder="예: 오늘 저녁 6시"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">메시지 (선택)</label>
              <Textarea
                value={proposeForm.ownerMessage}
                onChange={(e) => setProposeForm({ ...proposeForm, ownerMessage: e.target.value })}
                placeholder="손님에게 전할 메시지를 작성해주세요"
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handlePropose} disabled={isSaving}>
              {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
              가격 제안하기
            </Button>
          </CardFooter>
        </Card>
      )}

      {order.status === 'PROPOSED' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-6 text-center">
            <p className="text-blue-800">손님의 승인을 기다리고 있습니다.</p>
            <MarkDisplay amount={order.proposedPrice!} size="lg" className="justify-center mt-2" />
          </CardContent>
        </Card>
      )}

      {(order.status === 'APPROVED' || order.status === 'PAID') && !order.isDelivered && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">배달 준비</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>결제 상태</span>
              <span className="font-medium text-green-600">
                {order.isPaid ? '결제 완료' : '결제 대기'}
              </span>
            </div>
            <MarkDisplay amount={order.proposedPrice!} size="lg" />
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="success" onClick={handleDeliver} disabled={isSaving}>
              {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Package className="mr-2 h-4 w-4" />}
              배달 완료 처리
            </Button>
          </CardFooter>
        </Card>
      )}

      {order.isDelivered && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="py-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600">배달이 완료된 주문입니다.</p>
            <MarkDisplay amount={order.proposedPrice!} size="lg" className="justify-center mt-2" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
