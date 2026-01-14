import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    if (!session.user.isJudge) return NextResponse.json({ error: '재판관만 접근 가능' }, { status: 403 })

    const objections = await prisma.transaction.findMany({
      where: { hasObjection: true },
      include: {
        sender: { select: { id: true, nickname: true, marks: true } },
        receiver: { select: { id: true, nickname: true, marks: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ objections })
  } catch (error) {
    console.error('이의신청 목록 조회 오류:', error)
    return NextResponse.json({ error: '조회 실패' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    if (!session.user.isJudge) return NextResponse.json({ error: '재판관만 처리 가능' }, { status: 403 })

    const { transactionId, approve } = await request.json()

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { sender: true, receiver: true }
    })
    if (!transaction) return NextResponse.json({ error: '존재하지 않는 거래' }, { status: 404 })
    if (!transaction.hasObjection) return NextResponse.json({ error: '이의신청된 거래가 아님' }, { status: 400 })
    if (transaction.objectionStatus !== 'PENDING') return NextResponse.json({ error: '이미 처리됨' }, { status: 400 })

    if (approve) {
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transactionId },
          data: { status: 'CANCELLED', objectionStatus: 'APPROVED' }
        }),
        prisma.user.update({
          where: { id: transaction.senderId },
          data: { marks: { increment: transaction.amount } }
        }),
        prisma.user.update({
          where: { id: transaction.receiverId },
          data: { marks: { decrement: transaction.amount } }
        })
      ])

      await Promise.all([
        prisma.notification.create({
          data: { userId: transaction.senderId, type: 'TRANSACTION', title: '이의신청 승인됨', message: `거래가 취소되고 ${transaction.amount.toLocaleString()} 마크가 환급됨`, link: '/transactions' }
        }),
        prisma.notification.create({
          data: { userId: transaction.receiverId, type: 'TRANSACTION', title: '거래 취소됨', message: `이의신청 승인으로 거래가 취소됨`, link: '/transactions' }
        })
      ])

      return NextResponse.json({ success: true, message: '이의신청 승인, 거래 취소됨' })
    } else {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { objectionStatus: 'REJECTED' }
      })

      await prisma.notification.create({
        data: { userId: transaction.senderId, type: 'TRANSACTION', title: '이의신청 거절됨', message: '재판관이 이의신청을 거절했습니다', link: '/transactions' }
      })

      return NextResponse.json({ success: true, message: '이의신청 거절됨' })
    }
  } catch (error) {
    console.error('이의신청 처리 오류:', error)
    return NextResponse.json({ error: '이의신청 처리 실패' }, { status: 500 })
  }
}
