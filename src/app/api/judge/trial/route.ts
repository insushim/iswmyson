import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    }
    if (!session.user.isJudge) {
      return NextResponse.json({ error: '권능만 가능' }, { status: 403 })
    }

    const { defendantId, plaintiffId, reason, verdict, fineAmount } = await request.json()

    if (!defendantId) {
      return NextResponse.json({ error: '피고인을 선택해주세요' }, { status: 400 })
    }
    if (!reason) {
      return NextResponse.json({ error: '재판 사유를 입력해주세요' }, { status: 400 })
    }
    if (!verdict || !['GUILTY', 'NOT_GUILTY'].includes(verdict)) {
      return NextResponse.json({ error: '판결을 선택해주세요' }, { status: 400 })
    }

    const defendant = await prisma.user.findUnique({ where: { id: defendantId } })
    if (!defendant) {
      return NextResponse.json({ error: '존재하지 않는 피고인' }, { status: 404 })
    }

    // 신고 생성 (즉시 재판용)
    const report = await prisma.report.create({
      data: {
        reporterId: plaintiffId || session.user.id,
        reportedId: defendantId,
        reason,
        status: 'COMPLETED'
      }
    })

    // 재판 생성 및 즉시 완료
    const trial = await prisma.trial.create({
      data: {
        reportId: report.id,
        defendantId,
        plaintiffId: plaintiffId || session.user.id,
        verdict: verdict === 'GUILTY' ? '유죄' : '무죄',
        fineAmount: verdict === 'GUILTY' ? fineAmount : 0,
        finalFine: verdict === 'GUILTY' ? fineAmount : 0,
        status: 'COMPLETED',
        scheduledAt: new Date().toISOString()
      },
      include: {
        defendant: { select: { id: true, nickname: true } },
        plaintiff: { select: { id: true, nickname: true } }
      }
    })

    // 유죄 판결 시 벌금 차감
    if (verdict === 'GUILTY' && fineAmount > 0) {
      await prisma.user.update({
        where: { id: defendantId },
        data: { marks: { decrement: fineAmount } }
      })

      // 피고인에게 알림
      await prisma.notification.create({
        data: {
          userId: defendantId,
          type: 'TRIAL',
          title: '재판 결과: 유죄',
          message: `사유: ${reason}\n벌금: ${fineAmount}마크가 차감되었습니다.`,
          link: '/trial'
        }
      })
    } else {
      // 무죄 알림
      await prisma.notification.create({
        data: {
          userId: defendantId,
          type: 'TRIAL',
          title: '재판 결과: 무죄',
          message: `사유: ${reason}\n무죄 판결을 받았습니다.`,
          link: '/trial'
        }
      })
    }

    return NextResponse.json({ success: true, trial })
  } catch (error) {
    console.error('재판 처리 오류:', error)
    return NextResponse.json({ error: '재판 처리 실패' }, { status: 500 })
  }
}
