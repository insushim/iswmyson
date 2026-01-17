'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Store, ShoppingBag, ClipboardList, ArrowLeftRight, Scale, User, Briefcase, ScrollText } from 'lucide-react'

const navItems = [
  { href: '/market', label: '시장', icon: Store },
  { href: '/my-shop', label: '내 가게', icon: ShoppingBag },
  { href: '/my-orders', label: '내 주문', icon: ClipboardList },
  { href: '/transactions', label: '거래', icon: ArrowLeftRight },
  { href: '/jobs', label: '직업', icon: Briefcase },
  { href: '/records', label: '기록', icon: ScrollText },
  { href: '/trial', label: '재판', icon: Scale },
  { href: '/profile', label: '프로필', icon: User },
]

export function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <>
      {/* 데스크탑 사이드바 */}
      <nav className="hidden lg:block fixed left-0 top-16 w-48 bg-white border-r border-gray-200 h-[calc(100vh-64px)] p-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm',
                    isActive ? 'bg-amber-100 text-amber-800 font-medium' : 'text-gray-600 hover:bg-gray-100'
                  )}>
                  <Icon size={18} /><span>{item.label}</span>
                </Link>
              </li>
            )
          })}

          {session?.user?.isJudge && (
            <li className="pt-3 border-t border-gray-200 mt-3">
              <Link href="/judge"
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm',
                  pathname.startsWith('/judge') ? 'bg-purple-100 text-purple-800 font-medium' : 'text-purple-600 hover:bg-purple-50'
                )}>
                <Scale size={18} /><span>권능</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* 모바일 하단 네비게이션 */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <ul className="flex justify-around items-center h-16">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-1 px-3 py-2',
                    isActive ? 'text-amber-600' : 'text-gray-500'
                  )}>
                  <Icon size={20} />
                  <span className="text-xs">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
