import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const shop = await prisma.shop.findUnique({
      where: { ownerId: session.user.id },
      include: {
        menuItems: { orderBy: { createdAt: 'asc' } },
        orders: {
          where: { status: { in: ['PENDING', 'PROPOSED', 'APPROVED', 'PAID'] } },
          include: { customer: { select: { nickname: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json({ shop })
  } catch (error) {
    console.error('내 가게 조회 오류:', error)
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }
}
