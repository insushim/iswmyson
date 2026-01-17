'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarkDisplay } from '@/components/common/MarkDisplay'
import { Coins, LogOut, User, Scale, Bell } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

export function Header() {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [currentMarks, setCurrentMarks] = useState(0)

  const fetchUserData = useCallback(async () => {
    try {
      const [notifRes, userRes] = await Promise.all([
        fetch('/api/notifications'),
        fetch('/api/users/me')
      ])

      if (notifRes.ok) {
        const data = await notifRes.json()
        setUnreadCount(data.unreadCount || 0)
      }

      if (userRes.ok) {
        const data = await userRes.json()
        setCurrentMarks(data.marks || 0)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      setCurrentMarks(session.user.marks || 0)
      fetchUserData()
      const interval = setInterval(fetchUserData, 10000)
      return () => clearInterval(interval)
    }
  }, [session?.user?.id, session?.user?.marks, fetchUserData])

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 h-16">
      <div className="h-full px-3 lg:px-6 flex items-center justify-between">
        <Link href="/market" className="flex items-center gap-2">
          <Coins className="h-7 w-7 lg:h-8 lg:w-8 text-amber-500" />
          <span className="text-lg lg:text-xl font-bold text-gray-800">마크 모임</span>
        </Link>

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
