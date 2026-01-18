import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId } = await params

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        owner: { select: { id: true, nickname: true } },
        menuItems: { where: { isAvailable: true }, orderBy: { createdAt: 'asc' } },
        orders: {
          where: { status: { in: ['PENDING', 'PROPOSED', 'APPROVED', 'PAID'] } },
          include: { customer: { select: { nickname: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!shop) {
      return NextResponse.json({ error: '존재하지 않는 가게' }, { status: 404 })
    }

    return NextResponse.json({ shop })
  } catch (error) {
    console.error('가게 조회 오류:', error)
    return NextResponse.json({ error: '가게 조회 실패' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const { shopId } = await params
    const { name, jobTitle, description, isOpen } = await request.json()

    const shop = await prisma.shop.findUnique({ where: { id: shopId } })
    if (!shop) return NextResponse.json({ error: '존재하지 않는 가게' }, { status: 404 })
    if (shop.ownerId !== session.user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: { name, jobTitle, description, isOpen },
      include: { owner: { select: { id: true, nickname: true } }, menuItems: true }
    })

    return NextResponse.json({ success: true, shop: updatedShop })
  } catch (error) {
    console.error('가게 수정 오류:', error)
    return NextResponse.json({ error: '가게 수정 실패' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const { shopId } = await params

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        orders: { where: { status: { in: ['PENDING', 'PROPOSED', 'APPROVED', 'PAID'] } } }
      }
    })
    if (!shop) return NextResponse.json({ error: '존재하지 않는 가게' }, { status: 404 })
    if (shop.ownerId !== session.user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

    if (shop.orders.length > 0) {
      return NextResponse.json({ error: '진행 중인 주문이 있어 삭제할 수 없습니다' }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.menuItem.deleteMany({ where: { shopId } }),
      prisma.order.deleteMany({ where: { shopId } }),
      prisma.shop.delete({ where: { id: shopId } })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('가게 삭제 오류:', error)
    return NextResponse.json({ error: '가게 삭제 실패' }, { status: 500 })
  }
}
