import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        nickname: true,
        marks: true,
        isJudge: true,
        createdAt: true,
        shops: { select: { id: true } },
        _count: {
          select: {
            ordersAsCustomer: true,
            sentTransactions: true,
            receivedTransactions: true,
            reports: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return NextResponse.json({ error: '사용자 정보 조회 실패' }, { status: 500 })
  }
}
