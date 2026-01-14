import { cn } from '@/lib/utils'

export function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className={`animate-spin rounded-full border-b-2 border-amber-500 ${sizeClasses[size]}`} />
    </div>
  )
}
