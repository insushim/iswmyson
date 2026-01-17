'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { MarkDisplay } from '@/components/common/MarkDisplay'
import { Store, ArrowLeft, Package, ShoppingCart, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface MenuItem {
  id: string
  name: string
  description: string | null
  basePrice: number
  isAvailable: boolean
}

interface Shop {
  id: string
  name: string
  jobTitle: string
  description: string | null
  isOpen: boolean
  owner: { id: string; nickname: string }
  menuItems: MenuItem[]
}

export default function ShopDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [shop, setShop] = useState<Shop | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderData, setOrderData] = useState({
    customRequest: '',
    selectedMenus: [] as string[]
  })

  const shopId = params.shopId as string
  const isOwner = session?.user?.id === shop?.owner.id

  useEffect(() => {
    fetchShop()
  }, [shopId])

  const fetchShop = async () => {
    try {
      const response = await fetch(`/api/shops/${shopId}`)
      if (response.ok) {
        const data = await response.json()
        setShop(data.shop)
      } else {
        toast.error('가게를 찾을 수 없습니다')
        router.push('/market')
      }
    } catch (error) {
      console.error('Failed to fetch shop:', error)
      toast.error('가게 정보를 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMenuSelection = (menuId: string) => {
    setOrderData(prev => ({
      ...prev,
      selectedMenus: prev.selectedMenus.includes(menuId)
        ? prev.selectedMenus.filter(id => id !== menuId)
        : [...prev.selectedMenus, menuId]
    }))
  }

  const handleOrder = async () => {
    if (!orderData.customRequest.trim()) {
      toast.error('주문 내용을 입력해주세요')
      return
    }

    setIsOrdering(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          customRequest: orderData.customRequest,
          selectedMenuIds: orderData.selectedMenus
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '주문 실패')
      }

      toast.success('주문이 접수되었습니다!')
      router.push('/my-orders')
    } catch (error) {
      const message = error instanceof Error ? error.message : '주문 처리 중 오류가 발생했습니다'
      toast.error(message)
    } finally {
      setIsOrdering(false)
    }
  }

  const estimatedTotal = shop?.menuItems
    .filter(item => orderData.selectedMenus.includes(item.id))
    .reduce((sum, item) => sum + item.basePrice, 0) || 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!shop) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/market">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            시장으로
          </Button>
        </Link>
      </div>

      <Card className="border-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Store className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{shop.name}</CardTitle>
                <CardDescription className="text-base">
                  <span className="font-semibold text-gray-700">{shop.owner.nickname}</span>
                  <span className="mx-2">·</span>
                  <span>{shop.jobTitle}</span>
                </CardDescription>
              </div>
            </div>
            <Badge variant={shop.isOpen ? 'default' : 'secondary'} className="text-base px-3 py-1">
              {shop.isOpen ? '영업중' : '휴업'}
            </Badge>
          </div>
          {shop.description && (
            <p className="text-gray-600 mt-4">{shop.description}</p>
          )}
        </CardHeader>
      </Card>

      <Tabs defaultValue="menu" className="space-y-4">
        <TabsList>
          <TabsTrigger value="menu">
            <Package className="mr-2 h-4 w-4" />
            메뉴판
          </TabsTrigger>
          {!isOwner && shop.isOpen && (
            <TabsTrigger value="order">
              <ShoppingCart className="mr-2 h-4 w-4" />
              주문하기
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="menu" className="space-y-4">
          {shop.menuItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>아직 등록된 메뉴가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {shop.menuItems.map((item) => (
                <Card key={item.id} className={cn(
                  'overflow-hidden transition-all',
                  !item.isAvailable ? 'opacity-60' : 'hover:shadow-md',
                  orderData.selectedMenus.includes(item.id) && 'ring-2 ring-amber-400 bg-amber-50'
                )}>
                  <div className="p-4 space-y-3">
                    {/* 메뉴 이름 */}
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
                      {!item.isAvailable && (
                        <Badge variant="secondary">품절</Badge>
                      )}
                    </div>

                    {/* 설명 */}
                    {item.description && (
                      <p className="text-sm text-gray-500">{item.description}</p>
                    )}

                    {/* 가격 */}
                    <div className="pt-2 border-t">
                      <MarkDisplay amount={item.basePrice} size="lg" />
                    </div>

                    {/* 바로 주문 버튼 */}
                    {!isOwner && shop.isOpen && item.isAvailable && (
                      <Button
                        variant={orderData.selectedMenus.includes(item.id) ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                        onClick={() => toggleMenuSelection(item.id)}
                      >
                        {orderData.selectedMenus.includes(item.id) ? '선택됨 ✓' : '선택하기'}
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* 메뉴판에서 바로 주문하기 */}
          {!isOwner && shop.isOpen && orderData.selectedMenus.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 sticky bottom-20 lg:bottom-4">
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-amber-800">
                      {orderData.selectedMenus.length}개 메뉴 선택됨
                    </p>
                    <p className="text-sm text-amber-600">
                      예상 금액: {estimatedTotal.toLocaleString()}마크
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrderData({ ...orderData, selectedMenus: [] })}
                    >
                      초기화
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 sm:flex-none"
                      onClick={() => {
                        const selectedNames = shop.menuItems
                          .filter(item => orderData.selectedMenus.includes(item.id))
                          .map(item => item.name)
                          .join(', ')
                        setOrderData({
                          ...orderData,
                          customRequest: `${selectedNames} 주문합니다.`
                        })
                        document.querySelector('[value="order"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
                      }}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      주문하기
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {!isOwner && shop.isOpen && (
          <TabsContent value="order" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  주문하기
                </CardTitle>
                <CardDescription>
                  원하는 메뉴를 선택하고, 상세한 주문 내용을 작성해주세요.
                  사장님이 가격을 제안하면 승인 후 결제됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {shop.menuItems.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">메뉴 선택 (선택사항)</label>
                    <div className="flex flex-wrap gap-2">
                      {shop.menuItems.filter(item => item.isAvailable).map((item) => (
                        <Button
                          key={item.id}
                          variant={orderData.selectedMenus.includes(item.id) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleMenuSelection(item.id)}
                        >
                          {item.name} · {item.basePrice.toLocaleString()}마크
                        </Button>
                      ))}
                    </div>
                    {estimatedTotal > 0 && (
                      <p className="text-sm text-gray-600 mt-2">
                        예상 금액: <span className="font-semibold text-amber-600">{estimatedTotal.toLocaleString()}마크</span>
                        <span className="text-gray-400"> (실제 금액은 사장님이 제안)</span>
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">주문 내용 (자유롭게 작성)</label>
                  <Textarea
                    placeholder="예: 치킨 2마리 주문합니다. 양념 1, 후라이드 1로 해주세요. 콜라 2개도 같이 부탁드려요!"
                    value={orderData.customRequest}
                    onChange={(e) => setOrderData({ ...orderData, customRequest: e.target.value })}
                    rows={5}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleOrder}
                  disabled={isOrdering || !orderData.customRequest.trim()}
                >
                  {isOrdering ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      주문 접수 중...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      주문 접수하기
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {isOwner && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-amber-800 text-center">
              이 가게는 내 가게입니다.{' '}
              <Link href="/my-shop" className="font-semibold underline">
                가게 관리 페이지
              </Link>
              에서 관리하세요.
            </p>
          </CardContent>
        </Card>
      )}

      {!shop.isOpen && !isOwner && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="py-4">
            <p className="text-gray-600 text-center">
              현재 휴업 중인 가게입니다. 영업 시간에 다시 방문해주세요.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
