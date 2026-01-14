'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { Store, Search, Clock, Package } from 'lucide-react'

interface Shop {
  id: string
  name: string
  jobTitle: string
  description: string | null
  isOpen: boolean
  owner: { nickname: string }
  menuItems: { id: string; name: string; basePrice: number }[]
  _count: { orders: number }
}

export default function MarketPage() {
  const [shops, setShops] = useState<Shop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOpen, setFilterOpen] = useState<'all' | 'open' | 'closed'>('all')

  useEffect(() => {
    fetchShops()
  }, [])

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/shops')
      if (response.ok) {
        const data = await response.json()
        setShops(data.shops || [])
      }
    } catch (error) {
      console.error('Failed to fetch shops:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.owner.nickname.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterOpen === 'all' ||
      (filterOpen === 'open' && shop.isOpen) ||
      (filterOpen === 'closed' && !shop.isOpen)

    return matchesSearch && matchesFilter
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">시장</h1>
          <p className="text-gray-600">다양한 가게들을 둘러보고 주문해보세요!</p>
        </div>
        <Link href="/my-shop">
          <Button>
            <Store className="mr-2 h-4 w-4" />
            내 가게 관리
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="가게명, 직업, 사장님 닉네임으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterOpen === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterOpen('all')}
          >
            전체
          </Button>
          <Button
            variant={filterOpen === 'open' ? 'success' : 'outline'}
            onClick={() => setFilterOpen('open')}
          >
            영업중
          </Button>
          <Button
            variant={filterOpen === 'closed' ? 'secondary' : 'outline'}
            onClick={() => setFilterOpen('closed')}
          >
            휴업
          </Button>
        </div>
      </div>

      {filteredShops.length === 0 ? (
        <EmptyState
          icon={<Store className="h-12 w-12 text-gray-400" />}
          title="가게가 없습니다"
          description={searchTerm ? "검색 결과가 없습니다. 다른 키워드로 검색해보세요." : "아직 등록된 가게가 없습니다."}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShops.map((shop) => (
            <Link key={shop.id} href={`/market/${shop.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-amber-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{shop.name}</CardTitle>
                      <CardDescription>
                        <span className="font-medium">{shop.owner.nickname}</span>
                        <span className="mx-1">·</span>
                        <span>{shop.jobTitle}</span>
                      </CardDescription>
                    </div>
                    <Badge variant={shop.isOpen ? 'default' : 'secondary'}>
                      {shop.isOpen ? '영업중' : '휴업'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {shop.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{shop.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      <span>메뉴 {shop.menuItems.length}개</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>주문 {shop._count.orders}건</span>
                    </div>
                  </div>
                  {shop.menuItems.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-2">인기 메뉴</p>
                      <div className="flex flex-wrap gap-1">
                        {shop.menuItems.slice(0, 3).map((item) => (
                          <Badge key={item.id} variant="outline" className="text-xs">
                            {item.name} · {item.basePrice.toLocaleString()}마크
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
