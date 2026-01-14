import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ transactionId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const { transactionId } = await params
    const { reason } = await request.json()

    if (!reason?.trim()) return NextResponse.json({ error: '이의신청 사유 필수' }, { status: 400 })

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { sender: true, receiver: true }
    })

    if (!transaction) return NextResponse.json({ error: '존재하지 않는 거래' }, { status: 404 })
    if (transaction.senderId !== session.user.id && transaction.receiverId !== session.user.id) {
      return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }
    if (transaction.status !== 'ACCEPTED') return NextResponse.json({ error: '체결된 거래만 이의신청 가능' }, { status: 400 })
    if (transaction.hasObjection) return NextResponse.json({ error: '이미 이의신청된 거래' }, { status: 400 })

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { hasObjection: true, objectionReason: reason, objectionStatus: 'PENDING' },
      include: {
        sender: { select: { id: true, nickname: true } },
        receiver: { select: { id: true, nickname: true } }
      }
    })

    const judge = await prisma.user.findFirst({ where: { isJudge: true } })
    if (judge) {
      await prisma.notification.create({
        data: {
          userId: judge.id,
          type: 'TRANSACTION',
          title: '이의신청 접수',
          message: `${session.user.nickname}님의 이의신청: "${reason.substring(0, 30)}..."`,
          link: '/judge/dashboard/objections'
        }
      })
    }

    return NextResponse.json({ success: true, transaction: updatedTransaction, message: '이의신청 접수됨. 재판관이 검토합니다.' })
  } catch (error) {
    console.error('이의신청 오류:', error)
    return NextResponse.json({ error: '이의신청 실패' }, { status: 500 })
  }
}
