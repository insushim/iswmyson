import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const { orderId } = await params
    const { proposedPrice, estimatedDate, ownerMessage } = await request.json()

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: true, customer: true }
    })

    if (!order) return NextResponse.json({ error: '존재하지 않는 주문' }, { status: 404 })
    if (order.shop.ownerId !== session.user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    if (order.status !== 'PENDING') return NextResponse.json({ error: '이미 처리된 주문' }, { status: 400 })

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        proposedPrice,
        estimatedDate: estimatedDate,
        ownerMessage,
        status: 'PROPOSED'
      },
      include: {
        customer: { select: { id: true, nickname: true } },
        shop: { include: { owner: { select: { id: true, nickname: true } } } }
      }
    })

    await prisma.notification.create({
      data: {
        userId: order.customerId,
        type: 'ORDER',
        title: '가격이 제안되었습니다!',
        message: `${order.shop.name}에서 ${proposedPrice.toLocaleString()} 마크 제안`,
        link: '/my-orders'
      }
    })

    return NextResponse.json({ success: true, order: updatedOrder, message: '가격 제안됨!' })
  } catch (error) {
    console.error('가격 제안 오류:', error)
    return NextResponse.json({ error: '가격 제안 실패' }, { status: 500 })
  }
}
