'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { MarkDisplay } from '@/components/common/MarkDisplay'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { Store, Plus, Package, ClipboardList, Settings, Trash2, Edit2, Power, PowerOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface MenuItem {
  id: string
  name: string
  description: string | null
  basePrice: number
  isAvailable: boolean
}

interface Order {
  id: string
  orderNumber: string
  customRequest: string
  proposedPrice: number | null
  status: string
  customer: { nickname: string }
  createdAt: string
}

interface Shop {
  id: string
  name: string
  jobTitle: string
  description: string | null
  isOpen: boolean
  menuItems: MenuItem[]
  orders: Order[]
}

const JOB_OPTIONS = [
  '치킨집 사장', '피자집 사장', '카페 사장', '편의점 사장',
  '마트 사장', '옷가게 사장', '빵집 사장', '떡볶이집 사장',
  '아이스크림가게 사장', '문구점 사장', '약국 사장', '서점 사장',
  '꽃집 사장', '미용실 사장', '세탁소 사장', '기타'
]

export default function MyShopPage() {
  const router = useRouter()
  const [shop, setShop] = useState<Shop | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasShop, setHasShop] = useState(false)

  const [shopForm, setShopForm] = useState({
    name: '',
    jobTitle: JOB_OPTIONS[0],
    customJob: '',
    description: ''
  })

  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    basePrice: ''
  })

  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)

  useEffect(() => {
    fetchMyShop()
  }, [])

  const fetchMyShop = async () => {
    try {
      const response = await fetch('/api/shops/my')
      if (response.ok) {
        const data = await response.json()
        setShop(data)
        setHasShop(true)
        setShopForm({
          name: data.name,
          jobTitle: JOB_OPTIONS.includes(data.jobTitle) ? data.jobTitle : '기타',
          customJob: JOB_OPTIONS.includes(data.jobTitle) ? '' : data.jobTitle,
          description: data.description || ''
        })
      } else if (response.status === 404) {
        setHasShop(false)
      }
    } catch (error) {
      console.error('Failed to fetch shop:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateShop = async () => {
    if (!shopForm.name.trim()) {
      toast.error('가게 이름을 입력해주세요')
      return
    }

    const jobTitle = shopForm.jobTitle === '기타' ? shopForm.customJob : shopForm.jobTitle
    if (!jobTitle.trim()) {
      toast.error('직업을 입력해주세요')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shopForm.name,
          jobTitle,
          description: shopForm.description
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '가게 생성 실패')
      }

      toast.success('가게가 생성되었습니다!')
      fetchMyShop()
    } catch (error) {
      const message = error instanceof Error ? error.message : '가게 생성 실패'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateShop = async () => {
    if (!shop) return

    const jobTitle = shopForm.jobTitle === '기타' ? shopForm.customJob : shopForm.jobTitle

    setIsSaving(true)
    try {
      const response = await fetch(`/api/shops/${shop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: shopForm.name,
          jobTitle,
          description: shopForm.description
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '가게 수정 실패')
      }

      toast.success('가게 정보가 수정되었습니다!')
      fetchMyShop()
    } catch (error) {
      const message = error instanceof Error ? error.message : '가게 수정 실패'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleOpen = async () => {
    if (!shop) return

    try {
      const response = await fetch(`/api/shops/${shop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: !shop.isOpen })
      })

      if (response.ok) {
        toast.success(shop.isOpen ? '휴업으로 전환했습니다' : '영업을 시작했습니다!')
        fetchMyShop()
      }
    } catch (error) {
      toast.error('상태 변경 실패')
    }
  }

  const handleAddMenu = async () => {
    if (!shop) return
    if (!menuForm.name.trim()) {
      toast.error('메뉴 이름을 입력해주세요')
      return
    }
    if (!menuForm.basePrice || parseInt(menuForm.basePrice) <= 0) {
      toast.error('기본 가격을 입력해주세요')
      return
    }

    try {
      const response = await fetch(`/api/shops/${shop.id}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: menuForm.name,
          description: menuForm.description || null,
          basePrice: parseInt(menuForm.basePrice)
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '메뉴 추가 실패')
      }

      toast.success('메뉴가 추가되었습니다!')
      setMenuForm({ name: '', description: '', basePrice: '' })
      fetchMyShop()
    } catch (error) {
      const message = error instanceof Error ? error.message : '메뉴 추가 실패'
      toast.error(message)
    }
  }

  const handleDeleteMenu = async (menuId: string) => {
    if (!shop) return
    if (!confirm('이 메뉴를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/shops/${shop.id}/menu?menuId=${menuId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('메뉴가 삭제되었습니다')
        fetchMyShop()
      }
    } catch (error) {
      toast.error('메뉴 삭제 실패')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!hasShop) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <Store className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">내 가게 만들기</h1>
          <p className="text-gray-600">시장에서 자신만의 가게를 열어보세요!</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>가게 정보 입력</CardTitle>
            <CardDescription>가게 이름과 직업을 선택해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">가게 이름</label>
              <Input
                value={shopForm.name}
                onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                placeholder="예: 현보네 치킨"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">직업 선택</label>
              <select
                className="w-full p-2 border rounded-md"
                value={shopForm.jobTitle}
                onChange={(e) => setShopForm({ ...shopForm, jobTitle: e.target.value })}
              >
                {JOB_OPTIONS.map(job => (
                  <option key={job} value={job}>{job}</option>
                ))}
              </select>
            </div>
            {shopForm.jobTitle === '기타' && (
              <div>
                <label className="block text-sm font-medium mb-1">직접 입력</label>
                <Input
                  value={shopForm.customJob}
                  onChange={(e) => setShopForm({ ...shopForm, customJob: e.target.value })}
                  placeholder="직업을 입력하세요"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">가게 소개 (선택)</label>
              <Textarea
                value={shopForm.description}
                onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                placeholder="가게를 소개해주세요"
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleCreateShop} disabled={isSaving}>
              {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Store className="mr-2 h-4 w-4" />}
              가게 열기
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const pendingOrders = shop?.orders.filter(o => o.status === 'PENDING') || []
  const activeOrders = shop?.orders.filter(o => ['PROPOSED', 'APPROVED', 'PAID'].includes(o.status)) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{shop?.name}</h1>
          <p className="text-gray-600">{shop?.jobTitle}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={shop?.isOpen ? 'default' : 'secondary'} className="text-base px-3 py-1">
            {shop?.isOpen ? '영업중' : '휴업'}
          </Badge>
          <Button
            variant={shop?.isOpen ? 'outline' : 'success'}
            onClick={handleToggleOpen}
          >
            {shop?.isOpen ? (
              <><PowerOff className="mr-2 h-4 w-4" />휴업하기</>
            ) : (
              <><Power className="mr-2 h-4 w-4" />영업시작</>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">
            <ClipboardList className="mr-2 h-4 w-4" />
            주문 관리
            {pendingOrders.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingOrders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="menu">
            <Package className="mr-2 h-4 w-4" />
            메뉴 관리
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            가게 설정
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {pendingOrders.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800">새 주문 ({pendingOrders.length}건)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingOrders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{order.customer.nickname}님의 주문</p>
                          <p className="text-sm text-gray-600">{order.customRequest}</p>
                          <p className="text-xs text-gray-400 mt-1">{order.orderNumber}</p>
                        </div>
                        <Button size="sm" onClick={() => router.push(`/my-shop/orders/${order.id}`)}>
                          가격 제안하기
                        </Button>
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
                <CardTitle>진행중인 주문 ({activeOrders.length}건)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeOrders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{order.customer.nickname}님</p>
                            <OrderStatusBadge status={order.status} />
                          </div>
                          <p className="text-sm text-gray-600">{order.customRequest}</p>
                          {order.proposedPrice && (
                            <MarkDisplay amount={order.proposedPrice} size="sm" className="mt-1" />
                          )}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => router.push(`/my-shop/orders/${order.id}`)}>
                          상세보기
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          {pendingOrders.length === 0 && activeOrders.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>아직 주문이 없습니다.</p>
                <p className="text-sm">영업 중이면 손님들이 주문할 수 있어요!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="menu" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>새 메뉴 추가</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  placeholder="메뉴 이름"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                />
                <Input
                  placeholder="설명 (선택)"
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="기본 가격"
                  value={menuForm.basePrice}
                  onChange={(e) => setMenuForm({ ...menuForm, basePrice: e.target.value })}
                />
              </div>
              <Button onClick={handleAddMenu}>
                <Plus className="mr-2 h-4 w-4" />
                메뉴 추가
              </Button>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {shop?.menuItems.map(item => (
              <Card key={item.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      <MarkDisplay amount={item.basePrice} size="sm" className="mt-1" />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteMenu(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {shop?.menuItems.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>등록된 메뉴가 없습니다.</p>
                <p className="text-sm">위에서 메뉴를 추가해보세요!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>가게 정보 수정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">가게 이름</label>
                <Input
                  value={shopForm.name}
                  onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">직업</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={shopForm.jobTitle}
                  onChange={(e) => setShopForm({ ...shopForm, jobTitle: e.target.value })}
                >
                  {JOB_OPTIONS.map(job => (
                    <option key={job} value={job}>{job}</option>
                  ))}
                </select>
              </div>
              {shopForm.jobTitle === '기타' && (
                <div>
                  <label className="block text-sm font-medium mb-1">직접 입력</label>
                  <Input
                    value={shopForm.customJob}
                    onChange={(e) => setShopForm({ ...shopForm, customJob: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">가게 소개</label>
                <Textarea
                  value={shopForm.description}
                  onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleUpdateShop} disabled={isSaving}>
                {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Edit2 className="mr-2 h-4 w-4" />}
                수정 저장
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
