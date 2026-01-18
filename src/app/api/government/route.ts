import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function getOrCreateGovernment() {
  let government = await prisma.government.findFirst()
  if (!government) {
    government = await prisma.government.create({
      data: { marks: 400 }
    })
  }
  return government
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.isJudge) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    const government = await getOrCreateGovernment()
    const orders = await prisma.governmentOrder.findMany({
      where: { governmentId: government.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ government, orders })
  } catch (error) {
    console.error('정부 조회 오류:', error)
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user?.isJudge) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    const { shopId, description, amount } = await request.json()

    if (!shopId || !description || !amount || amount <= 0) {
      return NextResponse.json({ error: '필수 정보를 입력해주세요' }, { status: 400 })
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { owner: true }
    })
    if (!shop) {
      return NextResponse.json({ error: '가게를 찾을 수 없습니다' }, { status: 404 })
    }

    const government = await getOrCreateGovernment()

    if (government.marks < amount) {
      return NextResponse.json({ error: '정부 예산이 부족합니다' }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.government.update({
        where: { id: government.id },
        data: { marks: { decrement: amount } }
      }),
      prisma.user.update({
        where: { id: shop.ownerId },
        data: { marks: { increment: amount } }
      }),
      prisma.governmentOrder.create({
        data: {
          governmentId: government.id,
          shopId: shop.id,
          shopName: shop.name,
          ownerNickname: shop.owner.nickname,
          description,
          amount
        }
      }),
      prisma.notification.create({
        data: {
          userId: shop.ownerId,
          type: 'GOVERNMENT',
          title: '정부로부터 입금',
          message: `정부가 ${amount} 마크를 지급했습니다: ${description}`,
          link: '/transactions'
        }
      })
    ])

    return NextResponse.json({ success: true, message: '정부 주문 완료' })
  } catch (error) {
    console.error('정부 주문 오류:', error)
    return NextResponse.json({ error: '주문 실패' }, { status: 500 })
  }
}
