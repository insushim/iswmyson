'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { Briefcase, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Job {
  id: string
  name: string
  description: string | null
  createdAt: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [jobForm, setJobForm] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddJob = async () => {
    if (!jobForm.name.trim()) {
      toast.error('직업 이름을 입력해주세요')
      return
    }

    setIsAdding(true)
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: jobForm.name,
          description: jobForm.description || null
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '직업 추가 실패')
      }

      toast.success('직업이 추가되었습니다!')
      setJobForm({ name: '', description: '' })
      setShowAddForm(false)
      fetchJobs()
    } catch (error) {
      const message = error instanceof Error ? error.message : '직업 추가 실패'
      toast.error(message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('이 직업을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/jobs?jobId=${jobId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('직업이 삭제되었습니다')
        fetchJobs()
      } else {
        const data = await response.json()
        throw new Error(data.error || '삭제 실패')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '삭제 실패'
      toast.error(message)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">직업</h1>
          <p className="text-gray-600">마크 모임에서 할 수 있는 직업들을 확인하세요</p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            직업 추가
          </Button>
        )}
      </div>

      {/* 직업 추가 폼 */}
      {showAddForm && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle>새 직업 추가</CardTitle>
            <CardDescription>새로운 직업을 등록해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">직업 이름</label>
              <Input
                value={jobForm.name}
                onChange={(e) => setJobForm({ ...jobForm, name: e.target.value })}
                placeholder="예: 치킨집 사장"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">직업이 하는 일</label>
              <Textarea
                value={jobForm.description}
                onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                placeholder="예: 맛있는 치킨을 튀겨서 판매합니다"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setJobForm({ name: '', description: '' })
                }}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleAddJob}
                disabled={isAdding}
                className="flex-1"
              >
                {isAdding ? <LoadingSpinner size="sm" className="mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
                추가
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 직업 목록 */}
      {jobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-12 w-12 text-gray-400" />}
          title="등록된 직업이 없습니다"
          description="오른쪽 위 '직업 추가' 버튼으로 새 직업을 등록해보세요!"
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Briefcase className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{job.name}</h3>
                      {job.description && (
                        <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDeleteJob(job.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
