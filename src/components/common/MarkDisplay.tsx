'use client'

import { cn } from '@/lib/utils'
import { Coins } from 'lucide-react'

interface MarkDisplayProps {
  amount: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showIcon?: boolean
  className?: string
  change?: number
}

export function MarkDisplay({ amount, size = 'md', showIcon = true, className, change }: MarkDisplayProps) {
  const sizeClasses = { sm: 'text-sm', md: 'text-base', lg: 'text-xl font-bold', xl: 'text-3xl font-bold' }
  const iconSizes = { sm: 14, md: 18, lg: 24, xl: 32 }

  return (
    <div className={cn('inline-flex items-center gap-1', sizeClasses[size], className)}>
      {showIcon && <Coins size={iconSizes[size]} className="text-amber-500" />}
      <span className="font-semibold text-amber-700">{amount.toLocaleString('ko-KR')}</span>
      <span className="text-amber-600">마크</span>
      {change !== undefined && change !== 0 && (
        <span className={cn('ml-1 text-sm', change > 0 ? 'text-green-600' : 'text-red-600')}>
          ({change > 0 ? '+' : ''}{change.toLocaleString('ko-KR')})
        </span>
      )}
    </div>
  )
}

export function MarkBadge({ amount }: { amount: number }) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 font-bold rounded-full text-sm shadow-sm">
      <Coins size={14} />
      <span>{amount.toLocaleString('ko-KR')}</span>
    </div>
  )
}
