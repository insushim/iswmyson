import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ trialId: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    if (!session.user.isJudge) return NextResponse.json({ error: '재판관만 판결 가능' }, { status: 403 })

    const { trialId } = await params
    const { verdict, fineAmount } = await request.json()

    if (!verdict) return NextResponse.json({ error: '판결 내용 필수' }, { status: 400 })
    if (fineAmount < 0) return NextResponse.json({ error: '벌금은 0 이상' }, { status: 400 })

    const trial = await prisma.trial.findUnique({
      where: { id: trialId },
      include: { report: true, defendant: true, plaintiff: true }
    })
    if (!trial) return NextResponse.json({ error: '존재하지 않는 재판' }, { status: 404 })
    if (trial.defendant.marks < fineAmount) return NextResponse.json({ error: '피고인 마크 부족' }, { status: 400 })

    await prisma.$transaction([
      prisma.trial.update({
        where: { id: trialId },
        data: { verdict, fineAmount, finalFine: fineAmount, status: 'COMPLETED' }
      }),
      prisma.user.update({ where: { id: trial.defendantId }, data: { marks: { decrement: fineAmount } } }),
      prisma.report.update({ where: { id: trial.reportId }, data: { status: 'RESOLVED' } })
    ])

    const updatedTrial = await prisma.trial.findUnique({
      where: { id: trialId },
      include: {
        report: true,
        defendant: { select: { id: true, nickname: true } },
        plaintiff: { select: { id: true, nickname: true } }
      }
    })

    await Promise.all([
      prisma.notification.create({
        data: {
          userId: trial.defendantId,
          type: 'TRIAL',
          title: '판결 내려짐',
          message: `죄목: ${trial.report.reason}\n벌금: ${fineAmount.toLocaleString()} 마크`,
          link: '/trial/records'
        }
      }),
      prisma.notification.create({
        data: {
          userId: trial.plaintiffId,
          type: 'TRIAL',
          title: '신고한 재판 완료',
          message: `${trial.defendant.nickname}님에게 ${fineAmount.toLocaleString()} 마크 벌금`,
          link: '/trial/records'
        }
      })
    ])

    return NextResponse.json({ success: true, trial: updatedTrial, message: '판결 완료!' })
  } catch (error) {
    console.error('판결 오류:', error)
    return NextResponse.json({ error: '판결 실패' }, { status: 500 })
  }
}
