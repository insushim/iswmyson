import type {
  User, Shop, MenuItem, Order,
  Transaction, Report, Trial, Notification
} from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      nickname: string
      marks: number
      isJudge: boolean
    }
  }
  interface User {
    id: string
    nickname: string
    marks: number
    isJudge: boolean
  }
}

export type ShopWithOwner = Shop & {
  owner: User
  menuItems: MenuItem[]
  _count?: { orders: number }
}

export type OrderWithDetails = Order & {
  customer: User
  shop: ShopWithOwner
}

export type TransactionWithUsers = Transaction & {
  sender: User
  receiver: User
}

export type ReportWithUsers = Report & {
  reporter: User
  reported: User
  order?: Order | null
  trial?: Trial | null
}

export type TrialWithDetails = Trial & {
  report: ReportWithUsers
  defendant: User
  plaintiff: User
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type OrderStatus =
  | 'PENDING'
  | 'PRICE_PROPOSED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'DISPUTED'

export type TransactionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'

export type ReportStatus = 'PENDING' | 'ACCEPTED' | 'TRIAL_SCHEDULED' | 'RESOLVED' | 'DISMISSED'

export type TrialStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'

export type NotificationType = 'ORDER' | 'TRANSACTION' | 'REPORT' | 'TRIAL' | 'SYSTEM'
