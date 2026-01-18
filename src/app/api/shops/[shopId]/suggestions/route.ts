import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    }

    const { shopId } = await params

    const shop = await prisma.shop.findUnique({ where: { id: shopId } })
    if (!shop) {
      return NextResponse.json({ error: '가게를 찾을 수 없습니다' }, { status: 404 })
    }

    // 가게 주인만 전체 건의 목록 조회 가능
    if (shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    const suggestions = await prisma.suggestion.findMany({
      where: { shopId },
      include: {
        user: { select: { id: true, nickname: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('건의 목록 조회 오류:', error)
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    }

    const { shopId } = await params
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '건의 내용을 입력해주세요' }, { status: 400 })
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { owner: true }
    })
    if (!shop) {
      return NextResponse.json({ error: '가게를 찾을 수 없습니다' }, { status: 404 })
    }

    // 자기 가게에는 건의 불가
    if (shop.ownerId === session.user.id) {
      return NextResponse.json({ error: '자신의 가게에는 건의할 수 없습니다' }, { status: 400 })
    }

    const suggestion = await prisma.suggestion.create({
      data: {
        shopId,
        userId: session.user.id,
        content: content.trim()
      },
      include: {
        user: { select: { id: true, nickname: true } }
      }
    })

    // 가게 주인에게 알림
    await prisma.notification.create({
      data: {
        userId: shop.ownerId,
        type: 'SUGGESTION',
        title: '새로운 건의가 있습니다',
        message: `${session.user.nickname}님이 "${shop.name}" 가게에 건의를 남겼습니다`,
        link: `/my-shop/${shopId}`
      }
    })

    return NextResponse.json({ success: true, suggestion, message: '건의가 등록되었습니다!' })
  } catch (error) {
    console.error('건의 등록 오류:', error)
    return NextResponse.json({ error: '건의 등록 실패' }, { status: 500 })
  }
}
