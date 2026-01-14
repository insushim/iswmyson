'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { MarkDisplay } from '@/components/common/MarkDisplay'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { ShoppingBag, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

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
  canReport: boolean
  shop: { name: string; owner: { nickname: string } }
  createdAt: string
}

export default function MyOrdersPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (orderId: string) => {
    if (!confirm('주문을 승인하고 결제하시겠습니까?')) return

    setProcessingId(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}/approve`, {
        method: 'POST'
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '승인 실패')
      }

      toast.success('주문이 승인되었습니다!')
      fetchOrders()
    } catch (error) {
      const message = error instanceof Error ? error.message : '승인 실패'
      toast.error(message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (orderId: string) => {
    if (!confirm('주문을 거절하시겠습니까?')) return

    setProcessingId(orderId)
    try {
      const response = await fetch(`/api/orders/${orderId}/reject`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('주문이 거절되었습니다')
        fetchOrders()
      }
    } catch (error) {
      toast.error('거절 실패')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReport = (orderId: string) => {
    router.push(`/trial/report?orderId=${orderId}`)
  }

  const pendingOrders = orders.filter(o => o.status === 'PENDING')
  const proposedOrders = orders.filter(o => o.status === 'PROPOSED')
  const activeOrders = orders.filter(o => ['APPROVED', 'PAID'].includes(o.status) && !o.isDelivered)
  const completedOrders = orders.filter(o => o.isDelivered || o.status === 'COMPLETED')
  const cancelledOrders = orders.filter(o => ['CANCELLED', 'REJECTED'].includes(o.status))

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
        <h1 className="text-2xl font-bold text-gray-900">내 주문</h1>
        <p className="text-gray-600">내가 주문한 내역을 확인하세요</p>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            진행중
            {(pendingOrders.length + proposedOrders.length + activeOrders.length) > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingOrders.length + proposedOrders.length + activeOrders.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">완료</TabsTrigger>
          <TabsTrigger value="cancelled">취소/거절</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {proposedOrders.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  승인 대기 ({proposedOrders.length}건)
                </CardTitle>
                <CardDescription>사장님이 가격을 제안했습니다. 확인해주세요!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {proposedOrders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{order.shop.name}</p>
                          <p className="text-sm text-gray-600">{order.customRequest}</p>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">제안 가격</span>
                          <MarkDisplay amount={order.proposedPrice!} size="lg" />
                        </div>
                        {order.estimatedDate && (
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-600">예상 완료</span>
                            <span className="font-medium">{order.estimatedDate}</span>
                          </div>
                        )}
                        {order.ownerMessage && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-sm text-gray-600">사장님 메시지</p>
                            <p className="text-sm">{order.ownerMessage}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => handleApprove(order.id)}
                          disabled={processingId === order.id}
                        >
                          {processingId === order.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              승인 및 결제
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleReject(order.id)}
                          disabled={processingId === order.id}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          거절
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          {pendingOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  가격 제안 대기 ({pendingOrders.length}건)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingOrders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{order.shop.name}</p>
                          <p className="text-sm text-gray-600">{order.customRequest}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(order.createdAt).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          {activeOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-green-500" />
                  배달 대기 ({activeOrders.length}건)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeOrders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{order.shop.name}</p>
                          <p className="text-sm text-gray-600">{order.customRequest}</p>
                          <MarkDisplay amount={order.proposedPrice!} size="sm" className="mt-1" />
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          {pendingOrders.length === 0 && proposedOrders.length === 0 && activeOrders.length === 0 && (
            <EmptyState
              icon={<ShoppingBag className="h-12 w-12 text-gray-400" />}
              title="진행중인 주문이 없습니다"
              description="시장에서 가게를 둘러보고 주문해보세요!"
            />
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedOrders.length > 0 ? (
            <div className="space-y-3">
              {completedOrders.map(order => (
                <Card key={order.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{order.shop.name}</p>
                        <p className="text-sm text-gray-600">{order.customRequest}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <MarkDisplay amount={order.proposedPrice!} size="sm" />
                          <span className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <OrderStatusBadge status="COMPLETED" />
                        {order.canReport && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500"
                            onClick={() => handleReport(order.id)}
                          >
                            문제 신고
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle className="h-12 w-12 text-gray-400" />}
              title="완료된 주문이 없습니다"
              description="주문을 완료하면 여기에 표시됩니다"
            />
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledOrders.length > 0 ? (
            <div className="space-y-3">
              {cancelledOrders.map(order => (
                <Card key={order.id} className="opacity-75">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{order.shop.name}</p>
                        <p className="text-sm text-gray-600">{order.customRequest}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<XCircle className="h-12 w-12 text-gray-400" />}
              title="취소/거절된 주문이 없습니다"
              description=""
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
