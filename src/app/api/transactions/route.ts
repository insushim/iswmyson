import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const transactions = await prisma.transaction.findMany({
      where: { OR: [{ senderId: session.user.id }, { receiverId: session.user.id }] },
      include: {
        sender: { select: { id: true, nickname: true } },
        receiver: { select: { id: true, nickname: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('거래 목록 조회 오류:', error)
    return NextResponse.json({ error: '거래 목록 조회 실패' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const { receiverId, amount, description } = await request.json()

    if (!amount || amount < 1) return NextResponse.json({ error: '금액은 1 이상' }, { status: 400 })
    if (!description) return NextResponse.json({ error: '거래 내용 필수' }, { status: 400 })

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } })
    if (!receiver) return NextResponse.json({ error: '존재하지 않는 사용자' }, { status: 404 })
    if (receiverId === session.user.id) return NextResponse.json({ error: '자기 자신에게 거래 불가' }, { status: 400 })

    const transaction = await prisma.transaction.create({
      data: { senderId: session.user.id, receiverId, amount, description, status: 'PENDING' },
      include: {
        sender: { select: { id: true, nickname: true } },
        receiver: { select: { id: true, nickname: true } }
      }
    })

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'TRANSACTION',
        title: '새로운 거래 요청!',
        message: `${session.user.nickname}님이 ${amount.toLocaleString()} 마크 거래 요청`,
        link: '/transactions'
      }
    })

    return NextResponse.json({ success: true, transaction, message: '거래 요청 발송!' })
  } catch (error) {
    console.error('거래 생성 오류:', error)
    return NextResponse.json({ error: '거래 생성 실패' }, { status: 500 })
  }
}
