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
      include: { shop: true, customer: true }
    })

    if (!order) return NextResponse.json({ error: '존재하지 않는 주문' }, { status: 404 })
    if (order.customerId !== session.user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    if (!['APPROVED', 'IN_PROGRESS', 'READY'].includes(order.status)) {
      return NextResponse.json({ error: '수령 확인 불가 상태' }, { status: 400 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED', isDelivered: true, canReport: false },
      include: {
        customer: { select: { id: true, nickname: true } },
        shop: { include: { owner: { select: { id: true, nickname: true } } } }
      }
    })

    await prisma.notification.create({
      data: {
        userId: order.shop.ownerId,
        type: 'ORDER',
        title: '수령 완료!',
        message: `${order.customer.nickname}님이 주문 수령`,
        link: '/my-shop/orders'
      }
    })

    return NextResponse.json({ success: true, order: updatedOrder, message: '수령 확인됨!' })
  } catch (error) {
    console.error('수령 확인 오류:', error)
    return NextResponse.json({ error: '수령 확인 실패' }, { status: 500 })
  }
}
