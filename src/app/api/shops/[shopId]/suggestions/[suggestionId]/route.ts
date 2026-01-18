import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string; suggestionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    }

    const { shopId, suggestionId } = await params
    const { reply } = await request.json()

    const shop = await prisma.shop.findUnique({ where: { id: shopId } })
    if (!shop) {
      return NextResponse.json({ error: '가게를 찾을 수 없습니다' }, { status: 404 })
    }

    // 가게 주인만 답변 가능
    if (shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    const suggestion = await prisma.suggestion.findUnique({
      where: { id: suggestionId },
      include: { user: true }
    })
    if (!suggestion || suggestion.shopId !== shopId) {
      return NextResponse.json({ error: '건의를 찾을 수 없습니다' }, { status: 404 })
    }

    const updatedSuggestion = await prisma.suggestion.update({
      where: { id: suggestionId },
      data: {
        reply: reply?.trim() || null,
        status: reply ? 'REPLIED' : 'PENDING'
      },
      include: {
        user: { select: { id: true, nickname: true } }
      }
    })

    // 건의한 사람에게 알림
    if (reply) {
      await prisma.notification.create({
        data: {
          userId: suggestion.userId,
          type: 'SUGGESTION',
          title: '건의에 답변이 달렸습니다',
          message: `"${shop.name}" 가게에서 건의에 답변했습니다`,
          link: `/market/${shopId}`
        }
      })
    }

    return NextResponse.json({ success: true, suggestion: updatedSuggestion, message: '답변 완료!' })
  } catch (error) {
    console.error('건의 답변 오류:', error)
    return NextResponse.json({ error: '답변 실패' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string; suggestionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    }

    const { shopId, suggestionId } = await params

    const suggestion = await prisma.suggestion.findUnique({
      where: { id: suggestionId }
    })
    if (!suggestion || suggestion.shopId !== shopId) {
      return NextResponse.json({ error: '건의를 찾을 수 없습니다' }, { status: 404 })
    }

    const shop = await prisma.shop.findUnique({ where: { id: shopId } })

    // 건의 작성자 또는 가게 주인만 삭제 가능
    if (suggestion.userId !== session.user.id && shop?.ownerId !== session.user.id) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }

    await prisma.suggestion.delete({ where: { id: suggestionId } })

    return NextResponse.json({ success: true, message: '건의가 삭제되었습니다' })
  } catch (error) {
    console.error('건의 삭제 오류:', error)
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 })
  }
}
