'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarkDisplay } from '@/components/common/MarkDisplay'
import { Coins, LogOut, User, Scale, Bell } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Header() {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotificationCount()
      const interval = setInterval(fetchNotificationCount, 30000)
      return () => clearInterval(interval)
    }
  }, [session?.user?.id])

  const fetchNotificationCount = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {}
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/market" className="flex items-center gap-2">
          <Coins className="h-8 w-8 text-amber-500" />
          <span className="text-xl font-bold text-gray-800">마크 모임</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="bg-amber-50 px-4 py-2 rounded-full">
            <MarkDisplay amount={session?.user?.marks || 0} size="md" />
          </div>

          <Link href="/notifications" className="relative">
            <Button variant="ghost" size="icon">
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </Link>

          {session?.user?.isJudge && (
            <Link href="/judge">
              <Badge variant="judge" className="cursor-pointer">
                <Scale size={14} className="mr-1" />재판관
              </Badge>
            </Link>
          )}

          <Link href="/profile">
            <div className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
              <User size={20} className="text-gray-600" />
              <span className="font-medium text-gray-800">{session?.user?.nickname}</span>
            </div>
          </Link>

          <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: '/' })}>
            <LogOut size={20} className="text-gray-600" />
          </Button>
        </div>
      </div>
    </header>
  )
}
