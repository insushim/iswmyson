import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { orderId } = await params

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: true }
    })

    if (!order) {
      return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 })
    }

    if (order.customerId !== session.user.id) {
      return NextResponse.json({ error: '본인 주문만 거절할 수 있습니다' }, { status: 403 })
    }

    if (order.status !== 'PROPOSED') {
      return NextResponse.json({ error: '제안 상태의 주문만 거절할 수 있습니다' }, { status: 400 })
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'REJECTED' }
    })

    return NextResponse.json({ message: '주문이 거절되었습니다' })
  } catch (error) {
    console.error('Failed to reject order:', error)
    return NextResponse.json({ error: '주문 거절 실패' }, { status: 500 })
  }
}
