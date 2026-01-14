'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { MarkDisplay } from '@/components/common/MarkDisplay'
import { User, Coins, Store, ShoppingBag, Scale, LogOut, Lock, Gavel } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  nickname: string
  marks: number
  isJudge: boolean
  createdAt: string
  shop?: { id: string } | null
  _count: {
    ordersAsCustomer: number
    sentTransactions: number
    receivedTransactions: number
    reports: number
  }
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('비밀번호를 입력해주세요')
      return
    }
    if (passwordForm.newPassword.length < 4) {
      toast.error('새 비밀번호는 4자 이상이어야 합니다')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다')
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch('/api/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || '비밀번호 변경 실패')
      }

      toast.success('비밀번호가 변경되었습니다')
      setShowPasswordForm(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      const message = error instanceof Error ? error.message : '비밀번호 변경 실패'
      toast.error(message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">내 프로필</h1>
        <p className="text-gray-600">계정 정보를 확인하고 관리하세요</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-100 rounded-full">
              <User className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {profile?.nickname}
                {profile?.isJudge && (
                  <Badge variant="judge">
                    <Gavel className="mr-1 h-3 w-3" />
                    재판관
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                가입일: {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString('ko-KR')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-6 w-6 text-amber-500" />
                <span className="text-gray-600">보유 마크</span>
              </div>
              <MarkDisplay amount={profile?.marks || 0} size="xl" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>활동 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Store className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{profile?.shop ? 1 : 0}</p>
                <p className="text-sm text-gray-600">내 가게</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <ShoppingBag className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{profile?._count.ordersAsCustomer || 0}</p>
                <p className="text-sm text-gray-600">주문 횟수</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Coins className="h-6 w-6 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">
                  {(profile?._count.sentTransactions || 0) + (profile?._count.receivedTransactions || 0)}
                </p>
                <p className="text-sm text-gray-600">거래 횟수</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Scale className="h-6 w-6 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{profile?._count.reports || 0}</p>
                <p className="text-sm text-gray-600">신고 횟수</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>계정 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPasswordForm ? (
            <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
              <Lock className="mr-2 h-4 w-4" />
              비밀번호 변경
            </Button>
          ) : (
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">현재 비밀번호</label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">새 비밀번호</label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">새 비밀번호 확인</label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                  {isChangingPassword ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                  변경
                </Button>
                <Button variant="outline" onClick={() => setShowPasswordForm(false)}>
                  취소
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        </CardFooter>
      </Card>

      <div className="text-center text-sm text-gray-400">
        <p>닉네임은 변경할 수 없습니다</p>
      </div>
    </div>
  )
}
