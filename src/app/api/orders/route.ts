import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateOrderNumber } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const orderId = searchParams.get('orderId')

    // 개별 주문 조회
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: { select: { id: true, nickname: true } },
          shop: { include: { owner: { select: { id: true, nickname: true } } } }
        }
      })

      if (!order) {
        return NextResponse.json({ error: '주문을 찾을 수 없습니다' }, { status: 404 })
      }

      // 권한 확인: 주문자이거나 가게 주인이어야 함
      const shop = await prisma.shop.findUnique({ where: { id: order.shopId } })
      if (order.customerId !== session.user.id && shop?.ownerId !== session.user.id) {
        return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
      }

      return NextResponse.json(order)
    }

    let orders
    if (type === 'owner') {
      const shops = await prisma.shop.findMany({ where: { ownerId: session.user.id } })
      if (shops.length === 0) return NextResponse.json({ orders: [] })
      orders = await prisma.order.findMany({
        where: { shopId: { in: shops.map(s => s.id) } },
        include: {
          customer: { select: { id: true, nickname: true } },
          shop: { include: { owner: { select: { id: true, nickname: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      orders = await prisma.order.findMany({
        where: { customerId: session.user.id },
        include: {
          customer: { select: { id: true, nickname: true } },
          shop: { include: { owner: { select: { id: true, nickname: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('주문 목록 조회 오류:', error)
    return NextResponse.json({ error: '주문 목록 조회 실패' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    }

    const { shopId, customRequest } = await request.json()

    if (!customRequest || customRequest.length > 500) {
      return NextResponse.json({ error: '주문 내용은 1~500자' }, { status: 400 })
    }

    const shop = await prisma.shop.findUnique({ where: { id: shopId }, include: { owner: true } })
    if (!shop) {
      return NextResponse.json({ error: '존재하지 않는 가게' }, { status: 404 })
    }
    if (shop.ownerId === session.user.id) {
      return NextResponse.json({ error: '자기 가게에 주문 불가' }, { status: 400 })
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: session.user.id,
        shopId,
        customRequest,
        status: 'PENDING'
      },
      include: {
        customer: { select: { id: true, nickname: true } },
        shop: { include: { owner: { select: { id: true, nickname: true } } } }
      }
    })

    await prisma.notification.create({
      data: {
        userId: shop.ownerId,
        type: 'ORDER',
        title: '새 주문이 들어왔습니다!',
        message: `${session.user.nickname}님이 주문: "${customRequest.substring(0, 30)}..."`,
        link: '/my-shop/orders'
      }
    })

    return NextResponse.json({ success: true, order, message: '주문 접수됨!' })
  } catch (error) {
    console.error('주문 생성 오류:', error)
    return NextResponse.json({ error: '주문 생성 실패' }, { status: 500 })
  }
}
