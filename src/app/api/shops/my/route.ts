import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const shops = await prisma.shop.findMany({
      where: { ownerId: session.user.id },
      include: {
        menuItems: { orderBy: { createdAt: 'asc' } },
        orders: {
          where: { status: { in: ['PENDING', 'PROPOSED', 'APPROVED', 'PAID'] } },
          include: { customer: { select: { nickname: true } } },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            orders: { where: { status: 'PENDING' } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ shops })
  } catch (error) {
    console.error('내 가게 조회 오류:', error)
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }
}
