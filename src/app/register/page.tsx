'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({ nickname: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (formData.nickname.length < 2) newErrors.nickname = '닉네임은 2자 이상'
    if (formData.nickname.length > 20) newErrors.nickname = '닉네임은 20자 이하'
    if (!/^[가-힣a-zA-Z0-9]+$/.test(formData.nickname)) newErrors.nickname = '한글, 영문, 숫자만 사용'
    if (formData.password.length < 4) newErrors.password = '비밀번호는 4자 이상'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = '비밀번호 불일치'

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setIsLoading(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: formData.nickname, password: formData.password })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '가입 실패')
      toast.success('가입 환영합니다! 100 마크 지급!')
      router.push('/login')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '가입 실패'
      toast.error(message)
      setErrors({ general: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4"><Coins className="h-12 w-12 text-amber-500" /></div>
          <CardTitle className="text-2xl">마크 모임 가입</CardTitle>
          <CardDescription>
            닉네임을 정하고 참여하세요!<br />
            <span className="text-amber-600 font-semibold">닉네임은 변경 불가!</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">닉네임</label>
              <Input value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="닉네임 입력 (2~20자)" disabled={isLoading} className={errors.nickname ? 'border-red-500' : ''} />
              {errors.nickname && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} />{errors.nickname}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">비밀번호</label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="비밀번호 (4자 이상)" disabled={isLoading} className={errors.password ? 'border-red-500' : ''} />
              {errors.password && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} />{errors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
              <Input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="비밀번호 다시 입력" disabled={isLoading} className={errors.confirmPassword ? 'border-red-500' : ''} />
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} />{errors.confirmPassword}</p>}
            </div>
            {errors.general && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16} />{errors.general}</div>}
            <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-800"><p className="font-semibold">가입 혜택</p><p>가입 즉시 100 마크 지급!</p></div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />가입 중...</> : '가입하기'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            이미 계정이 있으신가요? <Link href="/login" className="text-blue-600 hover:underline font-medium">로그인</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
