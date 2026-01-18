import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const { orderId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: { include: { owner: true } }, customer: true }
    })

    if (!order) return NextResponse.json({ error: '존재하지 않는 주문' }, { status: 404 })
    if (order.customerId !== session.user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    if (order.status !== 'PROPOSED') return NextResponse.json({ error: '가격 제안된 주문만 승인 가능' }, { status: 400 })
    if (order.customer.marks < order.proposedPrice!) return NextResponse.json({ error: '마크 부족' }, { status: 400 })

    // 세금 10% 계산
    const tax = Math.floor(order.proposedPrice! * 0.1)
    const ownerAmount = order.proposedPrice! - tax

    // 정부 가져오기 또는 생성
    let government = await prisma.government.findFirst()
    if (!government) {
      government = await prisma.government.create({ data: { marks: 400 } })
    }

    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'APPROVED', isPaid: true, canReport: true },
        include: {
          customer: { select: { id: true, nickname: true, marks: true } },
          shop: { include: { owner: { select: { id: true, nickname: true, marks: true } } } }
        }
      }),
      prisma.user.update({ where: { id: order.customerId }, data: { marks: { decrement: order.proposedPrice! } } }),
      prisma.user.update({ where: { id: order.shop.ownerId }, data: { marks: { increment: ownerAmount } } }),
      prisma.government.update({ where: { id: government.id }, data: { marks: { increment: tax } } })
    ])

    await prisma.notification.create({
      data: {
        userId: order.shop.ownerId,
        type: 'ORDER',
        title: '주문 승인됨!',
        message: `${order.customer.nickname}님이 승인. ${order.proposedPrice?.toLocaleString()} 마크 입금!`,
        link: '/my-shop/orders'
      }
    })

    return NextResponse.json({ success: true, order: updatedOrder, message: '주문 승인됨!' })
  } catch (error) {
    console.error('주문 승인 오류:', error)
    return NextResponse.json({ error: '주문 승인 실패' }, { status: 500 })
  }
}
