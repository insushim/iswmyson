'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Gavel, Lock, AlertCircle, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function JudgeLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/judge/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '인증 실패')
      }

      toast.success('재판관 인증 완료!')
      router.push('/judge/dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : '인증 실패'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-purple-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-purple-100 rounded-full">
              <Gavel className="h-12 w-12 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">재판관 인증</CardTitle>
          <CardDescription>재판관 비밀번호를 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">비밀번호</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="재판관 비밀번호"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '인증 중...' : '인증하기'}
            </Button>
          </form>

          <div className="mt-4">
            <Button
              variant="ghost"
              className="w-full text-gray-500"
              onClick={() => setShowHint(!showHint)}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              힌트 보기
            </Button>

            {showHint && (
              <div className="mt-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>현보의 금고 번호</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-gray-500">심현보 전용 페이지입니다</p>
        </CardFooter>
      </Card>
    </div>
  )
}
