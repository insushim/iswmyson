'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarkDisplay } from '@/components/common/MarkDisplay'
import { Coins, LogOut, User, Scale, Bell } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

interface OnlineUser {
  id: string
  nickname: string
}

// 온라인 사용자 구슬 컴포넌트
function OnlineUserOrbs({ users }: { users: OnlineUser[] }) {
  if (users.length === 0) return null

  // 색상 팔레트 (무지개 색상)
  const colors = [
    'bg-red-400',
    'bg-orange-400',
    'bg-amber-400',
    'bg-yellow-400',
    'bg-lime-400',
    'bg-green-400',
    'bg-emerald-400',
    'bg-teal-400',
    'bg-cyan-400',
    'bg-sky-400',
    'bg-blue-400',
    'bg-indigo-400',
    'bg-violet-400',
    'bg-purple-400',
    'bg-fuchsia-400',
    'bg-pink-400',
    'bg-rose-400',
  ]

  return (
    <div className="flex items-center gap-1">
      {users.slice(0, 8).map((user, index) => (
        <div
          key={user.id}
          className={`
            relative w-8 h-8 lg:w-9 lg:h-9 rounded-full
            ${colors[index % colors.length]}
            flex items-center justify-center
            shadow-md
            transition-transform hover:scale-110 hover:z-10
            cursor-default
            ring-2 ring-white
          `}
          title={user.nickname}
        >
          <span className="text-[9px] lg:text-[10px] font-bold text-white truncate px-0.5 text-center leading-none">
            {user.nickname.length > 3 ? user.nickname.slice(0, 3) : user.nickname}
          </span>
          {/* 온라인 표시 점 */}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
        </div>
      ))}
      {users.length > 8 && (
        <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gray-400 flex items-center justify-center shadow-md ring-2 ring-white">
          <span className="text-[10px] font-bold text-white">+{users.length - 8}</span>
        </div>
      )}
    </div>
  )
}

export function Header() {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [currentMarks, setCurrentMarks] = useState(0)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])

  const fetchUserData = useCallback(async () => {
    try {
      const [notifRes, userRes, onlineRes] = await Promise.all([
        fetch('/api/notifications'),
        fetch('/api/users/me'),
        fetch('/api/users/online')
      ])

      if (notifRes.ok) {
        const data = await notifRes.json()
        setUnreadCount(data.unreadCount || 0)
      }

      if (userRes.ok) {
        const data = await userRes.json()
        setCurrentMarks(data.marks || 0)
      }

      if (onlineRes.ok) {
        const data = await onlineRes.json()
        setOnlineUsers(data.onlineUsers || [])
      }
    } catch {}
  }, [])

  // 하트비트 전송 (10초마다)
  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch('/api/users/online', { method: 'POST' })
    } catch {}
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      setCurrentMarks(session.user.marks || 0)

      // 초기 하트비트 전송
      sendHeartbeat()
      fetchUserData()

      // 10초마다 하트비트 전송
      const heartbeatInterval = setInterval(sendHeartbeat, 10000)
      // 5초마다 데이터 갱신 (온라인 상태 빠른 반영)
      const dataInterval = setInterval(fetchUserData, 5000)

      return () => {
        clearInterval(heartbeatInterval)
        clearInterval(dataInterval)
      }
    }
  }, [session?.user?.id, session?.user?.marks, fetchUserData, sendHeartbeat])

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 h-16">
      <div className="h-full px-3 lg:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 lg:gap-4">
          <Link href="/market" className="flex items-center gap-2">
            <Coins className="h-7 w-7 lg:h-8 lg:w-8 text-amber-500" />
            <span className="text-lg lg:text-xl font-bold text-gray-800 hidden sm:block">마크 모임</span>
          </Link>

          {/* 온라인 사용자 구슬들 */}
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-2 pl-2 lg:pl-3 border-l border-gray-200">
              <span className="text-xs text-gray-500 hidden lg:block">접속중</span>
              <OnlineUserOrbs users={onlineUsers} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="bg-amber-50 px-2 lg:px-4 py-1.5 lg:py-2 rounded-full">
            <MarkDisplay amount={currentMarks} size="sm" className="lg:text-base" />
          </div>

          <Link href="/notifications" className="relative">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </Link>

          {session?.user?.isJudge && (
            <Link href="/judge" className="hidden sm:block">
              <Badge variant="judge" className="cursor-pointer">
                <Scale size={14} className="mr-1" />재판관
              </Badge>
            </Link>
          )}

          <Link href="/profile" className="hidden sm:flex items-center gap-2 hover:bg-gray-100 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg transition-colors">
            <User size={18} className="text-gray-600" />
            <span className="font-medium text-gray-800 text-sm lg:text-base">{session?.user?.nickname}</span>
          </Link>

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => signOut({ callbackUrl: '/' })}>
            <LogOut size={18} className="text-gray-600" />
          </Button>
        </div>
      </div>
    </header>
  )
}

