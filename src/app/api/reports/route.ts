import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const reports = await prisma.report.findMany({
      where: { OR: [{ reporterId: session.user.id }, { reportedId: session.user.id }] },
      include: {
        reporter: { select: { id: true, nickname: true } },
        reported: { select: { id: true, nickname: true } },
        order: true,
        trial: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('신고 목록 조회 오류:', error)
    return NextResponse.json({ error: '신고 목록 조회 실패' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const { reportedId, reason, evidence, orderId } = await request.json()

    if (!reason) return NextResponse.json({ error: '죄목 필수' }, { status: 400 })

    const reported = await prisma.user.findUnique({ where: { id: reportedId } })
    if (!reported) return NextResponse.json({ error: '존재하지 않는 사용자' }, { status: 404 })
    if (reportedId === session.user.id) return NextResponse.json({ error: '자기 자신 신고 불가' }, { status: 400 })

    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } })
      if (!order) return NextResponse.json({ error: '존재하지 않는 주문' }, { status: 404 })
      if (!order.canReport) return NextResponse.json({ error: '신고 불가 주문 (이미 수령 완료)' }, { status: 400 })
    }

    const report = await prisma.report.create({
      data: { reporterId: session.user.id, reportedId, reason, evidence, orderId, status: 'PENDING' },
      include: {
        reporter: { select: { id: true, nickname: true } },
        reported: { select: { id: true, nickname: true } },
        order: true
      }
    })

    const judge = await prisma.user.findFirst({ where: { isJudge: true } })
    if (judge) {
      await prisma.notification.create({
        data: {
          userId: judge.id,
          type: 'REPORT',
          title: '신고 접수',
          message: `${session.user.nickname}님이 ${reported.nickname}님을 신고: "${reason.substring(0, 30)}..."`,
          link: '/judge/dashboard/reports'
        }
      })
    }

    return NextResponse.json({ success: true, report, message: '신고 접수됨. 재판관이 검토합니다.' })
  } catch (error) {
    console.error('신고 생성 오류:', error)
    return NextResponse.json({ error: '신고 접수 실패' }, { status: 500 })
  }
}
