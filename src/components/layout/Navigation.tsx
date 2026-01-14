'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Store, ShoppingBag, ClipboardList, ArrowLeftRight, Scale, User } from 'lucide-react'

const navItems = [
  { href: '/market', label: '시장', icon: Store },
  { href: '/my-shop', label: '내 가게', icon: ShoppingBag },
  { href: '/my-orders', label: '내 주문', icon: ClipboardList },
  { href: '/transactions', label: '거래', icon: ArrowLeftRight },
  { href: '/trial', label: '재판', icon: Scale },
  { href: '/profile', label: '프로필', icon: User },
]

export function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <nav className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-64px)] p-4">
      <ul className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive ? 'bg-amber-100 text-amber-800 font-medium' : 'text-gray-600 hover:bg-gray-100'
                )}>
                <Icon size={20} /><span>{item.label}</span>
              </Link>
            </li>
          )
        })}

        {session?.user?.isJudge && (
          <li className="pt-4 border-t border-gray-200 mt-4">
            <Link href="/judge"
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                pathname.startsWith('/judge') ? 'bg-purple-100 text-purple-800 font-medium' : 'text-purple-600 hover:bg-purple-50'
              )}>
              <Scale size={20} /><span>재판관 관리</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
