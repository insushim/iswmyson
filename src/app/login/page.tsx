'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ nickname: '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        nickname: formData.nickname,
        password: formData.password,
        redirect: false
      })
      if (result?.error) {
        setError(result.error)
        toast.error(result.error)
      } else {
        toast.success('환영합니다!')
        router.push('/market')
        router.refresh()
      }
    } catch {
      setError('로그인 중 오류 발생')
      toast.error('로그인 중 오류 발생')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4"><Coins className="h-12 w-12 text-amber-500" /></div>
          <CardTitle className="text-2xl">마크 모임 로그인</CardTitle>
          <CardDescription>닉네임과 비밀번호를 입력해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">닉네임</label>
              <Input value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="닉네임 입력" disabled={isLoading} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">비밀번호</label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="비밀번호 입력" disabled={isLoading} />
            </div>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />로그인 중...</> : '로그인'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            계정이 없으신가요? <Link href="/register" className="text-blue-600 hover:underline font-medium">가입하기</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
