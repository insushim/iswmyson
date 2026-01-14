import { Badge } from '@/components/ui/badge'

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "pending" | "mark" | "judge" | "objection" }> = {
  PENDING: { label: '대기중', variant: 'pending' },
  PROPOSED: { label: '가격 제안됨', variant: 'warning' },
  PRICE_PROPOSED: { label: '가격 제안됨', variant: 'warning' },
  APPROVED: { label: '승인됨', variant: 'success' },
  PAID: { label: '결제완료', variant: 'success' },
  IN_PROGRESS: { label: '진행중', variant: 'default' },
  READY: { label: '준비완료', variant: 'success' },
  DELIVERED: { label: '수령완료', variant: 'secondary' },
  COMPLETED: { label: '완료', variant: 'secondary' },
  CANCELLED: { label: '취소됨', variant: 'destructive' },
  REJECTED: { label: '거절됨', variant: 'destructive' },
  DISPUTED: { label: '분쟁중', variant: 'destructive' },
}

export function OrderStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, variant: 'default' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
