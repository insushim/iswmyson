'use client'

import { useState, useEffect, use } from 'react'
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
import { ArrowLeft, Plus, Package, ClipboardList, Settings, Trash2, Edit2, Power, PowerOff, MessageSquare, Reply } from 'lucide-react'
import toast from 'react-hot-toast'

interface MenuItem {
  id: string
  name: string
  description: string | null
  basePrice: number
  estimatedTime: string | null
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

interface Suggestion {
  id: string
  content: string
  reply: string | null
  status: string
  createdAt: string
  user: { id: string; nickname: string }
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

interface Job {
  id: string
  name: string
}

export default function ShopManagePage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params)
  const router = useRouter()
  const [shop, setShop] = useState<Shop | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [jobOptions, setJobOptions] = useState<string[]>([])
  const [myShopJobs, setMyShopJobs] = useState<string[]>([])

  const [shopForm, setShopForm] = useState({
    name: '',
    jobTitle: '',
    customJob: '',
    description: ''
  })

  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    basePrice: '',
    estimatedTime: ''
  })

  // 건의 관련
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [isReplying, setIsReplying] = useState(false)

  useEffect(() => {
    fetchShop()
    fetchJobs()
    fetchSuggestions()
  }, [shopId])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const data = await response.json()
        const jobs = (data.jobs || []).map((j: Job) => j.name)
        setJobOptions(jobs)
        setMyShopJobs(data.myShopJobs || [])
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    }
  }

  const fetchShop = async () => {
    try {
      const response = await fetch(`/api/shops/${shopId}`)
      if (response.ok) {
        const data = await response.json()
        setShop(data.shop)
        setShopForm({
          name: data.shop.name,
          jobTitle: data.shop.jobTitle,
          customJob: '',
          description: data.shop.description || ''
        })
      } else {
        toast.error('가게를 찾을 수 없습니다')
        router.push('/my-shop')
      }
    } catch (error) {
      console.error('Failed to fetch shop:', error)
      router.push('/my-shop')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`/api/shops/${shopId}/suggestions`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      // 권한 없으면 무시
    }
  }

  const handleReplySuggestion = async (suggestionId: string) => {
    if (!replyContent.trim()) {
      toast.error('답변 내용을 입력해주세요')
      return
    }

    setIsReplying(true)
    try {
      const response = await fetch(`/api/shops/${shopId}/suggestions/${suggestionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyContent })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '답변 실패')
      }

      toast.success('답변이 등록되었습니다!')
      setReplyingId(null)
      setReplyContent('')
      fetchSuggestions()
    } catch (error) {
      const message = error instanceof Error ? error.message : '답변 실패'
      toast.error(message)
    } finally {
      setIsReplying(false)
    }
  }

  const handleDeleteSuggestion = async (suggestionId: string) => {
    if (!confirm('이 건의를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/shops/${shopId}/suggestions/${suggestionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('건의가 삭제되었습니다')
        fetchSuggestions()
      }
    } catch (error) {
      toast.error('삭제 실패')
    }
  }

  const getAllJobOptions = () => {
    const allJobs = new Set([...jobOptions, ...myShopJobs])
    return [...allJobs].sort()
  }

  const isKnownJob = (jobTitle: string) => {
    const allJobs = getAllJobOptions()
    return allJobs.includes(jobTitle)
  }

  const handleUpdateShop = async () => {
    if (!shop) return

    const jobTitle = shopForm.jobTitle === '직접 입력' ? shopForm.customJob : shopForm.jobTitle

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
      fetchShop()
      fetchJobs()
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
        fetchShop()
      }
    } catch (error) {
      toast.error('상태 변경 실패')
    }
  }

  const handleDeleteShop = async () => {
    if (!shop) return
    if (!confirm('정말로 가게를 삭제하시겠습니까?\n모든 메뉴와 완료된 주문 기록이 삭제됩니다.')) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/shops/${shop.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '가게 삭제 실패')
      }

      toast.success('가게가 삭제되었습니다')
      router.push('/my-shop')
    } catch (error) {
      const message = error instanceof Error ? error.message : '가게 삭제 실패'
      toast.error(message)
    } finally {
      setIsDeleting(false)
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
          basePrice: parseInt(menuForm.basePrice),
          estimatedTime: menuForm.estimatedTime || null
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '메뉴 추가 실패')
      }

      toast.success('메뉴가 추가되었습니다!')
      setMenuForm({ name: '', description: '', basePrice: '', estimatedTime: '' })
      fetchShop()
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
        fetchShop()
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

  if (!shop) {
    return null
  }

  const pendingOrders = shop.orders.filter(o => o.status === 'PENDING')
  const activeOrders = shop.orders.filter(o => ['PROPOSED', 'APPROVED', 'PAID'].includes(o.status))
  const allJobs = getAllJobOptions()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/my-shop')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          목록으로
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
          <p className="text-gray-600">{shop.jobTitle}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={shop.isOpen ? 'default' : 'secondary'} className="text-base px-3 py-1">
            {shop.isOpen ? '영업중' : '휴업'}
          </Badge>
          <Button
            variant={shop.isOpen ? 'outline' : 'default'}
            onClick={handleToggleOpen}
          >
            {shop.isOpen ? (
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
          <TabsTrigger value="suggestions">
            <MessageSquare className="mr-2 h-4 w-4" />
            건의함
            {suggestions.filter(s => s.status === 'PENDING').length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {suggestions.filter(s => s.status === 'PENDING').length}
              </Badge>
            )}
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
              <div className="grid md:grid-cols-2 gap-4">
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
                <Input
                  placeholder="예상 소요 시간 (예: 30분, 1시간)"
                  value={menuForm.estimatedTime}
                  onChange={(e) => setMenuForm({ ...menuForm, estimatedTime: e.target.value })}
                />
              </div>
              <Button onClick={handleAddMenu}>
                <Plus className="mr-2 h-4 w-4" />
                메뉴 추가
              </Button>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {shop.menuItems.map(item => (
              <Card key={item.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <MarkDisplay amount={item.basePrice} size="sm" />
                        {item.estimatedTime && (
                          <span className="text-sm text-gray-500">⏱ {item.estimatedTime}</span>
                        )}
                      </div>
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

          {shop.menuItems.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>등록된 메뉴가 없습니다.</p>
                <p className="text-sm">위에서 메뉴를 추가해보세요!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          {suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map(suggestion => (
                <Card key={suggestion.id} className={suggestion.status === 'PENDING' ? 'border-blue-200' : ''}>
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{suggestion.user.nickname}</span>
                          <Badge variant={suggestion.status === 'PENDING' ? 'default' : 'secondary'}>
                            {suggestion.status === 'PENDING' ? '미답변' : '답변완료'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(suggestion.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteSuggestion(suggestion.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-700">{suggestion.content}</p>
                    </div>

                    {suggestion.reply && (
                      <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm text-blue-600 font-medium mb-1">내 답변</p>
                        <p className="text-gray-700">{suggestion.reply}</p>
                      </div>
                    )}

                    {replyingId === suggestion.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="답변을 입력하세요..."
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReplySuggestion(suggestion.id)}
                            disabled={isReplying}
                          >
                            {isReplying ? <LoadingSpinner size="sm" className="mr-2" /> : <Reply className="mr-2 h-4 w-4" />}
                            답변 등록
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReplyingId(null)
                              setReplyContent('')
                            }}
                          >
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReplyingId(suggestion.id)
                          setReplyContent(suggestion.reply || '')
                        }}
                      >
                        <Reply className="mr-2 h-4 w-4" />
                        {suggestion.reply ? '답변 수정' : '답변하기'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>아직 건의가 없습니다.</p>
                <p className="text-sm">손님들의 의견을 기다려보세요!</p>
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
                  value={isKnownJob(shopForm.jobTitle) ? shopForm.jobTitle : '직접 입력'}
                  onChange={(e) => setShopForm({ ...shopForm, jobTitle: e.target.value, customJob: '' })}
                >
                  {myShopJobs.length > 0 && (
                    <optgroup label="내 가게 직업">
                      {myShopJobs.map(job => (
                        <option key={`my-${job}`} value={job}>{job}</option>
                      ))}
                    </optgroup>
                  )}
                  {jobOptions.length > 0 && (
                    <optgroup label="등록된 직업">
                      {jobOptions.filter(j => !myShopJobs.includes(j)).map(job => (
                        <option key={`job-${job}`} value={job}>{job}</option>
                      ))}
                    </optgroup>
                  )}
                  <option value="직접 입력">직접 입력</option>
                </select>
              </div>
              {(shopForm.jobTitle === '직접 입력' || !isKnownJob(shopForm.jobTitle)) && (
                <div>
                  <label className="block text-sm font-medium mb-1">직접 입력</label>
                  <Input
                    value={shopForm.jobTitle === '직접 입력' ? shopForm.customJob : shopForm.jobTitle}
                    onChange={(e) => setShopForm({ ...shopForm, jobTitle: '직접 입력', customJob: e.target.value })}
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
            <CardFooter className="flex justify-between">
              <Button onClick={handleUpdateShop} disabled={isSaving}>
                {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Edit2 className="mr-2 h-4 w-4" />}
                수정 저장
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteShop}
                disabled={isDeleting}
              >
                {isDeleting ? <LoadingSpinner size="sm" className="mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
                가게 삭제
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
