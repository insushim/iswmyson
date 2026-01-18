'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Store, Plus, Package, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'

interface Shop {
  id: string
  name: string
  jobTitle: string
  description: string | null
  isOpen: boolean
  _count: { orders: number }
}

interface Job {
  id: string
  name: string
}

export default function MyShopListPage() {
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [jobOptions, setJobOptions] = useState<string[]>([])
  const [myShopJobs, setMyShopJobs] = useState<string[]>([])

  const [shopForm, setShopForm] = useState({
    name: '',
    jobTitle: '',
    customJob: '',
    description: ''
  })

  useEffect(() => {
    fetchMyShops()
    fetchJobs()
  }, [])

  const fetchMyShops = async () => {
    try {
      const response = await fetch('/api/shops/my')
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

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const data = await response.json()
        const jobs = (data.jobs || []).map((j: Job) => j.name)
        setJobOptions(jobs)
        setMyShopJobs(data.myShopJobs || [])
        if (jobs.length > 0) {
          setShopForm(prev => ({ ...prev, jobTitle: jobs[0] }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    }
  }

  const getAllJobOptions = () => {
    const allJobs = new Set([...jobOptions, ...myShopJobs])
    return [...allJobs].sort()
  }

  const handleCreateShop = async () => {
    if (!shopForm.name.trim()) {
      toast.error('가게 이름을 입력해주세요')
      return
    }

    const jobTitle = shopForm.jobTitle === '직접 입력' ? shopForm.customJob : shopForm.jobTitle
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
      setShopForm({ name: '', jobTitle: jobOptions[0] || '', customJob: '', description: '' })
      setShowCreateForm(false)
      fetchMyShops()
      fetchJobs()
    } catch (error) {
      const message = error instanceof Error ? error.message : '가게 생성 실패'
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

  const allJobs = getAllJobOptions()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내 가게</h1>
          <p className="text-gray-600">내가 운영하는 가게들을 관리하세요</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          가게 추가
        </Button>
      </div>

      {showCreateForm && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle>새 가게 만들기</CardTitle>
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
                {allJobs.length === 0 ? (
                  <option value="">직업을 먼저 추가해주세요</option>
                ) : (
                  <>
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
                  </>
                )}
                <option value="직접 입력">직접 입력</option>
              </select>
            </div>
            {shopForm.jobTitle === '직접 입력' && (
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
          <CardFooter className="flex gap-2">
            <Button onClick={handleCreateShop} disabled={isSaving}>
              {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Store className="mr-2 h-4 w-4" />}
              가게 열기
            </Button>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              취소
            </Button>
          </CardFooter>
        </Card>
      )}

      {shops.length === 0 && !showCreateForm ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">아직 가게가 없습니다</h2>
            <p className="text-gray-600 mb-4">시장에서 자신만의 가게를 열어보세요!</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              첫 가게 열기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shops.map(shop => (
            <Card
              key={shop.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/my-shop/${shop.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{shop.name}</CardTitle>
                    <CardDescription>{shop.jobTitle}</CardDescription>
                  </div>
                  <Badge variant={shop.isOpen ? 'default' : 'secondary'}>
                    {shop.isOpen ? '영업중' : '휴업'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {shop.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{shop.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <ClipboardList className="h-4 w-4" />
                    <span>대기 주문 {shop._count.orders}건</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" size="sm">
                  <Package className="mr-2 h-4 w-4" />
                  가게 관리
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
