import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ transactionId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const { transactionId } = await params

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { sender: true, receiver: true }
    })

    if (!transaction) return NextResponse.json({ error: '존재하지 않는 거래' }, { status: 404 })
    if (transaction.receiverId !== session.user.id) return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    if (transaction.status !== 'PENDING') return NextResponse.json({ error: '이미 처리된 거래' }, { status: 400 })
    if (transaction.sender.marks < transaction.amount) return NextResponse.json({ error: '상대방 마크 부족' }, { status: 400 })

    const [updatedTransaction] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'COMPLETED' },
        include: {
          sender: { select: { id: true, nickname: true, marks: true } },
          receiver: { select: { id: true, nickname: true, marks: true } }
        }
      }),
      prisma.user.update({ where: { id: transaction.senderId }, data: { marks: { decrement: transaction.amount } } }),
      prisma.user.update({ where: { id: transaction.receiverId }, data: { marks: { increment: transaction.amount } } })
    ])

    await prisma.notification.create({
      data: {
        userId: transaction.senderId,
        type: 'TRANSACTION',
        title: '거래 체결됨!',
        message: `${session.user.nickname}님이 수락. ${transaction.amount.toLocaleString()} 마크 전송됨`,
        link: '/transactions'
      }
    })

    return NextResponse.json({ success: true, transaction: updatedTransaction, message: '거래 체결됨!' })
  } catch (error) {
    console.error('거래 수락 오류:', error)
    return NextResponse.json({ error: '거래 수락 실패' }, { status: 500 })
  }
}
