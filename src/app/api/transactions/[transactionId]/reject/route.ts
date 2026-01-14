import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ transactionId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const { transactionId } = await params

    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } })
    if (!transaction) return NextResponse.json({ error: '존재하지 않는 거래' }, { status: 404 })
    if (transaction.senderId !== session.user.id && transaction.receiverId !== session.user.id) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }
    if (transaction.status !== 'PENDING') return NextResponse.json({ error: '이미 처리된 거래' }, { status: 400 })

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'REJECTED' },
      include: {
        sender: { select: { id: true, nickname: true } },
        receiver: { select: { id: true, nickname: true } }
      }
    })

    const targetUserId = transaction.senderId === session.user.id ? transaction.receiverId : transaction.senderId
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        type: 'TRANSACTION',
        title: '거래가 거절됨',
        message: `${session.user.nickname}님이 거래를 거절했습니다`,
        link: '/transactions'
      }
    })

    return NextResponse.json({ success: true, transaction: updatedTransaction, message: '거래 거절됨' })
  } catch (error) {
    console.error('거래 거절 오류:', error)
    return NextResponse.json({ error: '거래 거절 실패' }, { status: 500 })
  }
}
